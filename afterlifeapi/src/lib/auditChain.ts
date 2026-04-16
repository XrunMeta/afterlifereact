

import { hmacChain } from "./ale";

export type ActorType = "user" | "admin" | "heir" | "system";

export interface AuditActor {
  type: ActorType;
  id: string | number;
}

export interface DecryptionAuditEntry {
  actor: AuditActor;
  op: "decrypt" | "shred" | "emergency" | "rotate" | "chain_verify" | "v2_migrate" | "shred_failed";
  resourceType: string;   
  resourceId: string | number;
  reason: string | null;
  ticketId?: string | null;
}

export async function writeDecryptionAudit(
  db: D1Database,
  secret: string,
  entry: DecryptionAuditEntry,
): Promise<void> {
  const prev = await db
    .prepare(`SELECT row_hash FROM decryption_audit_log ORDER BY id DESC LIMIT 1`)
    .first<{ row_hash: string }>();
  const prevHash = prev?.row_hash ?? null;

  const ts = new Date().toISOString();
  const payload = {
    ts,
    actor: `${entry.actor.type}:${entry.actor.id}`,
    op: entry.op,
    resource: `${entry.resourceType}:${entry.resourceId}`,
  };
  const rowHash = await hmacChain(prevHash, payload, secret);

  await db
    .prepare(
      `INSERT INTO decryption_audit_log
         (actor_type, actor_id, ticket_id, op, resource_type, resource_id, reason, prev_hash, row_hash)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      entry.actor.type,
      String(entry.actor.id),
      entry.ticketId ?? null,
      entry.op,
      entry.resourceType,
      String(entry.resourceId),
      entry.reason,
      prevHash,
      rowHash,
    )
    .run();
}
