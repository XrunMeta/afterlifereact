import { describe, it, expect } from "vitest";
import { SELF, env } from "cloudflare:test";
import { getFaceIndex } from "../src/lib/faceVectors";
import { faceNamespace } from "../src/lib/cloneFaceScope";

async function seedUser(email: string): Promise<number> {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(email)
    .run();
  const u = await db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first<{ id: number }>();
  return u!.id;
}

async function seedClone(ownerId: number, username: string): Promise<number> {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
       VALUES (?, 'TestClone', ?, 'memlow', 'public', CURRENT_TIMESTAMP)`
    )
    .bind(ownerId, username)
    .run();
  const c = await db.prepare("SELECT id FROM clones WHERE username = ?").bind(username).first<{ id: number }>();
  return c!.id;
}

async function issueAccessToken(userId: number): Promise<string> {
  const { issueToken } = await import("../src/lib/jwt");
  const secret = (env as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET missing in test env");
  return await issueToken({ sub: userId, kind: "access" }, secret, 60 * 10);
}

async function createPerson(tok: string, cloneId: number): Promise<number> {
  const res = await SELF.fetch("http://localhost/oth-path", {
    method: "POST",
    headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
    body: JSON.stringify({ cloneId }),
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

async function enrollFace(tok: string, cloneId: number, personId: number, fill = 0.1) {
  const res = await SELF.fetch(`http://localhost/oth-path${personId}/faces`, {
    method: "POST",
    headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
    body: JSON.stringify({ cloneId, vectors: [vec(fill)] }),
  });
  expect(res.status).toBe(200);
}

async function deletePerson(tok: string, personId: number) {
  return SELF.fetch(`http://localhost/oth-path${personId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${tok}` },
  });
}

async function insertCallTurn(personId: number): Promise<number> {
  const db = env.DB as unknown as D1Database;
  const callId = `call-${personId}-${Date.now()}`;
  const r = await db
    .prepare(
      `INSERT INTO call_turns (call_id, seq, role, text, created_at, speaker_person_id)
       VALUES (?, 1, 'user', 'hi', ?, ?)`
    )
    .bind(callId, Date.now(), personId)
    .run();
  return r.meta.last_row_id as number;
}

describe("DELETE /oth-path", () => {
  it("enroll된 person 삭제 → 200, face_embeddings/clone_ont_person 행 0 + consent_log 보존(삭제 감사행 추가) + call_turns FK NULL화 + 같은 벡터 match 빈 결과", async () => {
    const db = env.DB as unknown as D1Database;
    const userId = await seedUser("del-full@test.local");
    const tok = await issueAccessToken(userId);
    const cloneId = await seedClone(userId, "del-full-clone");
    const personId = await createPerson(tok, cloneId);
    await grantConsent(tok, personId); 
    await enrollFace(tok, cloneId, personId, 0.1);

    await db
      .prepare(
        `INSERT INTO clone_ont_person (clone_id, person_id, data, updated_at) VALUES (?, ?, '{}', ?)`
      )
      .bind(cloneId + 100000, personId, Date.now())
      .run();

    const turnId = await insertCallTurn(personId);

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
    const cop = await db
      .prepare("SELECT COUNT(*) c FROM clone_ont_person WHERE person_id = ?")
      .bind(personId)
      .first<{ c: number }>();
    expect(cop?.c).toBe(0);

    const logs = await db
      .prepare("SELECT state, channel FROM persons_consent_log WHERE person_id = ? ORDER BY id ASC")
      .bind(personId)
      .all<{ state: string; channel: string | null }>();
    expect(logs.results.length).toBe(2); 
    expect(logs.results[0].state).toBe("granted");
    const last = logs.results[logs.results.length - 1];
    expect(last.state).toBe("revoked");
    expect(last.channel).toBe("face_delete");

    const turn = await db
      .prepare("SELECT speaker_person_id FROM call_turns WHERE id = ?")
      .bind(turnId)
      .first<{ speaker_person_id: number | null }>();
    expect(turn?.speaker_person_id).toBe(null);

    const idx = getFaceIndex(env as unknown as { FACE_VECTORS?: VectorizeIndex; ENVIRONMENT?: string });
    const queryResult = await idx.query(vec(0.1), {
      topK: 3,
      namespace: faceNamespace(userId, cloneId),
      returnMetadata: true,
    });
    expect(queryResult.matches.length).toBe(0);
  });

  it("완전 삭제 후 재호출 → 404", async () => {
    const userId = await seedUser("del-redelete@test.local");
    const tok = await issueAccessToken(userId);
    const cloneId = await seedClone(userId, "del-redelete-clone");
    const personId = await createPerson(tok, cloneId);
    await grantConsent(tok, personId);
    await enrollFace(tok, cloneId, personId, 0.2);

    const first = await deletePerson(tok, personId);
    expect(first.status).toBe(200);

    const second = await deletePerson(tok, personId);
    expect(second.status).toBe(404);
    const body = (await second.json()) as { error: { code: string } };
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("부분 실패 후 재시도(진짜 재현) — Vectorize만 먼저 소멸(라우트 밖 직접 호출)된 상태에서 재호출해도 deleteByIds no-op으로 200 완결·전 테이블 정리", async () => {
    const db = env.DB as unknown as D1Database;
    const userId = await seedUser("del-partial@test.local");
    const tok = await issueAccessToken(userId);
    const cloneId = await seedClone(userId, "del-partial-clone");
    const personId = await createPerson(tok, cloneId);
    await grantConsent(tok, personId);
    await enrollFace(tok, cloneId, personId, 0.3);

    await db
      .prepare(
        `INSERT INTO clone_ont_person (clone_id, person_id, data, updated_at) VALUES (?, ?, '{}', ?)`
      )
      .bind(cloneId + 100000, personId, Date.now())
      .run();
    const turnId = await insertCallTurn(personId);

    const embs = await db
      .prepare("SELECT vectorize_id FROM face_embeddings WHERE person_id = ?")
      .bind(personId)
      .all<{ vectorize_id: string | null }>();
    const vids = embs.results.map((r) => r.vectorize_id).filter((v): v is string => Boolean(v));
    expect(vids.length).toBeGreaterThan(0);
    await getFaceIndex(env as unknown as { FACE_VECTORS?: VectorizeIndex; ENVIRONMENT?: string }).deleteByIds(vids);

    const res = await deletePerson(tok, personId);
    expect(res.status).toBe(200);

    const p = await db.prepare("SELECT COUNT(*) c FROM persons WHERE id = ?").bind(personId).first<{ c: number }>();
    expect(p?.c).toBe(0);
    const fe = await db
      .prepare("SELECT COUNT(*) c FROM face_embeddings WHERE person_id = ?")
      .bind(personId)
      .first<{ c: number }>();
    expect(fe?.c).toBe(0);
    const cop = await db
      .prepare("SELECT COUNT(*) c FROM clone_ont_person WHERE person_id = ?")
      .bind(personId)
      .first<{ c: number }>();
    expect(cop?.c).toBe(0);
    const turn = await db
      .prepare("SELECT speaker_person_id FROM call_turns WHERE id = ?")
      .bind(turnId)
      .first<{ speaker_person_id: number | null }>();
    expect(turn?.speaker_person_id).toBe(null);
  });

  it("타인 소유 person → 404", async () => {
    const owner = await seedUser("del-owner@test.local");
    const attacker = await seedUser("del-attacker@test.local");
    const ownerTok = await issueAccessToken(owner);
    const attackerTok = await issueAccessToken(attacker);
    const cloneId = await seedClone(owner, "del-owner-clone");

    const personId = await createPerson(ownerTok, cloneId);

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
