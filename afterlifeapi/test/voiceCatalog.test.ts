

import { describe, it, expect, beforeAll } from "vitest";
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

const CATALOG_FILE_ID = 9500;

let OTHER_USER_FILE_ID: number;
let testUserId: number;

beforeAll(async () => {
  const db = env.DB as unknown as D1Database;

  await db
    .prepare(
      `INSERT OR IGNORE INTO files (id, r2_key, content_type, size_bytes, owner_user_id, purpose)
       VALUES (?, 'voice/sample/yeongji.mp3', 'audio/mpeg', 0, NULL, 'voice_catalog')`,
    )
    .bind(CATALOG_FILE_ID)
    .run();

  await db
    .prepare(
      `INSERT OR IGNORE INTO voice_presets
         (id, name, gender, age_range, description, sort_order, is_active, r2_key, se_key, src_file_id)
       VALUES (9510, '영지', NULL, NULL, NULL, 1, 1, 'voice/sample/yeongji.mp3', NULL, 9500)`,
    )
    .run();

  const otherId = await seedUser("catalog-other@test.com");
  const r = await db
    .prepare(
      `INSERT INTO files (r2_key, content_type, size_bytes, owner_user_id, purpose)
       VALUES ('uploadedfiles/other-catalog-test.jpg', 'image/jpeg', 1, ?, 'clone_avatar')
       RETURNING id`,
    )
    .bind(otherId)
    .first<{ id: number }>();
  OTHER_USER_FILE_ID = r!.id;

  testUserId = await seedUser("catalog-user@test.com");
});

describe("GET /oth-path — srcFileId 포함", () => {
  it("활성 카탈로그 항목에 srcFileId 를 포함한다", async () => {
    const token = await issueAccessToken(testUserId);
    const res = await SELF.fetch("https://x/oth-path", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json<{
      voices: Array<{ id: number; srcFileId: number | null; sampleUrl: string }>;
    }>();
    expect(body.voices.length).toBeGreaterThan(0);

    for (const v of body.voices) {
      expect(v).toHaveProperty("srcFileId");
      expect(typeof v.srcFileId === "number" || v.srcFileId === null).toBe(true);
    }
  });

  it("카탈로그 시드 항목(영지 id=9510)의 srcFileId 가 9500 이다", async () => {
    const token = await issueAccessToken(testUserId);
    const res = await SELF.fetch("https://x/oth-path", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json<{
      voices: Array<{ id: number; name: string; srcFileId: number | null }>;
    }>();
    const yeongji = body.voices.find((v) => v.id === 9510);
    expect(yeongji).toBeDefined();
    expect(yeongji!.srcFileId).toBe(9500);
  });
});

describe("POST /oth-path — 카탈로그 공용 파일 허용", () => {
  it("voice_catalog 파일은 본인 소유가 아니어도 voice_clone job 생성을 허용한다 (201)", async () => {
    const token = await issueAccessToken(testUserId);
    const res = await SELF.fetch("https://x/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "voice_clone", src_file_id: CATALOG_FILE_ID }),
    });
    expect(res.status).toBe(201);
    const body = await res.json<{ job_id: string; status: string }>();
    expect(body.job_id).toBeTruthy();
    expect(body.status).toBe("pending");
  });

  it("일반 타인 소유 파일은 여전히 404 로 거부한다", async () => {
    const token = await issueAccessToken(testUserId);
    const res = await SELF.fetch("https://x/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "voice_clone", src_file_id: OTHER_USER_FILE_ID }),
    });
    expect(res.status).toBe(404);
  });
});
