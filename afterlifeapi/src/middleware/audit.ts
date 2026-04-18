import type { Context } from "hono";
import type { AppEnv } from "../lib/env";
import { hmacChain } from "../lib/ale";

export interface AdminAuditEntry {
  adminUserId: number;
  action: string;
  targetType?: string;
  targetId?: string;
  reason?: string;
}

export async function appendAdminAudit(c: Context<AppEnv>, entry: AdminAuditEntry): Promise<void> {
  const db = c.env.DB;
  const prev = await db
    .prepare(`SELECT chain_hash FROM admin_audit_logs ORDER BY id DESC LIMIT 1`)
    .first<{ chain_hash: string }>();
  const prevHash = prev?.chain_hash ?? null;

  const ip = c.req.header("CF-Connecting-IP") ?? c.req.header("X-Forwarded-For") ?? null;
  const ua = c.req.header("User-Agent") ?? null;
  const row = {
    admin_user_id: entry.adminUserId,
    action: entry.action,
    target_type: entry.targetType ?? null,
    target_id: entry.targetId ?? null,
    reason: entry.reason ?? null,
    ip,
    user_agent: ua,
    ts: Date.now(),
  };
  const chainHash = await hmacChain(prevHash, row, c.env.AUDIT_SECRET);

  await db
    .prepare(
      `INSERT INTO admin_audit_logs
         (admin_user_id, action, target_type, target_id, reason, ip, user_agent, prev_hash, chain_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      row.admin_user_id,
      row.action,
      row.target_type,
      row.target_id,
      row.reason,
      row.ip,
      row.user_agent,
      prevHash,
      chainHash,
    )
    .run();
}
