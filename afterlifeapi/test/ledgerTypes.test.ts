

import { env } from "cloudflare:test";
import { describe, it, expect } from "vitest";

describe("0095 ledger types", () => {
  it("신규 타입 call_usage 를 받는다", async () => {
    await env.DB.prepare(
      `INSERT INTO users (id, email, password_hash) VALUES (9941, 't167b@test.local', 'x')`,
    ).run();
    await env.DB.prepare(
      `INSERT INTO credit_ledgers (user_id, amount, type, idempotency_key)
       VALUES (9941, -600, 'call_usage', 'call:test1')`,
    ).run();

    const row = await env.DB
      .prepare(
        `SELECT amount, type FROM credit_ledgers WHERE idempotency_key = 'call:test1'`,
      )
      .first<{ amount: number; type: string }>();
    expect(row!.type).toBe("call_usage");
    expect(row!.amount).toBe(-600);
  });

  it("정의되지 않은 타입은 거부한다", async () => {
    await expect(
      env.DB.prepare(
        `INSERT INTO credit_ledgers (user_id, amount, type, idempotency_key)
         VALUES (9941, -1, 'bogus_type', 'call:test2')`,
      ).run(),
    ).rejects.toThrow();
  });

  it("기존 타입 charge_xrun 은 여전히 허용된다", async () => {
    await env.DB.prepare(
      `INSERT INTO credit_ledgers (user_id, amount, type, idempotency_key)
       VALUES (9941, 100, 'charge_xrun', 'legacy:test1')`,
    ).run();
    const row = await env.DB
      .prepare(`SELECT type FROM credit_ledgers WHERE idempotency_key = 'legacy:test1'`)
      .first<{ type: string }>();
    expect(row!.type).toBe("charge_xrun");
  });

  it("UNIQUE(type, idempotency_key) 는 (같은 type 안에서만) 중복을 막는다", async () => {
    await env.DB.prepare(
      `INSERT INTO credit_ledgers (user_id, amount, type, idempotency_key)
       VALUES (9941, 3000, 'signup_grant', 'signup:9941')`,
    ).run();
    await expect(
      env.DB.prepare(
        `INSERT INTO credit_ledgers (user_id, amount, type, idempotency_key)
         VALUES (9941, 3000, 'signup_grant', 'signup:9941')`,
      ).run(),
    ).rejects.toThrow();
  });
});
