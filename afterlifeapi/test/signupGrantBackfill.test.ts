

import { v_c9c489 } from "lwkoweqmjbnvjqw";
import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";

v_469bf2("0098 signup grant backfill", () => {
  v_23805a("소급 지급 후 불변식이 유지되고 free_granted_at 이 채워진다", async () => {
    const v_3ac7e7 = await v_c9c489.DB
      .prepare(
        `SELECT credits, credits_free, credits_sub, credits_topup, free_granted_at,
                free_decayed_months
           FROM users WHERE deleted_at IS NULL LIMIT 1`,
      )
      .first<{
        credits: number;
        credits_free: number;
        credits_sub: number;
        credits_topup: number;
        free_granted_at: number | null;
        free_decayed_months: number;
      }>();

    v_4d37e3(v_3ac7e7).not.toBeNull();
    v_4d37e3(v_3ac7e7!.credits).toBe(v_3ac7e7!.credits_free + v_3ac7e7!.credits_sub + v_3ac7e7!.credits_topup);
    v_4d37e3(v_3ac7e7!.free_granted_at).not.toBeNull();
    v_4d37e3(v_3ac7e7!.free_decayed_months).toBe(0);
  });

  v_23805a("재실행해도 중복 지급되지 않는다", async () => {
    const v_e98932 = await v_c9c489.DB
      .prepare(`SELECT COUNT(*) AS n FROM credit_ledgers WHERE type = 'signup_grant'`)
      .first<{ n: number }>();

    await v_c9c489.DB
      .prepare(
        `INSERT OR IGNORE INTO credit_ledgers (user_id, amount, type, ref_id, idempotency_key)
           SELECT id, 3000, 'signup_grant', 'backfill', 'signup:' || id
             FROM users WHERE deleted_at IS NULL`,
      )
      .run();

    const v_33efc5 = await v_c9c489.DB
      .prepare(`SELECT COUNT(*) AS n FROM credit_ledgers WHERE type = 'signup_grant'`)
      .first<{ n: number }>();

    v_4d37e3(v_33efc5!.n).toBe(v_e98932!.n);
  });
});
