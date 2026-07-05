import { describe, it, expect } from "vitest";
import { env } from "cloudflare:test";
import { hasCallLearningConsent, personOwnerHasCallLearningConsent } from "../src/lib/consentGate";
import type { Bindings } from "../src/lib/env";

const E = env as unknown as Bindings;

async function seedUser(id: number, consent: number): Promise<void> {
  await E.DB.prepare(
    `INSERT OR IGNORE INTO users (id, email, password_hash, name, created_at, call_learning_consent)
     VALUES (?, ?, 'x', 'U', CURRENT_TIMESTAMP, ?)`,
  ).bind(id, `cg${id}@test.test`, consent).run();
}

describe("hasCallLearningConsent", () => {
  it("동의(1)면 true, 미동의(0)면 false", async () => {
    await seedUser(5101, 1);
    await seedUser(5102, 0);
    expect(await hasCallLearningConsent(E, 5101)).toBe(true);
    expect(await hasCallLearningConsent(E, 5102)).toBe(false);
  });
  it("존재하지 않는 user면 false", async () => {
    expect(await hasCallLearningConsent(E, 599999)).toBe(false);
  });
});

describe("personOwnerHasCallLearningConsent", () => {
  it("person 등록 user의 동의 상태를 따른다", async () => {
    await seedUser(5103, 1);
    await E.DB.prepare(
      `INSERT OR IGNORE INTO persons (id, user_id, clone_id, display_name, created_at)
       VALUES (?, ?, ?, 'P', unixepoch())`,
    ).bind(6101, 5103, 9101).run();
    expect(await personOwnerHasCallLearningConsent(E, 6101)).toBe(true);
  });
  it("등록 user 미동의면 false", async () => {
    await seedUser(5104, 0);
    await E.DB.prepare(
      `INSERT OR IGNORE INTO persons (id, user_id, clone_id, display_name, created_at)
       VALUES (?, ?, ?, 'P', unixepoch())`,
    ).bind(6102, 5104, 9102).run();
    expect(await personOwnerHasCallLearningConsent(E, 6102)).toBe(false);
  });
});

describe("migration 0085", () => {
  it("users.call_learning_consent 컬럼 + user_consent_log 테이블 존재", async () => {
    const cols = await E.DB.prepare("PRAGMA table_info(users)").all<{ name: string }>();
    expect(cols.results.some((r) => r.name === "call_learning_consent")).toBe(true);
    const tbl = await E.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='user_consent_log'",
    ).first();
    expect(tbl).toBeTruthy();
  });

  it("user 하드삭제 후에도 감사 이력 존속(FK cascade 없음)", async () => {
    await E.DB.prepare(
      `INSERT OR IGNORE INTO users (id, email, password_hash, name, created_at)
       VALUES (5150, 'tomb@test.test', 'x', 'U', CURRENT_TIMESTAMP)`,
    ).run();
    await E.DB.prepare(
      `INSERT INTO user_consent_log (user_id, consent_type, state, changed_at)
       VALUES (5150, 'call_learning', 'granted', unixepoch())`,
    ).run();
    await E.DB.prepare("DELETE FROM users WHERE id = 5150").run();
    const log = await E.DB.prepare(
      "SELECT COUNT(*) AS n FROM user_consent_log WHERE user_id = 5150",
    ).first<{ n: number }>();
    expect(log!.n).toBe(1); 
  });
});
