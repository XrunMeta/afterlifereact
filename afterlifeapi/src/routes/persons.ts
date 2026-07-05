

import { Hono } from "hono";
import type { AppEnv } from "../lib/env";
import { APIError } from "../lib/errors";
import { requireAuth } from "../middleware/auth";
import { getFaceIndex } from "../lib/faceVectors";

export const persons = new Hono<AppEnv>();

function parsePersonId(c: { req: { param: (k: string) => string } }): number {
  const raw = c.req.param("id");
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new APIError("VALIDATION_FAILED", "Invalid person id.");
  return id;
}

persons.post("/", requireAuth, async (c) => {
  const userId = c.get("userId")!;
  const body = await c.req
    .json<{ cloneId?: number; displayName?: string }>()
    .catch(() => ({}) as { cloneId?: number; displayName?: string });

  const cloneId = body.cloneId ?? null;

  let displayName: string | null = null;
  if (body.displayName !== undefined) {
    if (typeof body.displayName !== "string") {
      throw new APIError("VALIDATION_FAILED", "displayName은 문자열이어야 합니다.");
    }
    const trimmed = body.displayName.trim();
    if (trimmed.length < 1 || trimmed.length > 30) {
      throw new APIError("VALIDATION_FAILED", "displayName은 1~30자여야 합니다.");
    }

    if (/[\x00-\x1f\x7f​-‏‪-‮⁠-⁯﻿]/.test(trimmed)) {
      throw new APIError("VALIDATION_FAILED", "displayName에 제어문자를 사용할 수 없습니다.");
    }
    displayName = trimmed;
  }

  if (cloneId !== null) {
    const owned = await c.env.DB.prepare(
      `SELECT id FROM clones WHERE id = ? AND owner_id = ? AND deleted_at IS NULL`
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
      `INSERT INTO persons (user_id, clone_id, display_name, consent_state, created_at)
       VALUES (?, ?, ?, 'none', ?)`
    )
      .bind(userId, cloneId, displayName, createdAt)
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
      consentState: "none" as const,
      consentAt: null,
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
  const since = Number(c.req.query("since") ?? "0") || 0;
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
  const samples = results.map((r) => ({
    id: r.id,
    ts: r.created_at,
    groundTruthPersonId: r.ground_truth_person_id,
    matchedId: r.matched_person_id,
    bestScore: r.best_score,
    threshold: r.threshold,
    scores: JSON.parse(r.scores_json) as { personId: string; score: number }[],
  }));
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

  const embs = await c.env.DB.prepare("SELECT vectorize_id FROM face_embeddings WHERE person_id = ?")
    .bind(personId)
    .all<{ vectorize_id: string | null }>();
  const vids = embs.results.map((r) => r.vectorize_id).filter((v): v is string => Boolean(v));

  if (vids.length) await getFaceIndex(c.env).deleteByIds(vids);

  const deletedAt = Date.now();

  await c.env.DB.batch([
    c.env.DB.prepare("DELETE FROM face_embeddings WHERE person_id = ?").bind(personId),

    c.env.DB.prepare(
      `INSERT INTO persons_consent_log (person_id, state, terms_version, channel, changed_at)
       VALUES (?, 'revoked', NULL, 'face_delete', ?)`
    ).bind(personId, deletedAt),
    c.env.DB.prepare("UPDATE call_turns SET speaker_person_id = NULL WHERE speaker_person_id = ?").bind(personId),

    c.env.DB.prepare("DELETE FROM clone_ont_person WHERE person_id = ?").bind(personId),
    c.env.DB.prepare("DELETE FROM persons WHERE id = ? AND user_id = ?").bind(personId, userId),
  ]);

  console.log(JSON.stringify({ event: "face_person_deleted", personId, userId, deletedEmbeddings: vids.length }));

  return c.json({ deleted: true });
});

persons.get("/", requireAuth, async (c) => {
  const userId = c.get("userId")!;

  const rows = await c.env.DB.prepare(
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
    .bind(userId)
    .all<{
      id: number;
      userId: number;
      cloneId: number | null;
      displayName: string | null;
      consentState: string;
      consentAt: number | null;
      createdAt: number;
    }>();

  return c.json({ data: rows.results });
});
