import { describe, it, expect, beforeAll } from "vitest";
import { SELF, env } from "cloudflare:test";

let seq = 0;
async function seedUser(): Promise<number> {
  const db = env.DB as unknown as D1Database;
  seq += 1;
  const email = `ridem-${seq}-${(seq * 7919) % 100000}@test.local`;
  await db
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(email)
    .run();
  return (await db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first<{ id: number }>())!.id;
}

async function seedClone(ownerId: number): Promise<number> {
  const db = env.DB as unknown as D1Database;
  seq += 1;
  const username = `ridem_clone_${seq}`;
  await db
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, training_status, created_at, updated_at)
       VALUES (?, 'T', ?, 'friend', 'public', 'ready', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    )
    .bind(ownerId, username)
    .run();
  return (await db.prepare("SELECT id FROM clones WHERE username = ?").bind(username).first<{ id: number }>())!.id;
}

async function seedComment(cloneId: number, authorId: number): Promise<{ commentId: number; feedId: number }> {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(`INSERT INTO feeds (clone_id, content, created_at) VALUES (?, 'post', CURRENT_TIMESTAMP)`)
    .bind(cloneId)
    .run();
  const feedId = (await db.prepare("SELECT last_insert_rowid() AS id").first<{ id: number }>())!.id;
  await db
    .prepare(`INSERT INTO feed_comments (feed_id, user_id, content, created_at) VALUES (?, ?, 'c', CURRENT_TIMESTAMP)`)
    .bind(feedId, authorId)
    .run();
  const commentId = (await db.prepare("SELECT last_insert_rowid() AS id").first<{ id: number }>())!.id;
  return { commentId, feedId };
}

async function token(userId: number, admin = false): Promise<string> {
  const { issueToken } = await import("../src/lib/jwt");
  const secret = (env as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET missing");
  return await issueToken({ sub: userId, kind: "access", admin }, secret, 600);
}

function patch(path: string, t: string, body: object): Promise<Response> {
  return SELF.fetch(`http://localhost${path}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function reviewedAt(table: string, id: number): Promise<string | null> {
  const db = env.DB as unknown as D1Database;
  const r = await db.prepare(`SELECT reviewed_at AS r FROM ${table} WHERE id = ?`).bind(id).first<{ r: string | null }>();
  return r?.r ?? null;
}

describe("신고 PATCH reviewed_at 멱등성 (T-151-15b)", () => {
  beforeAll(async () => {
    try {
      await (env.DB as unknown as D1Database).prepare("SELECT COUNT(*) AS c FROM user_reports").first();
    } catch {
      throw new Error("D1 migrations not applied.");
    }
  });

  it("user_reports: 최초 open→reviewed 전이에 reviewed_at 세팅", async () => {
    const reporter = await seedUser();
    const target = await seedUser();
    const admin = await token(await seedUser(), true);
    const repToken = await token(reporter);

    await SELF.fetch(`http://localhost/oth-path${target}/report`, {
      method: "POST",
      headers: { Authorization: `Bearer ${repToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "test" }),
    });
    const db = env.DB as unknown as D1Database;
    const rep = await db
      .prepare("SELECT id FROM user_reports WHERE reporter_id = ? AND target_id = ?")
      .bind(reporter, target)
      .first<{ id: number }>();
    const id = rep!.id;

    expect(await reviewedAt("user_reports", id)).toBeNull();

    const res = await patch(`/oth-path${id}`, admin, { status: "reviewed" });
    expect(res.status).toBe(200);
    const first = await reviewedAt("user_reports", id);
    expect(first).toBeTruthy();
  });

  it("user_reports: 같은 상태로 재PATCH해도 reviewed_at 불변", async () => {
    const reporter = await seedUser();
    const target = await seedUser();
    const admin = await token(await seedUser(), true);
    const repToken = await token(reporter);
    await SELF.fetch(`http://localhost/oth-path${target}/report`, {
      method: "POST",
      headers: { Authorization: `Bearer ${repToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "test" }),
    });
    const db = env.DB as unknown as D1Database;
    const id = (
      await db.prepare("SELECT id FROM user_reports WHERE reporter_id = ? AND target_id = ?").bind(reporter, target).first<{ id: number }>()
    )!.id;

    await patch(`/oth-path${id}`, admin, { status: "reviewed" });
    const first = await reviewedAt("user_reports", id);
    expect(first).toBeTruthy();

    await new Promise((r) => setTimeout(r, 1100)); 
    const res2 = await patch(`/oth-path${id}`, admin, { status: "reviewed", adminMessage: "수정된 메모" });
    expect(res2.status).toBe(200);
    const second = await reviewedAt("user_reports", id);
    expect(second).toBe(first);
  });

  it("user_reports: 다른 비open 상태로 바뀌어도 기존 reviewed_at 보존", async () => {
    const reporter = await seedUser();
    const target = await seedUser();
    const admin = await token(await seedUser(), true);
    const repToken = await token(reporter);
    await SELF.fetch(`http://localhost/oth-path${target}/report`, {
      method: "POST",
      headers: { Authorization: `Bearer ${repToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "test" }),
    });
    const db = env.DB as unknown as D1Database;
    const id = (
      await db.prepare("SELECT id FROM user_reports WHERE reporter_id = ? AND target_id = ?").bind(reporter, target).first<{ id: number }>()
    )!.id;

    await patch(`/oth-path${id}`, admin, { status: "reviewed" });
    const first = await reviewedAt("user_reports", id);
    expect(first).toBeTruthy();

    await new Promise((r) => setTimeout(r, 1100));
    const res2 = await patch(`/oth-path${id}`, admin, { status: "dismissed" });
    expect(res2.status).toBe(200);
    const afterDismiss = await reviewedAt("user_reports", id);
    expect(afterDismiss).toBe(first);

    const res3 = await patch(`/oth-path${id}`, admin, { status: "open" });
    expect(res3.status).toBe(200);
    expect(await reviewedAt("user_reports", id)).toBeNull();

    const res4 = await patch(`/oth-path${id}`, admin, { status: "actioned" });
    expect(res4.status).toBe(200);
    const second = await reviewedAt("user_reports", id);
    expect(second).toBeTruthy();
    expect(second).not.toBe(first);
  });

  it("clone_reports: 최초 세팅 + 같은 상태 재PATCH 시 불변", async () => {
    const reporter = await seedUser();
    const owner = await seedUser();
    const cloneId = await seedClone(owner);
    const admin = await token(await seedUser(), true);
    const db = env.DB as unknown as D1Database;
    await db
      .prepare(`INSERT INTO clone_reports (user_id, clone_id, reason, status, created_at) VALUES (?, ?, 'r', 'open', CURRENT_TIMESTAMP)`)
      .bind(reporter, cloneId)
      .run();
    const id = (await db.prepare("SELECT id FROM clone_reports WHERE user_id = ? AND clone_id = ?").bind(reporter, cloneId).first<{ id: number }>())!
      .id;

    const res = await patch(`/oth-path${id}`, admin, { status: "dismissed" });
    expect(res.status).toBe(200);
    const first = await reviewedAt("clone_reports", id);
    expect(first).toBeTruthy();

    await new Promise((r) => setTimeout(r, 1100));
    const res2 = await patch(`/oth-path${id}`, admin, { status: "dismissed", adminMessage: "메모 변경" });
    expect(res2.status).toBe(200);
    expect(await reviewedAt("clone_reports", id)).toBe(first);
  });

  it("comment_reports: 최초 세팅 + 같은 상태 재PATCH 시 불변", async () => {
    const reporter = await seedUser();
    const owner = await seedUser();
    const cloneId = await seedClone(owner);
    const { commentId } = await seedComment(cloneId, owner);
    const admin = await token(await seedUser(), true);
    const db = env.DB as unknown as D1Database;
    await db
      .prepare(
        `INSERT INTO comment_reports (user_id, comment_id, feed_id, clone_id, reason, status, created_at)
         VALUES (?, ?, (SELECT feed_id FROM feed_comments WHERE id = ?), ?, 'r', 'open', CURRENT_TIMESTAMP)`,
      )
      .bind(reporter, commentId, commentId, cloneId)
      .run();
    const id = (
      await db.prepare("SELECT id FROM comment_reports WHERE user_id = ? AND comment_id = ?").bind(reporter, commentId).first<{ id: number }>()
    )!.id;

    const res = await patch(`/oth-path${id}`, admin, { status: "dismissed" });
    expect(res.status).toBe(200);
    const first = await reviewedAt("comment_reports", id);
    expect(first).toBeTruthy();

    await new Promise((r) => setTimeout(r, 1100));
    const res2 = await patch(`/oth-path${id}`, admin, { status: "dismissed", adminMessage: "메모 변경" });
    expect(res2.status).toBe(200);
    expect(await reviewedAt("comment_reports", id)).toBe(first);
  });

  it("adminData dismiss(POST): 이미 reviewed 상태로 세팅된 reviewed_at 보존", async () => {
    const reporter = await seedUser();
    const target = await seedUser();
    const admin = await token(await seedUser(), true);
    const repToken = await token(reporter);
    await SELF.fetch(`http://localhost/oth-path${target}/report`, {
      method: "POST",
      headers: { Authorization: `Bearer ${repToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "test" }),
    });
    const db = env.DB as unknown as D1Database;
    const id = (
      await db.prepare("SELECT id FROM user_reports WHERE reporter_id = ? AND target_id = ?").bind(reporter, target).first<{ id: number }>()
    )!.id;

    await patch(`/oth-path${id}`, admin, { status: "reviewed" });
    const first = await reviewedAt("user_reports", id);
    expect(first).toBeTruthy();

    await new Promise((r) => setTimeout(r, 1100));
    const dismissRes = await SELF.fetch(`http://localhost/oth-path${id}/dismiss`, {
      method: "POST",
      headers: { Authorization: `Bearer ${admin}`, "Content-Type": "application/json" },
      body: JSON.stringify({ message: "기각" }),
    });
    expect(dismissRes.status).toBe(200);
    expect(await reviewedAt("user_reports", id)).toBe(first);

    const status = await db.prepare("SELECT status AS s FROM user_reports WHERE id = ?").bind(id).first<{ s: string }>();
    expect(status?.s).toBe("dismissed");
  });

  it("adminData warn(POST, reportId 지정): 이미 처리된 신고에 경고 재부과해도 reviewed_at 불변", async () => {
    const reporter = await seedUser();
    const target = await seedUser();
    const admin = await token(await seedUser(), true);
    const repToken = await token(reporter);
    await SELF.fetch(`http://localhost/oth-path${target}/report`, {
      method: "POST",
      headers: { Authorization: `Bearer ${repToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "test" }),
    });
    const db = env.DB as unknown as D1Database;
    const id = (
      await db.prepare("SELECT id FROM user_reports WHERE reporter_id = ? AND target_id = ?").bind(reporter, target).first<{ id: number }>()
    )!.id;

    const warn1 = await SELF.fetch(`http://localhost/oth-path${target}/warn`, {
      method: "POST",
      headers: { Authorization: `Bearer ${admin}`, "Content-Type": "application/json" },
      body: JSON.stringify({ reportId: id, reason: "1차 경고" }),
    });
    expect(warn1.status).toBe(200);
    const first = await reviewedAt("user_reports", id);
    expect(first).toBeTruthy();
    const status1 = await db.prepare("SELECT status AS s FROM user_reports WHERE id = ?").bind(id).first<{ s: string }>();
    expect(status1?.s).toBe("actioned");

    await new Promise((r) => setTimeout(r, 1100));
    const warn2 = await SELF.fetch(`http://localhost/oth-path${target}/warn`, {
      method: "POST",
      headers: { Authorization: `Bearer ${admin}`, "Content-Type": "application/json" },
      body: JSON.stringify({ reportId: id, reason: "2차(재부과) 경고" }),
    });
    expect(warn2.status).toBe(200);
    expect(await reviewedAt("user_reports", id)).toBe(first);
  });
});
