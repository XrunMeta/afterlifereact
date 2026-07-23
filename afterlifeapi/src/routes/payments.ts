

import { Hono } from "hono";
import type { AppEnv } from "../lib/env";
import { requireAuth } from "../middleware/auth";
import { APIError } from "../lib/errors";
import { hasXrunPaymentPin, verifyXrunPaymentPin, getXrunBalances, getXrunOnchainXrunBalance } from "../lib/xrun";

export const payments = new Hono<AppEnv>();

payments.use("*", requireAuth);

async function loadXrunMember(env: AppEnv["Bindings"], userId: number): Promise<number | null> {
  const row = await env.DB.prepare(
    `SELECT xrun_member_id FROM users WHERE id = ? AND deleted_at IS NULL`,
  )
    .bind(userId)
    .first<{ xrun_member_id: number | null }>();
  return row?.xrun_member_id ?? null;
}

payments.get("/pin/status", async (c) => {
  const userId = c.get("userId")!;
  const member = await loadXrunMember(c.env, userId);
  if (!member) return c.json({ linked: false, hasPin: false });
  const res = await hasXrunPaymentPin(c.env, member);
  if (!res.ok) throw new APIError("UPSTREAM_FAILURE", res.reason ?? "xrun gateway error");
  return c.json({ linked: true, hasPin: res.hasPin });
});

payments.post("/pin/verify", async (c) => {
  const userId = c.get("userId")!;
  const body = await c.req.json().catch(() => ({}) as Record<string, unknown>);
  const pin = typeof body.pin === "string" ? body.pin : "";
  if (!/^\d{6}$/.test(pin)) {
    throw new APIError("VALIDATION_FAILED", "pin must be 6 digits");
  }
  const member = await loadXrunMember(c.env, userId);
  if (!member) throw new APIError("CONFLICT", "xrun account not linked");

  const res = await verifyXrunPaymentPin(c.env, member, pin);
  if (!res.ok) throw new APIError("UPSTREAM_FAILURE", res.reason ?? "xrun gateway error");
  return c.json({ match: res.match, hasPin: res.hasPin });
});

payments.get("/balance", async (c) => {
  const userId = c.get("userId")!;
  const member = await loadXrunMember(c.env, userId);
  if (!member) {
    return c.json({ linked: false, balances: [], xrun: null, ad: null });
  }
  const res = await getXrunBalances(c.env, member);
  if (!res.ok) {
    throw new APIError("UPSTREAM_FAILURE", res.reason ?? "xrun gateway error");
  }

  const validBalances = res.balances.filter(
    (b) => b.currency != null && Number.isFinite(Number(b.currency)),
  );

  if (res.balances.length > 0 && validBalances.length === 0) {
    console.warn(
      "[payments.balance] gateway returned only null-currency rows",
      "member=", member,
      "raw=", JSON.stringify(res.balances),
    );
  }

  const find = (currency: number): number | null => {
    const row = validBalances.find((b) => Number(b.currency) === currency);
    if (!row) return null;
    const n = Number(row.amount);
    return Number.isFinite(n) ? n : null;
  };

  void getXrunOnchainXrunBalance;
  const xrunAmount = find(11);
  return c.json({
    linked: true,
    balances: validBalances.map((b) => ({
      currency: Number(b.currency),
      symbol: b.symbol,
      amount: b.amount,
      address: b.address,
    })),
    xrun: xrunAmount,
    ad: find(19),

    gatewayWalletReady: validBalances.length > 0,
  });
});
