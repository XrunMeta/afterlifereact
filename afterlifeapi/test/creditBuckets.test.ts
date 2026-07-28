

import { v_c9c489 } from "lwkoweqmjbnvjqw";
import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";

v_469bf2("0094 credit buckets", () => {
  v_23805a("기존 credits 가 credits_topup 으로 이관되고 불변식이 성립한다", async () => {
    await v_c9c489.DB.prepare(
      `INSERT INTO users (id, email, password_hash, credits, credits_topup)
       VALUES (9931, 't167a@test.local', 'x', 500, 500)`,
    ).run();

    const v_3ac7e7 = await v_c9c489.DB
      .prepare(
        `SELECT credits, credits_free, credits_sub, credits_topup
           FROM users WHERE id = 9931`,
      )
      .first<{
        credits: number;
        credits_free: number;
        credits_sub: number;
        credits_topup: number;
      }>();

    v_4d37e3(v_3ac7e7!.credits).toBe(v_3ac7e7!.credits_free + v_3ac7e7!.credits_sub + v_3ac7e7!.credits_topup);
    v_4d37e3(v_3ac7e7!.credits_topup).toBe(500);
  });

  v_23805a("새 사용자는 모든 버킷이 0 으로 시작한다", async () => {
    await v_c9c489.DB.prepare(
      `INSERT INTO users (id, email, password_hash)
       VALUES (9932, 't167a2@test.local', 'x')`,
    ).run();

    const v_3ac7e7 = await v_c9c489.DB
      .prepare(
        `SELECT credits, credits_free, credits_sub, credits_topup, free_decayed_months, free_granted_at
           FROM users WHERE id = 9932`,
      )
      .first<{
        credits: number;
        credits_free: number;
        credits_sub: number;
        credits_topup: number;
        free_decayed_months: number;
        free_granted_at: number | null;
      }>();

    v_4d37e3(v_3ac7e7!.credits).toBe(0);
    v_4d37e3(v_3ac7e7!.credits_free).toBe(0);
    v_4d37e3(v_3ac7e7!.credits_sub).toBe(0);
    v_4d37e3(v_3ac7e7!.credits_topup).toBe(0);
    v_4d37e3(v_3ac7e7!.free_decayed_months).toBe(0);
    v_4d37e3(v_3ac7e7!.free_granted_at).toBeNull();
  });
});
