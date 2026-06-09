import { describe, it, expect, beforeAll } from "vitest";
import { SELF, env } from "cloudflare:test";

let seq = 0;
async function seedUser(): Promise<number> {
  const db = env.DB as unknown as D1Database;
  seq += 1;
  const email = `cn-${seq}-${(seq * 7919) % 100000}@test.local`;
  await db
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(email)
    .run();
  return (await db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first<{ id: number }>())!.id;
}

async function seedClone(ownerId: number): Promise<number> {
  const db = env.DB as unknown as D1Database;
  seq += 1;
  const username = `cn_clone_${seq}`;
  await db
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
       VALUES (?, 'CT', ?, 'friend', 'public', CURRENT_TIMESTAMP)`,
    )
    .bind(ownerId, username)
    .run();
  return (await db.prepare("SELECT id FROM clones WHERE username = ?").bind(username).first<{ id: number }>())!.id;
}

async function seedFeed(cloneId: number): Promise<number> {
  const db = env.DB as unknown as D1Database;
  const r = await db
    .prepare(
      `INSERT INTO feeds (clone_id, content, media_url, media_type, created_at)
       VALUES (?, 'hi', NULL, NULL, CURRENT_TIMESTAMP)`,
    )
    .bind(cloneId)
    .run();
  return Number(r.meta.last_row_id);
}

async function token(userId: number): Promise<string> {
  const { issueToken } = await import("../src/lib/jwt");
  const secret = (env as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET missing");
  return await issueToken({ sub: userId, kind: "access" }, secret, 600);
}

describe("댓글 알림 — clone_comment data 에 feedId 포함", () => {
  beforeAll(async () => {
    try {
      await (env.DB as unknown as D1Database).prepare("SELECT COUNT(*) AS c FROM notifications").first();
      await (env.DB as unknown as D1Database).prepare("SELECT COUNT(*) AS c FROM feeds").first();
    } catch {
      throw new Error("D1 migrations not applied.");
    }
  });

  it("다른 유저가 댓글 → owner 알림 data.feedId = 그 피드", async () => {
    const owner = await seedUser();
    const commenter = await seedUser();
    const cloneId = await seedClone(owner);
    const feedId = await seedFeed(cloneId);

    const res = await SELF.fetch(`http://localhost/oth-path${feedId}/comments`, {
      method: "POST",
      headers: { Authorization: `Bearer ${await token(commenter)}`, "Content-Type": "application/json" },
      body: JSON.stringify({ content: "좋은 글이에요" }),
    });
    expect([200, 201]).toContain(res.status);

    const db = env.DB as unknown as D1Database;
    const notif = await db
      .prepare(
        `SELECT data_json FROM notifications
          WHERE user_id = ? AND type = 'clone_comment'
          ORDER BY id DESC LIMIT 1`,
      )
      .bind(owner)
      .first<{ data_json: string }>();
    expect(notif).toBeTruthy();
    const data = JSON.parse(notif!.data_json) as { cloneId?: number; feedId?: number };
    expect(data.cloneId).toBe(cloneId);
    expect(data.feedId).toBe(feedId);
  });
});
