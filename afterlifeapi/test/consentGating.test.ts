import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";
import type { v_273a0c } from "../src/lib/env";

const v_9542f7 = v_c9c489 as unknown as v_273a0c;
const v_7169b4 = "test-learn-secret"; 

async function v_dc3517(v_6e0fd3, v_43e90c, v_74e200) {
  await v_9542f7.DB.prepare(
    `INSERT OR IGNORE INTO users (id, email, password_hash, name, created_at, call_learning_consent)
     VALUES (?, ?, 'x', 'U', CURRENT_TIMESTAMP, ?)`,
  ).bind(v_43e90c, `gate${v_43e90c}@test.test`, v_74e200).run();
  await v_9542f7.DB.prepare(
    `INSERT OR IGNORE INTO clones (id, owner_id, name, username, clone_type, visibility, created_at)
     VALUES (?, ?, 'CT', ?, 'memlow', 'public', CURRENT_TIMESTAMP)`,
  ).bind(v_6e0fd3, v_43e90c, `g${v_6e0fd3}`).run();
  await v_9542f7.DB.prepare(
    `INSERT OR IGNORE INTO call_sessions (call_id, user_id, clone_id, started_at)
     VALUES (?, ?, ?, unixepoch())`,
  ).bind(`call-${v_6e0fd3}-${v_43e90c}`, v_43e90c, v_6e0fd3).run();
}

v_469bf2("l2/learn 동의 게이트", () => {
  v_23805a("미동의 user → skipped no_consent, 쓰기 없음", async () => {
    await v_dc3517(9301, 8301, 0);
    await v_9542f7.KV_ONT.delete("l2:9301:8301");
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST", headers: { Authorization: `Bearer ${v_7169b4}`, "Content-Type": "application/json" },
      body: JSON.stringify({ userId: 8301, extracted: { relation: "친구" }, source: "call" }),
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_7ecfd1 = await v_8f00b9.json<{ skipped: boolean; reason?: string }>();
    v_4d37e3(v_7ecfd1.skipped).toBe(true);
    v_4d37e3(v_7ecfd1.reason).toBe("no_consent");
    const v_3ac7e7 = await v_9542f7.DB.prepare("SELECT data FROM clone_ont WHERE clone_id=? AND user_id=?")
      .bind(9301, 8301).first();
    v_4d37e3(v_3ac7e7).toBeNull();
  });

  v_23805a("동의 user → 정상 학습", async () => {
    await v_dc3517(9302, 8302, 1);
    await v_9542f7.KV_ONT.delete("l2:9302:8302");
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST", headers: { Authorization: `Bearer ${v_7169b4}`, "Content-Type": "application/json" },
      body: JSON.stringify({ userId: 8302, extracted: { relation: "친구" }, source: "call" }),
    });
    const v_7ecfd1 = await v_8f00b9.json<{ skipped: boolean }>();
    v_4d37e3(v_7ecfd1.skipped).toBe(false);
    const v_3ac7e7 = await v_9542f7.DB.prepare("SELECT data FROM clone_ont WHERE clone_id=? AND user_id=?")
      .bind(9302, 8302).first();
    v_4d37e3(v_3ac7e7).toBeTruthy();
  });
});

v_469bf2("l2p/learn 동의 게이트", () => {
  v_23805a("등록 user 미동의 → skipped no_consent", async () => {
    await v_dc3517(9303, 8303, 0);
    await v_9542f7.DB.prepare(
      `INSERT OR IGNORE INTO persons (id, user_id, clone_id, display_name, created_at)
       VALUES (?, ?, ?, 'P', unixepoch())`,
    ).bind(6301, 8303, 9303).run();
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST", headers: { Authorization: `Bearer ${v_7169b4}`, "Content-Type": "application/json" },
      body: JSON.stringify({ personId: 6301, userId: 8303, extracted: { relation: "이웃" }, source: "call" }),
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_7ecfd1 = await v_8f00b9.json<{ skipped: boolean; reason?: string }>();
    v_4d37e3(v_7ecfd1.skipped).toBe(true);
    v_4d37e3(v_7ecfd1.reason).toBe("no_consent");
  });
});
