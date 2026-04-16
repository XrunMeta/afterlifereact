

import { v_101295 } from "./ale";

export type ActorType = "user" | "admin" | "heir" | "system";

export interface AuditActor {
  type: ActorType;
  id: string | number;
}

export interface DecryptionAuditEntry {
  actor: AuditActor;
  op: "decrypt" | "shred" | "emergency" | "rotate" | "chain_verify" | "v2_migrate" | "shred_failed" | "archive_cold" | "hard_delete" | "cold_restore";
  resourceType: string;   
  resourceId: string | number;
  reason: string | null;
  ticketId?: string | null;
}

export async function v_e56fb3(
  v_a1651b,
  v_43fd42,
  v_2b8338,
): Promise<void> {
  const v_ba2215 = await v_a1651b
    .prepare(`SELECT row_hash FROM decryption_audit_log ORDER BY id DESC LIMIT 1`)
    .first<{ row_hash: string }>();
  const v_e9093c = v_ba2215?.row_hash ?? null;

  const v_3a5fef = new Date().toISOString();
  const v_931bf0 = {
    ts: v_3a5fef,
    actor: `${v_2b8338.actor.type}:${v_2b8338.actor.id}`,
    op: v_2b8338.op,
    resource: `${v_2b8338.resourceType}:${v_2b8338.resourceId}`,
  };
  const v_721ef6 = await v_101295(v_e9093c, v_931bf0, v_43fd42);

  await v_a1651b
    .prepare(
      `INSERT INTO decryption_audit_log
         (actor_type, actor_id, ticket_id, op, resource_type, resource_id, reason, prev_hash, row_hash)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      v_2b8338.actor.type,
      String(v_2b8338.actor.id),
      v_2b8338.ticketId ?? null,
      v_2b8338.op,
      v_2b8338.resourceType,
      String(v_2b8338.resourceId),
      v_2b8338.reason,
      v_e9093c,
      v_721ef6,
    )
    .run();
}
