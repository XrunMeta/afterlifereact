

import { hmacChain } from "./ale";

export interface AdminAuditEntry {
  adminUserId: number | null;   
  action: string;               
  targetType?: string | null;
  targetId?: string | null;
  reason?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}

export async function writeAdminAudit(
  db: D1Database,
  secret: string,
  entry: AdminAuditEntry,
): Promise<void> {
  const prev = await db
    .prepare(`SELECT chain_hash FROM admin_audit_logs ORDER BY id DESC LIMIT 1`)
    .first<{ chain_hash: string }>();
  const prevHash = prev?.chain_hash ?? null;

  const ts = new Date().toISOString();
  const row = {
    ts,
    adminUserId: entry.adminUserId,
    action: entry.action,
    targetType: entry.targetType ?? null,
    targetId: entry.targetId ?? null,
    reason: entry.reason ?? null,
  };
  const chainHash = await hmacChain(prevHash, row, secret);

  await db
    .prepare(
      `INSERT INTO admin_audit_logs
         (admin_user_id, action, target_type, target_id, reason, ip, user_agent, prev_hash, chain_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      entry.adminUserId,
      entry.action,
      entry.targetType ?? null,
      entry.targetId ?? null,
      entry.reason ?? null,
      entry.ip ?? null,
      entry.userAgent ?? null,
      prevHash,
      chainHash,
    )
    .run();
}
