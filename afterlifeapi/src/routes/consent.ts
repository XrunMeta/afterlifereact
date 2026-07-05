

import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_3ebe58 } from "../lib/errors";
import { v_6690d9 } from "../middleware/auth";

export const v_74e200 = new v_b7c41b<v_de0a25>();

v_74e200.post("/consent/call-learning", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_4d33b2 = await v_3f4e2e.req.json<{ state?: string; termsVersion?: string; channel?: string }>()
    .catch(() => ({} as { state?: string; termsVersion?: string; channel?: string }));
  const v_b6e533 = v_4d33b2.state;
  if (v_b6e533 !== "granted" && v_b6e533 !== "revoked") {
    throw new v_3ebe58("VALIDATION_FAILED", "state must be 'granted' or 'revoked'.");
  }
  const v_5c2f9f = Date.now();
  const v_5ba503 = v_4d33b2.termsVersion ?? null;
  const v_8e9fad = v_4d33b2.channel ?? "settings";

  await v_3f4e2e.env.DB.batch([
    v_3f4e2e.env.DB.prepare(
      "UPDATE users SET call_learning_consent = ?, call_learning_consent_at = ? WHERE id = ?",
    ).bind(v_b6e533 === "granted" ? 1 : 0, v_5c2f9f, v_43e90c),
    v_3f4e2e.env.DB.prepare(
      `INSERT INTO user_consent_log (user_id, consent_type, state, terms_version, channel, changed_at)
       VALUES (?, 'call_learning', ?, ?, ?, ?)`,
    ).bind(v_43e90c, v_b6e533, v_5ba503, v_8e9fad, v_5c2f9f),
  ]);

  return v_3f4e2e.json({ ok: true, state: v_b6e533 });
});

v_74e200.get("/consent", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_3ac7e7 = await v_3f4e2e.env.DB.prepare(
    "SELECT call_learning_consent AS c, call_learning_consent_at AS at FROM users WHERE id = ?",
  ).bind(v_43e90c).first<{ c: number; at: number | null }>();
  return v_3f4e2e.json({
    call_learning: { state: v_3ac7e7?.c === 1 ? "granted" : "none", at: v_3ac7e7?.at ?? null },
  });
});
