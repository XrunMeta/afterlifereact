import type { v_437670 } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_101295 } from "../lib/ale";

export interface AdminAuditEntry {
  adminUserId: number;
  action: string;
  targetType?: string;
  targetId?: string;
  reason?: string;
}

export async function v_9aec1c(c: v_437670<v_de0a25>, v_2b8338): Promise<void> {
  const v_a1651b = v_3f4e2e.env.DB;
  const v_ba2215 = await v_a1651b
    .prepare(`SELECT chain_hash FROM admin_audit_logs ORDER BY id DESC LIMIT 1`)
    .first<{ chain_hash: string }>();
  const v_e9093c = v_ba2215?.chain_hash ?? null;

  const v_70cac0 = v_3f4e2e.req.header("CF-Connecting-IP") ?? v_3f4e2e.req.header("X-Forwarded-For") ?? null;
  const v_6c4f39 = v_3f4e2e.req.header("User-Agent") ?? null;
  const v_3ac7e7 = {
    admin_user_id: v_2b8338.adminUserId,
    action: v_2b8338.action,
    target_type: v_2b8338.targetType ?? null,
    target_id: v_2b8338.targetId ?? null,
    reason: v_2b8338.reason ?? null,
    ip: v_70cac0,
    user_agent: v_6c4f39,
    ts: Date.now(),
  };
  const v_7eb351 = await v_101295(v_e9093c, v_3ac7e7, v_3f4e2e.env.AUDIT_SECRET);

  await v_a1651b
    .prepare(
      `INSERT INTO admin_audit_logs
         (admin_user_id, action, target_type, target_id, reason, ip, user_agent, prev_hash, chain_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      v_3ac7e7.admin_user_id,
      v_3ac7e7.action,
      v_3ac7e7.target_type,
      v_3ac7e7.target_id,
      v_3ac7e7.reason,
      v_3ac7e7.ip,
      v_3ac7e7.user_agent,
      v_e9093c,
      v_7eb351,
    )
    .run();
}
