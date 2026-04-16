

import { Hono } from "hono";
import type { AppEnv } from "../lib/env";
import { APIError } from "../lib/errors";
import { requireAdmin, requireSuperAdmin } from "../middleware/auth";

export const adminGdpr = new Hono<AppEnv>();

adminGdpr.get("/requests", requireAdmin, async (c) => {
  const status = c.req.query("status");
  const limit = Math.min(Number(c.req.query("limit") ?? 50), 200);

  const where: string[] = [];
  const binds: unknown[] = [];
  if (status) {
    where.push("status = ?");
    binds.push(status);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const rows = (
    await c.env.DB
      .prepare(
        `SELECT id,
                user_id          AS userId,
                scope,
                resources_json   AS resourcesJson,
                reason,
                status,
                quorum_request_id AS quorumRequestId,
                submitted_at     AS submittedAt,
                executed_at      AS executedAt,
                cancelled_at     AS cancelledAt,
                shredded_count   AS shreddedCount
           FROM gdpr_shred_requests
          ${whereSql}
          ORDER BY id DESC
          LIMIT ?`,
      )
      .bind(...binds, limit)
      .all()
  ).results;

  return c.json({ requests: rows });
});

adminGdpr.post("/requests/:id/quorum", requireSuperAdmin, async (c) => {
  const adminId = c.get("adminUserId");
  if (!adminId) throw new APIError("UNAUTHENTICATED", "Admin identity missing.");

  const id = Number(c.req.param("id"));
  if (!Number.isFinite(id) || id <= 0)
    throw new APIError("VALIDATION_FAILED", "Invalid id.");

  const gdprRow = await c.env.DB
    .prepare(
      `SELECT id, user_id, scope, resources_json, reason, status, quorum_request_id
         FROM gdpr_shred_requests
        WHERE id = ?`,
    )
    .bind(id)
    .first<{
      id: number;
      user_id: number;
      scope: string;
      resources_json: string | null;
      reason: string;
      status: string;
      quorum_request_id: number | null;
    }>();

  if (!gdprRow) throw new APIError("NOT_FOUND", "GDPR request not found.");
  if (gdprRow.status !== "submitted") {
    throw new APIError(
      "CONFLICT",
      `Cannot promote request in status=${gdprRow.status}.`,
    );
  }

  const payload = {
    gdprRequestId: gdprRow.id,
    userId: gdprRow.user_id,
    scope: gdprRow.scope,
    resources: gdprRow.resources_json
      ? JSON.parse(gdprRow.resources_json)
      : null,
  };

  const quorum = await c.env.DB
    .prepare(
      `INSERT INTO admin_quorum_requests
             (action_type, payload, requested_by, reason, required_approvals, expires_at)
       VALUES ('crypto_shredding', ?, ?, ?, 2, datetime('now', '+24 hours'))
       RETURNING id`,
    )
    .bind(
      JSON.stringify(payload),
      `GDPR shred req #${gdprRow.id}: ${gdprRow.reason}`,
      adminId,
    )
    .first<{ id: number }>();

  if (!quorum) throw new APIError("INTERNAL_ERROR", "Quorum insert failed.");

  await c.env.DB
    .prepare(
      `UPDATE gdpr_shred_requests
          SET status = 'in_review',
              quorum_request_id = ?
        WHERE id = ? AND status = 'submitted'`,
    )
    .bind(quorum.id, gdprRow.id)
    .run();

  return c.json(
    {
      ok: true,
      gdprRequestId: gdprRow.id,
      quorumRequestId: quorum.id,
      status: "in_review",
    },
    201,
  );
});
