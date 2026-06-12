

import { Hono } from "hono";
import type { AppEnv } from "../lib/env";
import { APIError } from "../lib/errors";
import { requireAuth } from "../middleware/auth";

export const persons = new Hono<AppEnv>();

function parsePersonId(c: { req: { param: (k: string) => string } }): number {
  const raw = c.req.param("id");
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new APIError("VALIDATION_FAILED", "Invalid person id.");
  return id;
}

persons.post("/", requireAuth, async (c) => {
  const userId = c.get("userId")!;
  const body = await c.req.json<{ cloneId?: number; displayName?: string }>().catch(() => ({}));

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
