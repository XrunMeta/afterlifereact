

import type { v_de0a25 } from "../lib/env";
import { v_c7071c, v_5e4807, v_a02f1c, type v_d33606 } from "../lib/coldStorage";
import { v_e56fb3 } from "../lib/auditChain";

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

export async function v_09b071(env: v_de0a25["Bindings"]): Promise<CleanupResult> {
  const v_a1651b = v_c9c489.DB;

  const v_8d925d = (
    await v_a1651b
      .prepare(
        `SELECT c.id FROM clones c
           LEFT JOIN users u ON u.id = c.owner_id
          WHERE c.deleted_at IS NULL
            AND u.id IS NULL
            AND c.created_at < datetime('now', '-5 minutes')
          LIMIT 100`,
      )
      .all<{ id: number }>()
  ).results;

  let v_77311a = 0;
  if (v_8d925d.length > 0) {
    const v_52e08b = v_8d925d.map((v_cb35cb) => v_cb35cb.id);
    const v_1cdc07 = v_52e08b.map(() => "?").join(",");
    const v_8f00b9 = await v_a1651b
      .prepare(
        `UPDATE clones SET deleted_at = CURRENT_TIMESTAMP,
                           deletion_state = 'soft_deleted',
                           soft_deleted_at = CURRENT_TIMESTAMP
          WHERE id IN (${v_1cdc07}) AND deleted_at IS NULL`,
      )
      .bind(...v_52e08b)
      .run();
    v_77311a = v_8f00b9.meta.changes ?? 0;
    console.log(`[CLEANUP] orphan clones soft-deleted: ${v_77311a}`);
  }

  const v_3a158e = await v_a1651b
    .prepare(
      `DELETE FROM invite_tokens
        WHERE (used_at IS NOT NULL AND used_at < datetime('now', '-30 days'))
           OR (used_at IS NULL AND expires_at < datetime('now', '-30 days'))`,
    )
    .run();
  const v_7d695e = v_3a158e.meta.changes ?? 0;

  const COLD_TABLE_MAP: Record<v_d33606, string> = { user: "users", clone: "clones", message: "messages" };

  async function v_e4ee88(type: v_d33606, v_f8df46): Promise<number> {
    const v_18b8bf = (await v_a1651b.prepare(v_f8df46).all<{ id: number }>()).results;
    let v_2328bc = 0;
    for (const { id: v_389afb } of v_18b8bf) {
      try {
        const { key: v_b24339, body: v_4d33b2 } = await v_c7071c(v_a1651b, v_3b27d9, v_389afb);
        await v_5e4807(v_c9c489.R2_ARCHIVE, v_b24339, v_4d33b2);

        const v_6c1676 = v_a02f1c[v_3b27d9];
        const v_cb9428 = v_6041a3[v_3b27d9];

        const v_2b754e = v_3b27d9 !== "message";
        const v_8e18d5 = [];
        if (v_6c1676.length > 0) v_8e18d5.push(...v_6c1676.map((v_3f4e2e) => `${v_3f4e2e}=NULL`));
        v_8e18d5.push(`deletion_state='archived_cold'`);
        if (v_2b754e) v_8e18d5.push(`archived_cold_at=CURRENT_TIMESTAMP`);

        await v_a1651b.batch([
          v_a1651b.prepare(`UPDATE ${v_cb9428} SET ${v_8e18d5.join(",")} WHERE id=?`).bind(v_389afb),
        ]);

        await v_e56fb3(v_a1651b, v_c9c489.AUDIT_SECRET, {
          actor: { type: "system", id: "cron" },
          op: "archive_cold",
          resourceType: v_3b27d9,
          resourceId: v_389afb,
          reason: "auto:soft+90d",
        });
        v_2328bc += 1;
      } catch (v_9e86fd) {
        console.error(`[CLEANUP] archive_cold failed for ${v_3b27d9}:${v_389afb}`, v_9e86fd);
      }
    }
    return v_2328bc;
  }

  const v_8fd193 = await v_e4ee88(
    "user",
    `SELECT id FROM users WHERE deletion_state='soft_deleted' AND soft_deleted_at < datetime('now', '-90 days') LIMIT 50`,
  );
  const v_14ab5f = await v_e4ee88(
    "clone",
    `SELECT id FROM clones WHERE deletion_state='soft_deleted' AND soft_deleted_at < datetime('now', '-90 days') LIMIT 50`,
  );
  const v_3d77dd = await v_e4ee88(
    "message",
    `SELECT id FROM messages WHERE deletion_state='soft_deleted' AND created_at < datetime('now', '-90 days') LIMIT 50`,
  );

  async function v_7a29f1(type: v_d33606, v_f8df46): Promise<number> {
    const v_18b8bf = (await v_a1651b.prepare(v_f8df46).all<{ id: number }>()).results;
    let v_86952f = 0;
    for (const { id: v_389afb } of v_18b8bf) {
      try {

        await v_a1651b
          .prepare(
            `UPDATE dek_registry SET shredded_at=CURRENT_TIMESTAMP
              WHERE resource_type LIKE ? AND resource_id=? AND shredded_at IS NULL`,
          )
          .bind(`${v_3b27d9}.%`, String(v_389afb))
          .run();

        await v_a1651b.prepare(`DELETE FROM ${v_6041a3[v_3b27d9]} WHERE id=?`).bind(v_389afb).run();

        await v_e56fb3(v_a1651b, v_c9c489.AUDIT_SECRET, {
          actor: { type: "system", id: "cron" },
          op: "hard_delete",
          resourceType: v_3b27d9,
          resourceId: v_389afb,
          reason: "auto:cold+275d",
        });
        v_86952f += 1;
      } catch (v_9e86fd) {
        console.error(`[CLEANUP] hard_delete failed for ${v_3b27d9}:${v_389afb}`, v_9e86fd);
      }
    }
    return v_86952f;
  }

  const v_bb10c0 = await v_7a29f1(
    "user",
    `SELECT id FROM users WHERE deletion_state='archived_cold' AND archived_cold_at < datetime('now', '-275 days') LIMIT 50`,
  );
  const v_7668e0 = await v_7a29f1(
    "clone",
    `SELECT id FROM clones WHERE deletion_state='archived_cold' AND archived_cold_at < datetime('now', '-275 days') LIMIT 50`,
  );

  const v_93422b = await v_7a29f1(
    "message",
    `SELECT id FROM messages WHERE deletion_state='archived_cold' AND created_at < datetime('now', '-365 days') LIMIT 50`,
  );

  const v_bebd1c = (
    await v_a1651b
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

  let v_9146f3 = 0;
  for (const v_3f4e2e of v_bebd1c) {
    await v_a1651b
      .prepare(
        `INSERT INTO inheritance_release_logs
           (emergency_contact_id, event, reason)
         VALUES (?, 'triggered', ?)`,
      )
      .bind(v_3f4e2e.id, `inactivity:${v_3f4e2e.trigger_param}d`)
      .run();
    v_9146f3 += 1;
  }

  const v_411f75 = await v_a1651b
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
  const v_21c6eb = v_411f75.meta.changes ?? 0;

  return {
    orphansFound: v_8d925d.length,
    orphansSoftDeleted: v_77311a,
    expiredInvitesPurged: v_7d695e,
    usersAdvancedToCold: v_8fd193,
    clonesAdvancedToCold: v_14ab5f,
    messagesAdvancedToCold: v_3d77dd,
    usersHardDeleted: v_bb10c0,
    clonesHardDeleted: v_7668e0,
    messagesHardDeleted: v_93422b,
    inactivityContactsTriggered: v_9146f3,
    coownerRemindersScheduled: v_21c6eb,
  };
}
