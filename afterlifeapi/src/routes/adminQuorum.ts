

import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_3ebe58 } from "../lib/errors";
import { v_4c95c2, v_1f4ea7 } from "../lib/validate";
import { v_b09138 } from "../middleware/auth";
import { v_1cb5cc } from "../lib/adminAudit";
import { v_0dd6a5 } from "./adminAuth";
import {
  v_8bb5d2,
  v_ffdbc6,
} from "../lib/kekProvider";

export const v_83c76b = new v_b7c41b<v_de0a25>();
v_83c76b.use("*", v_b09138);

const v_aeaf72 = 24;
const v_5af641 = [
  "celeb_ip_transfer",     
  "force_hard_delete",     
  "admin_role_change",     
  "crypto_shredding",      
  "kek_rotate",            
] as const;
type AllowedAction = (typeof v_5af641)[number];

interface RequestRow {
  id: number;
  action_type: AllowedAction;
  payload: string;
  requested_by: number;
  reason: string;
  required_approvals: number;
  status: "pending" | "approved" | "executed" | "rejected" | "expired";
  expires_at: string;
  executed_at: string | null;
  rejected_at: string | null;
  reject_reason: string | null;
  execution_result: string | null;
  created_at: string;
}

async function v_23d699(
  v_a1651b,
  v_309144,
): Promise<RequestRow> {
  if (v_309144.status !== "pending") return v_309144;
  if (new Date(v_309144.expires_at) > new Date()) return v_309144;
  await v_a1651b
    .prepare(
      `UPDATE admin_quorum_requests
          SET status = 'expired', updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND status = 'pending'`,
    )
    .bind(v_309144.id)
    .run();
  return { ...v_309144, status: "expired" };
}

async function v_4925d7(v_a1651b, v_389afb): Promise<RequestRow> {
  const v_3ac7e7 = await v_a1651b
    .prepare(`SELECT * FROM admin_quorum_requests WHERE id = ?`)
    .bind(v_389afb)
    .first<RequestRow>();
  if (!v_3ac7e7) throw new v_3ebe58("NOT_FOUND", "Request not found.");
  return v_3ac7e7;
}

const v_722b6d = v_1f4ea7.object({
  actionType: v_1f4ea7.enum(v_5af641),
  payload: v_1f4ea7.record(v_1f4ea7.string(), v_1f4ea7.unknown()),
  reason: v_1f4ea7.string().min(10).max(500),
  requiredApprovals: v_1f4ea7.number().int().min(1).max(10).optional(),
});

v_83c76b.post("/requests", async (v_3f4e2e) => {
  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_722b6d);
  const v_db9be1 = v_3f4e2e.get("adminUserId")!;
  const v_925940 = v_4d33b2.requiredApprovals ?? 2;
  const v_ed6640 = JSON.stringify(v_4d33b2.payload);

  const v_8f00b9 = await v_3f4e2e.env.DB.prepare(
    `INSERT INTO admin_quorum_requests
       (action_type, payload, requested_by, reason, required_approvals, expires_at)
       VALUES (?, ?, ?, ?, ?, datetime('now', '+${v_aeaf72} hours'))`,
  )
    .bind(v_4d33b2.actionType, v_ed6640, v_db9be1, v_4d33b2.reason, v_925940)
    .run();

  const v_389afb = Number(v_8f00b9.meta.last_row_id);
  const v_ab4c96 = v_0dd6a5(v_3f4e2e);
  await v_1cb5cc(v_3f4e2e.env.DB, v_3f4e2e.env.AUDIT_SECRET, {
    adminUserId: v_db9be1,
    action: "quorum.request.create",
    targetType: "quorum_request",
    targetId: String(v_389afb),
    reason: `${v_4d33b2.actionType}: ${v_4d33b2.reason}`,
    ip: v_ab4c96.ip,
    userAgent: v_ab4c96.userAgent,
  });

  const v_309144 = await v_4925d7(v_3f4e2e.env.DB, v_389afb);
  return v_3f4e2e.json({ request: v_1d33a9(v_309144, []) }, 201);
});

v_83c76b.get("/requests", async (v_3f4e2e) => {
  const v_d308b5 = v_3f4e2e.req.query("status");
  const v_02be30 = Math.min(Number(v_3f4e2e.req.query("limit") ?? 50), 200);

  await v_3f4e2e.env.DB.prepare(
    `UPDATE admin_quorum_requests
        SET status = 'expired', updated_at = CURRENT_TIMESTAMP
      WHERE status = 'pending' AND expires_at <= CURRENT_TIMESTAMP`,
  ).run();

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
        `SELECT * FROM admin_quorum_requests ${v_8b4d7e}
           ORDER BY id DESC LIMIT ?`,
      )
      .bind(...v_925171, v_02be30)
      .all<RequestRow>()
  ).results;

  return v_3f4e2e.json({ requests: v_18b8bf.map((v_cb35cb) => v_1d33a9(v_cb35cb, [])) });
});

v_83c76b.get("/requests/:id", async (v_3f4e2e) => {
  const v_389afb = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_389afb) || v_389afb <= 0) throw new v_3ebe58("NOT_FOUND", "Request not found.");
  let v_309144 = await v_4925d7(v_3f4e2e.env.DB, v_389afb);
  v_309144 = await v_23d699(v_3f4e2e.env.DB, v_309144);

  const v_e34a18 = (
    await v_3f4e2e.env.DB
      .prepare(
        `SELECT id, admin_user_id, decision, comment, created_at
           FROM admin_quorum_approvals WHERE request_id = ? ORDER BY id ASC`,
      )
      .bind(v_389afb)
      .all<{
        id: number;
        admin_user_id: number;
        decision: "approve" | "reject";
        comment: string | null;
        created_at: string;
      }>()
  ).results;

  return v_3f4e2e.json({ request: v_1d33a9(v_309144, v_e34a18) });
});

const v_1cec39 = v_1f4ea7.object({
  decision: v_1f4ea7.enum(["approve", "reject"]),
  comment: v_1f4ea7.string().max(500).optional(),
});

v_83c76b.post("/requests/:id/decisions", async (v_3f4e2e) => {
  const v_389afb = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_389afb) || v_389afb <= 0) throw new v_3ebe58("NOT_FOUND", "Request not found.");
  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_1cec39);
  const v_db9be1 = v_3f4e2e.get("adminUserId")!;

  let v_309144 = await v_4925d7(v_3f4e2e.env.DB, v_389afb);
  v_309144 = await v_23d699(v_3f4e2e.env.DB, v_309144);
  if (v_309144.status !== "pending") {
    throw new v_3ebe58("CONFLICT", `Request is ${v_309144.status}.`);
  }
  if (v_309144.requested_by === v_db9be1) {
    throw new v_3ebe58("FORBIDDEN", "Requester cannot vote on own request.");
  }

  try {
    await v_3f4e2e.env.DB.prepare(
      `INSERT INTO admin_quorum_approvals
         (request_id, admin_user_id, decision, comment) VALUES (?, ?, ?, ?)`,
    )
      .bind(v_389afb, v_db9be1, v_4d33b2.decision, v_4d33b2.comment ?? null)
      .run();
  } catch (v_49263d) {
    const v_badeaf = (v_49263d as Error).message ?? "";
    if (/UNIQUE|constraint/i.test(v_badeaf)) {
      throw new v_3ebe58("CONFLICT", "Already voted on this request.");
    }
    throw v_49263d;
  }

  const v_5605dd = await v_3f4e2e.env.DB.prepare(
    `SELECT
        SUM(CASE WHEN decision='approve' THEN 1 ELSE 0 END) AS approves,
        SUM(CASE WHEN decision='reject'  THEN 1 ELSE 0 END) AS rejects
       FROM admin_quorum_approvals WHERE request_id = ?`,
  )
    .bind(v_389afb)
    .first<{ approves: number | null; rejects: number | null }>();
  const v_b6042b = v_5605dd?.approves ?? 0;
  const v_3efb47 = v_5605dd?.rejects ?? 0;

  let v_8bdb7e = v_309144.status;
  if (v_3efb47 > 0) {
    await v_3f4e2e.env.DB.prepare(
      `UPDATE admin_quorum_requests
          SET status='rejected', rejected_at=CURRENT_TIMESTAMP,
              reject_reason=?, updated_at=CURRENT_TIMESTAMP
        WHERE id=? AND status='pending'`,
    )
      .bind(v_4d33b2.comment ?? null, v_389afb)
      .run();
    v_8bdb7e = "rejected";
  } else if (v_b6042b >= v_309144.required_approvals) {
    await v_3f4e2e.env.DB.prepare(
      `UPDATE admin_quorum_requests
          SET status='approved', updated_at=CURRENT_TIMESTAMP
        WHERE id=? AND status='pending'`,
    )
      .bind(v_389afb)
      .run();
    v_8bdb7e = "approved";
  }

  const v_ab4c96 = v_0dd6a5(v_3f4e2e);
  await v_1cb5cc(v_3f4e2e.env.DB, v_3f4e2e.env.AUDIT_SECRET, {
    adminUserId: v_db9be1,
    action: `quorum.decision.${v_4d33b2.decision}`,
    targetType: "quorum_request",
    targetId: String(v_389afb),
    reason: v_4d33b2.comment ?? null,
    ip: v_ab4c96.ip,
    userAgent: v_ab4c96.userAgent,
  });

  return v_3f4e2e.json({
    ok: true,
    requestId: v_389afb,
    decision: v_4d33b2.decision,
    approves: v_b6042b,
    rejects: v_3efb47,
    status: v_8bdb7e,
  });
});

v_83c76b.post("/requests/:id/execute", async (v_3f4e2e) => {
  const v_389afb = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_389afb) || v_389afb <= 0) throw new v_3ebe58("NOT_FOUND", "Request not found.");
  const v_db9be1 = v_3f4e2e.get("adminUserId")!;

  let v_309144 = await v_4925d7(v_3f4e2e.env.DB, v_389afb);
  v_309144 = await v_23d699(v_3f4e2e.env.DB, v_309144);
  if (v_309144.requested_by !== v_db9be1) {
    throw new v_3ebe58("FORBIDDEN", "Only the requester can execute.");
  }
  if (v_309144.status !== "approved") {
    throw new v_3ebe58("CONFLICT", `Request is ${v_309144.status}, not approved.`);
  }

  let v_43c42e;
  try {
    v_43c42e = await v_bfc0e5(
      v_3f4e2e.env.DB,
      v_3f4e2e.env.MASTER_ROOT,
      v_309144.action_type,
      v_063096(v_309144.payload),
    );
  } catch (v_49263d) {

    const v_ab4c96 = v_0dd6a5(v_3f4e2e);
    await v_1cb5cc(v_3f4e2e.env.DB, v_3f4e2e.env.AUDIT_SECRET, {
      adminUserId: v_db9be1,
      action: "quorum.execute.failed",
      targetType: "quorum_request",
      targetId: String(v_389afb),
      reason: `${v_309144.action_type}: ${(v_49263d as Error).message ?? "unknown"}`,
      ip: v_ab4c96.ip,
      userAgent: v_ab4c96.userAgent,
    });
    throw v_49263d;
  }
  await v_3f4e2e.env.DB.prepare(
    `UPDATE admin_quorum_requests
        SET status='executed',
            executed_at=CURRENT_TIMESTAMP,
            execution_result=?,
            updated_at=CURRENT_TIMESTAMP
      WHERE id=? AND status='approved'`,
  )
    .bind(JSON.stringify(v_43c42e), v_389afb)
    .run();

  const v_ab4c96 = v_0dd6a5(v_3f4e2e);
  await v_1cb5cc(v_3f4e2e.env.DB, v_3f4e2e.env.AUDIT_SECRET, {
    adminUserId: v_db9be1,
    action: "quorum.execute",
    targetType: "quorum_request",
    targetId: String(v_389afb),
    reason: v_309144.action_type,
    ip: v_ab4c96.ip,
    userAgent: v_ab4c96.userAgent,
  });

  return v_3f4e2e.json({ ok: true, requestId: v_389afb, status: "executed", result: v_43c42e });
});

function v_1d33a9(
  v_cb35cb,
  v_e34a18,
) {
  return {
    id: v_cb35cb.id,
    actionType: v_cb35cb.action_type,
    payload: v_063096(v_cb35cb.payload),
    requestedBy: v_cb35cb.requested_by,
    reason: v_cb35cb.reason,
    requiredApprovals: v_cb35cb.required_approvals,
    status: v_cb35cb.status,
    expiresAt: v_cb35cb.expires_at,
    executedAt: v_cb35cb.executed_at,
    rejectedAt: v_cb35cb.rejected_at,
    rejectReason: v_cb35cb.reject_reason,
    executionResult: v_cb35cb.execution_result ? v_063096(v_cb35cb.execution_result) : null,
    createdAt: v_cb35cb.created_at,
    approvals: v_e34a18.map((v_779914) => ({
      id: v_779914.id,
      adminUserId: v_779914.admin_user_id,
      decision: v_779914.decision,
      comment: v_779914.comment,
      createdAt: v_779914.created_at,
    })),
  };
}

async function v_bfc0e5(
  v_a1651b,
  v_e6465d,
  v_5e5d85,
  v_931bf0,
): Promise<unknown> {
  switch (v_5e5d85) {
    case "kek_rotate": {
      return await v_f8c0fd(v_a1651b, v_e6465d);
    }
    case "celeb_ip_transfer":
    case "force_hard_delete":
    case "admin_role_change":
    case "crypto_shredding":

      return { handler: "pending_handler", note: `${v_5e5d85} not yet implemented` };
    default: {
      const v_84b499 = v_5e5d85;
      throw new v_3ebe58("INTERNAL_ERROR", `Unknown action: ${v_84b499}`);
    }
  }
}

async function v_f8c0fd(
  v_a1651b,
  v_e6465d,
): Promise<{ kekId: string; version: number; previousActive: string | null }> {
  const { encryptedKek: v_8f246d } = v_8bb5d2(v_e6465d);

  const v_750665 = await v_a1651b
    .prepare(`SELECT COALESCE(MAX(version), 0) AS v FROM encryption_keys`)
    .first<{ v: number }>();
  const v_01c751 = (v_750665?.v ?? 0) + 1;
  const v_8cf32f = `kek_v${v_01c751}`;

  const v_ba2215 = await v_a1651b
    .prepare(`SELECT kek_id FROM encryption_keys WHERE status = 'active' LIMIT 1`)
    .first<{ kek_id: string }>();

  await v_a1651b.batch([
    v_a1651b.prepare(
      `UPDATE encryption_keys SET status = 'retired', rotated_at = CURRENT_TIMESTAMP
         WHERE status = 'active'`,
    ),
    v_a1651b
      .prepare(
        `INSERT INTO encryption_keys(kek_id, version, encrypted_kek, status)
           VALUES (?, ?, ?, 'active')`,
      )
      .bind(v_8cf32f, v_01c751, v_8f246d),
  ]);

  v_ffdbc6();
  return {
    kekId: v_8cf32f,
    version: v_01c751,
    previousActive: v_ba2215?.kek_id ?? null,
  };
}

function v_063096(v_fd5f43): unknown {
  try {
    return JSON.parse(v_fd5f43);
  } catch {
    return v_fd5f43;
  }
}
