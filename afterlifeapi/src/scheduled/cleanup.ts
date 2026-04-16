

import type { AppEnv } from "../lib/env";
import { buildSnapshotFromDb, putSnapshot, COLD_TARGET_COLUMNS, type ColdType } from "../lib/coldStorage";
import { writeDecryptionAudit } from "../lib/auditChain";

export interface CleanupResult {
  orphansFound: number;
  orphansSoftDeleted: number;
  expiredInvitesPurged: number;
  usersAdvancedToCold: number;
  clonesAdvancedToCold: number;
  messagesAdvancedToCold: number;
  usersHardDeleted: number;
  clonesHardDeleted: number;
  messagesHardDeleted: number;
  inactivityContactsTriggered: number;
  coownerRemindersScheduled: number;
}

export async function runCleanup(env: AppEnv["Bindings"]): Promise<CleanupResult> {
  const db = env.DB;

  const orphans = (
    await db
      .prepare(
        `SELECT c.id FROM clones c
           LEFT JOIN clone_shares s ON s.clone_id = c.id
          WHERE c.deleted_at IS NULL
            AND s.id IS NULL
            AND c.created_at < datetime('now', '-5 minutes')
          LIMIT 100`,
      )
      .all<{ id: number }>()
  ).results;

  let orphansSoftDeleted = 0;
  if (orphans.length > 0) {
    const ids = orphans.map((r) => r.id);
    const placeholders = ids.map(() => "?").join(",");
    const res = await db
      .prepare(
        `UPDATE clones SET deleted_at = CURRENT_TIMESTAMP,
                           deletion_state = 'soft_deleted',
                           soft_deleted_at = CURRENT_TIMESTAMP
          WHERE id IN (${placeholders}) AND deleted_at IS NULL`,
      )
      .bind(...ids)
      .run();
    orphansSoftDeleted = res.meta.changes ?? 0;
    console.log(`[CLEANUP] orphan clones soft-deleted: ${orphansSoftDeleted}`);
  }

  const purgeRes = await db
    .prepare(
      `DELETE FROM invite_tokens
        WHERE (used_at IS NOT NULL AND used_at < datetime('now', '-30 days'))
           OR (used_at IS NULL AND expires_at < datetime('now', '-30 days'))`,
    )
    .run();
  const expiredInvitesPurged = purgeRes.meta.changes ?? 0;

  const COLD_TABLE_MAP: Record<ColdType, string> = { user: "users", clone: "clones", message: "messages" };

  async function archiveColdBatch(type: ColdType, sql: string): Promise<number> {
    const rows = (await db.prepare(sql).all<{ id: number }>()).results;
    let advanced = 0;
    for (const { id } of rows) {
      try {
        const { key, body } = await buildSnapshotFromDb(db, type, id);
        await putSnapshot(env.R2_ARCHIVE, key, body);

        const cols = COLD_TARGET_COLUMNS[type];
        const table = COLD_TABLE_MAP[type];

        const hasTimestamp = type !== "message";
        const setParts: string[] = [];
        if (cols.length > 0) setParts.push(...cols.map((c) => `${c}=NULL`));
        setParts.push(`deletion_state='archived_cold'`);
        if (hasTimestamp) setParts.push(`archived_cold_at=CURRENT_TIMESTAMP`);

        await db.batch([
          db.prepare(`UPDATE ${table} SET ${setParts.join(",")} WHERE id=?`).bind(id),
        ]);

        await writeDecryptionAudit(db, env.AUDIT_SECRET, {
          actor: { type: "system", id: "cron" },
          op: "archive_cold",
          resourceType: type,
          resourceId: id,
          reason: "auto:soft+90d",
        });
        advanced += 1;
      } catch (e) {
        console.error(`[CLEANUP] archive_cold failed for ${type}:${id}`, e);
      }
    }
    return advanced;
  }

  const usersAdvancedToCold = await archiveColdBatch(
    "user",
    `SELECT id FROM users WHERE deletion_state='soft_deleted' AND soft_deleted_at < datetime('now', '-90 days') LIMIT 50`,
  );
  const clonesAdvancedToCold = await archiveColdBatch(
    "clone",
    `SELECT id FROM clones WHERE deletion_state='soft_deleted' AND soft_deleted_at < datetime('now', '-90 days') LIMIT 50`,
  );
  const messagesAdvancedToCold = await archiveColdBatch(
    "message",
    `SELECT id FROM messages WHERE deletion_state='soft_deleted' AND created_at < datetime('now', '-90 days') LIMIT 50`,
  );

  async function hardDeleteBatch(type: ColdType, sql: string): Promise<number> {
    const rows = (await db.prepare(sql).all<{ id: number }>()).results;
    let deleted = 0;
    for (const { id } of rows) {
      try {

        await db
          .prepare(
            `UPDATE dek_registry SET shredded_at=CURRENT_TIMESTAMP
              WHERE resource_type LIKE ? AND resource_id=? AND shredded_at IS NULL`,
          )
          .bind(`${type}.%`, String(id))
          .run();

        await db.prepare(`DELETE FROM ${COLD_TABLE_MAP[type]} WHERE id=?`).bind(id).run();

        await writeDecryptionAudit(db, env.AUDIT_SECRET, {
          actor: { type: "system", id: "cron" },
          op: "hard_delete",
          resourceType: type,
          resourceId: id,
          reason: "auto:cold+275d",
        });
        deleted += 1;
      } catch (e) {
        console.error(`[CLEANUP] hard_delete failed for ${type}:${id}`, e);
      }
    }
    return deleted;
  }

  const usersHardDeleted = await hardDeleteBatch(
    "user",
    `SELECT id FROM users WHERE deletion_state='archived_cold' AND archived_cold_at < datetime('now', '-275 days') LIMIT 50`,
  );
  const clonesHardDeleted = await hardDeleteBatch(
    "clone",
    `SELECT id FROM clones WHERE deletion_state='archived_cold' AND archived_cold_at < datetime('now', '-275 days') LIMIT 50`,
  );

  const messagesHardDeleted = await hardDeleteBatch(
    "message",
    `SELECT id FROM messages WHERE deletion_state='archived_cold' AND created_at < datetime('now', '-365 days') LIMIT 50`,
  );

  const inactiveContacts = (
    await db
      .prepare(
        `SELECT ec.id, ec.principal_user_id, ec.trigger_param
           FROM emergency_contacts ec
           JOIN users u ON u.id = ec.principal_user_id
          WHERE ec.status = 'accepted'
            AND ec.trigger_condition = 'inactivity_N_days'
            AND ec.trigger_param IS NOT NULL
            AND u.last_activity_at IS NOT NULL
            AND u.deletion_state = 'active'
            AND julianday('now') - julianday(u.last_activity_at) >= CAST(ec.trigger_param AS INTEGER)
            AND NOT EXISTS (
              SELECT 1 FROM inheritance_release_logs l
               WHERE l.emergency_contact_id = ec.id AND l.event = 'triggered'
            )
          LIMIT 100`,
      )
      .all<{ id: number; principal_user_id: number; trigger_param: string }>()
  ).results;

  let inactivityContactsTriggered = 0;
  for (const c of inactiveContacts) {
    await db
      .prepare(
        `INSERT INTO inheritance_release_logs
           (emergency_contact_id, event, reason)
         VALUES (?, 'triggered', ?)`,
      )
      .bind(c.id, `inactivity:${c.trigger_param}d`)
      .run();
    inactivityContactsTriggered += 1;
  }

  const coownerRes = await db
    .prepare(
      `UPDATE clones
          SET last_coowner_reminder_at = CURRENT_TIMESTAMP
        WHERE clone_type = 'memlow'
          AND coowner_reminder_opt_out = 0
          AND deletion_state = 'active'
          AND (last_coowner_reminder_at IS NULL
               OR last_coowner_reminder_at < datetime('now', '-30 days'))
          AND (SELECT COUNT(*) FROM clone_shares
                WHERE clone_id = clones.id AND status = 'accepted' AND role = 'owner') = 1`,
    )
    .run();
  const coownerRemindersScheduled = coownerRes.meta.changes ?? 0;

  return {
    orphansFound: orphans.length,
    orphansSoftDeleted,
    expiredInvitesPurged,
    usersAdvancedToCold,
    clonesAdvancedToCold,
    messagesAdvancedToCold,
    usersHardDeleted,
    clonesHardDeleted,
    messagesHardDeleted,
    inactivityContactsTriggered,
    coownerRemindersScheduled,
  };
}
