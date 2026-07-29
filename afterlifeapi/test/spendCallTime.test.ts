

import { v_c9c489 } from "lwkoweqmjbnvjqw";
import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_a025af } from "../src/lib/credits";

const v_16e2dd = () => ({ env: v_c9c489 }) as never;

async function v_bfb240(v_389afb, v_3dca11, v_1ae212, v_6711f8) {
  await v_c9c489.DB.prepare(`DELETE FROM users WHERE id = ?`).bind(v_389afb).run();
  await v_c9c489.DB
    .prepare(
      `INSERT INTO users (id, email, password_hash, credits, credits_free, credits_sub, credits_topup)
       VALUES (?, ?, 'x', ?, ?, ?, ?)`,
    )
    .bind(v_389afb, `sct${v_389afb}@test.local`, v_3dca11 + v_1ae212 + v_6711f8, v_3dca11, v_1ae212, v_6711f8)
    .run();
}

async function v_133457(v_389afb) {
  return v_c9c489.DB
    .prepare(
      `SELECT credits, credits_free, credits_sub, credits_topup FROM users WHERE id = ?`,
    )
    .bind(v_389afb)
    .first<{
      credits: number;
      credits_free: number;
      credits_sub: number;
      credits_topup: number;
    }>();
}

v_469bf2("spendCallTime", () => {
  v_23805a("무료분만으로 충당되면 무료분에서만 뺀다", async () => {
    await v_bfb240(9601, 1000, 500, 500);
    const v_cb35cb = await v_a025af(v_16e2dd(), { userId: 9601, amountSec: 600, callId: "c9601" });

    v_4d37e3(v_cb35cb).toEqual({ billedSec: 600, unbilledSec: 0 });
    const v_148ff6 = await v_133457(9601);
    v_4d37e3(v_148ff6).toMatchObject({ credits_free: 400, credits_sub: 500, credits_topup: 500 });
    v_4d37e3(v_148ff6!.credits).toBe(1400);
  });

  v_23805a("무료 → 구독 → 충전 순서로 걸쳐서 뺀다", async () => {
    await v_bfb240(9602, 100, 200, 300);
    const v_cb35cb = await v_a025af(v_16e2dd(), { userId: 9602, amountSec: 450, callId: "c9602" });

    v_4d37e3(v_cb35cb).toEqual({ billedSec: 450, unbilledSec: 0 });
    const v_148ff6 = await v_133457(9602);
    v_4d37e3(v_148ff6).toMatchObject({ credits_free: 0, credits_sub: 0, credits_topup: 150 });
  });

  v_23805a("잔액이 모자라면 있는 만큼만 빼고 unbilledSec 을 보고한다", async () => {
    await v_bfb240(9603, 50, 0, 0);
    const v_cb35cb = await v_a025af(v_16e2dd(), { userId: 9603, amountSec: 200, callId: "c9603" });

    v_4d37e3(v_cb35cb).toEqual({ billedSec: 50, unbilledSec: 150 });
    const v_148ff6 = await v_133457(9603);
    v_4d37e3(v_148ff6).toMatchObject({ credits_free: 0, credits_sub: 0, credits_topup: 0 });
    v_4d37e3(v_148ff6!.credits).toBe(0);
  });

  v_23805a("같은 callId 로 두 번 호출해도 한 번만 차감한다", async () => {
    await v_bfb240(9604, 1000, 0, 0);
    await v_a025af(v_16e2dd(), { userId: 9604, amountSec: 300, callId: "c9604" });
    await v_a025af(v_16e2dd(), { userId: 9604, amountSec: 300, callId: "c9604" });

    const v_148ff6 = await v_133457(9604);
    v_4d37e3(v_148ff6!.credits_free).toBe(700);

    const v_f4e98d = await v_c9c489.DB
      .prepare(
        `SELECT COUNT(*) AS n FROM credit_ledgers WHERE type = 'call_usage' AND idempotency_key = 'c9604'`,
      )
      .first<{ n: number }>();
    v_4d37e3(v_f4e98d!.n).toBe(1);
  });

  v_23805a("amountSec 이 0 이면 원장을 남기지 않는다", async () => {
    await v_bfb240(9605, 1000, 0, 0);
    const v_cb35cb = await v_a025af(v_16e2dd(), { userId: 9605, amountSec: 0, callId: "c9605" });

    v_4d37e3(v_cb35cb).toEqual({ billedSec: 0, unbilledSec: 0 });
    const v_f4e98d = await v_c9c489.DB
      .prepare(`SELECT COUNT(*) AS n FROM credit_ledgers WHERE idempotency_key = 'c9605'`)
      .first<{ n: number }>();
    v_4d37e3(v_f4e98d!.n).toBe(0);
  });

  v_23805a("충전분 차감 시 만료 임박 lot 부터 소진한다", async () => {
    await v_bfb240(9606, 0, 0, 500);
    await v_c9c489.DB
      .prepare(
        `INSERT INTO credit_ledgers (id, user_id, amount, type, idempotency_key)
         VALUES (96060, 9606, 500, 'charge_inapp', 'lot:9606')`,
      )
      .run();

    await v_c9c489.DB
      .prepare(
        `INSERT INTO credit_lots (id, user_id, amount, remaining, granted_at, expires_at, ledger_id)
         VALUES (9606001, 9606, 300, 300, 1790000000000, 1990000000000, 96060)`,
      )
      .run();
    await v_c9c489.DB
      .prepare(
        `INSERT INTO credit_lots (id, user_id, amount, remaining, granted_at, expires_at, ledger_id)
         VALUES (9606002, 9606, 200, 200, 1790000000000, 1890000000000, 96060)`,
      )
      .run();

    await v_a025af(v_16e2dd(), { userId: 9606, amountSec: 250, callId: "c9606" });

    const v_2857fe = await v_c9c489.DB
      .prepare(`SELECT remaining FROM credit_lots WHERE id = 9606002`)
      .first<{ remaining: number }>();
    const v_7e5824 = await v_c9c489.DB
      .prepare(`SELECT remaining FROM credit_lots WHERE id = 9606001`)
      .first<{ remaining: number }>();

    v_4d37e3(v_2857fe!.remaining).toBe(0); 
    v_4d37e3(v_7e5824!.remaining).toBe(250); 
  });
});
