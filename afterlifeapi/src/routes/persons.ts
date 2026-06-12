

import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_3ebe58 } from "../lib/errors";
import { v_6690d9 } from "../middleware/auth";

export const v_fded81 = new v_b7c41b<v_de0a25>();

function v_5c8583(v_3f4e2e): number {
  const v_479f05 = v_3f4e2e.req.param("id");
  const v_389afb = Number(v_479f05);
  if (!Number.isInteger(v_389afb) || v_389afb <= 0) throw new v_3ebe58("VALIDATION_FAILED", "Invalid person id.");
  return v_389afb;
}

v_fded81.post("/", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_4d33b2 = await v_3f4e2e.req
    .json<{ cloneId?: number; displayName?: string }>()
    .catch(() => ({}) as { cloneId?: number; displayName?: string });

  const v_6e0fd3 = v_4d33b2.cloneId ?? null;

  const v_8a1355 = null;

  if (v_6e0fd3 !== null) {
    const v_2461e1 = await v_3f4e2e.env.DB.prepare(
      `SELECT id FROM clones WHERE id = ? AND owner_id = ? AND deleted_at IS NULL`
    )
      .bind(v_6e0fd3, v_43e90c)
      .first<{ id: number }>();
    if (!v_2461e1) {
      throw new v_3ebe58("VALIDATION_FAILED", "Invalid clone id.");
    }
  }

  const v_9e67a6 = Date.now();

  const v_43c42e = await v_3f4e2e.env.DB.prepare(
    `INSERT INTO persons (user_id, clone_id, display_name, consent_state, created_at)
     VALUES (?, ?, ?, 'none', ?)`
  )
    .bind(v_43e90c, v_6e0fd3, v_8a1355, v_9e67a6)
    .run();

  const v_389afb = v_43c42e.meta.last_row_id as number;

  return v_3f4e2e.json(
    {
      id: v_389afb,
      userId: v_43e90c,
      cloneId: v_6e0fd3,
      displayName: v_8a1355,
      consentState: "none" as const,
      consentAt: null,
      createdAt: v_9e67a6,
    },
    201
  );
});

v_fded81.post("/:id/consent", v_6690d9, async (v_3f4e2e) => {
  const v_ca1ec5 = v_5c8583(v_3f4e2e);
  const v_43e90c = v_3f4e2e.get("userId")!;

  const v_4d33b2 = await v_3f4e2e.req.json<{ state?: string; termsVersion?: string; channel?: string }>().catch(
    () => ({}) as { state?: string; termsVersion?: string; channel?: string }
  );
  const v_b6e533 = v_4d33b2.state;

  if (v_b6e533 !== "granted" && v_b6e533 !== "revoked") {
    throw new v_3ebe58("VALIDATION_FAILED", "state must be 'granted' or 'revoked'.");
  }

  const v_322d60 = Date.now();

  const v_5ba503 = v_4d33b2.termsVersion ?? null;
  const v_8e9fad = v_4d33b2.channel ?? "api";

  const v_2461e1 = await v_3f4e2e.env.DB.prepare(
    `SELECT id FROM persons WHERE id = ? AND user_id = ?`
  )
    .bind(v_ca1ec5, v_43e90c)
    .first<{ id: number }>();

  if (!v_2461e1) {
    throw new v_3ebe58("NOT_FOUND", "Person not found.");
  }

  const v_dba7e8 = v_3f4e2e.env.DB.prepare(
    `UPDATE persons SET consent_state = ?, consent_at = ? WHERE id = ? AND user_id = ?`
  ).bind(v_b6e533, v_322d60, v_ca1ec5, v_43e90c);

  const v_6ede3e = v_3f4e2e.env.DB.prepare(
    `INSERT INTO persons_consent_log (person_id, state, terms_version, channel, changed_at)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(v_ca1ec5, v_b6e533, v_5ba503, v_8e9fad, v_322d60);

  await v_3f4e2e.env.DB.batch([v_dba7e8, v_6ede3e]);

  return v_3f4e2e.json({ consentState: v_b6e533, consentAt: v_322d60 });
});

v_fded81.get("/", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;

  const v_18b8bf = await v_3f4e2e.env.DB.prepare(
    `SELECT
       id,
       user_id       AS userId,
       clone_id      AS cloneId,
       display_name  AS displayName,
       consent_state AS consentState,
       consent_at    AS consentAt,
       created_at    AS createdAt
     FROM persons
     WHERE user_id = ?
     ORDER BY created_at DESC`
  )
    .bind(v_43e90c)
    .all<{
      id: number;
      userId: number;
      cloneId: number | null;
      displayName: string | null;
      consentState: string;
      consentAt: number | null;
      createdAt: number;
    }>();

  return v_3f4e2e.json({ data: v_18b8bf.results });
});
