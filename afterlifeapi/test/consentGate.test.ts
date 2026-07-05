import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_c9c489 } from "lwkoweqmjbnvjqw";
import { v_8d5056, v_900412 } from "../src/lib/consentGate";
import type { v_273a0c } from "../src/lib/env";

const v_9542f7 = v_c9c489 as unknown as v_273a0c;

async function v_bfb240(v_389afb, v_74e200): Promise<void> {
  await v_9542f7.DB.prepare(
    `INSERT OR IGNORE INTO users (id, email, password_hash, name, created_at, call_learning_consent)
     VALUES (?, ?, 'x', 'U', CURRENT_TIMESTAMP, ?)`,
  ).bind(v_389afb, `cg${v_389afb}@test.test`, v_74e200).run();
}

v_469bf2("hasCallLearningConsent", () => {
  v_23805a("동의(1)면 true, 미동의(0)면 false", async () => {
    await v_bfb240(5101, 1);
    await v_bfb240(5102, 0);
    v_4d37e3(await v_8d5056(v_9542f7, 5101)).toBe(true);
    v_4d37e3(await v_8d5056(v_9542f7, 5102)).toBe(false);
  });
  v_23805a("존재하지 않는 user면 false", async () => {
    v_4d37e3(await v_8d5056(v_9542f7, 599999)).toBe(false);
  });
});

v_469bf2("personOwnerHasCallLearningConsent", () => {
  v_23805a("person 등록 user의 동의 상태를 따른다", async () => {
    await v_bfb240(5103, 1);
    await v_9542f7.DB.prepare(
      `INSERT OR IGNORE INTO persons (id, user_id, clone_id, display_name, created_at)
       VALUES (?, ?, ?, 'P', unixepoch())`,
    ).bind(6101, 5103, 9101).run();
    v_4d37e3(await v_900412(v_9542f7, 6101)).toBe(true);
  });
  v_23805a("등록 user 미동의면 false", async () => {
    await v_bfb240(5104, 0);
    await v_9542f7.DB.prepare(
      `INSERT OR IGNORE INTO persons (id, user_id, clone_id, display_name, created_at)
       VALUES (?, ?, ?, 'P', unixepoch())`,
    ).bind(6102, 5104, 9102).run();
    v_4d37e3(await v_900412(v_9542f7, 6102)).toBe(false);
  });
});

v_469bf2("migration 0085", () => {
  v_23805a("users.call_learning_consent 컬럼 + user_consent_log 테이블 존재", async () => {
    const v_6c1676 = await v_9542f7.DB.prepare("PRAGMA table_info(users)").all<{ name: string }>();
    v_4d37e3(v_6c1676.results.some((v_cb35cb) => v_cb35cb.name === "call_learning_consent")).toBe(true);
    const v_49272c = await v_9542f7.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='user_consent_log'",
    ).first();
    v_4d37e3(v_49272c).toBeTruthy();
  });

  v_23805a("user 하드삭제 후에도 감사 이력 존속(FK cascade 없음)", async () => {
    await v_9542f7.DB.prepare(
      `INSERT OR IGNORE INTO users (id, email, password_hash, name, created_at)
       VALUES (5150, 'tomb@test.test', 'x', 'U', CURRENT_TIMESTAMP)`,
    ).run();
    await v_9542f7.DB.prepare(
      `INSERT INTO user_consent_log (user_id, consent_type, state, changed_at)
       VALUES (5150, 'call_learning', 'granted', unixepoch())`,
    ).run();
    await v_9542f7.DB.prepare("DELETE FROM users WHERE id = 5150").run();
    const v_3e58a1 = await v_9542f7.DB.prepare(
      "SELECT COUNT(*) AS n FROM user_consent_log WHERE user_id = 5150",
    ).first<{ n: number }>();
    v_4d37e3(v_3e58a1!.n).toBe(1); 
  });
});
