

import { Hono } from "hono";
import type { AppEnv } from "../lib/env";
import { requireAuth } from "../middleware/auth";
import { APIError } from "../lib/errors";
import { hasXrunPaymentPin, verifyXrunPaymentPin } from "../lib/xrun";

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
