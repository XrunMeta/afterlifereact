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

describe("GET /oth-path — guideVideoUrls", () => {
  it("guide_video_urls JSON 2개 → assets.guideVideoUrls 길이 2", async () => {
    const db = env.DB as unknown as D1Database;
    const ownerId = await seedUser("bundle-guide-2@test.local");
    const cloneId = await seedClone(ownerId, "bundle_guide_2_clone");
    const urls = ["https://x/oth-path", "https://x/oth-path"];
    await db
      .prepare("UPDATE clones SET guide_video_urls = ? WHERE id = ?")
      .bind(JSON.stringify(urls), cloneId)
      .run();
    const token = await issueAccessToken(ownerId);

    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/bundle`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const { assets } = (await res.json()) as { assets: { guideVideoUrls: string[] } };

    expect(assets.guideVideoUrls).toHaveLength(2);
    expect(assets.guideVideoUrls[0]).toMatch(/\/oth-path\/files\/1$/);
    expect(assets.guideVideoUrls[1]).toMatch(/\/oth-path\/files\/2$/);
  });

  it("guide_video_urls NULL이면 []", async () => {
    const ownerId = await seedUser("bundle-guide-null@test.local");
    const cloneId = await seedClone(ownerId, "bundle_guide_null_clone");
    const token = await issueAccessToken(ownerId);

    const res = await SELF.fetch(`http://localhost/oth-path${cloneId}/bundle`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const { assets } = (await res.json()) as { assets: { guideVideoUrls: string[] } };
    expect(Array.isArray(assets.guideVideoUrls)).toBe(true);
    expect(assets.guideVideoUrls).toHaveLength(0);
  });
});
