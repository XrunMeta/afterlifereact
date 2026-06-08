import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { SELF, env, fetchMock } from "cloudflare:test";

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
    .prepare(`INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at) VALUES (?, 'CT', ?, 'memlow', 'public', CURRENT_TIMESTAMP)`)
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

beforeAll(() => {
  fetchMock.activate();
  fetchMock.disableNetConnect();
});
afterEach(() => fetchMock.assertNoPendingInterceptors());

describe("GET /oth-path", () => {
  it("returns personaBundle+assets without creating a call_sessions row", async () => {
    const userId = await seedUser("bundle-ok@test.local");
    const cloneId = await seedClone(userId, "bundle_clone_ok");
    const token = await issueAccessToken(userId);

    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/bundle`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      personaBundle: unknown;
      assets: { voiceSeKey: string | null; voiceSeUrl: string | null; idleVideoUrl: string | null; avatarUrl: string | null };
    };
    expect(body.personaBundle).toBeTruthy();
    expect(body.assets).toHaveProperty("voiceSeKey");

    const row = await env.DB.prepare(
      "SELECT COUNT(*) as n FROM call_sessions WHERE clone_id = ?"
    ).bind(cloneId).first<{ n: number }>();
    expect(row!.n).toBe(0);
  });

  it("requires auth — 비로그인 401", async () => {
    const ownerId = await seedUser("bundle-anon@test.local");
    const cloneId = await seedClone(ownerId, "bundle_clone_anon");

    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/bundle`);
    expect(res.status).toBe(401);
  });

  it("없는 clone → 404", async () => {
    const userId = await seedUser("bundle-404@test.local");
    const token = await issueAccessToken(userId);

    const res = await SELF.fetch(`http://localhost/oth-path`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(404);
  });

  it("private 클론은 stranger에게 403", async () => {
    const db = env.DB as unknown as D1Database;
    const ownerId = await seedUser("bundle-priv-owner@test.local");
    await db
      .prepare(
        `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
         VALUES (?, 'Priv', 'bundle_priv_clone', 'memlow', 'private', CURRENT_TIMESTAMP)`,
      )
      .bind(ownerId)
      .run();
    const clone = await db.prepare("SELECT id FROM clones WHERE username = 'bundle_priv_clone'").first<{ id: number }>();
    const stranger = await seedUser("bundle-priv-stranger@test.local");
    const token = await issueAccessToken(stranger);

    const res = await SELF.fetch(`http://localhost/oth-path${clone!.id}/bundle`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(403);
  });

  it("personaBundle에 l0.rules_text와 persona.displayName 포함", async () => {
    const userId = await seedUser("bundle-pb@test.local");
    const cloneId = await seedClone(userId, "bundle_pb_clone");
    const token = await issueAccessToken(userId);

    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/bundle`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      personaBundle: { l0: { rules_text: string }; persona: { displayName: string } };
      assets: unknown;
    };
    expect(typeof body.personaBundle.l0.rules_text).toBe("string");
    expect(body.personaBundle.persona.displayName).toBe("CT"); 
  });

  it("voice_se_url 있는 클론은 assets.voiceSeUrl 반환", async () => {
    const db = env.DB as unknown as D1Database;
    const ownerId = await seedUser("bundle-seurl@test.local");
    const cloneId = await seedClone(ownerId, "bundle_se_url_clone");
    await db
      .prepare("UPDATE clones SET voice_se_url = ?, idle_video_url = ?, avatar_url = ? WHERE id = ?")
      .bind("https://r2.example.com/voice/se.pth", "https://r2.example.com/idle.mp4", "https://r2.example.com/avatar.jpg", cloneId)
      .run();
    const token = await issueAccessToken(ownerId);

    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/bundle`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const { assets } = (await res.json()) as {
      assets: { voiceSeUrl: string | null; idleVideoUrl: string | null; avatarUrl: string | null; voiceSeKey: string | null };
    };
    expect(assets.voiceSeUrl).toBe("https://r2.example.com/voice/se.pth");
    expect(assets.idleVideoUrl).toBe("https://r2.example.com/idle.mp4");
    expect(assets.avatarUrl).toBe("https://r2.example.com/avatar.jpg");
    expect(assets.voiceSeKey).toBeNull();
  });
});
