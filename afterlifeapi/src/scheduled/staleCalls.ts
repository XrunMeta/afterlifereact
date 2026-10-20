

import type { v_de0a25 } from "../lib/env";

export const v_764919 = 6 * 60 * 60 * 1000;
const v_20961c = 500;

export interface StaleCallsResult {
  found: number;
  closed: number;
}

export async function v_4d538f(
  env: v_de0a25["Bindings"],
  v_5c2f9f = Date.now(),
): Promise<StaleCallsResult> {
  const v_18b8bf = (
    await v_c9c489.DB.prepare(
      `SELECT s.call_id, s.user_id, s.clone_id, s.started_at,
              (SELECT MAX(t.created_at) FROM call_turns t WHERE t.call_id = s.call_id) AS last_turn_at,
              (SELECT COUNT(*) FROM call_turns t WHERE t.call_id = s.call_id) AS turns
         FROM call_sessions s
        WHERE s.ended_at IS NULL AND s.started_at < ?
        ORDER BY s.started_at
        LIMIT ?`,
    )
      .bind(v_5c2f9f - v_764919, v_20961c)
      .all<{
        call_id: string;
        user_id: number;
        clone_id: number;
        started_at: number;
        last_turn_at: number | null;
        turns: number;
      }>()
  ).results;

  let v_313dc7 = 0;
  for (const v_cb35cb of v_18b8bf) {
    const v_3a0669 = Math.max(v_cb35cb.started_at, v_cb35cb.last_turn_at ?? v_cb35cb.started_at);
    const v_8f00b9 = await v_c9c489.DB.prepare(
      `UPDATE call_sessions
          SET ended_at = ?, duration_sec = MAX(0, (? - started_at) / 1000), end_reason = 'stale_cleanup'
        WHERE call_id = ? AND ended_at IS NULL`,
    )
      .bind(v_3a0669, v_3a0669, v_cb35cb.call_id)
      .run();
    if ((v_8f00b9.meta?.changes ?? 0) > 0) {
      v_313dc7++;
      console.log(
        `[CRON] stale-call closed call=${v_cb35cb.call_id} user=${v_cb35cb.user_id} clone=${v_cb35cb.clone_id} ` +
          `started=${new Date(v_cb35cb.started_at).toISOString()} turns=${v_cb35cb.turns} ` +
          `durationSec=${Math.floor((v_3a0669 - v_cb35cb.started_at) / 1000)}`,
      );
    }
  }
  return { found: v_18b8bf.length, closed: v_313dc7 };
}
