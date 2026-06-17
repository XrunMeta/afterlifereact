import { describe, it, expect, beforeAll } from "vitest";
import { SELF, env } from "cloudflare:test";

const ADMIN_ORIGIN = "https://preview.xrun-admin.pages.dev";

async function hasUsersTable(): Promise<boolean> {
  try {
    const db = env.DB as unknown as D1Database;
    const row = await db.prepare("SELECT COUNT(*) AS cnt FROM users").first<{ cnt: number }>();
    return typeof row?.cnt === "number";
  } catch {
    return false;
  }
}

async function seedUser(email: string): Promise<number> {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(email)
    .run();
  const u = await db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first<{ id: number }>();
  return u!.id;
}

function applyPenalty(userId: number, body: unknown): Promise<Response> {
  return SELF.fetch(`http://localhost/oth-path${userId}/apply-penalty`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: ADMIN_ORIGIN },
    body: JSON.stringify(body),
  });
}

async function latestModerationBody(userId: number): Promise<string | null> {
  const db = env.DB as unknown as D1Database;
  const r = await db
    .prepare(`SELECT body FROM notifications WHERE user_id = ? AND type = 'moderation' ORDER BY id DESC LIMIT 1`)
    .bind(userId)
    .first<{ body: string }>();
  return r?.body ?? null;
}

describe("apply-penalty 알림 — 만료일 포함", () => {
  beforeAll(async () => {
    if (!(await hasUsersTable())) throw new Error("D1 migrations not applied.");
  });

  it("account_ban 알림 본문에 '까지 계정 사용이 정지됩니다' + 연/월/일", async () => {
    const id = await seedUser("pen-ban@test.local");
    const res = await applyPenalty(id, { action: "account_ban", suspendDays: 7 });
    expect(res.status).toBe(200);
    const bodyText = await latestModerationBody(id);
    expect(bodyText).toBeTruthy();
    expect(bodyText).toContain("까지 계정 사용이 정지됩니다");
    expect(bodyText).toMatch(/\d{4}년 \d{1,2}월 \d{1,2}일/);
  });

  it("clone_create_ban 알림 본문에 '까지 페르소나 생성이 제한됩니다' + 날짜", async () => {
    const id = await seedUser("pen-suspend@test.local");
    const res = await applyPenalty(id, { action: "clone_create_ban", suspendDays: 30 });
    expect(res.status).toBe(200);
    const bodyText = await latestModerationBody(id);
    expect(bodyText).toContain("까지 페르소나 생성이 제한됩니다");
    expect(bodyText).toMatch(/\d{4}년 \d{1,2}월 \d{1,2}일/);
  });
});
