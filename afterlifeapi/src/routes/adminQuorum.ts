

import { Hono } from "hono";
import type { AppEnv } from "../lib/env";
import { APIError } from "../lib/errors";
import { parseJson, z } from "../lib/validate";
import { requireSuperAdmin } from "../middleware/auth";
import { writeAdminAudit } from "../lib/adminAudit";
import { clientMeta } from "./adminAuth";
import {
  generateKekAndWrap,
  invalidateKekCache,
} from "../lib/kekProvider";
import { shredV3 } from "../lib/ale";
import { writeDecryptionAudit } from "../lib/auditChain";

export const adminQuorum = new Hono<AppEnv>();
adminQuorum.use("*", requireSuperAdmin);

const TTL_HOURS = 24;
const ALLOWED_ACTIONS = [
  "celeb_ip_transfer",     
  "force_hard_delete",     
  "admin_role_change",     
  "crypto_shredding",      
  "kek_rotate",            
] as const;
type AllowedAction = (typeof ALLOWED_ACTIONS)[number];

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

async function expireIfNeeded(
  db: D1Database,
  req: RequestRow,
): Promise<RequestRow> {
  if (req.status !== "pending") return req;
  if (new Date(req.expires_at) > new Date()) return req;
  await db
    .prepare(
      `UPDATE admin_quorum_requests
          SET status = 'expired', updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND status = 'pending'`,
    )
    .bind(req.id)
    .run();
  return { ...req, status: "expired" };
}

async function loadRequest(db: D1Database, id: number): Promise<RequestRow> {
  const row = await db
    .prepare(`SELECT * FROM admin_quorum_requests WHERE id = ?`)
    .bind(id)
    .first<RequestRow>();
  if (!row) throw new APIError("NOT_FOUND", "Request not found.");
  return row;
}

const createSchema = z.object({
  actionType: z.enum(ALLOWED_ACTIONS),
  payload: z.record(z.string(), z.unknown()),
  reason: z.string().min(10).max(500),
  requiredApprovals: z.number().int().min(1).max(10).optional(),
});

adminQuorum.post("/requests", async (c) => {
  const body = await parseJson(c, createSchema);
  const adminId = c.get("adminUserId")!;
  const required = body.requiredApprovals ?? 2;
  const payloadJson = JSON.stringify(body.payload);

  const res = await c.env.DB.prepare(
    `INSERT INTO admin_quorum_requests
       (action_type, payload, requested_by, reason, required_approvals, expires_at)
       VALUES (?, ?, ?, ?, ?, datetime('now', '+${TTL_HOURS} hours'))`,
  )
    .bind(body.actionType, payloadJson, adminId, body.reason, required)
    .run();

  const id = Number(res.meta.last_row_id);
  const meta = clientMeta(c);
  await writeAdminAudit(c.env.DB, c.env.AUDIT_SECRET, {
    adminUserId: adminId,
    action: "quorum.request.create",
    targetType: "quorum_request",
    targetId: String(id),
    reason: `${body.actionType}: ${body.reason}`,
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  const req = await loadRequest(c.env.DB, id);
  return c.json({ request: serializeRequest(req, []) }, 201);
});

adminQuorum.get("/requests", async (c) => {
  const status = c.req.query("status");
  const limit = Math.min(Number(c.req.query("limit") ?? 50), 200);

  await c.env.DB.prepare(
    `UPDATE admin_quorum_requests
        SET status = 'expired', updated_at = CURRENT_TIMESTAMP
      WHERE status = 'pending' AND expires_at <= CURRENT_TIMESTAMP`,
  ).run();

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
        `SELECT * FROM admin_quorum_requests ${whereSql}
           ORDER BY id DESC LIMIT ?`,
      )
      .bind(...binds, limit)
      .all<RequestRow>()
  ).results;

  return c.json({ requests: rows.map((r) => serializeRequest(r, [])) });
});

adminQuorum.get("/requests/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) throw new APIError("NOT_FOUND", "Request not found.");
  let req = await loadRequest(c.env.DB, id);
  req = await expireIfNeeded(c.env.DB, req);

  const approvals = (
    await c.env.DB
      .prepare(
        `SELECT id, admin_user_id, decision, comment, created_at
           FROM admin_quorum_approvals WHERE request_id = ? ORDER BY id ASC`,
      )
      .bind(id)
      .all<{
        id: number;
        admin_user_id: number;
        decision: "approve" | "reject";
        comment: string | null;
        created_at: string;
      }>()
  ).results;

  return c.json({ request: serializeRequest(req, approvals) });
});

const decisionSchema = z.object({
  decision: z.enum(["approve", "reject"]),
  comment: z.string().max(500).optional(),
});

adminQuorum.post("/requests/:id/decisions", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) throw new APIError("NOT_FOUND", "Request not found.");
  const body = await parseJson(c, decisionSchema);
  const adminId = c.get("adminUserId")!;

  let req = await loadRequest(c.env.DB, id);
  req = await expireIfNeeded(c.env.DB, req);
  if (req.status !== "pending") {
    throw new APIError("CONFLICT", `Request is ${req.status}.`);
  }
  if (req.requested_by === adminId) {
    throw new APIError("FORBIDDEN", "Requester cannot vote on own request.");
  }

  try {
    await c.env.DB.prepare(
      `INSERT INTO admin_quorum_approvals
         (request_id, admin_user_id, decision, comment) VALUES (?, ?, ?, ?)`,
    )
      .bind(id, adminId, body.decision, body.comment ?? null)
      .run();
  } catch (err) {
    const msg = (err as Error).message ?? "";
    if (/UNIQUE|constraint/i.test(msg)) {
      throw new APIError("CONFLICT", "Already voted on this request.");
    }
    throw err;
  }

  const tally = await c.env.DB.prepare(
    `SELECT
        SUM(CASE WHEN decision='approve' THEN 1 ELSE 0 END) AS approves,
        SUM(CASE WHEN decision='reject'  THEN 1 ELSE 0 END) AS rejects
       FROM admin_quorum_approvals WHERE request_id = ?`,
  )
    .bind(id)
    .first<{ approves: number | null; rejects: number | null }>();
  const approves = tally?.approves ?? 0;
  const rejects = tally?.rejects ?? 0;

  let nextStatus: RequestRow["status"] = req.status;
  if (rejects > 0) {
    await c.env.DB.prepare(
      `UPDATE admin_quorum_requests
          SET status='rejected', rejected_at=CURRENT_TIMESTAMP,
              reject_reason=?, updated_at=CURRENT_TIMESTAMP
        WHERE id=? AND status='pending'`,
    )
      .bind(body.comment ?? null, id)
      .run();
    nextStatus = "rejected";
  } else if (approves >= req.required_approvals) {
    await c.env.DB.prepare(
      `UPDATE admin_quorum_requests
          SET status='approved', updated_at=CURRENT_TIMESTAMP
        WHERE id=? AND status='pending'`,
    )
      .bind(id)
      .run();
    nextStatus = "approved";
  }

  const meta = clientMeta(c);
  await writeAdminAudit(c.env.DB, c.env.AUDIT_SECRET, {
    adminUserId: adminId,
    action: `quorum.decision.${body.decision}`,
    targetType: "quorum_request",
    targetId: String(id),
    reason: body.comment ?? null,
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  return c.json({
    ok: true,
    requestId: id,
    decision: body.decision,
    approves,
    rejects,
    status: nextStatus,
  });
});

adminQuorum.post("/requests/:id/execute", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) throw new APIError("NOT_FOUND", "Request not found.");
  const adminId = c.get("adminUserId")!;

  let req = await loadRequest(c.env.DB, id);
  req = await expireIfNeeded(c.env.DB, req);
  if (req.requested_by !== adminId) {
    throw new APIError("FORBIDDEN", "Only the requester can execute.");
  }
  if (req.status !== "approved") {
    throw new APIError("CONFLICT", `Request is ${req.status}, not approved.`);
  }

  let result: unknown;
  try {
    result = await executeAction(
      c.env.DB,
      c.env.MASTER_ROOT,
      req.action_type,
      safeParse(req.payload),
      c.env.AUDIT_SECRET,
      adminId,
    );
  } catch (err) {

    try {
      const meta = clientMeta(c);
      await writeAdminAudit(c.env.DB, c.env.AUDIT_SECRET, {
        adminUserId: adminId,
        action: "quorum.execute.failed",
        targetType: "quorum_request",
        targetId: String(id),
        reason: `${req.action_type}: ${(err as Error).message ?? "unknown"}`,
        ip: meta.ip,
        userAgent: meta.userAgent,
      });
    } catch (auditErr) {
      console.error("[quorum] audit write failed while handling execute error:", auditErr);
    }
    throw err;
  }
  await c.env.DB.prepare(
    `UPDATE admin_quorum_requests
        SET status='executed',
            executed_at=CURRENT_TIMESTAMP,
            execution_result=?,
            updated_at=CURRENT_TIMESTAMP
      WHERE id=? AND status='approved'`,
  )
    .bind(JSON.stringify(result), id)
    .run();

  const meta = clientMeta(c);
  await writeAdminAudit(c.env.DB, c.env.AUDIT_SECRET, {
    adminUserId: adminId,
    action: "quorum.execute",
    targetType: "quorum_request",
    targetId: String(id),
    reason: req.action_type,
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  return c.json({ ok: true, requestId: id, status: "executed", result });
});

function serializeRequest(
  r: RequestRow,
  approvals: Array<{
    id: number;
    admin_user_id: number;
    decision: "approve" | "reject";
    comment: string | null;
    created_at: string;
  }>,
) {
  return {
    id: r.id,
    actionType: r.action_type,
    payload: safeParse(r.payload),
    requestedBy: r.requested_by,
    reason: r.reason,
    requiredApprovals: r.required_approvals,
    status: r.status,
    expiresAt: r.expires_at,
    executedAt: r.executed_at,
    rejectedAt: r.rejected_at,
    rejectReason: r.reject_reason,
    executionResult: r.execution_result ? safeParse(r.execution_result) : null,
    createdAt: r.created_at,
    approvals: approvals.map((a) => ({
      id: a.id,
      adminUserId: a.admin_user_id,
      decision: a.decision,
      comment: a.comment,
      createdAt: a.created_at,
    })),
  };
}

async function executeAction(
  db: D1Database,
  masterRoot: string,
  actionType: AllowedAction,
  payload: unknown,
  auditSecret: string,
  requesterId: string | number,
): Promise<unknown> {
  switch (actionType) {
    case "kek_rotate": {
      return await executeKekRotate(db, masterRoot);
    }
    case "celeb_ip_transfer":
    case "force_hard_delete":
    case "admin_role_change":

      return { handler: "pending_handler", note: `${actionType} not yet implemented` };
    case "crypto_shredding": {

      const p = (payload ?? {}) as {
        gdprRequestId?: number;
        userId?: number;
        scope?: "user_all" | "resources";
        resources?: Array<{ resourceType: string; resourceId: string | number }>;
      };
      if (!p.gdprRequestId || !p.userId || !p.scope) {
        throw new APIError("VALIDATION_FAILED", "crypto_shredding payload missing required fields.");
      }

      const targets: { resourceType: string; resourceId: string }[] = [];
      if (p.scope === "user_all") {
        targets.push({ resourceType: "user", resourceId: String(p.userId) });
        const clones = await db
          .prepare(`SELECT id FROM clones WHERE created_by=? LIMIT 500`)
          .bind(p.userId).all();
        for (const cl of clones.results as Array<{ id: number }>) {
          targets.push({ resourceType: "clone", resourceId: String(cl.id) });
        }
        const messages = await db
          .prepare(`SELECT id FROM messages WHERE sender_id=? LIMIT 500`)
          .bind(p.userId).all();
        for (const m of messages.results as Array<{ id: number }>) {
          targets.push({ resourceType: "message", resourceId: String(m.id) });
        }
      } else {
        if (!p.resources || p.resources.length === 0) {
          throw new APIError("VALIDATION_FAILED", "resources required when scope=resources.");
        }
        for (const r of p.resources) {
          targets.push({ resourceType: r.resourceType, resourceId: String(r.resourceId) });
        }
      }

      if (targets.length > 500) {
        throw new APIError("QUOTA_EXCEEDED", "target count exceeds 500 — async queue required");
      }

      let count = 0;
      for (const t of targets) {
        const regs = (
          await db
            .prepare(
              `SELECT dek_id FROM dek_registry
                WHERE resource_type=? AND resource_id=? AND shredded_at IS NULL`,
            )
            .bind(t.resourceType, t.resourceId)
            .all()
        ).results as Array<{ dek_id: string }>;
        for (const r of regs) {
          try {
            await shredV3(db, r.dek_id);
            try {
              await writeDecryptionAudit(db, auditSecret, {
                actor: { type: "admin", id: String(requesterId) },
                op: "shred",
                resourceType: t.resourceType,
                resourceId: t.resourceId,
                reason: `gdpr_req=${p.gdprRequestId}`,
              });
            } catch {  }
            count++;
          } catch (err) {
            try {
              await writeDecryptionAudit(db, auditSecret, {
                actor: { type: "admin", id: String(requesterId) },
                op: "shred_failed",
                resourceType: t.resourceType,
                resourceId: t.resourceId,
                reason: `gdpr_req=${p.gdprRequestId}: ${(err as Error).message}`,
              });
            } catch {  }
          }
        }
      }

      const upd = await db
        .prepare(
          `UPDATE gdpr_shred_requests
              SET status='executed', executed_at=CURRENT_TIMESTAMP, shredded_count=?
            WHERE id=? AND status='in_review'`,
        )
        .bind(count, p.gdprRequestId)
        .run();
      const changes = (upd as unknown as { meta?: { changes?: number } }).meta?.changes ?? 0;
      if (changes === 0) {
        throw new APIError("CONFLICT", `gdpr_shred_requests #${p.gdprRequestId} not in_review — status changed concurrently`);
      }

      return { shreddedCount: count, totalTargets: targets.length, gdprRequestId: p.gdprRequestId };
    }
    default: {
      const _exhaustive: never = actionType;
      throw new APIError("INTERNAL_ERROR", `Unknown action: ${_exhaustive}`);
    }
  }
}

async function executeKekRotate(
  db: D1Database,
  masterRoot: string,
): Promise<{ kekId: string; version: number; previousActive: string | null }> {
  const { encryptedKek } = generateKekAndWrap(masterRoot);

  const maxRow = await db
    .prepare(`SELECT COALESCE(MAX(version), 0) AS v FROM encryption_keys`)
    .first<{ v: number }>();
  const nextVersion = (maxRow?.v ?? 0) + 1;
  const newKid = `kek_v${nextVersion}`;

  const prev = await db
    .prepare(`SELECT kek_id FROM encryption_keys WHERE status = 'active' LIMIT 1`)
    .first<{ kek_id: string }>();

  await db.batch([
    db.prepare(
      `UPDATE encryption_keys SET status = 'retired', rotated_at = CURRENT_TIMESTAMP
         WHERE status = 'active'`,
    ),
    db
      .prepare(
        `INSERT INTO encryption_keys(kek_id, version, encrypted_kek, status)
           VALUES (?, ?, ?, 'active')`,
      )
      .bind(newKid, nextVersion, encryptedKek),
  ]);

  invalidateKekCache();
  return {
    kekId: newKid,
    version: nextVersion,
    previousActive: prev?.kek_id ?? null,
  };
}

function safeParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}
