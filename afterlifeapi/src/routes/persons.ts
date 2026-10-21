

import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_3ebe58 } from "../lib/errors";
import { v_6690d9 } from "../middleware/auth";
import { v_a8d2cc } from "../lib/faceVectors";
import { v_430d2b } from "../lib/personDelete";
import { v_d0fd96 } from "../lib/displayName";
import { v_0b07b9 } from "../lib/cloneAccess";
import { v_929ead, v_97be02, v_003ee1 } from "../lib/cloneFaceScope";
import { v_a752e9 } from "../lib/personaBundle";
import { v_74defc } from "../lib/logger";

export const v_fded81 = new v_b7c41b<v_de0a25>();

function v_5c8583(v_3f4e2e): number {
  const v_479f05 = v_3f4e2e.req.param("id");
  const v_389afb = Number(v_479f05);
  if (!Number.isInteger(v_389afb) || v_389afb <= 0) throw new v_3ebe58("VALIDATION_FAILED", "Invalid person id.");
  return v_389afb;
}

export function v_565c6d(v_c9c489): boolean {
  return v_c9c489.FACE_CONSENT_ENFORCED === "true";
}

v_fded81.post("/", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_4d33b2 = await v_3f4e2e.req
    .json<{ cloneId?: number; displayName?: string; enrolledVia?: string }>()
    .catch(() => ({}) as { cloneId?: number; displayName?: string; enrolledVia?: string });

  const v_6e0fd3 = v_4d33b2.cloneId;
  if (typeof v_6e0fd3 !== "number" || !Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0)
    throw new v_3ebe58("VALIDATION_FAILED", "cloneId: 양의 정수여야 합니다");

  let v_8a1355 = null;
  if (v_4d33b2.displayName !== undefined) {
    v_8a1355 = v_d0fd96(v_4d33b2.displayName);
  }

  let v_926d89 = "card";
  if (v_4d33b2.enrolledVia !== undefined) {
    if (v_4d33b2.enrolledVia !== "card" && v_4d33b2.enrolledVia !== "auto_biometric") {
      throw new v_3ebe58("VALIDATION_FAILED", "enrolledVia는 'card' 또는 'auto_biometric'이어야 합니다.");
    }
    v_926d89 = v_4d33b2.enrolledVia;
  }

  if (v_926d89 === "auto_biometric" && v_565c6d(v_3f4e2e.env)) {
    const v_625c74 = await v_3f4e2e.env.DB.prepare(`SELECT face_biometric_consent FROM users WHERE id = ?`)
      .bind(v_43e90c)
      .first<{ face_biometric_consent: number }>();
    if (!v_625c74 || v_625c74.face_biometric_consent !== 1) {
      v_926d89 = "card";
    }
  }
  const v_40c2c9 = v_926d89 === "auto_biometric" ? "granted" : "none";
  const v_322d60 = v_926d89 === "auto_biometric" ? Date.now() : null;

  const v_eb25ce = await v_0b07b9(v_3f4e2e.env.DB, v_6e0fd3, v_43e90c);
  if (!v_eb25ce) {
    throw new v_3ebe58("NOT_FOUND", "클론을 찾을 수 없습니다.");
  }

  const v_9e67a6 = Date.now();

  let v_43c42e;
  try {
    v_43c42e = await v_3f4e2e.env.DB.prepare(
      `INSERT INTO persons (user_id, clone_id, display_name, consent_state, consent_at, enrolled_via, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(v_43e90c, v_6e0fd3, v_8a1355, v_40c2c9, v_322d60, v_926d89, v_9e67a6)
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
      consentState: v_40c2c9,
      consentAt: v_322d60,
      enrolledVia: v_926d89,
      createdAt: v_9e67a6,
    },
    201
  );
});

const v_0eeb45 = 0.6;

v_fded81.post("/match", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_4d33b2 = await v_3f4e2e.req
    .json<{ vector?: number[]; cloneId?: number }>()
    .catch(() => ({}) as { vector?: number[]; cloneId?: number });
  const v_81e2ef = v_4d33b2.vector;
  if (!Array.isArray(v_81e2ef) || v_81e2ef.length !== 512 || v_81e2ef.some((v_62c214) => typeof v_62c214 !== "number" || !Number.isFinite(v_62c214)))
    throw new v_3ebe58("VALIDATION_FAILED", "vector: 512차원 수치 배열이어야 합니다");

  const v_6e0fd3 = v_4d33b2.cloneId;
  if (typeof v_6e0fd3 !== "number" || !Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0)
    throw new v_3ebe58("VALIDATION_FAILED", "cloneId: 양의 정수여야 합니다");

  const v_eb25ce = await v_0b07b9(v_3f4e2e.env.DB, v_6e0fd3, v_43e90c);
  if (!v_eb25ce) throw new v_3ebe58("NOT_FOUND", "클론을 찾을 수 없습니다.");

  const v_01dcf5 = await v_3f4e2e.env.DB.prepare("SELECT value FROM app_config WHERE key = 'face.match_threshold'").first<{
    value: string;
  }>();
  const v_d361d7 = v_01dcf5?.value !== undefined && Number.isFinite(Number(v_01dcf5.value)) ? Number(v_01dcf5.value) : v_0eeb45;

  const v_495447 = await v_97be02(v_3f4e2e.env, { userId: v_43e90c, cloneId: v_6e0fd3, vector: v_81e2ef });
  const v_52e08b = v_495447.map((v_35f85c) => v_35f85c.personId);

  const v_77b1ac = new Map<number, string | null>();
  if (v_52e08b.length) {
    const v_315151 = await v_3f4e2e.env.DB.prepare(
      `SELECT p.id, p.display_name
         FROM persons p
         JOIN clone_person_faces f ON f.person_id = p.id AND f.clone_id = ?
        WHERE p.user_id = ? AND p.clone_id = ? AND p.id IN (${v_52e08b.map(() => "?").join(",")})
        GROUP BY p.id`,
    )
      .bind(v_6e0fd3, v_43e90c, v_6e0fd3, ...v_52e08b)
      .all<{ id: number; display_name: string | null }>();
    for (const v_3ac7e7 of v_315151.results) v_77b1ac.set(v_3ac7e7.id, v_3ac7e7.display_name);
  }

  const v_a49907 = v_495447
    .filter((v_35f85c) => v_77b1ac.has(v_35f85c.personId))
    .map((v_35f85c) => ({
      personId: v_35f85c.personId,
      displayName: v_77b1ac.get(v_35f85c.personId) ?? null,
      score: v_35f85c.score,

      landmarkRatiosList: v_35f85c.landmarkRatiosList ?? null,
    }));

  const v_643757 = v_a49907[0] && v_a49907[0].score >= v_d361d7 ? v_a49907[0] : null;

  return v_3f4e2e.json({ matches: v_a49907, best: v_643757, threshold: v_d361d7 });
});

export function v_70df81(v_c9c489): boolean {
  return v_c9c489.FACE_CALIBRATE_ENABLED === "1";
}

v_fded81.post("/calibrate", v_6690d9, async (v_3f4e2e) => {
  if (!v_70df81(v_3f4e2e.env)) return v_3f4e2e.notFound();
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_4d33b2 = await v_3f4e2e.req
    .json<{ vector?: unknown; groundTruthPersonId?: string | null; cloneId?: number }>()
    .catch(() => ({}) as { vector?: unknown; groundTruthPersonId?: string | null; cloneId?: number });
  const v_81e2ef = v_4d33b2.vector;
  if (!Array.isArray(v_81e2ef) || v_81e2ef.length !== 512 || !v_81e2ef.every((v_f4e98d) => typeof v_f4e98d === "number" && Number.isFinite(v_f4e98d))) {
    return v_3f4e2e.json({ error: "invalid vector" }, 400); 
  }
  const v_01dcf5 = await v_3f4e2e.env.DB.prepare("SELECT value FROM app_config WHERE key='face.match_threshold'").first<{
    value: string;
  }>();
  const v_d361d7 = v_01dcf5 && Number.isFinite(Number(v_01dcf5.value)) ? Number(v_01dcf5.value) : v_0eeb45;

  const v_6b5963 = v_4d33b2.cloneId;
  if (typeof v_6b5963 !== "number" || !Number.isInteger(v_6b5963) || v_6b5963 <= 0) {
    return v_3f4e2e.json({ error: "invalid cloneId" }, 400);
  }
  const { matches: v_a49907 } = await v_a8d2cc(v_3f4e2e.env).query(v_81e2ef as number[], {

    topK: 20,
    namespace: v_929ead(v_43e90c, v_6b5963),
    returnMetadata: true,
  });

  const v_392321 = v_a49907
    .filter((v_35f85c) => v_35f85c.metadata?.personId != null)
    .map((v_35f85c) => ({ personId: String(v_35f85c.metadata!.personId), score: v_35f85c.score }));
  const v_643757 = v_392321.reduce<{ personId: string; score: number } | null>(
    (v_779914, v_148ff6) => (v_779914 && v_779914.score >= v_148ff6.score ? v_779914 : v_148ff6),
    null
  );
  const v_333258 = v_643757?.score ?? 0;
  const v_38da05 = v_643757 && v_643757.score >= v_d361d7 ? v_643757.personId : null;
  const v_f5477a = typeof v_4d33b2.groundTruthPersonId === "string" ? v_4d33b2.groundTruthPersonId : null;

  let v_22ceee = null;
  if (v_38da05 != null) {
    const v_d4923e = Number(v_38da05);
    if (Number.isInteger(v_d4923e) && v_d4923e > 0) {
      const v_d94e57 = await v_3f4e2e.env.DB.prepare(
        "SELECT 1 AS hit FROM clone_ont_person WHERE clone_id = ? AND person_id = ? LIMIT 1"
      )
        .bind(v_6b5963, v_d4923e)
        .first<{ hit: number }>();
      v_22ceee = v_d94e57 != null;
    }
  }

  const v_5c2f9f = Date.now();
  const v_43af15 = await v_3f4e2e.env.DB.prepare(
    `INSERT INTO faceoth-secretes
     (user_id, ground_truth_person_id, matched_person_id, best_score, threshold, scores_json, created_at, matched_has_l2p)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )

    .bind(
      String(v_43e90c),
      v_f5477a,
      v_38da05,
      v_333258,
      v_d361d7,
      JSON.stringify(v_392321),
      v_5c2f9f,
      v_22ceee == null ? null : v_22ceee ? 1 : 0
    )
    .run();
  const v_389afb = Number(v_43af15.meta.last_row_id);
  return v_3f4e2e.json({ id: v_389afb, matchedId: v_38da05, bestScore: v_333258, threshold: v_d361d7, scoreCount: v_392321.length, matchedHasL2p: v_22ceee });
});

v_fded81.get("/calibrate/samples", v_6690d9, async (v_3f4e2e) => {
  if (!v_70df81(v_3f4e2e.env)) return v_3f4e2e.notFound();
  const v_43e90c = v_3f4e2e.get("userId")!;

  const v_8738be = Math.max(Number(v_3f4e2e.req.query("since") ?? "0") || 0, 0);
  const v_02be30 = Math.min(Math.max(Number(v_3f4e2e.req.query("limit") ?? "100") || 100, 1), 200);
  const { results: v_a7f568 } = await v_3f4e2e.env.DB.prepare(
    `SELECT id, ground_truth_person_id, matched_person_id, best_score, threshold, scores_json, created_at,
            matched_has_l2p
     FROM faceoth-secretes WHERE user_id = ? AND id > ? ORDER BY id ASC LIMIT ?`
  )

    .bind(String(v_43e90c), v_8738be, v_02be30)
    .all<{
      id: number;
      ground_truth_person_id: string | null;
      matched_person_id: string | null;
      best_score: number;
      threshold: number;
      scores_json: string;
      created_at: number;
      matched_has_l2p: number | null;
    }>();

  const v_5b2623 = v_a7f568.map((v_cb35cb) => {
    let v_392321;
    try {
      v_392321 = JSON.parse(v_cb35cb.scores_json) as { personId: string; score: number }[];
    } catch {
      v_392321 = [];
    }
    return {
      id: v_cb35cb.id,
      ts: v_cb35cb.created_at,
      groundTruthPersonId: v_cb35cb.ground_truth_person_id,
      matchedId: v_cb35cb.matched_person_id,
      bestScore: v_cb35cb.best_score,
      threshold: v_cb35cb.threshold,
      scores: v_392321,

      matchedHasL2p: v_cb35cb.matched_has_l2p == null ? null : v_cb35cb.matched_has_l2p === 1,
    };
  });
  const v_d074ef = v_5b2623[v_5b2623.length - 1];
  const v_ee40f4 = v_d074ef ? v_d074ef.id : v_8738be;
  return v_3f4e2e.json({ samples: v_5b2623, nextSince: v_ee40f4 });
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
  const v_4d33b2 = await v_3f4e2e.req
    .json<{ vectors?: number[][]; cloneId?: number; landmarkRatios?: (Record<string, number> | null)[] }>()
    .catch(() => ({}) as { vectors?: number[][]; cloneId?: number; landmarkRatios?: (Record<string, number> | null)[] });
  const v_f94e64 = v_4d33b2.vectors;
  if (
    !Array.isArray(v_f94e64) ||
    v_f94e64.length < 1 ||
    v_f94e64.length > 10 ||
    v_f94e64.some(
      (v_81e2ef) => !Array.isArray(v_81e2ef) || v_81e2ef.length !== 512 || v_81e2ef.some((v_62c214) => typeof v_62c214 !== "number" || !Number.isFinite(v_62c214))
    )
  )
    throw new v_3ebe58("VALIDATION_FAILED", "vectors: 1~10개의 512차원 수치 배열이어야 합니다");

  const v_6e0fd3 = v_4d33b2.cloneId;
  if (typeof v_6e0fd3 !== "number" || !Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0)
    throw new v_3ebe58("VALIDATION_FAILED", "cloneId: 양의 정수여야 합니다");

  const v_bef6f8 = v_4d33b2.landmarkRatios;
  if (v_bef6f8 !== undefined) {
    if (!Array.isArray(v_bef6f8) || v_bef6f8.length !== v_f94e64.length)
      throw new v_3ebe58("VALIDATION_FAILED", "landmarkRatios: vectors 와 동일 길이 배열이어야 합니다");
    for (const v_cb35cb of v_bef6f8) {
      if (v_cb35cb == null) continue;
      if (typeof v_cb35cb !== "object")
        throw new v_3ebe58("VALIDATION_FAILED", "landmarkRatios 항목: object 또는 null 이어야 합니다");
      for (const v_81e2ef of Object.values(v_cb35cb)) {
        if (typeof v_81e2ef !== "number" || !Number.isFinite(v_81e2ef))
          throw new v_3ebe58("VALIDATION_FAILED", "landmarkRatios 값: 유한 수치여야 합니다");
      }
    }
  }

  const v_eb25ce = await v_0b07b9(v_3f4e2e.env.DB, v_6e0fd3, v_43e90c);
  if (!v_eb25ce) throw new v_3ebe58("NOT_FOUND", "person이 존재하지 않습니다.");

  const v_306a28 = await v_3f4e2e.env.DB.prepare(
    "SELECT id, consent_state FROM persons WHERE id = ? AND user_id = ? AND clone_id = ?",
  )
    .bind(v_ca1ec5, v_43e90c, v_6e0fd3)
    .first<{ id: number; consent_state: string }>();
  if (!v_306a28) throw new v_3ebe58("NOT_FOUND", "person이 존재하지 않습니다.");
  if (v_306a28.consent_state !== "granted")
    throw new v_3ebe58("FORBIDDEN", "얼굴정보 저장 동의(consent granted)가 필요합니다"); 

  try {
    const { enrolled: v_570847 } = await v_003ee1(v_3f4e2e.env, {
      userId: v_43e90c,
      cloneId: v_6e0fd3,
      personId: v_ca1ec5,
      vectors: v_f94e64,
      landmarkRatios: v_bef6f8,
      source: "call",
    });

    const v_0a2cd1 = await v_a752e9(v_3f4e2e.env.DB, v_6e0fd3, v_43e90c, v_ca1ec5).catch(() => false);
    if (v_0a2cd1) {
      await v_74defc(v_3f4e2e, {
        userId: v_43e90c,
        action: "l2.owner_face.claim",
        details: { cloneId: v_6e0fd3, personId: v_ca1ec5 },
      });
    }

    return v_3f4e2e.json({ enrolled: v_570847 });
  } catch (v_9e86fd) {
    throw new v_3ebe58("UPSTREAM_FAILURE", `얼굴 벡터 인덱스 저장 실패: ${(v_9e86fd as Error).message}`);
  }
});

v_fded81.delete("/:id", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_ca1ec5 = v_5c8583(v_3f4e2e);

  const v_306a28 = await v_3f4e2e.env.DB.prepare("SELECT id FROM persons WHERE id = ? AND user_id = ?")
    .bind(v_ca1ec5, v_43e90c)
    .first<{ id: number }>();
  if (!v_306a28) throw new v_3ebe58("NOT_FOUND", "person이 존재하지 않습니다.");

  const { deletedEmbeddings: v_2395e5 } = await v_430d2b(v_3f4e2e.env, v_ca1ec5, v_43e90c);

  console.log(JSON.stringify({ event: "face_person_deleted", personId: v_ca1ec5, userId: v_43e90c, deletedEmbeddings: v_2395e5 }));

  return v_3f4e2e.json({ deleted: true });
});

v_fded81.patch("/:id", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_ca1ec5 = v_5c8583(v_3f4e2e);
  const v_4d33b2 = await v_3f4e2e.req.json<{ displayName?: string }>().catch(() => ({}) as { displayName?: string });

  const v_2f361a = v_d0fd96(v_4d33b2.displayName);

  const v_2461e1 = await v_3f4e2e.env.DB.prepare(`SELECT id FROM persons WHERE id = ? AND user_id = ?`)
    .bind(v_ca1ec5, v_43e90c)
    .first<{ id: number }>();
  if (!v_2461e1) throw new v_3ebe58("NOT_FOUND", "person이 존재하지 않습니다.");

  try {
    await v_3f4e2e.env.DB.prepare(`UPDATE persons SET display_name = ? WHERE id = ? AND user_id = ?`)
      .bind(v_2f361a, v_ca1ec5, v_43e90c)
      .run();
  } catch (v_49263d) {
    const v_badeaf = (v_49263d as Error).message ?? "";
    if (/UNIQUE constraint failed/i.test(v_badeaf)) {
      throw new v_3ebe58("VALIDATION_FAILED", "이미 등록된 이름입니다.");
    }
    throw v_49263d;
  }

  return v_3f4e2e.json({ id: v_ca1ec5, displayName: v_2f361a });
});

v_fded81.patch("/:id/relation", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_ca1ec5 = v_5c8583(v_3f4e2e);
  const v_4d33b2 = await v_3f4e2e.req
    .json<{ relation?: string }>()
    .catch(() => ({}) as { relation?: string });

  const v_dd8af0 = (v_4d33b2.relation ?? "").trim();
  if (!v_dd8af0) throw new v_3ebe58("VALIDATION_FAILED", "relation 이 비어 있습니다.");
  if (v_dd8af0.length > 100) {
    throw new v_3ebe58("VALIDATION_FAILED", "relation 이 너무 깁니다(100자 이내).");
  }

  const v_2461e1 = await v_3f4e2e.env.DB.prepare(
    `SELECT id, clone_id AS cloneId FROM persons WHERE id = ? AND user_id = ?`,
  )
    .bind(v_ca1ec5, v_43e90c)
    .first<{ id: number; cloneId: number | null }>();
  if (!v_2461e1) throw new v_3ebe58("NOT_FOUND", "person이 존재하지 않습니다.");
  if (v_2461e1.cloneId == null) {
    throw new v_3ebe58("VALIDATION_FAILED", "클론에 속하지 않은 화자입니다.");
  }

  const v_3ac7e7 = await v_3f4e2e.env.DB.prepare(
    `SELECT data FROM clone_ont_person WHERE clone_id = ? AND person_id = ?`,
  )
    .bind(v_2461e1.cloneId, v_ca1ec5)
    .first<{ data: string }>();

  let v_9390e8 = {};
  if (v_3ac7e7?.data) {
    try {
      const v_8decf8 = JSON.parse(v_3ac7e7.data);
      if (v_8decf8 && typeof v_8decf8 === "object" && !Array.isArray(v_8decf8)) {
        v_9390e8 = v_8decf8 as Record<string, unknown>;
      }
    } catch {

    }
  }
  v_9390e8.relation = v_dd8af0;

  await v_3f4e2e.env.DB.prepare(
    `INSERT INTO clone_ont_person (clone_id, person_id, data, updated_at)
     VALUES (?, ?, ?, unixepoch())
     ON CONFLICT(clone_id, person_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
  )
    .bind(v_2461e1.cloneId, v_ca1ec5, JSON.stringify(v_9390e8))
    .run();

  return v_3f4e2e.json({ id: v_ca1ec5, relation: v_dd8af0 });
});

v_fded81.get("/", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_56b68f = v_3f4e2e.req.query("cloneId");

  const v_6c1676 = `SELECT
       p.id,
       p.user_id       AS userId,
       p.clone_id      AS cloneId,
       p.display_name  AS displayName,
       p.consent_state AS consentState,
       p.consent_at    AS consentAt,
       p.created_at    AS createdAt,
       (SELECT COUNT(*) FROM clone_person_faces f
         WHERE f.person_id = p.id AND f.clone_id = p.clone_id) AS faceCount,
       CASE WHEN c.self_person_id IS NOT NULL AND c.self_person_id = p.id
            THEN 1 ELSE 0 END AS isSelf
     FROM persons p
     LEFT JOIN clones c ON c.id = p.clone_id`;
  type Row = {
    id: number;
    userId: number;
    cloneId: number | null;
    displayName: string | null;
    consentState: string;
    consentAt: number | null;
    createdAt: number;
    faceCount: number;
    isSelf: number; 
  };

  let v_18b8bf;
  if (v_56b68f !== undefined) {
    const v_6e0fd3 = Number(v_56b68f);
    if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) {
      throw new v_3ebe58("VALIDATION_FAILED", "Invalid clone id.");
    }
    v_18b8bf = await v_3f4e2e.env.DB.prepare(
      `${v_6c1676} WHERE p.user_id = ? AND p.clone_id = ? ORDER BY p.created_at DESC`
    )
      .bind(v_43e90c, v_6e0fd3)
      .all<Row>();
  } else {
    v_18b8bf = await v_3f4e2e.env.DB.prepare(`${v_6c1676} WHERE p.user_id = ? ORDER BY p.created_at DESC`)
      .bind(v_43e90c)
      .all<Row>();
  }

  return v_3f4e2e.json({
    data: v_18b8bf.results.map((v_cb35cb) => ({ ...v_cb35cb, isSelf: v_cb35cb.isSelf === 1 })),
  });
});
