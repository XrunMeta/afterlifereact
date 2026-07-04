

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

  let v_8a1355 = null;
  if (v_4d33b2.displayName !== undefined) {
    if (typeof v_4d33b2.displayName !== "string") {
      throw new v_3ebe58("VALIDATION_FAILED", "displayName은 문자열이어야 합니다.");
    }
    const v_2f361a = v_4d33b2.displayName.trim();
    if (v_2f361a.length < 1 || v_2f361a.length > 30) {
      throw new v_3ebe58("VALIDATION_FAILED", "displayName은 1~30자여야 합니다.");
    }
    v_8a1355 = v_2f361a;
  }

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

  let v_43c42e;
  try {
    v_43c42e = await v_3f4e2e.env.DB.prepare(
      `INSERT INTO persons (user_id, clone_id, display_name, consent_state, created_at)
       VALUES (?, ?, ?, 'none', ?)`
    )
      .bind(v_43e90c, v_6e0fd3, v_8a1355, v_9e67a6)
      .run();
  } catch (v_49263d) {
    const v_badeaf = (v_49263d as Error).message ?? "";

    if (/UNIQUE constraint failed/i.test(v_badeaf)) {
      throw new v_3ebe58("VALIDATION_FAILED", "이미 등록된 이름입니다.");
    }
    throw v_49263d;
  }

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

const v_0eeb45 = 0.45;

v_fded81.post("/match", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_4d33b2 = await v_3f4e2e.req.json<{ vector?: number[] }>().catch(() => ({}) as { vector?: number[] });
  const v_81e2ef = v_4d33b2.vector;
  if (!Array.isArray(v_81e2ef) || v_81e2ef.length !== 512 || v_81e2ef.some((v_62c214) => typeof v_62c214 !== "number" || !Number.isFinite(v_62c214)))
    throw new v_3ebe58("VALIDATION_FAILED", "vector: 512차원 수치 배열이어야 합니다");

  const v_01dcf5 = await v_3f4e2e.env.DB.prepare("SELECT value FROM app_config WHERE key = 'face.match_threshold'").first<{
    value: string;
  }>();
  const v_d361d7 = v_01dcf5?.value !== undefined && Number.isFinite(Number(v_01dcf5.value)) ? Number(v_01dcf5.value) : v_0eeb45;

  const v_e86ad8 = v_a8d2cc(v_3f4e2e.env);
  const v_cb35cb = await v_e86ad8.query(v_81e2ef, { topK: 3, namespace: String(v_43e90c), returnMetadata: true });

  const v_8a69ab = new Map<number, number>(); 
  for (const v_35f85c of v_cb35cb.matches) {
    const v_d4923e = Number(v_35f85c.metadata?.personId);
    if (!v_d4923e) continue;
    v_8a69ab.set(v_d4923e, Math.max(v_8a69ab.get(v_d4923e) ?? -1, v_35f85c.score));
  }

  const v_52e08b = [...v_8a69ab.keys()];
  const v_77b1ac = new Map<number, string | null>();
  if (v_52e08b.length) {
    const v_315151 = await v_3f4e2e.env.DB.prepare(
      `SELECT id, display_name FROM persons WHERE user_id = ? AND id IN (${v_52e08b.map(() => "?").join(",")})`
    )
      .bind(v_43e90c, ...v_52e08b)
      .all<{ id: number; display_name: string | null }>();
    for (const v_3ac7e7 of v_315151.results) v_77b1ac.set(v_3ac7e7.id, v_3ac7e7.display_name);
  }

  const v_a49907 = v_52e08b
    .map((v_d4923e) => ({ personId: v_d4923e, displayName: v_77b1ac.get(v_d4923e) ?? null, score: v_8a69ab.get(v_d4923e)! }))
    .sort((v_779914, v_148ff6) => v_148ff6.score - v_779914.score);

  const v_643757 = v_a49907[0] && v_a49907[0].score >= v_d361d7 ? v_a49907[0] : null;

  return v_3f4e2e.json({ matches: v_a49907, best: v_643757, threshold: v_d361d7 });
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
  const v_ca1ec5 = v_5c8583(v_3f4e2e);
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
  if (!v_306a28) throw new v_3ebe58("NOT_FOUND", "person이 존재하지 않습니다.");
  if (v_306a28.consent_state !== "granted")
    throw new v_3ebe58("FORBIDDEN", "얼굴정보 저장 동의(consent granted)가 필요합니다"); 

  const v_18b8bf = v_f94e64.map((v_6fea0b) => ({
    id: crypto.randomUUID(),
    values: v_6fea0b,
    namespace: String(v_43e90c),
    metadata: { personId: String(v_ca1ec5) },
  }));

  const v_9e67a6 = Date.now();
  const v_a9cac6 = v_3f4e2e.env.DB.prepare(
    `INSERT INTO face_embeddings (person_id, vectorize_id, model, dim, source, created_at)
     VALUES (?, ?, 'w600k_mbf', 512, 'call', ?)`
  );
  await v_3f4e2e.env.DB.batch(v_18b8bf.map((v_cb35cb) => v_a9cac6.bind(v_ca1ec5, v_cb35cb.id, v_9e67a6)));

  const v_e86ad8 = v_a8d2cc(v_3f4e2e.env);
  try {
    await v_e86ad8.insert(v_18b8bf);
  } catch (v_9e86fd) {

    const v_1cdc07 = v_18b8bf.map(() => "?").join(",");
    await v_3f4e2e.env.DB.prepare(`DELETE FROM face_embeddings WHERE vectorize_id IN (${v_1cdc07})`)
      .bind(...v_18b8bf.map((v_cb35cb) => v_cb35cb.id))
      .run();
    throw new v_3ebe58("UPSTREAM_FAILURE", `얼굴 벡터 인덱스 저장 실패: ${(v_9e86fd as Error).message}`);
  }

  return v_3f4e2e.json({ enrolled: v_18b8bf.length });
});

v_fded81.delete("/:id", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_ca1ec5 = v_5c8583(v_3f4e2e);

  const v_306a28 = await v_3f4e2e.env.DB.prepare("SELECT id FROM persons WHERE id = ? AND user_id = ?")
    .bind(v_ca1ec5, v_43e90c)
    .first<{ id: number }>();
  if (!v_306a28) throw new v_3ebe58("NOT_FOUND", "person이 존재하지 않습니다.");

  const v_61c797 = await v_3f4e2e.env.DB.prepare("SELECT vectorize_id FROM face_embeddings WHERE person_id = ?")
    .bind(v_ca1ec5)
    .all<{ vectorize_id: string | null }>();
  const v_23dafb = v_61c797.results.map((v_cb35cb) => v_cb35cb.vectorize_id).filter((v_81e2ef): v_81e2ef is string => Boolean(v_81e2ef));

  if (v_23dafb.length) await v_a8d2cc(v_3f4e2e.env).deleteByIds(v_23dafb);

  const v_bee926 = Date.now();

  await v_3f4e2e.env.DB.batch([
    v_3f4e2e.env.DB.prepare("DELETE FROM face_embeddings WHERE person_id = ?").bind(v_ca1ec5),

    v_3f4e2e.env.DB.prepare(
      `INSERT INTO persons_consent_log (person_id, state, terms_version, channel, changed_at)
       VALUES (?, 'revoked', NULL, 'face_delete', ?)`
    ).bind(v_ca1ec5, v_bee926),
    v_3f4e2e.env.DB.prepare("UPDATE call_turns SET speaker_person_id = NULL WHERE speaker_person_id = ?").bind(v_ca1ec5),

    v_3f4e2e.env.DB.prepare("DELETE FROM clone_ont_person WHERE person_id = ?").bind(v_ca1ec5),
    v_3f4e2e.env.DB.prepare("DELETE FROM persons WHERE id = ? AND user_id = ?").bind(v_ca1ec5, v_43e90c),
  ]);

  console.log(JSON.stringify({ event: "face_person_deleted", personId: v_ca1ec5, userId: v_43e90c, deletedEmbeddings: v_23dafb.length }));

  return v_3f4e2e.json({ deleted: true });
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
