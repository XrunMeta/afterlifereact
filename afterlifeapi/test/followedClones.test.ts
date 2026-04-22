import { describe, it, expect, beforeAll } from "vitest";
import { SELF, env } from "cloudflare:test";

interface ClonesRow { cnt: number }

async function hasClonesTable(): Promise<boolean> {
  try {
    const db = env.DB as unknown as D1Database;
    const row = await db
      .prepare("SELECT COUNT(*) AS cnt FROM clones")
      .first<ClonesRow>();
    return typeof row?.cnt === "number";
  } catch {
    return false;
  }
}

async function seedUser(email: string): Promise<number> {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(
      `INSERT INTO users (email, password_hash, name, created_at)
       VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`,
    )
    .bind(email)
    .run();
  const u = await db
    .prepare("SELECT id FROM users WHERE email = ?")
    .bind(email)
    .first<{ id: number }>();
  return u!.id;
}

async function seedClone(
  ownerId: number,
  username: string,
  cloneType: "memlow" | "friend" | "mentor" | "celeb" = "memlow",
): Promise<number> {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
       VALUES (?, 'CT', ?, ?, 'public', CURRENT_TIMESTAMP)`,
    )
    .bind(ownerId, username, cloneType)
    .run();
  const c = await db
    .prepare("SELECT id FROM clones WHERE username = ?")
    .bind(username)
    .first<{ id: number }>();
  return c!.id;
}

async function seedFollow(cloneId: number, userId: number): Promise<void> {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(
      `INSERT OR IGNORE INTO clone_follows (user_id, clone_id) VALUES (?, ?)`,
    )
    .bind(userId, cloneId)
    .run();
}

async function issueAccessToken(userId: number): Promise<string> {
  const { issueToken } = await import("../src/lib/jwt");
  const secret = (env as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET missing in test env");
  return await issueToken({ sub: userId, kind: "access" }, secret, 60 * 10);
}

describe("users route — followed clones", () => {
  beforeAll(async () => {
    if (!(await hasClonesTable())) {
      throw new Error("D1 migrations not applied.");
    }
  });

  it("GET /oth-path — 본인이면 items 반환", async () => {
    const ownerId = await seedUser("fc-o@test.local");
    const followerId = await seedUser("fc-f@test.local");
    const c1 = await seedClone(ownerId, "fc_c1", "memlow");
    const c2 = await seedClone(ownerId, "fc_c2", "friend");
    await seedFollow(c1, followerId);
    await seedFollow(c2, followerId);

    const token = await issueAccessToken(followerId);
    const res = await SELF.fetch(
      `http://localhost/oth-path${followerId}/followed-clones`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      items: Array<{
        id: number;
        name: string;
        username: string;
        cloneType: string;
        avatarUrl: string | null;
        stats: { followers: number; messages: number; gifts: number };
        createdAt: string;
      }>;
    };
    expect(Array.isArray(body.items)).toBe(true);
    const ids = body.items.map((i) => i.id).sort((a, b) => a - b);
    expect(ids).toEqual([c1, c2].sort((a, b) => a - b));
    expect(body.items[0]!.stats).toBeDefined();
  });

  it("GET /oth-path — 타인이면 403", async () => {
    const a = await seedUser("fc-other-a@test.local");
    const b = await seedUser("fc-other-b@test.local");
    const token = await issueAccessToken(a);
    const res = await SELF.fetch(
      `http://localhost/oth-path${b}/followed-clones`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    expect(res.status).toBe(403);
  });

  it("GET /oth-path — 비로그인이면 401", async () => {
    const u = await seedUser("fc-anon@test.local");
    const res = await SELF.fetch(
      `http://localhost/oth-path${u}/followed-clones`,
    );
    expect(res.status).toBe(401);
  });
});
