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

async function seedUser(email: string, password: string): Promise<number> {
  const db = env.DB as unknown as D1Database;
  const { hashPassword } = await import("../src/lib/password");
  const hash = await hashPassword(password);
  await db
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, ?, 'U', CURRENT_TIMESTAMP)`)
    .bind(email, hash)
    .run();
  const u = await db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first<{ id: number }>();
  return u!.id;
}

async function banUser(userId: number): Promise<void> {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(`UPDATE users SET banned_until = datetime('now', '+30 days') WHERE id = ?`)
    .bind(userId)
    .run();
}

function postJson(path: string, body: unknown): Promise<Response> {
  return SELF.fetch(`http://localhost${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const PW = "Abcdef1";

describe("auth — 계정 사용 금지(account_ban) 활성 세션 무효화", () => {
  beforeAll(async () => {
    if (!(await hasUsersTable())) throw new Error("D1 migrations not applied.");
  });

  it("ban 적용 후 리프레시 토큰 갱신 → 403 ACCOUNT_SUSPENDED", async () => {
    const email = "ban-refresh@test.local";
    const id = await seedUser(email, PW);

    const loginRes = await postJson("/oth-path", { email, password: PW });
    expect(loginRes.status).toBe(200);
    const login = (await loginRes.json()) as { refreshToken?: string };
    expect(typeof login.refreshToken).toBe("string");

    const ok = await postJson("/oth-path", { refreshToken: login.refreshToken });
    expect(ok.status).toBe(200);
    const okJson = (await ok.json()) as { refreshToken?: string };
    expect(typeof okJson.refreshToken).toBe("string");

    await banUser(id);

    const blocked = await postJson("/oth-path", { refreshToken: okJson.refreshToken });
    expect(blocked.status).toBe(403);
    const body = (await blocked.json()) as { error?: { code?: string } };
    expect(body.error?.code).toBe("ACCOUNT_SUSPENDED");
  });

  it("ban 적용 후 신규 로그인도 403 ACCOUNT_SUSPENDED", async () => {
    const email = "ban-login@test.local";
    const id = await seedUser(email, PW);
    await banUser(id);
    const res = await postJson("/oth-path", { email, password: PW });
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error?: { code?: string } };
    expect(body.error?.code).toBe("ACCOUNT_SUSPENDED");
  });
});
