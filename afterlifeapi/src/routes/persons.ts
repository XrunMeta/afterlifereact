

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

  const displayName: null = null;

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

  const result = await c.env.DB.prepare(
    `INSERT INTO persons (user_id, clone_id, display_name, consent_state, created_at)
     VALUES (?, ?, ?, 'none', ?)`
  )
    .bind(userId, cloneId, displayName, createdAt)
    .run();

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
  const personId = Number(c.req.param("id"));
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
  if (!person) throw new APIError("NOT_FOUND", "Person not found.");
  if (person.consent_state !== "granted")
    throw new APIError("FORBIDDEN", "얼굴정보 저장 동의(consent granted)가 필요합니다"); 

  const idx = getFaceIndex(c.env);
  const rows = vectors.map((values) => ({
    id: crypto.randomUUID(),
    values,
    namespace: String(userId),
    metadata: { personId: String(personId) },
  }));
  await idx.insert(rows);

  const createdAt = Date.now();
  const stmt = c.env.DB.prepare(
    `INSERT INTO face_embeddings (person_id, vectorize_id, model, dim, source, created_at)
     VALUES (?, ?, 'w600k_mbf', 512, 'call', ?)`
  );
  await c.env.DB.batch(rows.map((r) => stmt.bind(personId, r.id, createdAt)));

  return c.json({ enrolled: rows.length });
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
