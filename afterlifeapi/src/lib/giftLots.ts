

export async function v_2d8130(
  v_a1651b,
  v_43e90c,
  v_96f93d,
  v_f4e98d,
): Promise<number> {
  if (!(v_f4e98d > 0)) return 0;
  const v_9fdb66 =
    (
      await v_a1651b
        .prepare(
          `SELECT id, count_remaining FROM user_gift_lots
            WHERE user_id = ? AND gift_id = ? AND count_remaining > 0
            ORDER BY received_at ASC, id ASC`,
        )
        .bind(v_43e90c, v_96f93d)
        .all<{ id: number; count_remaining: number }>()
    ).results ?? [];
  const v_3e6264 = [];
  let v_dbaa7f = v_f4e98d;
  for (const v_41d9f0 of v_9fdb66) {
    if (v_dbaa7f <= 0) break;
    const v_04326c = Math.min(v_dbaa7f, Number(v_41d9f0.count_remaining));
    v_3e6264.push(
      v_a1651b
        .prepare(`UPDATE user_gift_lots SET count_remaining = count_remaining - ? WHERE id = ? AND count_remaining >= ?`)
        .bind(v_04326c, v_41d9f0.id, v_04326c),
    );
    v_dbaa7f -= v_04326c;
  }
  if (v_3e6264.length) await v_a1651b.batch(v_3e6264);
  return v_f4e98d - v_dbaa7f;
}
