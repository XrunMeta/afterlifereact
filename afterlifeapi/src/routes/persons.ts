

import { Hono } from "hono";
import type { AppEnv } from "../lib/env";
import { APIError } from "../lib/errors";
import { requireAuth } from "../middleware/auth";
import { getFaceIndex } from "../lib/faceVectors";
import { deletePersonCascade } from "../lib/personDelete";
import { assertValidDisplayName } from "../lib/displayName";
import { cloneActiveSql } from "../lib/cloneAccess";

export const persons = new Hono<AppEnv>();

function parsePersonId(c: { req: { param: (k: string) => string } }): number {
  const raw = c.req.param("id");
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new APIError("VALIDATION_FAILED", "Invalid person id.");
  return id;
}

export function isFaceConsentEnforced(env: { FACE_CONSENT_ENFORCED?: string }): boolean {
  return env.FACE_CONSENT_ENFORCED === "true";
}

persons.post("/", requireAuth, async (c) => {
  const userId = c.get("userId")!;
  const body = await c.req
    .json<{ cloneId?: number; displayName?: string; enrolledVia?: string }>()
    .catch(() => ({}) as { cloneId?: number; displayName?: string; enrolledVia?: string });

  const cloneId = body.cloneId ?? null;

  let displayName: string | null = null;
  if (body.displayName !== undefined) {
    displayName = assertValidDisplayName(body.displayName);
  }

  let enrolledVia: "card" | "auto_biometric" = "card";
  if (body.enrolledVia !== undefined) {
    if (body.enrolledVia !== "card" && body.enrolledVia !== "auto_biometric") {
      throw new APIError("VALIDATION_FAILED", "enrolledVia는 'card' 또는 'auto_biometric'이어야 합니다.");
    }
    enrolledVia = body.enrolledVia;
  }

  if (enrolledVia === "auto_biometric" && isFaceConsentEnforced(c.env)) {
    const user = await c.env.DB.prepare(`SELECT face_biometric_consent FROM users WHERE id = ?`)
      .bind(userId)
      .first<{ face_biometric_consent: number }>();
    if (!user || user.face_biometric_consent !== 1) {
      enrolledVia = "card";
    }
  }
  const consentState: "none" | "granted" = enrolledVia === "auto_biometric" ? "granted" : "none";
  const consentAt: number | null = enrolledVia === "auto_biometric" ? Date.now() : null;

  if (cloneId !== null) {
    const owned = await c.env.DB.prepare(
      `SELECT id FROM clones WHERE id = ? AND owner_id = ? AND ${cloneActiveSql()}`
    )
      .bind(cloneId, userId)
      .first<{ id: number }>();
    if (!owned) {
      throw new APIError("VALIDATION_FAILED", "Invalid clone id.");
    }
  }

  const createdAt = Date.now();

  let result;
  try {
    result = await c.env.DB.prepare(
      `INSERT INTO persons (user_id, clone_id, display_name, consent_state, consent_at, enrolled_via, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(userId, cloneId, displayName, consentState, consentAt, enrolledVia, createdAt)
      .run();
  } catch (err) {
    const msg = (err as Error).message ?? "";

    if (/UNIQUE constraint failed/i.test(msg)) {
      throw new APIError("VALIDATION_FAILED", "이미 등록된 이름입니다.");
    }
    throw err;
  }

  const id = result.meta.last_row_id as number;

  return c.json(
    {
      id,
      userId,
      cloneId,
      displayName,
      consentState,
      consentAt,
      enrolledVia,
      createdAt,
    },
    201
  );
});

const DEFAULT_FACE_THRESHOLD = 0.45;

persons.post("/match", requireAuth, async (c) => {
  const userId = c.get("userId")!;
  const body = await c.req.json<{ vector?: number[] }>().catch(() => ({}) as { vector?: number[] });
  const v = body.vector;
  if (!Array.isArray(v) || v.length !== 512 || v.some((x) => typeof x !== "number" || !Number.isFinite(x)))
    throw new APIError("VALIDATION_FAILED", "vector: 512차원 수치 배열이어야 합니다");

  const cfg = await c.env.DB.prepare("SELECT value FROM app_config WHERE key = 'face.match_threshold'").first<{
    value: string;
  }>();
  const threshold = cfg?.value !== undefined && Number.isFinite(Number(cfg.value)) ? Number(cfg.value) : DEFAULT_FACE_THRESHOLD;

  const idx = getFaceIndex(c.env);
  const r = await idx.query(v, { topK: 3, namespace: String(userId), returnMetadata: true });

  const byPerson = new Map<number, number>(); 
  for (const m of r.matches) {
    const pid = Number(m.metadata?.personId);
    if (!pid) continue;
    byPerson.set(pid, Math.max(byPerson.get(pid) ?? -1, m.score));
  }

  const ids = [...byPerson.keys()];
  const names = new Map<number, string | null>();
  if (ids.length) {
    const rs = await c.env.DB.prepare(
      `SELECT id, display_name FROM persons WHERE user_id = ? AND id IN (${ids.map(() => "?").join(",")})`
    )
      .bind(userId, ...ids)
      .all<{ id: number; display_name: string | null }>();
    for (const row of rs.results) names.set(row.id, row.display_name);
  }

  const matches = ids
    .map((pid) => ({ personId: pid, displayName: names.get(pid) ?? null, score: byPerson.get(pid)! }))
    .sort((a, b) => b.score - a.score);

  const best = matches[0] && matches[0].score >= threshold ? matches[0] : null;

  return c.json({ matches, best, threshold });
});

export function isFaceCalibrateEnabled(env: { FACE_CALIBRATE_ENABLED?: string }): boolean {
  return env.FACE_CALIBRATE_ENABLED === "1";
}

persons.post("/calibrate", requireAuth, async (c) => {
  if (!isFaceCalibrateEnabled(c.env)) return c.notFound();
  const userId = c.get("userId")!;
  const body = await c.req
    .json<{ vector?: unknown; groundTruthPersonId?: string | null }>()
    .catch(() => ({}) as { vector?: unknown; groundTruthPersonId?: string | null });
  const v = body.vector;
  if (!Array.isArray(v) || v.length !== 512 || !v.every((n) => typeof n === "number" && Number.isFinite(n))) {
    return c.json({ error: "invalid vector" }, 400); 
  }
  const cfg = await c.env.DB.prepare("SELECT value FROM app_config WHERE key='face.match_threshold'").first<{
    value: string;
  }>();
  const threshold = cfg && Number.isFinite(Number(cfg.value)) ? Number(cfg.value) : DEFAULT_FACE_THRESHOLD;
  const { matches } = await getFaceIndex(c.env).query(v as number[], {
    topK: 100,
    namespace: String(userId),
    returnMetadata: true,
  });

  const scores = matches
    .filter((m) => m.metadata?.personId != null)
    .map((m) => ({ personId: String(m.metadata!.personId), score: m.score }));
  const best = scores.reduce<{ personId: string; score: number } | null>(
    (a, b) => (a && a.score >= b.score ? a : b),
    null
  );
  const bestScore = best?.score ?? 0;
  const matchedId = best && best.score >= threshold ? best.personId : null;
  const gt = typeof body.groundTruthPersonId === "string" ? body.groundTruthPersonId : null;
  const now = Date.now();
  const ins = await c.env.DB.prepare(
    `INSERT INTO face_calibrate_samples
     (user_id, ground_truth_person_id, matched_person_id, best_score, threshold, scores_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )

    .bind(String(userId), gt, matchedId, bestScore, threshold, JSON.stringify(scores), now)
    .run();
  const id = Number(ins.meta.last_row_id);
  return c.json({ id, matchedId, bestScore, threshold, scoreCount: scores.length });
});

persons.get("/calibrate/samples", requireAuth, async (c) => {
  if (!isFaceCalibrateEnabled(c.env)) return c.notFound();
  const userId = c.get("userId")!;

  const since = Math.max(Number(c.req.query("since") ?? "0") || 0, 0);
  const limit = Math.min(Math.max(Number(c.req.query("limit") ?? "100") || 100, 1), 200);
  const { results } = await c.env.DB.prepare(
    `SELECT id, ground_truth_person_id, matched_person_id, best_score, threshold, scores_json, created_at
     FROM face_calibrate_samples WHERE user_id = ? AND id > ? ORDER BY id ASC LIMIT ?`
  )

    .bind(String(userId), since, limit)
    .all<{
      id: number;
      ground_truth_person_id: string | null;
      matched_person_id: string | null;
      best_score: number;
      threshold: number;
      scores_json: string;
      created_at: number;
    }>();

  const samples = results.map((r) => {
    let scores: { personId: string; score: number }[];
    try {
      scores = JSON.parse(r.scores_json) as { personId: string; score: number }[];
    } catch {
      scores = [];
    }
    return {
      id: r.id,
      ts: r.created_at,
      groundTruthPersonId: r.ground_truth_person_id,
      matchedId: r.matched_person_id,
      bestScore: r.best_score,
      threshold: r.threshold,
      scores,
    };
  });
  const lastSample = samples[samples.length - 1];
  const nextSince = lastSample ? lastSample.id : since;
  return c.json({ samples, nextSince });
});

persons.post("/:id/consent", requireAuth, async (c) => {
  const personId = parsePersonId(c);
  const userId = c.get("userId")!;

  const body = await c.req.json<{ state?: string; termsVersion?: string; channel?: string }>().catch(
    () => ({}) as { state?: string; termsVersion?: string; channel?: string }
  );
  const state = body.state;

  if (state !== "granted" && state !== "revoked") {
    throw new APIError("VALIDATION_FAILED", "state must be 'granted' or 'revoked'.");
  }

  const consentAt = Date.now();

  const termsVersion = body.termsVersion ?? null;
  const channel = body.channel ?? "api";

  const owned = await c.env.DB.prepare(
    `SELECT id FROM persons WHERE id = ? AND user_id = ?`
  )
    .bind(personId, userId)
    .first<{ id: number }>();

  if (!owned) {
    throw new APIError("NOT_FOUND", "Person not found.");
  }

  const updateStmt = c.env.DB.prepare(
    `UPDATE persons SET consent_state = ?, consent_at = ? WHERE id = ? AND user_id = ?`
  ).bind(state, consentAt, personId, userId);

  const logStmt = c.env.DB.prepare(
    `INSERT INTO persons_consent_log (person_id, state, terms_version, channel, changed_at)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(personId, state, termsVersion, channel, consentAt);

  await c.env.DB.batch([updateStmt, logStmt]);

  return c.json({ consentState: state, consentAt });
});

persons.post("/:id/faces", requireAuth, async (c) => {
  const userId = c.get("userId")!;
  const personId = parsePersonId(c);
  const body = await c.req.json<{ vectors?: number[][] }>().catch(() => ({}) as { vectors?: number[][] });
  const vectors = body.vectors;
  if (
    !Array.isArray(vectors) ||
    vectors.length < 1 ||
    vectors.length > 5 ||
    vectors.some(
      (v) => !Array.isArray(v) || v.length !== 512 || v.some((x) => typeof x !== "number" || !Number.isFinite(x))
    )
  )
    throw new APIError("VALIDATION_FAILED", "vectors: 1~5개의 512차원 수치 배열이어야 합니다");

  const person = await c.env.DB.prepare("SELECT id, consent_state FROM persons WHERE id = ? AND user_id = ?")
    .bind(personId, userId)
    .first<{ id: number; consent_state: string }>();
  if (!person) throw new APIError("NOT_FOUND", "person이 존재하지 않습니다.");
  if (person.consent_state !== "granted")
    throw new APIError("FORBIDDEN", "얼굴정보 저장 동의(consent granted)가 필요합니다"); 

  const rows = vectors.map((values) => ({
    id: crypto.randomUUID(),
    values,
    namespace: String(userId),
    metadata: { personId: String(personId) },
  }));

  const createdAt = Date.now();
  const insertStmt = c.env.DB.prepare(
    `INSERT INTO face_embeddings (person_id, vectorize_id, model, dim, source, created_at)
     VALUES (?, ?, 'w600k_mbf', 512, 'call', ?)`
  );
  await c.env.DB.batch(rows.map((r) => insertStmt.bind(personId, r.id, createdAt)));

  const idx = getFaceIndex(c.env);
  try {
    await idx.insert(rows);
  } catch (e) {

    const placeholders = rows.map(() => "?").join(",");
    await c.env.DB.prepare(`DELETE FROM face_embeddings WHERE vectorize_id IN (${placeholders})`)
      .bind(...rows.map((r) => r.id))
      .run();
    throw new APIError("UPSTREAM_FAILURE", `얼굴 벡터 인덱스 저장 실패: ${(e as Error).message}`);
  }

  return c.json({ enrolled: rows.length });
});

persons.delete("/:id", requireAuth, async (c) => {
  const userId = c.get("userId")!;
  const personId = parsePersonId(c);

  const person = await c.env.DB.prepare("SELECT id FROM persons WHERE id = ? AND user_id = ?")
    .bind(personId, userId)
    .first<{ id: number }>();
  if (!person) throw new APIError("NOT_FOUND", "person이 존재하지 않습니다.");

  const { deletedEmbeddings } = await deletePersonCascade(c.env, personId, userId);

  console.log(JSON.stringify({ event: "face_person_deleted", personId, userId, deletedEmbeddings }));

  return c.json({ deleted: true });
});

persons.patch("/:id", requireAuth, async (c) => {
  const userId = c.get("userId")!;
  const personId = parsePersonId(c);
  const body = await c.req.json<{ displayName?: string }>().catch(() => ({}) as { displayName?: string });

  const trimmed = assertValidDisplayName(body.displayName);

  const owned = await c.env.DB.prepare(`SELECT id FROM persons WHERE id = ? AND user_id = ?`)
    .bind(personId, userId)
    .first<{ id: number }>();
  if (!owned) throw new APIError("NOT_FOUND", "person이 존재하지 않습니다.");

  try {
    await c.env.DB.prepare(`UPDATE persons SET display_name = ? WHERE id = ? AND user_id = ?`)
      .bind(trimmed, personId, userId)
      .run();
  } catch (err) {
    const msg = (err as Error).message ?? "";
    if (/UNIQUE constraint failed/i.test(msg)) {
      throw new APIError("VALIDATION_FAILED", "이미 등록된 이름입니다.");
    }
    throw err;
  }

  return c.json({ id: personId, displayName: trimmed });
});

persons.get("/", requireAuth, async (c) => {
  const userId = c.get("userId")!;
  const cloneIdRaw = c.req.query("cloneId");

  const cols = `SELECT
       id,
       user_id       AS userId,
       clone_id      AS cloneId,
       display_name  AS displayName,
       consent_state AS consentState,
       consent_at    AS consentAt,
       created_at    AS createdAt
     FROM persons`;
  type Row = {
    id: number;
    userId: number;
    cloneId: number | null;
    displayName: string | null;
    consentState: string;
    consentAt: number | null;
    createdAt: number;
  };

  let rows;
  if (cloneIdRaw !== undefined) {
    const cloneId = Number(cloneIdRaw);
    if (!Number.isInteger(cloneId) || cloneId <= 0) {
      throw new APIError("VALIDATION_FAILED", "Invalid clone id.");
    }
    rows = await c.env.DB.prepare(
      `${cols} WHERE user_id = ? AND (clone_id = ? OR clone_id IS NULL) ORDER BY created_at DESC`
    )
      .bind(userId, cloneId)
      .all<Row>();
  } else {
    rows = await c.env.DB.prepare(`${cols} WHERE user_id = ? ORDER BY created_at DESC`)
      .bind(userId)
      .all<Row>();
  }

  return c.json({ data: rows.results });
});
