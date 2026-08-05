

import { describe, it, expect, beforeEach } from "vitest";
import { SELF, env } from "cloudflare:test";
import { issueToken } from "../src/lib/jwt";
import { __resetMemoryFaceIndex, getFaceIndex } from "../src/lib/faceVectors";
import { faceNamespace } from "../src/lib/cloneFaceScope";

const db = () => env.DB as unknown as D1Database;

async function seedUser(email: string): Promise<number> {
  await db()
    .prepare(
      `INSERT INTO users (email, password_hash, name, created_at, call_learning_consent)
       VALUES (?, 'x', 'U', CURRENT_TIMESTAMP, 1)`,
    )
    .bind(email)
    .run();
  const u = await db().prepare("SELECT id FROM users WHERE email = ?").bind(email).first<{ id: number }>();
  return u!.id;
}

async function seedClone(ownerId: number, username: string, cloneType = "memlow"): Promise<number> {
  await db()
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
       VALUES (?, 'TestClone', ?, ?, 'public', CURRENT_TIMESTAMP)`,
    )
    .bind(ownerId, username, cloneType)
    .run();
  const c = await db().prepare("SELECT id FROM clones WHERE username = ?").bind(username).first<{ id: number }>();
  return c!.id;
}

function vec(seed: number): number[] {
  const v = new Array(512).fill(0);
  v[seed % 512] = 1;
  return v;
}

async function issueAccessToken(userId: number): Promise<string> {
  const secret = (env as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET missing in test env");
  return await issueToken({ sub: userId, kind: "access" }, secret, 60 * 10);
}

async function seedCloneFace(userId: number, cloneId: number, personId: number, vector: number[]) {
  const vectorizeId = crypto.randomUUID();
  await getFaceIndex(env as unknown as { FACE_VECTORS?: VectorizeIndex; ENVIRONMENT?: string }).insert([
    { id: vectorizeId, values: vector, namespace: faceNamespace(userId, cloneId), metadata: { personId: String(personId) } },
  ]);
  await db()
    .prepare(
      `INSERT INTO clone_person_faces (clone_id, person_id, vectorize_id, model, dim, source, created_at)
       VALUES (?, ?, ?, 'w600k_mbf', 512, 'enroll', ?)`,
    )
    .bind(cloneId, personId, vectorizeId, Date.now())
    .run();
}

describe("POST /oth-path — 클론 스코프", () => {
  beforeEach(() => {
    __resetMemoryFaceIndex();
  });

  it("cloneId가 없으면 422 VALIDATION_FAILED", async () => {
    const userId = await seedUser("t257a@x.com");
    const token = await issueAccessToken(userId);
    const res = await SELF.fetch("https://x/oth-path", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ vector: vec(1) }),
    });

    expect(res.status).toBe(422);
    const body = await res.json<{ error: { code: string } }>();
    expect(body.error.code).toBe("VALIDATION_FAILED");
    expect(userId).toBeGreaterThan(0);
  });

  it("클론 A에 등록한 얼굴이 클론 B에서는 매칭되지 않는다", async () => {
    const userId = await seedUser("t257b@x.com");
    const cloneA = await seedClone(userId, "t257b-a");
    const cloneB = await seedClone(userId, "t257b-b");
    const token = await issueAccessToken(userId);

    const createRes = await SELF.fetch("https://x/oth-path", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ cloneId: cloneA, displayName: "지훈", enrolledVia: "card" }),
    });
    expect(createRes.status).toBe(201);
    const person = await createRes.json<{ id: number }>();
    const consentRes = await SELF.fetch(`https://x/oth-path${person.id}/consent`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ state: "granted" }),
    });
    expect(consentRes.status).toBe(200);
    await seedCloneFace(userId, cloneA, person.id, vec(1));

    const hitRes = await SELF.fetch("https://x/oth-path", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ vector: vec(1), cloneId: cloneA }),
    });
    expect(hitRes.status).toBe(200);
    const hit = await hitRes.json<{ best: { personId: number; displayName: string } | null }>();
    expect(hit.best?.personId).toBe(person.id);
    expect(hit.best?.displayName).toBe("지훈");

    const missRes = await SELF.fetch("https://x/oth-path", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ vector: vec(1), cloneId: cloneB }),
    });
    expect(missRes.status).toBe(200);
    const miss = await missRes.json<{ best: unknown | null; matches: unknown[] }>();
    expect(miss.best).toBeNull();
    expect(miss.matches).toHaveLength(0);
  });

  it("타 사용자 소유 클론이면 404", async () => {
    const ownerId = await seedUser("t257c-owner@x.com");
    const cloneId = await seedClone(ownerId, "t257c-owner-clone");
    const otherId = await seedUser("t257c-other@x.com");
    const token = await issueAccessToken(otherId);

    const res = await SELF.fetch("https://x/oth-path", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ vector: vec(1), cloneId }),
    });
    expect(res.status).toBe(404);
  });

  it("소유자 본인이어도 소프트삭제된 클론이면 404(deletion_state≠active)", async () => {
    const userId = await seedUser("t257d@x.com");
    const cloneId = await seedClone(userId, "t257d-deleted");
    await db()
      .prepare(`UPDATE clones SET deletion_state = 'soft_deleted', deleted_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .bind(cloneId)
      .run();
    const token = await issueAccessToken(userId);

    const res = await SELF.fetch("https://x/oth-path", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ vector: vec(1), cloneId }),
    });
    expect(res.status).toBe(404);
  });
});
