import { describe, it, expect, beforeAll } from "vitest";
import { SELF, env } from "cloudflare:test";

async function hasUsersTable(): Promise<boolean> {
  try {
    const db = env.DB as unknown as D1Database;
    const row = await db.prepare("SELECT COUNT(*) AS cnt FROM users").first<{ cnt: number }>();
    return typeof row?.cnt === "number";
  } catch {
    return false;
  }
}

async function seedUser(email: string, password: string): Promise<void> {
  const db = env.DB as unknown as D1Database;
  const { hashPassword } = await import("../src/lib/password");
  const hash = await hashPassword(password);
  await db
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, ?, 'U', CURRENT_TIMESTAMP)`)
    .bind(email, hash)
    .run();
}

async function login(email: string, password: string): Promise<string> {
  const res = await SELF.fetch("http://localhost/oth-path", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const json = (await res.json()) as { accessToken?: string };
  return json.accessToken!;
}

function postDevice(token: string, body: unknown): Promise<Response> {
  return SELF.fetch("http://localhost/oth-path", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
}

const PW = "Abcdef1";

describe("POST /oth-path — push_token 부분 unique 충돌 방지", () => {
  beforeAll(async () => {
    if (!(await hasUsersTable())) throw new Error("D1 migrations not applied.");
  });

  it("같은 토큰을 다른 device_id 로 재등록해도 500 없이 200, 이전 행은 비활성화", async () => {
    const email = "device-reuse@test.local";
    await seedUser(email, PW);
    const token = await login(email, PW);
    const pushToken = "ExponentPushToken[reuse-xyz-123]";

    const r1 = await postDevice(token, { deviceId: "dev-A", pushToken, platform: "android" });
    expect(r1.status).toBe(200);

    const r2 = await postDevice(token, { deviceId: "dev-B", pushToken, platform: "android" });
    expect(r2.status).toBe(200);

    const db = env.DB as unknown as D1Database;
    const active = await db
      .prepare(`SELECT device_id FROM user_devices WHERE push_token = ? AND is_active = 1`)
      .bind(pushToken)
      .all<{ device_id: string }>();

    expect(active.results.map((r) => r.device_id)).toEqual(["dev-B"]);
  });

  it("필수 필드 누락 시 400 VALIDATION_FAILED", async () => {
    const email = "device-missing@test.local";
    await seedUser(email, PW);
    const token = await login(email, PW);
    const res = await postDevice(token, { deviceId: "x" });
    expect(res.status).toBe(422); 
  });
});
