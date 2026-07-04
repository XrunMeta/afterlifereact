import { describe, it, expect } from "vitest";
import { SELF, env } from "cloudflare:test";
import { getFaceIndex } from "../src/lib/faceVectors";

async function seedUser(email: string): Promise<number> {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(email)
    .run();
  const u = await db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first<{ id: number }>();
  return u!.id;
}

async function issueAccessToken(userId: number): Promise<string> {
  const { issueToken } = await import("../src/lib/jwt");
  const secret = (env as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET missing in test env");
  return await issueToken({ sub: userId, kind: "access" }, secret, 60 * 10);
}

async function createPerson(tok: string): Promise<number> {
  const res = await SELF.fetch("http://localhost/oth-path", {
    method: "POST",
    headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const { id } = (await res.json()) as { id: number };
  return id;
}

async function grantConsent(tok: string, personId: number) {
  const res = await SELF.fetch(`http://localhost/oth-path${personId}/consent`, {
    method: "POST",
    headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
    body: JSON.stringify({ state: "granted" }),
  });
  expect(res.status).toBe(200);
}

function vec(fill = 0.1): number[] {
  return Array(512).fill(fill);
}

async function enrollFace(tok: string, personId: number, fill = 0.1) {
  const res = await SELF.fetch(`http://localhost/oth-path${personId}/faces`, {
    method: "POST",
    headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
    body: JSON.stringify({ vectors: [vec(fill)] }),
  });
  expect(res.status).toBe(200);
}

async function deletePerson(tok: string, personId: number) {
  return SELF.fetch(`http://localhost/oth-path${personId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${tok}` },
  });
}

describe("DELETE /oth-path", () => {
  it("enroll된 person 삭제 → 200, 4개 테이블 행 0 + 같은 벡터 match 빈 결과", async () => {
    const db = env.DB as unknown as D1Database;
    const userId = await seedUser("del-full@test.local");
    const tok = await issueAccessToken(userId);
    const personId = await createPerson(tok);
    await grantConsent(tok, personId);
    await enrollFace(tok, personId, 0.1);

    await db
      .prepare(
        `INSERT INTO clone_ont_person (clone_id, person_id, data, updated_at) VALUES (?, ?, '{}', ?)`
      )
      .bind(1, personId, Date.now())
      .run();

    const res = await deletePerson(tok, personId);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { deleted: boolean };
    expect(body.deleted).toBe(true);

    const p = await db.prepare("SELECT COUNT(*) c FROM persons WHERE id = ?").bind(personId).first<{ c: number }>();
    expect(p?.c).toBe(0);
    const fe = await db
      .prepare("SELECT COUNT(*) c FROM face_embeddings WHERE person_id = ?")
      .bind(personId)
      .first<{ c: number }>();
    expect(fe?.c).toBe(0);
    const cl = await db
      .prepare("SELECT COUNT(*) c FROM persons_consent_log WHERE person_id = ?")
      .bind(personId)
      .first<{ c: number }>();
    expect(cl?.c).toBe(0);
    const cop = await db
      .prepare("SELECT COUNT(*) c FROM clone_ont_person WHERE person_id = ?")
      .bind(personId)
      .first<{ c: number }>();
    expect(cop?.c).toBe(0);

    const idx = getFaceIndex(env as unknown as { FACE_VECTORS?: VectorizeIndex; ENVIRONMENT?: string });
    const queryResult = await idx.query(vec(0.1), { topK: 3, namespace: String(userId), returnMetadata: true });
    expect(queryResult.matches.length).toBe(0);
  });

  it("완전 삭제 후 재호출 → 404", async () => {
    const userId = await seedUser("del-redelete@test.local");
    const tok = await issueAccessToken(userId);
    const personId = await createPerson(tok);
    await grantConsent(tok, personId);
    await enrollFace(tok, personId, 0.2);

    const first = await deletePerson(tok, personId);
    expect(first.status).toBe(200);

    const second = await deletePerson(tok, personId);
    expect(second.status).toBe(404);
    const body = (await second.json()) as { error: { code: string } };
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("부분 실패 후 재시도 — persons 행이 남아있으면(자식 일부만 지워진 상태) 재호출이 나머지를 마저 지우고 200", async () => {
    const db = env.DB as unknown as D1Database;
    const userId = await seedUser("del-partial@test.local");
    const tok = await issueAccessToken(userId);
    const personId = await createPerson(tok);
    await grantConsent(tok, personId);
    await enrollFace(tok, personId, 0.3);
    await db
      .prepare(
        `INSERT INTO clone_ont_person (clone_id, person_id, data, updated_at) VALUES (?, ?, '{}', ?)`
      )
      .bind(2, personId, Date.now())
      .run();

    await db.prepare("DELETE FROM face_embeddings WHERE person_id = ?").bind(personId).run();

    const res = await deletePerson(tok, personId);
    expect(res.status).toBe(200);

    const p = await db.prepare("SELECT COUNT(*) c FROM persons WHERE id = ?").bind(personId).first<{ c: number }>();
    expect(p?.c).toBe(0);
    const cl = await db
      .prepare("SELECT COUNT(*) c FROM persons_consent_log WHERE person_id = ?")
      .bind(personId)
      .first<{ c: number }>();
    expect(cl?.c).toBe(0);
    const cop = await db
      .prepare("SELECT COUNT(*) c FROM clone_ont_person WHERE person_id = ?")
      .bind(personId)
      .first<{ c: number }>();
    expect(cop?.c).toBe(0);
  });

  it("타인 소유 person → 404", async () => {
    const owner = await seedUser("del-owner@test.local");
    const attacker = await seedUser("del-attacker@test.local");
    const ownerTok = await issueAccessToken(owner);
    const attackerTok = await issueAccessToken(attacker);

    const personId = await createPerson(ownerTok);

    const res = await deletePerson(attackerTok, personId);
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("비정수 person id → 422 VALIDATION_FAILED", async () => {
    const userId = await seedUser("del-nanid@test.local");
    const tok = await issueAccessToken(userId);

    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tok}` },
    });

    expect(res.status).toBe(422);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("VALIDATION_FAILED");
  });
});
