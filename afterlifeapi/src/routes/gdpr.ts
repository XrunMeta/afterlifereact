import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_3ebe58 } from "../lib/errors";
import { v_4c95c2, v_1f4ea7 } from "../lib/validate";
import { v_6690d9 } from "../middleware/auth";

export const v_a58945 = new v_b7c41b<v_de0a25>();

const v_fa2de7 = v_1f4ea7.object({
  scope: v_1f4ea7.enum(["user_all", "resources"]),
  resources: v_1f4ea7
    .array(
      v_1f4ea7.object({
        resourceType: v_1f4ea7.string().min(1).max(64),
        resourceId: v_1f4ea7.union([v_1f4ea7.string(), v_1f4ea7.number()]),
      }),
    )
    .max(500)
    .optional(),
  reason: v_1f4ea7.string().min(10).max(1000),
});

v_a58945.post("/shred-request", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId");
  if (!v_43e90c) throw new v_3ebe58("UNAUTHENTICATED", "User identity missing.");
  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_fa2de7);

  if (v_4d33b2.scope === "resources") {
    if (!v_4d33b2.resources || v_4d33b2.resources.length === 0) {
      throw new v_3ebe58(
        "VALIDATION_FAILED",
        "resources required when scope=resources.",
      );
    }
  } else if (v_4d33b2.resources && v_4d33b2.resources.length > 0) {
    throw new v_3ebe58(
      "VALIDATION_FAILED",
      "resources must be empty when scope=user_all.",
    );
  }

  const v_31c067 =
    v_4d33b2.scope === "resources" ? JSON.stringify(v_4d33b2.resources) : null;
  const v_43af15 = await v_3f4e2e.env.DB.prepare(
    `INSERT INTO gdpr_shred_requests (user_id, scope, resources_json, reason)
     VALUES (?, ?, ?, ?)
     RETURNING id, status, submitted_at`,
  )
    .bind(v_43e90c, v_4d33b2.scope, v_31c067, v_4d33b2.reason)
    .first<{ id: number; status: string; submitted_at: string }>();

  return v_3f4e2e.json({ request: v_43af15 }, 202);
});

v_a58945.get("/shred-request", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId");
  if (!v_43e90c) throw new v_3ebe58("UNAUTHENTICATED", "User identity missing.");
  const v_18b8bf = (
    await v_3f4e2e.env.DB.prepare(
      `SELECT id, scope, status, quorum_request_id AS quorumRequestId,
              submitted_at AS submittedAt, executed_at AS executedAt,
              cancelled_at AS cancelledAt, shredded_count AS shreddedCount
         FROM gdpr_shred_requests
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT 50`,
    )
      .bind(v_43e90c)
      .all()
  ).results;
  return v_3f4e2e.json({ requests: v_18b8bf });
});

v_a58945.post("/shred-request/:id/cancel", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId");
  if (!v_43e90c) throw new v_3ebe58("UNAUTHENTICATED", "User identity missing.");
  const v_389afb = Number(v_3f4e2e.req.param("id"));
  if (!Number.isFinite(v_389afb) || v_389afb <= 0)
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid id.");

  const v_3ac7e7 = await v_3f4e2e.env.DB.prepare(
    `SELECT user_id, status FROM gdpr_shred_requests WHERE id = ?`,
  )
    .bind(v_389afb)
    .first<{ user_id: number; status: string }>();
  if (!v_3ac7e7) throw new v_3ebe58("NOT_FOUND", "Request not found.");
  if (v_3ac7e7.user_id !== Number(v_43e90c))
    throw new v_3ebe58("FORBIDDEN", "Not your request.");
  if (v_3ac7e7.status !== "submitted" && v_3ac7e7.status !== "in_review") {
    throw new v_3ebe58(
      "CONFLICT",
      `Cannot cancel request in status=${v_3ac7e7.status}.`,
    );
  }

  const v_b1eff4 = await v_3f4e2e.env.DB.prepare(
    `UPDATE gdpr_shred_requests
        SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP
      WHERE id = ? AND status IN ('submitted', 'in_review')`,
  )
    .bind(v_389afb)
    .run();
  const v_4e2f8b =
    (v_b1eff4 as unknown as { meta?: { changes?: number } }).meta?.changes ?? 0;
  if (v_4e2f8b === 0) throw new v_3ebe58("CONFLICT", "Race: status changed.");

  return v_3f4e2e.json({ ok: true, id: v_389afb, status: "cancelled" });
});
