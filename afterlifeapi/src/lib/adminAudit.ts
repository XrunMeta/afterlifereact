

import { v_101295 } from "./ale";

export interface AdminAuditEntry {
  adminUserId: number | null;   
  action: string;               
  targetType?: string | null;
  targetId?: string | null;
  reason?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}

export async function v_1cb5cc(
  v_a1651b,
  v_43fd42,
  v_2b8338,
): Promise<void> {
  const v_ba2215 = await v_a1651b
    .prepare(`SELECT chain_hash FROM admin_audit_logs ORDER BY id DESC LIMIT 1`)
    .first<{ chain_hash: string }>();
  const v_e9093c = v_ba2215?.chain_hash ?? null;

  const v_3a5fef = new Date().toISOString();
  const v_3ac7e7 = {
    ts: v_3a5fef,
    adminUserId: v_2b8338.adminUserId,
    action: v_2b8338.action,
    targetType: v_2b8338.targetType ?? null,
    targetId: v_2b8338.targetId ?? null,
    reason: v_2b8338.reason ?? null,
  };
  const v_7eb351 = await v_101295(v_e9093c, v_3ac7e7, v_43fd42);

  await v_a1651b
    .prepare(
      `INSERT INTO admin_audit_logs
         (admin_user_id, action, target_type, target_id, reason, ip, user_agent, prev_hash, chain_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      v_2b8338.adminUserId,
      v_2b8338.action,
      v_2b8338.targetType ?? null,
      v_2b8338.targetId ?? null,
      v_2b8338.reason ?? null,
      v_2b8338.ip ?? null,
      v_2b8338.userAgent ?? null,
      v_e9093c,
      v_7eb351,
    )
    .run();
}
