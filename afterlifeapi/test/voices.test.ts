import { describe, it, expect } from "vitest";
import { SELF, env } from "cloudflare:test";

async function issueAccessToken(userId: number): Promise<string> {
  const { issueToken } = await import("../src/lib/jwt");
  const secret = (env as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET missing in test env");
  return issueToken({ sub: userId, kind: "access" }, secret, 60 * 10);
}

async function seedUser(email: string): Promise<number> {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(
      `INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`,
    )
    .bind(email)
    .run();
  const u = await db
    .prepare("SELECT id FROM users WHERE email = ?")
    .bind(email)
    .first<{ id: number }>();
  return u!.id;
}

describe("GET /oth-path", () => {
  it("활성 음색만 sort_order 순으로 반환, 고민주 #0", async () => {
    const uid = await seedUser("voices1@test.com");
    const token = await issueAccessToken(uid);
    const res = await SELF.fetch("https://x/oth-path", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json<{
      voices: Array<{ id: number; name: string; sampleUrl: string; sortOrder: number }>;
    }>();
    expect(body.voices.length).toBeGreaterThanOrEqual(1);
    expect(body.voices[0].name).toBe("고민주");
    expect(body.voices[0].sortOrder).toBe(0);
    expect(body.voices[0].sampleUrl).toContain("/sample");

    expect(body.voices.some((v) => v.sampleUrl.includes("/samples/voice_"))).toBe(false);
  });

  it("응답에 nameEn/Ja/ZhCn/Id 필드 포함 (초기 값 null 허용)", async () => {
    const uid = await seedUser("voicesI18n@test.com");
    const token = await issueAccessToken(uid);
    const res = await SELF.fetch("https://x/oth-path", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json<{
      voices: Array<{
        id: number;
        name: string;
        nameEn: string | null;
        nameJa: string | null;
        nameZhCn: string | null;
        nameId: string | null;
      }>;
    }>();
    expect(body.voices.length).toBeGreaterThanOrEqual(1);
    const first = body.voices[0];
    expect(first).toHaveProperty("nameEn");
    expect(first).toHaveProperty("nameJa");
    expect(first).toHaveProperty("nameZhCn");
    expect(first).toHaveProperty("nameId");
  });
});

describe("GET /oth-path", () => {
  it("R2 객체 없으면 404 (라우트 동작 검증)", async () => {

    const res = await SELF.fetch("https://x/oth-path");
    expect(res.status).toBe(404);
  });
  it("id=0 잘못된 id — 422 (VALIDATION_FAILED)", async () => {
    const res = await SELF.fetch("https://x/oth-path");
    expect(res.status).toBe(422);
  });
});

describe("createClone voice_preset_id 검증", () => {
  it("비활성/없는 voice_preset_id 거부 — 400", async () => {
    const uid = await seedUser("voices2@test.com");
    const token = await issueAccessToken(uid);
    const res = await SELF.fetch("https://x/oth-path", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "idempotency-key": `vp-test-${Date.now()}`,
      },
      body: JSON.stringify({
        clone_type: "friend",
        name: "V",
        username: `vp${Date.now()}`,
        voice_preset_id: 999999,
      }),
    });
    expect(res.status).toBe(400);
  });
});
