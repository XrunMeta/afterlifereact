

import { env } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import { grantSignupFreeCredits } from "../src/lib/credits";

const ctx = () => ({ env }) as never;

async function seedUser(id: number) {
  await env.DB.prepare(`DELETE FROM users WHERE id = ?`).bind(id).run();
  await env.DB
    .prepare(
      `INSERT INTO users (id, email, password_hash) VALUES (?, ?, 'x')`,
    )
    .bind(id, `gsf${id}@test.local`)
    .run();
}

async function readUser(id: number) {
  return env.DB
    .prepare(
      `SELECT credits, credits_free, credits_sub, credits_topup,
              free_granted_at, free_decayed_months
         FROM users WHERE id = ?`,
    )
    .bind(id)
    .first<{
      credits: number;
      credits_free: number;
      credits_sub: number;
      credits_topup: number;
      free_granted_at: number | null;
      free_decayed_months: number;
    }>();
}

describe("grantSignupFreeCredits", () => {
  it("신규 가입자에게 3000 크레딧을 무료 버킷에 지급하고 granted_at 을 세팅한다", async () => {
    await seedUser(9701);
    const r = await grantSignupFreeCredits(ctx(), 9701);

    expect(r.granted).toBe(true);
    const u = await readUser(9701);
    expect(u!.credits).toBe(3000);
    expect(u!.credits_free).toBe(3000);
    expect(u!.credits_sub).toBe(0);
    expect(u!.credits_topup).toBe(0);
    expect(u!.free_granted_at).not.toBeNull();
    expect(u!.free_decayed_months).toBe(0);
  });

  it("원장에 signup_grant 타입으로 +3000 이 기록된다", async () => {
    await seedUser(9702);
    await grantSignupFreeCredits(ctx(), 9702);

    const row = await env.DB
      .prepare(
        `SELECT amount, type, idempotency_key FROM credit_ledgers
          WHERE user_id = ? AND type = 'signup_grant' LIMIT 1`,
      )
      .bind(9702)
      .first<{ amount: number; type: string; idempotency_key: string }>();
    expect(row).not.toBeNull();
    expect(row!.amount).toBe(3000);
    expect(row!.idempotency_key).toBe("signup:9702");
  });

  it("같은 사용자에 두 번 호출해도 한 번만 지급 (idempotent)", async () => {
    await seedUser(9703);
    const r1 = await grantSignupFreeCredits(ctx(), 9703);
    const r2 = await grantSignupFreeCredits(ctx(), 9703);

    expect(r1.granted).toBe(true);
    expect(r2.granted).toBe(false);

    const u = await readUser(9703);
    expect(u!.credits).toBe(3000); 
    expect(u!.credits_free).toBe(3000);

    const count = await env.DB
      .prepare(
        `SELECT COUNT(*) AS n FROM credit_ledgers
          WHERE user_id = ? AND type = 'signup_grant'`,
      )
      .bind(9703)
      .first<{ n: number }>();
    expect(count!.n).toBe(1);
  });
});
