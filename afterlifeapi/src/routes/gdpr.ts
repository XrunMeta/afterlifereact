import { Hono } from "hono";
import type { AppEnv } from "../lib/env";
import { APIError } from "../lib/errors";
import { parseJson, z } from "../lib/validate";
import { requireAuth } from "../middleware/auth";

export const gdpr = new Hono<AppEnv>();

const submitSchema = z.object({
  scope: z.enum(["user_all", "resources"]),
  resources: z
    .array(
      z.object({
        resourceType: z.string().min(1).max(64),
        resourceId: z.union([z.string(), z.number()]),
      }),
    )
    .max(500)
    .optional(),
  reason: z.string().min(10).max(1000),
});

gdpr.post("/shred-request", requireAuth, async (c) => {
  const userId = c.get("userId");
  if (!userId) throw new APIError("UNAUTHENTICATED", "User identity missing.");
  const body = await parseJson(c, submitSchema);

  if (body.scope === "resources") {
    if (!body.resources || body.resources.length === 0) {
      throw new APIError(
        "VALIDATION_FAILED",
        "resources required when scope=resources.",
      );
    }
  } else if (body.resources && body.resources.length > 0) {
    throw new APIError(
      "VALIDATION_FAILED",
      "resources must be empty when scope=user_all.",
    );
  }

  const resourcesJson =
    body.scope === "resources" ? JSON.stringify(body.resources) : null;
  const ins = await c.env.DB.prepare(
    `INSERT INTO gdpr_shred_requests (user_id, scope, resources_json, reason)
     VALUES (?, ?, ?, ?)
     RETURNING id, status, submitted_at`,
  )
    .bind(userId, body.scope, resourcesJson, body.reason)
    .first<{ id: number; status: string; submitted_at: string }>();

  return c.json({ request: ins }, 202);
});

gdpr.get("/shred-request", requireAuth, async (c) => {
  const userId = c.get("userId");
  if (!userId) throw new APIError("UNAUTHENTICATED", "User identity missing.");
  const rows = (
    await c.env.DB.prepare(
      `SELECT id, scope, status, quorum_request_id AS quorumRequestId,
              submitted_at AS submittedAt, executed_at AS executedAt,
              cancelled_at AS cancelledAt, shredded_count AS shreddedCount
         FROM gdpr_shred_requests
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT 50`,
    )
      .bind(userId)
      .all()
  ).results;
  return c.json({ requests: rows });
});

gdpr.post("/shred-request/:id/cancel", requireAuth, async (c) => {
  const userId = c.get("userId");
  if (!userId) throw new APIError("UNAUTHENTICATED", "User identity missing.");
  const id = Number(c.req.param("id"));
  if (!Number.isFinite(id) || id <= 0)
    throw new APIError("VALIDATION_FAILED", "Invalid id.");

  const row = await c.env.DB.prepare(
    `SELECT user_id, status FROM gdpr_shred_requests WHERE id = ?`,
  )
    .bind(id)
    .first<{ user_id: number; status: string }>();
  if (!row) throw new APIError("NOT_FOUND", "Request not found.");
  if (row.user_id !== Number(userId))
    throw new APIError("FORBIDDEN", "Not your request.");
  if (row.status !== "submitted" && row.status !== "in_review") {
    throw new APIError(
      "CONFLICT",
      `Cannot cancel request in status=${row.status}.`,
    );
  }

  const upd = await c.env.DB.prepare(
    `UPDATE gdpr_shred_requests
        SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP
      WHERE id = ? AND status IN ('submitted', 'in_review')`,
  )
    .bind(id)
    .run();
  const changes =
    (upd as unknown as { meta?: { changes?: number } }).meta?.changes ?? 0;
  if (changes === 0) throw new APIError("CONFLICT", "Race: status changed.");

  return c.json({ ok: true, id, status: "cancelled" });
});
