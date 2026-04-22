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

async function seedClone(ownerId: number, username: string): Promise<number> {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
       VALUES (?, 'CT', ?, 'memlow', 'public', CURRENT_TIMESTAMP)`,
    )
    .bind(ownerId, username)
    .run();
  const c = await db
    .prepare("SELECT id FROM clones WHERE username = ?")
    .bind(username)
    .first<{ id: number }>();
  return c!.id;
}

async function seedMessage(
  cloneId: number,
  userId: number,
  sessionId: string,
  role: "user" | "clone",
  rawContent: string,
): Promise<number> {
  const db = env.DB as unknown as D1Database;

  await db
    .prepare(
      `INSERT INTO messages (clone_id, user_id, session_id, role, content, status, reconciliation_status)
       VALUES (?, ?, ?, ?, NULL, 'active', 'pending')`,
    )
    .bind(cloneId, userId, sessionId, role)
    .run();
  void rawContent;
  const m = await db
    .prepare(
      `SELECT id FROM messages WHERE clone_id = ? AND user_id = ? AND role = ? ORDER BY id DESC LIMIT 1`,
    )
    .bind(cloneId, userId, role)
    .first<{ id: number }>();
  return m!.id;
}

async function issueAccessToken(userId: number): Promise<string> {
  const { issueToken } = await import("../src/lib/jwt");
  const secret = (env as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET missing in test env");
  return await issueToken({ sub: userId, kind: "access" }, secret, 60 * 10);
}

async function ensureActiveKek(): Promise<void> {
  const db = env.DB as unknown as D1Database;
  const row = await db
    .prepare(`SELECT kek_id FROM encryption_keys WHERE status = 'active' LIMIT 1`)
    .first<{ kek_id: string }>();
  if (row) return;
  const masterRoot = (env as { MASTER_ROOT?: string }).MASTER_ROOT;
  if (!masterRoot) throw new Error("MASTER_ROOT missing in test env");
  const { generateKekAndWrap } = await import("../src/lib/kekProvider");
  const { encryptedKek } = generateKekAndWrap(masterRoot);
  await db
    .prepare(
      `INSERT INTO encryption_keys (kek_id, version, encrypted_kek, status)
       VALUES ('kek_test_v1', 1, ?, 'active')`,
    )
    .bind(encryptedKek)
    .run();
}

describe("messages route — contract", () => {
  beforeAll(async () => {
    if (!(await hasClonesTable())) {
      throw new Error("D1 migrations not applied.");
    }
    await ensureActiveKek();
  });

  it("GET /oth-path — items shape 검증 (snapshot 정합)", async () => {
    const ownerId = await seedUser("msg-o@test.local");
    const userId = await seedUser("msg-u@test.local");
    const cloneId = await seedClone(ownerId, "msg_clone");

    const sessionId = "sess-test-01";
    const u1 = await seedMessage(cloneId, userId, sessionId, "user", "hi");
    const c1 = await seedMessage(cloneId, userId, sessionId, "clone", "hello");

    const token = await issueAccessToken(userId);
    const res = await SELF.fetch(
      `http://localhost/oth-path${cloneId}/messages`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      items: Array<{
        id: number;
        sessionId: string;
        role: "user" | "clone";
        content: string | null;
        createdAt: string;
      }>;
      nextCursor: number | null;
    };
    expect(Array.isArray(body.items)).toBe(true);
    const ids = body.items.map((i) => i.id).sort((a, b) => a - b);
    expect(ids).toEqual([u1, c1].sort((a, b) => a - b));
    for (const item of body.items) {
      expect(item.sessionId).toBe(sessionId);
      expect(["user", "clone"]).toContain(item.role);
      expect(typeof item.createdAt).toBe("string");
    }
    expect(body).toHaveProperty("nextCursor");
  });
});
