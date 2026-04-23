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
  visibility: "public" | "followers" | "private" = "public",
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

interface SessionResponse {
  sessionId: string;
  livekitRoom: string;
  livekitToken: string;
  cloudflareCallsAppId: string;
  loraUri: string;
  ttsVoiceUri: string;
  expiresAt: string;
  viewerRole: "owner" | "coowner" | "follower";
}

describe("sessions route — contract", () => {
  beforeAll(async () => {
    if (!(await hasClonesTable())) {
      throw new Error("D1 migrations not applied.");
    }
  });

  it("POST /oth-path — owner 는 200 + stub fields 반환", async () => {
    const ownerId = await seedUser("sess-o@test.local");
    const cloneId = await seedClone(ownerId, "sess_owner_clone");
    const token = await issueAccessToken(ownerId);
    const res = await SELF.fetch(
      `http://localhost/oth-path${cloneId}`,
      { method: "POST", headers: { Authorization: `Bearer ${token}` } },
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as SessionResponse;
    expect(body.sessionId).toMatch(/^sess-/);
    expect(body.livekitRoom).toMatch(/^room-/);
    expect(body.livekitToken.length).toBeGreaterThan(0);
    expect(body.loraUri).toMatch(/^r2:\/\//);
    expect(body.ttsVoiceUri).toMatch(/^r2:\/\//);
    expect(typeof body.expiresAt).toBe("string");
    expect(body.viewerRole).toBe("owner");
  });

  it("POST /oth-path — follower 는 200 + viewerRole='follower'", async () => {
    const ownerId = await seedUser("sess-flw-o@test.local");
    const followerId = await seedUser("sess-flw-f@test.local");
    const cloneId = await seedClone(ownerId, "sess_flw_clone");
    await seedFollow(cloneId, followerId);
    const token = await issueAccessToken(followerId);
    const res = await SELF.fetch(
      `http://localhost/oth-path${cloneId}`,
      { method: "POST", headers: { Authorization: `Bearer ${token}` } },
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as SessionResponse;
    expect(body.viewerRole).toBe("follower");
  });

  it("POST /oth-path — 관계 없는 유저는 403", async () => {
    const ownerId = await seedUser("sess-noacc-o@test.local");
    const strangerId = await seedUser("sess-noacc-s@test.local");
    const cloneId = await seedClone(ownerId, "sess_noacc_clone");
    const token = await issueAccessToken(strangerId);
    const res = await SELF.fetch(
      `http://localhost/oth-path${cloneId}`,
      { method: "POST", headers: { Authorization: `Bearer ${token}` } },
    );
    expect(res.status).toBe(403);
  });

  it("POST /oth-path — 비로그인은 401", async () => {
    const ownerId = await seedUser("sess-anon-o@test.local");
    const cloneId = await seedClone(ownerId, "sess_anon_clone");
    const res = await SELF.fetch(
      `http://localhost/oth-path${cloneId}`,
      { method: "POST" },
    );
    expect(res.status).toBe(401);
  });
});
