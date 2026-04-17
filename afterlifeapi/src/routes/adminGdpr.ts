

import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_3ebe58 } from "../lib/errors";
import { v_c0a297, v_b09138 } from "../middleware/auth";

export const v_87e8b2 = new v_b7c41b<v_de0a25>();

v_87e8b2.get("/requests", v_c0a297, async (v_3f4e2e) => {
  const v_d308b5 = v_3f4e2e.req.query("status");
  const v_02be30 = Math.min(Number(v_3f4e2e.req.query("limit") ?? 50), 200);

  const v_abcc8d = [];
  const v_925171 = [];
  if (v_d308b5) {
    v_abcc8d.push("status = ?");
    v_925171.push(v_d308b5);
  }
  const v_8b4d7e = v_abcc8d.length ? `WHERE ${v_abcc8d.join(" AND ")}` : "";

  const v_18b8bf = (
    await v_3f4e2e.env.DB
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
          ${v_8b4d7e}
          ORDER BY id DESC
          LIMIT ?`,
      )
      .bind(...v_925171, v_02be30)
      .all()
  ).results;

  return v_3f4e2e.json({ requests: v_18b8bf });
});

v_87e8b2.post("/requests/:id/quorum", v_b09138, async (v_3f4e2e) => {
  const v_db9be1 = v_3f4e2e.get("adminUserId");
  if (!v_db9be1) throw new v_3ebe58("UNAUTHENTICATED", "Admin identity missing.");

  const v_389afb = Number(v_3f4e2e.req.param("id"));
  if (!Number.isFinite(v_389afb) || v_389afb <= 0)
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid id.");

  const v_df4480 = await v_3f4e2e.env.DB
    .prepare(
      `SELECT id, user_id, scope, resources_json, reason, status, quorum_request_id
         FROM gdpr_shred_requests
        WHERE id = ?`,
    )
    .bind(v_389afb)
    .first<{
      id: number;
      user_id: number;
      scope: string;
      resources_json: string | null;
      reason: string;
      status: string;
      quorum_request_id: number | null;
    }>();

  if (!v_df4480) throw new v_3ebe58("NOT_FOUND", "GDPR request not found.");
  if (v_df4480.status !== "submitted") {
    throw new v_3ebe58(
      "CONFLICT",
      `Cannot promote request in status=${v_df4480.status}.`,
    );
  }

  const v_931bf0 = {
    gdprRequestId: v_df4480.id,
    userId: v_df4480.user_id,
    scope: v_df4480.scope,
    resources: v_df4480.resources_json
      ? JSON.parse(v_df4480.resources_json)
      : null,
  };

  const v_f84f6a = await v_3f4e2e.env.DB
    .prepare(
      `INSERT INTO admin_quorum_requests
             (action_type, payload, requested_by, reason, required_approvals, expires_at)
       VALUES ('crypto_shredding', ?, ?, ?, 2, datetime('now', '+24 hours'))
       RETURNING id`,
    )
    .bind(
      JSON.stringify(v_931bf0),
      v_db9be1,
      `GDPR shred req #${v_df4480.id}: ${v_df4480.reason}`,
    )
    .first<{ id: number }>();

  if (!v_f84f6a) throw new v_3ebe58("INTERNAL_ERROR", "Quorum insert failed.");

  await v_3f4e2e.env.DB
    .prepare(
      `UPDATE gdpr_shred_requests
          SET status = 'in_review',
              quorum_request_id = ?
        WHERE id = ? AND status = 'submitted'`,
    )
    .bind(v_f84f6a.id, v_df4480.id)
    .run();

  return v_3f4e2e.json(
    {
      ok: true,
      gdprRequestId: v_df4480.id,
      quorumRequestId: v_f84f6a.id,
      status: "in_review",
    },
    201,
  );
});
