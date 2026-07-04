

import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_3ebe58 } from "../lib/errors";
import { v_6690d9 } from "../middleware/auth";
import { v_a8d2cc } from "../lib/faceVectors";

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

v_fded81.post("/:id/faces", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_ca1ec5 = Number(v_3f4e2e.req.param("id"));
  const v_4d33b2 = await v_3f4e2e.req.json<{ vectors?: number[][] }>().catch(() => ({}) as { vectors?: number[][] });
  const v_f94e64 = v_4d33b2.vectors;
  if (
    !Array.isArray(v_f94e64) ||
    v_f94e64.length < 1 ||
    v_f94e64.length > 5 ||
    v_f94e64.some(
      (v_81e2ef) => !Array.isArray(v_81e2ef) || v_81e2ef.length !== 512 || v_81e2ef.some((v_62c214) => typeof v_62c214 !== "number" || !Number.isFinite(v_62c214))
    )
  )
    throw new v_3ebe58("VALIDATION_FAILED", "vectors: 1~5개의 512차원 수치 배열이어야 합니다");

  const v_306a28 = await v_3f4e2e.env.DB.prepare("SELECT id, consent_state FROM persons WHERE id = ? AND user_id = ?")
    .bind(v_ca1ec5, v_43e90c)
    .first<{ id: number; consent_state: string }>();
  if (!v_306a28) throw new v_3ebe58("NOT_FOUND", "Person not found.");
  if (v_306a28.consent_state !== "granted")
    throw new v_3ebe58("FORBIDDEN", "얼굴정보 저장 동의(consent granted)가 필요합니다"); 

  const v_e86ad8 = v_a8d2cc(v_3f4e2e.env);
  const v_18b8bf = v_f94e64.map((v_6fea0b) => ({
    id: crypto.randomUUID(),
    values: v_6fea0b,
    namespace: String(v_43e90c),
    metadata: { personId: String(v_ca1ec5) },
  }));
  await v_e86ad8.insert(v_18b8bf);

  const v_9e67a6 = Date.now();
  const v_df04a4 = v_3f4e2e.env.DB.prepare(
    `INSERT INTO face_embeddings (person_id, vectorize_id, model, dim, source, created_at)
     VALUES (?, ?, 'w600k_mbf', 512, 'call', ?)`
  );
  await v_3f4e2e.env.DB.batch(v_18b8bf.map((v_cb35cb) => v_df04a4.bind(v_ca1ec5, v_cb35cb.id, v_9e67a6)));

  return v_3f4e2e.json({ enrolled: v_18b8bf.length });
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
