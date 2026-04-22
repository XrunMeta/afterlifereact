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
  visibility: "public" | "followers" | "private",
): Promise<number> {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
       VALUES (?, 'CT', ?, 'memlow', ?, CURRENT_TIMESTAMP)`,
    )
    .bind(ownerId, username, visibility)
    .run();
  const c = await db
    .prepare("SELECT id FROM clones WHERE username = ?")
    .bind(username)
    .first<{ id: number }>();
  return c!.id;
}

async function seedFeed(cloneId: number, content: string): Promise<number> {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(
      `INSERT INTO feeds (clone_id, content, media_url, media_type, created_at)
       VALUES (?, ?, null, null, CURRENT_TIMESTAMP)`,
    )
    .bind(cloneId, content)
    .run();
  const f = await db
    .prepare("SELECT id FROM feeds WHERE clone_id = ? ORDER BY id DESC LIMIT 1")
    .bind(cloneId)
    .first<{ id: number }>();
  return f!.id;
}

describe("feeds route — contract", () => {
  beforeAll(async () => {
    if (!(await hasClonesTable())) {
      throw new Error(
        "D1 migrations not applied. Check poolOptions.workers.miniflare.d1Databases or wrangler migrations.",
      );
    }
  });

  it("GET /oth-path — public clone 이면 인증 없이 items 반환", async () => {
    const ownerId = await seedUser("pub@test.local");
    const cloneId = await seedClone(ownerId, "pubclone", "public");
    const feedId = await seedFeed(cloneId, "hello");

    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/oth-path`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      items: Array<{
        id: number;
        cloneId: number;
        content: string | null;
        mediaUrl: string | null;
        mediaType: string | null;
        likesCount: number;
        visibility: "public" | "followers" | "private";
        createdAt: string;
      }>;
      nextCursor: number | null;
    };
    expect(Array.isArray(body.items)).toBe(true);
    const first = body.items.find((i) => i.id === feedId);
    expect(first).toBeDefined();
    expect(first!.cloneId).toBe(cloneId);
    expect(first!.content).toBe("hello");
    expect(first!.visibility).toBe("public");
    expect(body).toHaveProperty("nextCursor");
  });

  it("GET /oth-path — private clone 은 비로그인 시 403", async () => {
    const ownerId = await seedUser("priv@test.local");
    const cloneId = await seedClone(ownerId, "privclone", "private");
    await seedFeed(cloneId, "secret");

    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/oth-path`);
    expect(res.status).toBe(403);
  });

  it("GET /oth-path — followers clone 은 비로그인 시 403", async () => {
    const ownerId = await seedUser("flw@test.local");
    const cloneId = await seedClone(ownerId, "flwclone", "followers");
    await seedFeed(cloneId, "fans only");

    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/oth-path`);
    expect(res.status).toBe(403);
  });

  it("POST /oth-path — 비로그인 시 401", async () => {
    const ownerId = await seedUser("pw@test.local");
    const cloneId = await seedClone(ownerId, "pwclone", "public");
    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/oth-path`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: "hi" }),
    });
    expect(res.status).toBe(401);
  });
});
