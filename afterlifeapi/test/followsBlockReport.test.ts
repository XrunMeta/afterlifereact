import { describe, it, expect, beforeAll } from "vitest";
import { SELF, env } from "cloudflare:test";

async function hasUsersTable(): Promise<boolean> {
  try {
    const db = env.DB as unknown as D1Database;
    const r = await db.prepare("SELECT COUNT(*) AS c FROM users").first<{ c: number }>();
    return typeof r?.c === "number";
  } catch {
    return false;
  }
}

let seq = 0;
async function seedUser(): Promise<number> {
  const db = env.DB as unknown as D1Database;
  seq += 1;
  const email = `fbr-${seq}-${Math.floor(seq * 7919) % 100000}@test.local`;
  await db
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(email)
    .run();
  const u = await db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first<{ id: number }>();
  return u!.id;
}

async function follow(followerId: number, followeeId: number): Promise<void> {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(`INSERT OR IGNORE INTO user_follows (follower_id, followee_id) VALUES (?, ?)`)
    .bind(followerId, followeeId)
    .run();
}

async function followExists(followerId: number, followeeId: number): Promise<boolean> {
  const db = env.DB as unknown as D1Database;
  const r = await db
    .prepare(`SELECT 1 AS x FROM user_follows WHERE follower_id = ? AND followee_id = ?`)
    .bind(followerId, followeeId)
    .first<{ x: number }>();
  return !!r;
}

async function blockExists(blockerId: number, blockedId: number): Promise<boolean> {
  const db = env.DB as unknown as D1Database;
  const r = await db
    .prepare(`SELECT 1 AS x FROM user_blocks WHERE blocker_id = ? AND blocked_id = ?`)
    .bind(blockerId, blockedId)
    .first<{ x: number }>();
  return !!r;
}

async function issueAccessToken(userId: number): Promise<string> {
  const { issueToken } = await import("../src/lib/jwt");
  const secret = (env as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET missing in test env");
  return await issueToken({ sub: userId, kind: "access" }, secret, 600);
}

function authPost(path: string, token: string, body?: unknown): Promise<Response> {
  return SELF.fetch(`http://localhost${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function deleteMe(token: string): Promise<Response> {
  return SELF.fetch("http://localhost/oth-path", {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

describe("탈퇴 시 팔로우 삭제 + 차단/신고 언팔로우 컬럼 버그", () => {
  beforeAll(async () => {
    if (!(await hasUsersTable())) throw new Error("D1 migrations not applied.");
  });

  it("탈퇴 시 팔로우/팔로워 관계가 양방향 삭제됨", async () => {
    const me = await seedUser();
    const follower = await seedUser(); 
    const followee = await seedUser(); 
    await follow(follower, me);
    await follow(me, followee);
    expect(await followExists(follower, me)).toBe(true);
    expect(await followExists(me, followee)).toBe(true);

    expect((await deleteMe(await issueAccessToken(me))).status).toBe(200);

    expect(await followExists(follower, me)).toBe(false);
    expect(await followExists(me, followee)).toBe(false);
  });

  it("차단 시 200 + 양방향 언팔로우 (following_id 컬럼 버그 회귀 방지)", async () => {
    const a = await seedUser();
    const b = await seedUser();
    await follow(a, b);
    await follow(b, a);

    const res = await authPost(`/oth-path${b}/block`, await issueAccessToken(a));
    expect(res.status).toBe(200); 

    expect(await followExists(a, b)).toBe(false);
    expect(await followExists(b, a)).toBe(false);
    expect(await blockExists(a, b)).toBe(true);
  });

  it("신고 시 200(reported) + 자동 차단 + 언팔로우 (500 회귀 방지)", async () => {
    const a = await seedUser();
    const b = await seedUser();
    await follow(a, b);

    const res = await authPost(`/oth-path${b}/report`, await issueAccessToken(a), { reason: "spam" });
    expect(res.status).toBe(200);
    const json = (await res.json()) as { reported?: boolean };
    expect(json.reported).toBe(true);

    expect(await followExists(a, b)).toBe(false);
    expect(await blockExists(a, b)).toBe(true);
  });
});
