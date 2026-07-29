

import { env } from "cloudflare:test";
import { describe, it, expect } from "vitest";

describe("0098 signup grant backfill", () => {
  it("소급 지급 후 불변식이 유지되고 free_granted_at 이 채워진다", async () => {
    const row = await env.DB
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

    expect(row).not.toBeNull();
    expect(row!.credits).toBe(row!.credits_free + row!.credits_sub + row!.credits_topup);
    expect(row!.free_granted_at).not.toBeNull();
    expect(row!.free_decayed_months).toBe(0);
  });

  it("재실행해도 중복 지급되지 않는다", async () => {
    const before = await env.DB
      .prepare(`SELECT COUNT(*) AS n FROM credit_ledgers WHERE type = 'signup_grant'`)
      .first<{ n: number }>();

    await env.DB
      .prepare(
        `INSERT OR IGNORE INTO credit_ledgers (user_id, amount, type, ref_id, idempotency_key)
           SELECT id, 3000, 'signup_grant', 'backfill', 'signup:' || id
             FROM users WHERE deleted_at IS NULL`,
      )
      .run();

    const after = await env.DB
      .prepare(`SELECT COUNT(*) AS n FROM credit_ledgers WHERE type = 'signup_grant'`)
      .first<{ n: number }>();

    expect(after!.n).toBe(before!.n);
  });
});
