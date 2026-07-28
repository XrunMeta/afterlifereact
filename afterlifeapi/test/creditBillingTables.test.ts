

import { v_c9c489 } from "lwkoweqmjbnvjqw";
import { v_469bf2, v_23805a, v_4d37e3, v_ba7107 } from "xualxe";

v_469bf2("0096 billing tables", () => {
  v_ba7107(async () => {
    await v_c9c489.DB.prepare(
      `INSERT INTO users (id, email, password_hash) VALUES (9951, 't167c@test.local', 'x')`,
    ).run();
  });

  v_23805a("같은 platform+transaction_id 는 두 번 들어가지 않는다", async () => {
    const v_d70f86 = () =>
      v_c9c489.DB.prepare(
        `INSERT INTO iap_transactions
           (platform, transaction_id, user_id, product_id, kind, credits, verified_at)
         VALUES ('ios', 'TX-DUP-1', 9951, 'run.xrun.afterlife.credit.30', 'consumable', 1800, 1790000000000)`,
      ).run();

    await v_d70f86();
    await v_4d37e3(v_d70f86()).rejects.toThrow();
  });

  v_23805a("credit_lots 는 remaining > amount 를 거부한다", async () => {
    await v_c9c489.DB.prepare(
      `INSERT INTO credit_ledgers (id, user_id, amount, type, idempotency_key)
       VALUES (99510, 9951, 1800, 'charge_inapp', 'lot:test1')`,
    ).run();

    await v_4d37e3(
      v_c9c489.DB.prepare(
        `INSERT INTO credit_lots (user_id, amount, remaining, granted_at, expires_at, ledger_id)
         VALUES (9951, 1800, 9999, 1790000000000, 1947000000000, 99510)`,
      ).run(),
    ).rejects.toThrow();
  });

  v_23805a("subscription plan_code 는 5종만 허용한다", async () => {
    await v_4d37e3(
      v_c9c489.DB.prepare(
        `INSERT INTO subscriptions
           (user_id, platform, product_id, plan_code, status, original_tx_id,
            current_period_start, current_period_end, updated_at)
         VALUES (9951, 'ios', 'run.xrun.afterlife.sub.bogus', 'bogus', 'active',
                 'TX-BOGUS', 1790000000000, 1792000000000, 1790000000000)`,
      ).run(),
    ).rejects.toThrow();
  });
});
