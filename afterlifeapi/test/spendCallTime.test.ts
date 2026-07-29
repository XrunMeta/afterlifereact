

import { env } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import { spendCallTime } from "../src/lib/credits";

const ctx = () => ({ env }) as never;

async function seedUser(id: number, free: number, sub: number, topup: number) {
  await env.DB.prepare(`DELETE FROM users WHERE id = ?`).bind(id).run();
  await env.DB
    .prepare(
      `INSERT INTO users (id, email, password_hash, credits, credits_free, credits_sub, credits_topup)
       VALUES (?, ?, 'x', ?, ?, ?, ?)`,
    )
    .bind(id, `sct${id}@test.local`, free + sub + topup, free, sub, topup)
    .run();
}

async function buckets(id: number) {
  return env.DB
    .prepare(
      `SELECT credits, credits_free, credits_sub, credits_topup FROM users WHERE id = ?`,
    )
    .bind(id)
    .first<{
      credits: number;
      credits_free: number;
      credits_sub: number;
      credits_topup: number;
    }>();
}

describe("spendCallTime", () => {
  it("무료분만으로 충당되면 무료분에서만 뺀다", async () => {
    await seedUser(9601, 1000, 500, 500);
    const r = await spendCallTime(ctx(), { userId: 9601, amountSec: 600, callId: "c9601" });

    expect(r).toEqual({ billedSec: 600, unbilledSec: 0 });
    const b = await buckets(9601);
    expect(b).toMatchObject({ credits_free: 400, credits_sub: 500, credits_topup: 500 });
    expect(b!.credits).toBe(1400);
  });

  it("무료 → 구독 → 충전 순서로 걸쳐서 뺀다", async () => {
    await seedUser(9602, 100, 200, 300);
    const r = await spendCallTime(ctx(), { userId: 9602, amountSec: 450, callId: "c9602" });

    expect(r).toEqual({ billedSec: 450, unbilledSec: 0 });
    const b = await buckets(9602);
    expect(b).toMatchObject({ credits_free: 0, credits_sub: 0, credits_topup: 150 });
  });

  it("잔액이 모자라면 있는 만큼만 빼고 unbilledSec 을 보고한다", async () => {
    await seedUser(9603, 50, 0, 0);
    const r = await spendCallTime(ctx(), { userId: 9603, amountSec: 200, callId: "c9603" });

    expect(r).toEqual({ billedSec: 50, unbilledSec: 150 });
    const b = await buckets(9603);
    expect(b).toMatchObject({ credits_free: 0, credits_sub: 0, credits_topup: 0 });
    expect(b!.credits).toBe(0);
  });

  it("같은 callId 로 두 번 호출해도 한 번만 차감한다", async () => {
    await seedUser(9604, 1000, 0, 0);
    await spendCallTime(ctx(), { userId: 9604, amountSec: 300, callId: "c9604" });
    await spendCallTime(ctx(), { userId: 9604, amountSec: 300, callId: "c9604" });

    const b = await buckets(9604);
    expect(b!.credits_free).toBe(700);

    const n = await env.DB
      .prepare(
        `SELECT COUNT(*) AS n FROM credit_ledgers WHERE type = 'call_usage' AND idempotency_key = 'c9604'`,
      )
      .first<{ n: number }>();
    expect(n!.n).toBe(1);
  });

  it("amountSec 이 0 이면 원장을 남기지 않는다", async () => {
    await seedUser(9605, 1000, 0, 0);
    const r = await spendCallTime(ctx(), { userId: 9605, amountSec: 0, callId: "c9605" });

    expect(r).toEqual({ billedSec: 0, unbilledSec: 0 });
    const n = await env.DB
      .prepare(`SELECT COUNT(*) AS n FROM credit_ledgers WHERE idempotency_key = 'c9605'`)
      .first<{ n: number }>();
    expect(n!.n).toBe(0);
  });

  it("충전분 차감 시 만료 임박 lot 부터 소진한다", async () => {
    await seedUser(9606, 0, 0, 500);
    await env.DB
      .prepare(
        `INSERT INTO credit_ledgers (id, user_id, amount, type, idempotency_key)
         VALUES (96060, 9606, 500, 'charge_inapp', 'lot:9606')`,
      )
      .run();

    await env.DB
      .prepare(
        `INSERT INTO credit_lots (id, user_id, amount, remaining, granted_at, expires_at, ledger_id)
         VALUES (9606001, 9606, 300, 300, 1790000000000, 1990000000000, 96060)`,
      )
      .run();
    await env.DB
      .prepare(
        `INSERT INTO credit_lots (id, user_id, amount, remaining, granted_at, expires_at, ledger_id)
         VALUES (9606002, 9606, 200, 200, 1790000000000, 1890000000000, 96060)`,
      )
      .run();

    await spendCallTime(ctx(), { userId: 9606, amountSec: 250, callId: "c9606" });

    const early = await env.DB
      .prepare(`SELECT remaining FROM credit_lots WHERE id = 9606002`)
      .first<{ remaining: number }>();
    const late = await env.DB
      .prepare(`SELECT remaining FROM credit_lots WHERE id = 9606001`)
      .first<{ remaining: number }>();

    expect(early!.remaining).toBe(0); 
    expect(late!.remaining).toBe(250); 
  });
});
