

import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_3ebe58 } from "../lib/errors";
import { v_6690d9 } from "../middleware/auth";
import { v_430d2b, v_714639 } from "../lib/personDelete";

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

v_74e200.post("/consent/face-biometric", v_6690d9, async (v_3f4e2e) => {
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
      "UPDATE users SET face_biometric_consent = ?, face_consent_at = ?, face_consent_version = COALESCE(?, face_consent_version) WHERE id = ?",
    ).bind(v_b6e533 === "granted" ? 1 : 0, v_5c2f9f, v_5ba503, v_43e90c),
    v_3f4e2e.env.DB.prepare(
      `INSERT INTO user_consent_log (user_id, consent_type, state, terms_version, channel, changed_at)
       VALUES (?, 'face_biometric', ?, ?, ?, ?)`,
    ).bind(v_43e90c, v_b6e533, v_5ba503, v_8e9fad, v_5c2f9f),
  ]);

  if (v_b6e533 === "revoked") {
    const v_18b8bf = await v_3f4e2e.env.DB.prepare(
      `SELECT id FROM persons WHERE user_id = ? AND enrolled_via = 'auto_biometric'`,
    ).bind(v_43e90c).all<{ id: number }>();
    for (const v_3ac7e7 of v_18b8bf.results) {
      try {
        await v_430d2b(v_3f4e2e.env, v_3ac7e7.id, v_43e90c);
      } catch (v_9e86fd) {
        console.warn(JSON.stringify({
          event: "face_biometric_revoke_cascade_failed",
          personId: v_3ac7e7.id, userId: v_43e90c, error: (v_9e86fd as Error).message,
        }));
      }
    }
  }

  return v_3f4e2e.json({ ok: true, state: v_b6e533 });
});

v_74e200.get("/consent", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_3ac7e7 = await v_3f4e2e.env.DB.prepare(
    `SELECT call_learning_consent AS c, call_learning_consent_at AS at,
            face_biometric_consent AS fbc, face_consent_at AS fbAt, face_consent_version AS fbVer
     FROM users WHERE id = ?`,
  ).bind(v_43e90c).first<{
    c: number; at: number | null;
    fbc: number; fbAt: number | null; fbVer: string | null;
  }>();
  return v_3f4e2e.json({
    call_learning: { state: v_3ac7e7?.c === 1 ? "granted" : "none", at: v_3ac7e7?.at ?? null },
    face_biometric: {
      state: v_3ac7e7?.fbc === 1 ? "granted" : "none",
      at: v_3ac7e7?.fbAt ?? null,
      version: v_3ac7e7?.fbVer ?? null,
    },
  });
});

v_74e200.get("/remembering-clones", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_315151 = await v_3f4e2e.env.DB.prepare(
    `SELECT c.id AS cloneId, c.name, c.username, MAX(cop.updated_at) AS updatedAt
       FROM clone_ont_person cop
       JOIN clones  c ON c.id = cop.clone_id
       JOIN persons p ON p.id = cop.person_id
      WHERE p.user_id = ?
        AND cop.person_id IS NOT c.self_person_id
      GROUP BY c.id
      ORDER BY updatedAt DESC`,
  )
    .bind(v_43e90c)
    .all<{ cloneId: number; name: string; username: string; updatedAt: number }>();
  return v_3f4e2e.json({ clones: v_315151.results });
});

v_74e200.delete("/remembering-clones/:cloneId", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_6e0fd3 = Number(v_3f4e2e.req.param("cloneId"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0)
    throw new v_3ebe58("VALIDATION_FAILED", "cloneId: 양의 정수여야 합니다");

  const v_43c42e = await v_714639(v_3f4e2e.env, { userId: v_43e90c, cloneId: v_6e0fd3 });
  return v_3f4e2e.json(v_43c42e);
});
