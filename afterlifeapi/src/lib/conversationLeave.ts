

export type LeaveKind = "subscribed" | "called" | "owned";

export async function v_3205df(v_a1651b, v_43e90c): Promise<Map<number, number>> {
  const v_315151 = await v_a1651b
    .prepare(`SELECT clone_id, MAX(left_at) AS left_at FROM conversation_leaves WHERE user_id = ? GROUP BY clone_id`)
    .bind(v_43e90c)
    .all<{ clone_id: number; left_at: number }>();
  return new Map((v_315151.results ?? []).map((v_cb35cb) => [v_cb35cb.clone_id, Number(v_cb35cb.left_at)]));
}

export async function v_19b1f0(v_a1651b, v_43e90c, v_6e0fd3): Promise<number> {
  const v_cb35cb = await v_a1651b
    .prepare(`SELECT MAX(left_at) AS left_at FROM conversation_leaves WHERE user_id = ? AND clone_id = ?`)
    .bind(v_43e90c, v_6e0fd3)
    .first<{ left_at: number | null }>();
  return Number(v_cb35cb?.left_at ?? 0);
}

export function v_991113(v_81fc5c): string {
  return `AND ${v_81fc5c}.created_at > COALESCE((
            SELECT strftime('%Y-%m-%d %H:%M:%S', MAX(cl.left_at) / 1000, 'unixepoch')
              FROM conversation_leaves cl
             WHERE cl.user_id = ${v_81fc5c}.user_id AND cl.clone_id = ${v_81fc5c}.clone_id), '')`;
}

export async function v_8be472(
  v_a1651b,
  v_328259,
): Promise<{ leaveId: number; leftAt: number; unsubscribed: boolean }> {
  const { userId: v_43e90c, cloneId: v_6e0fd3, kind: v_94302c } = v_328259;
  const v_a0bb1f = Date.now();
  const v_ba2215 = await v_a1651b
    .prepare(`SELECT intimacy_score FROM user_clone_interactions WHERE user_id = ? AND clone_id = ?`)
    .bind(v_43e90c, v_6e0fd3)
    .first<{ intimacy_score: number }>();
  const v_100ad9 = v_94302c === "subscribed";

  const v_43af15 = await v_a1651b
    .prepare(
      `INSERT INTO conversation_leaves (user_id, clone_id, kind, left_at, unsubscribed, prev_intimacy)
       VALUES (?, ?, ?, ?, ?, ?) RETURNING id`,
    )
    .bind(v_43e90c, v_6e0fd3, v_94302c, v_a0bb1f, v_100ad9 ? 1 : 0, v_ba2215?.intimacy_score ?? null)
    .first<{ id: number }>();
  const v_203b84 = Number(v_43af15?.id ?? 0);

  const v_3e6264 = [

    v_a1651b.prepare(
      `INSERT INTO conversation_resets (user_id, clone_id, reset_at) VALUES (?, ?, ?)
       ON CONFLICT(user_id, clone_id) DO UPDATE SET reset_at = excluded.reset_at`,
    ).bind(v_43e90c, v_6e0fd3, v_a0bb1f),

    v_a1651b.prepare(`UPDATE user_clone_interactions SET intimacy_score = 0 WHERE user_id = ? AND clone_id = ?`)
      .bind(v_43e90c, v_6e0fd3),

    v_a1651b.prepare(
      `INSERT INTO conversation_read_markers (user_id, clone_id, last_read_at)
         VALUES (?, ?, datetime(?, 'unixepoch'))
       ON CONFLICT(user_id, clone_id) DO UPDATE SET last_read_at = excluded.last_read_at`,
    ).bind(v_43e90c, v_6e0fd3, Math.floor(v_a0bb1f / 1000)),

    v_a1651b.prepare(
      `INSERT INTO clone_ont_archive (leave_id, clone_id, user_id, data, updated_at, archived_at)
       SELECT ?, clone_id, user_id, data, updated_at, ? FROM clone_ont WHERE clone_id = ? AND user_id = ?`,
    ).bind(v_203b84, v_a0bb1f, v_6e0fd3, v_43e90c),
    v_a1651b.prepare(`DELETE FROM clone_ont WHERE clone_id = ? AND user_id = ?`).bind(v_6e0fd3, v_43e90c),
    v_a1651b.prepare(
      `INSERT INTO clone_ont_person_archive (leave_id, clone_id, person_id, data, updated_at, archived_at)
       SELECT ?, cop.clone_id, cop.person_id, cop.data, cop.updated_at, ?
         FROM clone_ont_person cop JOIN persons p ON p.id = cop.person_id
        WHERE cop.clone_id = ? AND p.user_id = ?`,
    ).bind(v_203b84, v_a0bb1f, v_6e0fd3, v_43e90c),
    v_a1651b.prepare(
      `DELETE FROM clone_ont_person
        WHERE clone_id = ? AND person_id IN (SELECT id FROM persons WHERE user_id = ? AND clone_id = ?)`,
    ).bind(v_6e0fd3, v_43e90c, v_6e0fd3),
  ];
  if (v_100ad9) {
    v_3e6264.push(v_a1651b.prepare(`DELETE FROM clone_follows WHERE user_id = ? AND clone_id = ?`).bind(v_43e90c, v_6e0fd3));
  }
  await v_a1651b.batch(v_3e6264);
  return { leaveId: v_203b84, leftAt: v_a0bb1f, unsubscribed: v_100ad9 };
}
