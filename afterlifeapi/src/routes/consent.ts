

import { Hono } from "hono";
import type { AppEnv } from "../lib/env";
import { APIError } from "../lib/errors";
import { requireAuth } from "../middleware/auth";
import { deletePersonCascade } from "../lib/personDelete";

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

consent.post("/consent/face-biometric", requireAuth, async (c) => {
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
      "UPDATE users SET face_biometric_consent = ?, face_consent_at = ?, face_consent_version = COALESCE(?, face_consent_version) WHERE id = ?",
    ).bind(state === "granted" ? 1 : 0, now, termsVersion, userId),
    c.env.DB.prepare(
      `INSERT INTO user_consent_log (user_id, consent_type, state, terms_version, channel, changed_at)
       VALUES (?, 'face_biometric', ?, ?, ?, ?)`,
    ).bind(userId, state, termsVersion, channel, now),
  ]);

  if (state === "revoked") {
    const rows = await c.env.DB.prepare(
      `SELECT id FROM persons WHERE user_id = ? AND enrolled_via = 'auto_biometric'`,
    ).bind(userId).all<{ id: number }>();
    for (const row of rows.results) {
      try {
        await deletePersonCascade(c.env, row.id, userId);
      } catch (e) {
        console.warn(JSON.stringify({
          event: "face_biometric_revoke_cascade_failed",
          personId: row.id, userId, error: (e as Error).message,
        }));
      }
    }
  }

  return c.json({ ok: true, state });
});

consent.get("/consent", requireAuth, async (c) => {
  const userId = c.get("userId")!;
  const row = await c.env.DB.prepare(
    `SELECT call_learning_consent AS c, call_learning_consent_at AS at,
            face_biometric_consent AS fbc, face_consent_at AS fbAt, face_consent_version AS fbVer
     FROM users WHERE id = ?`,
  ).bind(userId).first<{
    c: number; at: number | null;
    fbc: number; fbAt: number | null; fbVer: string | null;
  }>();
  return c.json({
    call_learning: { state: row?.c === 1 ? "granted" : "none", at: row?.at ?? null },
    face_biometric: {
      state: row?.fbc === 1 ? "granted" : "none",
      at: row?.fbAt ?? null,
      version: row?.fbVer ?? null,
    },
  });
});
