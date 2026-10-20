

import type { v_de0a25 } from "../lib/env";

export const v_60d58e = 5 * 60 * 1000;
const v_20961c = 500;
const v_d110f5 = 100;

export interface StaleCallsResult {
  found: number;
  closed: number;

  closedGreeted: number;
}

export async function v_4d538f(
  env: v_de0a25["Bindings"],
  v_5c2f9f = Date.now(),
): Promise<StaleCallsResult> {
  const v_18b8bf = (
    await v_c9c489.DB.prepare(
      `SELECT s.call_id, s.user_id, s.clone_id, s.started_at, s.greeted_at,
              t.last_turn_at, COALESCE(t.turns, 0) AS turns
         FROM call_sessions s
         LEFT JOIN (SELECT call_id, MAX(created_at) AS last_turn_at, COUNT(*) AS turns
                      FROM call_turns GROUP BY call_id) t ON t.call_id = s.call_id
        WHERE s.ended_at IS NULL AND COALESCE(t.last_turn_at, s.started_at) < ?
        ORDER BY s.started_at
        LIMIT ?`,
    )
      .bind(v_5c2f9f - v_60d58e, v_20961c)
      .all<{
        call_id: string;
        user_id: number;
        clone_id: number;
        started_at: number;
        greeted_at: number | null;
        last_turn_at: number | null;
        turns: number;
      }>()
  ).results;

  let v_313dc7 = 0;
  let v_b2f82c = 0;
  for (let v_ebec57 = 0; v_ebec57 < v_18b8bf.length; v_ebec57 += v_d110f5) {
    const v_334f63 = v_18b8bf.slice(v_ebec57, v_ebec57 + v_d110f5);
    const v_a7f568 = await v_c9c489.DB.batch(
      v_334f63.map((v_cb35cb) => {
        const v_3a0669 = Math.max(v_cb35cb.started_at, v_cb35cb.last_turn_at ?? v_cb35cb.started_at);
        return v_c9c489.DB.prepare(
          `UPDATE call_sessions
              SET ended_at = ?, duration_sec = MAX(0, (? - started_at) / 1000), end_reason = 'stale_cleanup'
            WHERE call_id = ? AND ended_at IS NULL`,
        ).bind(v_3a0669, v_3a0669, v_cb35cb.call_id);
      }),
    );
    v_334f63.forEach((v_cb35cb, v_b75e36) => {
      if ((v_a7f568[v_b75e36]?.meta?.changes ?? 0) === 0) return;
      v_313dc7++;
      if (v_cb35cb.greeted_at) v_b2f82c++;
      const v_3a0669 = Math.max(v_cb35cb.started_at, v_cb35cb.last_turn_at ?? v_cb35cb.started_at);
      console.log(
        `[CRON] stale-call closed call=${v_cb35cb.call_id} user=${v_cb35cb.user_id} clone=${v_cb35cb.clone_id} ` +
          `started=${new Date(v_cb35cb.started_at).toISOString()} turns=${v_cb35cb.turns} greeted=${!!v_cb35cb.greeted_at} ` +
          `durationSec=${Math.floor((v_3a0669 - v_cb35cb.started_at) / 1000)}`,
      );
    });
  }
  return { found: v_18b8bf.length, closed: v_313dc7, closedGreeted: v_b2f82c };
}
