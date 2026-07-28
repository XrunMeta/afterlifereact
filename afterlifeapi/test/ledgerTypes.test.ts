

import { v_c9c489 } from "lwkoweqmjbnvjqw";
import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";

v_469bf2("0095 ledger types", () => {
  v_23805a("신규 타입 call_usage 를 받는다", async () => {
    await v_c9c489.DB.prepare(
      `INSERT INTO users (id, email, password_hash) VALUES (9941, 't167b@test.local', 'x')`,
    ).run();
    await v_c9c489.DB.prepare(
      `INSERT INTO credit_ledgers (user_id, amount, type, idempotency_key)
       VALUES (9941, -600, 'call_usage', 'call:test1')`,
    ).run();

    const v_3ac7e7 = await v_c9c489.DB
      .prepare(
        `SELECT amount, type FROM credit_ledgers WHERE idempotency_key = 'call:test1'`,
      )
      .first<{ amount: number; type: string }>();
    v_4d37e3(v_3ac7e7!.type).toBe("call_usage");
    v_4d37e3(v_3ac7e7!.amount).toBe(-600);
  });

  v_23805a("정의되지 않은 타입은 거부한다", async () => {
    await v_4d37e3(
      v_c9c489.DB.prepare(
        `INSERT INTO credit_ledgers (user_id, amount, type, idempotency_key)
         VALUES (9941, -1, 'bogus_type', 'call:test2')`,
      ).run(),
    ).rejects.toThrow();
  });

  v_23805a("기존 타입 charge_xrun 은 여전히 허용된다", async () => {
    await v_c9c489.DB.prepare(
      `INSERT INTO credit_ledgers (user_id, amount, type, idempotency_key)
       VALUES (9941, 100, 'charge_xrun', 'legacy:test1')`,
    ).run();
    const v_3ac7e7 = await v_c9c489.DB
      .prepare(`SELECT type FROM credit_ledgers WHERE idempotency_key = 'legacy:test1'`)
      .first<{ type: string }>();
    v_4d37e3(v_3ac7e7!.type).toBe("charge_xrun");
  });

  v_23805a("UNIQUE(type, idempotency_key) 는 (같은 type 안에서만) 중복을 막는다", async () => {
    await v_c9c489.DB.prepare(
      `INSERT INTO credit_ledgers (user_id, amount, type, idempotency_key)
       VALUES (9941, 3000, 'signup_grant', 'signup:9941')`,
    ).run();
    await v_4d37e3(
      v_c9c489.DB.prepare(
        `INSERT INTO credit_ledgers (user_id, amount, type, idempotency_key)
         VALUES (9941, 3000, 'signup_grant', 'signup:9941')`,
      ).run(),
    ).rejects.toThrow();
  });
});
