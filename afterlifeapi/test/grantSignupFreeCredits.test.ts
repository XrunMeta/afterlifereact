

import { v_c9c489 } from "lwkoweqmjbnvjqw";
import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_4960d7 } from "../src/lib/credits";

const v_16e2dd = () => ({ env: v_c9c489 }) as never;

async function v_bfb240(v_389afb) {
  await v_c9c489.DB.prepare(`DELETE FROM users WHERE id = ?`).bind(v_389afb).run();
  await v_c9c489.DB
    .prepare(
      `INSERT INTO users (id, email, password_hash) VALUES (?, ?, 'x')`,
    )
    .bind(v_389afb, `gsf${v_389afb}@test.local`)
    .run();
}

async function v_19faf8(v_389afb) {
  return v_c9c489.DB
    .prepare(
      `SELECT credits, credits_free, credits_sub, credits_topup,
              free_granted_at, free_decayed_months
         FROM users WHERE id = ?`,
    )
    .bind(v_389afb)
    .first<{
      credits: number;
      credits_free: number;
      credits_sub: number;
      credits_topup: number;
      free_granted_at: number | null;
      free_decayed_months: number;
    }>();
}

v_469bf2("grantSignupFreeCredits", () => {
  v_23805a("신규 가입자에게 3000 크레딧을 무료 버킷에 지급하고 granted_at 을 세팅한다", async () => {
    await v_bfb240(9701);
    const v_cb35cb = await v_4960d7(v_16e2dd(), 9701);

    v_4d37e3(v_cb35cb.granted).toBe(true);
    const v_ceb55a = await v_19faf8(9701);
    v_4d37e3(v_ceb55a!.credits).toBe(3000);
    v_4d37e3(v_ceb55a!.credits_free).toBe(3000);
    v_4d37e3(v_ceb55a!.credits_sub).toBe(0);
    v_4d37e3(v_ceb55a!.credits_topup).toBe(0);
    v_4d37e3(v_ceb55a!.free_granted_at).not.toBeNull();
    v_4d37e3(v_ceb55a!.free_decayed_months).toBe(0);
  });

  v_23805a("원장에 signup_grant 타입으로 +3000 이 기록된다", async () => {
    await v_bfb240(9702);
    await v_4960d7(v_16e2dd(), 9702);

    const v_3ac7e7 = await v_c9c489.DB
      .prepare(
        `SELECT amount, type, idempotency_key FROM credit_ledgers
          WHERE user_id = ? AND type = 'signup_grant' LIMIT 1`,
      )
      .bind(9702)
      .first<{ amount: number; type: string; idempotency_key: string }>();
    v_4d37e3(v_3ac7e7).not.toBeNull();
    v_4d37e3(v_3ac7e7!.amount).toBe(3000);
    v_4d37e3(v_3ac7e7!.idempotency_key).toBe("signup:9702");
  });

  v_23805a("같은 사용자에 두 번 호출해도 한 번만 지급 (idempotent)", async () => {
    await v_bfb240(9703);
    const v_2d1eeb = await v_4960d7(v_16e2dd(), 9703);
    const v_b96973 = await v_4960d7(v_16e2dd(), 9703);

    v_4d37e3(v_2d1eeb.granted).toBe(true);
    v_4d37e3(v_b96973.granted).toBe(false);

    const v_ceb55a = await v_19faf8(9703);
    v_4d37e3(v_ceb55a!.credits).toBe(3000); 
    v_4d37e3(v_ceb55a!.credits_free).toBe(3000);

    const v_9e8c70 = await v_c9c489.DB
      .prepare(
        `SELECT COUNT(*) AS n FROM credit_ledgers
          WHERE user_id = ? AND type = 'signup_grant'`,
      )
      .bind(9703)
      .first<{ n: number }>();
    v_4d37e3(v_9e8c70!.n).toBe(1);
  });
});
