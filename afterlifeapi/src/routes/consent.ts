

import { Hono } from "hono";
import type { AppEnv } from "../lib/env";
import { APIError } from "../lib/errors";
import { requireAuth } from "../middleware/auth";

export const consent = new Hono<AppEnv>();

consent.post("/consent/call-learning", requireAuth, async (c) => {
  const userId = c.get("userId")!;
  const body = await c.req.json<{ state?: string; termsVersion?: string; channel?: string }>()
    .catch(() => ({} as { state?: string; termsVersion?: string; channel?: string }));
  const state = body.state;
  if (state !== "granted" && state !== "revoked") {
    throw new APIError("VALIDATION_FAILED", "state must be 'granted' or 'revoked'.");
  }
  const now = Date.now();
  const termsVersion = body.termsVersion ?? null;
  const channel = body.channel ?? "settings";

  await c.env.DB.batch([
    c.env.DB.prepare(
      "UPDATE users SET call_learning_consent = ?, call_learning_consent_at = ? WHERE id = ?",
    ).bind(state === "granted" ? 1 : 0, now, userId),
    c.env.DB.prepare(
      `INSERT INTO user_consent_log (user_id, consent_type, state, terms_version, channel, changed_at)
       VALUES (?, 'call_learning', ?, ?, ?, ?)`,
    ).bind(userId, state, termsVersion, channel, now),
  ]);

  return c.json({ ok: true, state });
});

consent.get("/consent", requireAuth, async (c) => {
  const userId = c.get("userId")!;
  const row = await c.env.DB.prepare(
    "SELECT call_learning_consent AS c, call_learning_consent_at AS at FROM users WHERE id = ?",
  ).bind(userId).first<{ c: number; at: number | null }>();
  return c.json({
    call_learning: { state: row?.c === 1 ? "granted" : "none", at: row?.at ?? null },
  });
});
