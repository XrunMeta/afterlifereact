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

async function seedPerson(userId: number, cloneId: number | null, name: string): Promise<void> {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(
      `INSERT INTO persons (user_id, clone_id, display_name, consent_state, created_at)
       VALUES (?, ?, ?, 'none', ?)`
    )
    .bind(userId, cloneId, name, Date.now())
    .run();
}

describe("GET /oth-path — cloneId 필터", () => {
  let token: string;
  let userId: number;
  let cloneId: number;
  let otherCloneId: number;

  beforeAll(async () => {
    userId = await seedUser("persons-list-filter@test.local");
    token = await issueAccessToken(userId);
    cloneId = await seedClone(userId, "persons-list-clone-a");
    otherCloneId = await seedClone(userId, "persons-list-clone-b");

    await seedPerson(userId, cloneId, "형"); 
    await seedPerson(userId, null, "전역이"); 
    await seedPerson(userId, otherCloneId, "다른형"); 
  });

  it("401 without auth", async () => {
    const r = await SELF.fetch("https://x/oth-path");
    expect(r.status).toBe(401);
  });

  it("returns all persons without cloneId (기존 동작 불변)", async () => {
    const r = await SELF.fetch("https://x/oth-path", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(r.status).toBe(200);
    const body = await r.json<{ data: Array<{ displayName: string | null }> }>();
    const names = body.data.map((p) => p.displayName).sort();
    expect(names).toEqual(["다른형", "형", "전역이"].sort());
  });

  it("filters by cloneId including global", async () => {
    const r = await SELF.fetch(`https://x/oth-path?cloneId=${cloneId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(r.status).toBe(200);
    const body = await r.json<{ data: Array<{ displayName: string | null; cloneId: number | null }> }>();
    const names = body.data.map((p) => p.displayName).sort();

    expect(names).toEqual(["형", "전역이"].sort());
  });

  it("invalid cloneId → VALIDATION_FAILED(422)", async () => {
    const r = await SELF.fetch("https://x/oth-path?cloneId=abc", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(r.status).toBe(422);
    const body = (await r.json()) as { error: { code: string } };
    expect(body.error.code).toBe("VALIDATION_FAILED");
  });
});
