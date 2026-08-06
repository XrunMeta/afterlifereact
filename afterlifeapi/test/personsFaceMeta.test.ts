

import { describe, it, expect, beforeAll } from "vitest";
import { SELF, env } from "cloudflare:test";

async function seedUser(email: string): Promise<number> {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(email)
    .run();
  const u = await db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first<{ id: number }>();
  return u!.id;
}

async function seedClone(ownerId: number, username: string, cloneType = "memlow"): Promise<number> {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
       VALUES (?, 'TestClone', ?, ?, 'public', CURRENT_TIMESTAMP)`
    )
    .bind(ownerId, username, cloneType)
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

async function seedPerson(userId: number, cloneId: number, name: string): Promise<number> {
  const db = env.DB as unknown as D1Database;
  const r = await db
    .prepare(
      `INSERT INTO persons (user_id, clone_id, display_name, consent_state, created_at)
       VALUES (?, ?, ?, 'granted', ?)`
    )
    .bind(userId, cloneId, name, Date.now())
    .run();
  return r.meta.last_row_id as number;
}

async function seedFaces(cloneId: number, personId: number, n: number): Promise<void> {
  const db = env.DB as unknown as D1Database;
  for (let i = 0; i < n; i++) {
    await db
      .prepare(
        `INSERT INTO clone_person_faces (clone_id, person_id, vectorize_id, model, dim, source, created_at)
         VALUES (?, ?, ?, 'w600k_mbf', 512, 'call', ?)`
      )
      .bind(cloneId, personId, `vec-${cloneId}-${personId}-${i}`, Date.now())
      .run();
  }
}

describe("GET /oth-path — 얼굴 메타(faceCount·isSelf)", () => {
  let token: string;
  let cloneId: number;
  let otherCloneId: number;
  let withFacesId: number;
  let noFacesId: number;
  let selfId: number;

  beforeAll(async () => {
    const userId = await seedUser("t257meta@x.com");
    token = await issueAccessToken(userId);
    cloneId = await seedClone(userId, "t257meta-clone");
    otherCloneId = await seedClone(userId, "t257meta-other");

    withFacesId = await seedPerson(userId, cloneId, "얼굴있음");
    await seedFaces(cloneId, withFacesId, 3);

    noFacesId = await seedPerson(userId, cloneId, "얼굴없음");

    selfId = await seedPerson(userId, cloneId, "제작자");
    await seedFaces(cloneId, selfId, 5);
    const db = env.DB as unknown as D1Database;
    await db.prepare("UPDATE clones SET self_person_id = ? WHERE id = ?").bind(selfId, cloneId).run();
  });

  it("faceCount 는 그 클론 스코프의 얼굴 개수를 센다", async () => {
    const r = await SELF.fetch(`https://x/oth-path?cloneId=${cloneId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(r.status).toBe(200);
    const body = await r.json<{ data: Array<{ id: number; faceCount: number }> }>();
    const byId = new Map(body.data.map((p) => [p.id, p]));
    expect(byId.get(withFacesId)?.faceCount).toBe(3);
    expect(byId.get(selfId)?.faceCount).toBe(5);
  });

  it("얼굴이 없는 person 은 faceCount 0 (누락이 아니라 0)", async () => {
    const r = await SELF.fetch(`https://x/oth-path?cloneId=${cloneId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await r.json<{ data: Array<{ id: number; faceCount: number }> }>();
    const row = body.data.find((p) => p.id === noFacesId);
    expect(row).toBeDefined();
    expect(row!.faceCount).toBe(0);
  });

  it("isSelf 는 clones.self_person_id 와 일치하는 person 에만 true", async () => {
    const r = await SELF.fetch(`https://x/oth-path?cloneId=${cloneId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await r.json<{ data: Array<{ id: number; isSelf: boolean }> }>();
    const byId = new Map(body.data.map((p) => [p.id, p]));
    expect(byId.get(selfId)?.isSelf).toBe(true);
    expect(byId.get(withFacesId)?.isSelf).toBe(false);
    expect(byId.get(noFacesId)?.isSelf).toBe(false);
  });

  it("다른 클론의 얼굴은 세지 않는다", async () => {
    const db = env.DB as unknown as D1Database;

    await db
      .prepare(
        `INSERT INTO clone_person_faces (clone_id, person_id, vectorize_id, model, dim, source, created_at)
         VALUES (?, ?, 'vec-cross-contamination', 'w600k_mbf', 512, 'call', ?)`
      )
      .bind(otherCloneId, withFacesId, Date.now())
      .run();

    const r = await SELF.fetch(`https://x/oth-path?cloneId=${cloneId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await r.json<{ data: Array<{ id: number; faceCount: number }> }>();
    const row = body.data.find((p) => p.id === withFacesId);
    expect(row!.faceCount).toBe(3); 
  });

  it("cloneId 미지정 조회에서도 person 의 소속 클론 기준으로 센다", async () => {
    const r = await SELF.fetch("https://x/oth-path", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(r.status).toBe(200);
    const body = await r.json<{ data: Array<{ id: number; faceCount: number; isSelf: boolean }> }>();
    const byId = new Map(body.data.map((p) => [p.id, p]));
    expect(byId.get(withFacesId)?.faceCount).toBe(3);
    expect(byId.get(selfId)?.isSelf).toBe(true);
  });
});
