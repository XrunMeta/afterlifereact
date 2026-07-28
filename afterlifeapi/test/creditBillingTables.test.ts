

import { env } from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";

describe("0096 billing tables", () => {
  beforeAll(async () => {
    await env.DB.prepare(
      `INSERT INTO users (id, email, password_hash) VALUES (9951, 't167c@test.local', 'x')`,
    ).run();
  });

  it("같은 platform+transaction_id 는 두 번 들어가지 않는다", async () => {
    const insert = () =>
      env.DB.prepare(
        `INSERT INTO iap_transactions
           (platform, transaction_id, user_id, product_id, kind, credits, verified_at)
         VALUES ('ios', 'TX-DUP-1', 9951, 'run.xrun.afterlife.credit.30', 'consumable', 1800, 1790000000000)`,
      ).run();

    await insert();
    await expect(insert()).rejects.toThrow();
  });

  it("credit_lots 는 remaining > amount 를 거부한다", async () => {
    await env.DB.prepare(
      `INSERT INTO credit_ledgers (id, user_id, amount, type, idempotency_key)
       VALUES (99510, 9951, 1800, 'charge_inapp', 'lot:test1')`,
    ).run();

    await expect(
      env.DB.prepare(
        `INSERT INTO credit_lots (user_id, amount, remaining, granted_at, expires_at, ledger_id)
         VALUES (9951, 1800, 9999, 1790000000000, 1947000000000, 99510)`,
      ).run(),
    ).rejects.toThrow();
  });

  it("subscription plan_code 는 5종만 허용한다", async () => {
    await expect(
      env.DB.prepare(
        `INSERT INTO subscriptions
           (user_id, platform, product_id, plan_code, status, original_tx_id,
            current_period_start, current_period_end, updated_at)
         VALUES (9951, 'ios', 'run.xrun.afterlife.sub.bogus', 'bogus', 'active',
                 'TX-BOGUS', 1790000000000, 1792000000000, 1790000000000)`,
      ).run(),
    ).rejects.toThrow();
  });
});
