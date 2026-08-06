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

describe("POST /oth-path", () => {
  it("consent 없는 person enroll → 403", async () => {
    const userId = await seedUser("faces-noconsent@test.local");
    const tok = await issueAccessToken(userId);
    const cloneId = await seedClone(userId, "faces-noconsent-clone");
    const personId = await createPerson(tok, cloneId);

    const res = await SELF.fetch(`http://localhost/oth-path${personId}/faces`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({ cloneId, vectors: [vec()] }),
    });

    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("consent granted → 200, face_embeddings 행 N개 생성", async () => {
    const db = env.DB as unknown as D1Database;
    const userId = await seedUser("faces-granted@test.local");
    const tok = await issueAccessToken(userId);
    const cloneId = await seedClone(userId, "faces-granted-clone");
    const personId = await createPerson(tok, cloneId);
    await grantConsent(tok, personId);

    const res = await SELF.fetch(`http://localhost/oth-path${personId}/faces`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({ cloneId, vectors: [vec(0.1), vec(0.2), vec(0.3)] }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { enrolled: number };
    expect(body.enrolled).toBe(3);

    const row = await db
      .prepare("SELECT COUNT(*) c FROM face_embeddings WHERE person_id = ?")
      .bind(personId)
      .first<{ c: number }>();
    expect(row?.c).toBe(3);

    const cpf = await db
      .prepare("SELECT COUNT(*) c FROM clone_person_faces WHERE clone_id = ? AND person_id = ?")
      .bind(cloneId, personId)
      .first<{ c: number }>();
    expect(cpf?.c).toBe(3);

    const idx = getFaceIndex(env as unknown as { FACE_VECTORS?: VectorizeIndex; ENVIRONMENT?: string });
    const queryResult = await idx.query(vec(0.1), {
      topK: 3,
      namespace: faceNamespace(userId, cloneId),
      returnMetadata: true,
    });
    expect(queryResult.matches.length).toBeGreaterThan(0);
    expect(queryResult.matches[0].metadata?.personId).toBe(String(personId));
  });

  it("vectors 검증: 512 아님/6개 초과/비수치 → 422 VALIDATION_FAILED", async () => {
    const userId = await seedUser("faces-invalid@test.local");
    const tok = await issueAccessToken(userId);
    const cloneId = await seedClone(userId, "faces-invalid-clone");
    const personId = await createPerson(tok, cloneId);
    await grantConsent(tok, personId);

    const res1 = await SELF.fetch(`http://localhost/oth-path${personId}/faces`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({ cloneId, vectors: [Array(10).fill(0.1)] }),
    });
    expect(res1.status).toBe(422);
    expect(((await res1.json()) as { error: { code: string } }).error.code).toBe("VALIDATION_FAILED");

    const res2 = await SELF.fetch(`http://localhost/oth-path${personId}/faces`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({ cloneId, vectors: Array(6).fill(vec()) }),
    });
    expect(res2.status).toBe(422);

    const badVec = vec();
    badVec[0] = "x" as unknown as number;
    const res3 = await SELF.fetch(`http://localhost/oth-path${personId}/faces`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({ cloneId, vectors: [badVec] }),
    });
    expect(res3.status).toBe(422);
  });

  it("cloneId 누락 → 422 VALIDATION_FAILED(T-257)", async () => {
    const userId = await seedUser("faces-noclone@test.local");
    const tok = await issueAccessToken(userId);
    const cloneId = await seedClone(userId, "faces-noclone-clone");
    const personId = await createPerson(tok, cloneId);
    await grantConsent(tok, personId);

    const res = await SELF.fetch(`http://localhost/oth-path${personId}/faces`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({ vectors: [vec()] }),
    });
    expect(res.status).toBe(422);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("VALIDATION_FAILED");
  });

  it("타인 소유 person → 404", async () => {
    const owner = await seedUser("faces-owner@test.local");
    const attacker = await seedUser("faces-attacker@test.local");
    const ownerTok = await issueAccessToken(owner);
    const attackerTok = await issueAccessToken(attacker);
    const cloneId = await seedClone(owner, "faces-owner-clone");

    const personId = await createPerson(ownerTok, cloneId);
    await grantConsent(ownerTok, personId);

    const res = await SELF.fetch(`http://localhost/oth-path${personId}/faces`, {
      method: "POST",
      headers: { Authorization: `Bearer ${attackerTok}`, "Content-Type": "application/json" },
      body: JSON.stringify({ cloneId, vectors: [vec()] }),
    });

    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("person이 다른 클론 소속(clone_id 불일치) → 404(T-257)", async () => {
    const userId = await seedUser("faces-wrongclone@test.local");
    const tok = await issueAccessToken(userId);
    const cloneA = await seedClone(userId, "faces-wrongclone-a");
    const cloneB = await seedClone(userId, "faces-wrongclone-b");
    const personId = await createPerson(tok, cloneA);
    await grantConsent(tok, personId);

    const res = await SELF.fetch(`http://localhost/oth-path${personId}/faces`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({ cloneId: cloneB, vectors: [vec()] }),
    });

    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("비소유자도 공개 클론이면 자신의 person에 얼굴 enroll 가능", async () => {
    const owner = await seedUser("faces-nonowner-owner@test.local");
    const nonOwner = await seedUser("faces-nonowner-guest@test.local");
    const nonOwnerTok = await issueAccessToken(nonOwner);
    const cloneId = await seedClone(owner, "faces-nonowner-clone");

    const personId = await createPerson(nonOwnerTok, cloneId);
    await grantConsent(nonOwnerTok, personId);

    const res = await SELF.fetch(`http://localhost/oth-path${personId}/faces`, {
      method: "POST",
      headers: { Authorization: `Bearer ${nonOwnerTok}`, "Content-Type": "application/json" },
      body: JSON.stringify({ cloneId, vectors: [vec()] }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { enrolled: number };
    expect(body.enrolled).toBe(1);
  });

  it("enroll 이후 클론이 정지되면 비소유자는 자신의 person이어도 추가 enroll이 404", async () => {
    const db = env.DB as unknown as D1Database;
    const owner = await seedUser("faces-susp-owner@test.local");
    const nonOwner = await seedUser("faces-susp-guest@test.local");
    const nonOwnerTok = await issueAccessToken(nonOwner);
    const cloneId = await seedClone(owner, "faces-susp-clone");

    const personId = await createPerson(nonOwnerTok, cloneId);
    await grantConsent(nonOwnerTok, personId);

    await db.prepare(`UPDATE clones SET admin_suspended_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(cloneId).run();

    const res = await SELF.fetch(`http://localhost/oth-path${personId}/faces`, {
      method: "POST",
      headers: { Authorization: `Bearer ${nonOwnerTok}`, "Content-Type": "application/json" },
      body: JSON.stringify({ cloneId, vectors: [vec()] }),
    });
    expect(res.status).toBe(404);
  });

  it("비정수 person id(/faces) → 422 VALIDATION_FAILED (parsePersonId 재사용, 500 아님)", async () => {
    const userId = await seedUser("faces-nanid@test.local");
    const tok = await issueAccessToken(userId);

    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body: JSON.stringify({ vectors: [vec()] }),
    });

    expect(res.status).toBe(422);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("VALIDATION_FAILED");
  });
});
