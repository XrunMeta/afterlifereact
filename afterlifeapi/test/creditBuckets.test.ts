

import { env } from "cloudflare:test";
import { describe, it, expect } from "vitest";

describe("0094 credit buckets", () => {
  it("기존 credits 가 credits_topup 으로 이관되고 불변식이 성립한다", async () => {
    await env.DB.prepare(
      `INSERT INTO users (id, email, password_hash, credits, credits_topup)
       VALUES (9931, 't167a@test.local', 'x', 500, 500)`,
    ).run();

    const row = await env.DB
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

    expect(row!.credits).toBe(row!.credits_free + row!.credits_sub + row!.credits_topup);
    expect(row!.credits_topup).toBe(500);
  });

  it("새 사용자는 모든 버킷이 0 으로 시작한다", async () => {
    await env.DB.prepare(
      `INSERT INTO users (id, email, password_hash)
       VALUES (9932, 't167a2@test.local', 'x')`,
    ).run();

    const row = await env.DB
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

    expect(row!.credits).toBe(0);
    expect(row!.credits_free).toBe(0);
    expect(row!.credits_sub).toBe(0);
    expect(row!.credits_topup).toBe(0);
    expect(row!.free_decayed_months).toBe(0);
    expect(row!.free_granted_at).toBeNull();
  });
});
