

import type { v_8330bc } from "audevgreebvpcootosqqkonhs";

export interface PenaltyLogEntry {
  id: number;
  action: string;
  createdAt: string;
  details: Record<string, unknown>;
}

export async function v_c60c30(db: v_8330bc, v_43e90c, v_02be30 = 20): Promise<PenaltyLogEntry[]> {
  const v_18b8bf = await v_a1651b
    .prepare(
      `SELECT id, action, details, created_at AS createdAt FROM activity_logs
        WHERE user_id = ?
          AND (action LIKE 'moderation.%' OR (action = 'clone.delete' AND json_extract(details, '$.by') = 'admin'))
        ORDER BY id DESC LIMIT ?`,
    )
    .bind(v_43e90c, v_02be30)
    .all<{ id: number; action: string; details: string | null; createdAt: string }>();
  return (v_18b8bf.results ?? []).map((v_cb35cb) => {
    let v_5ab5bd = {};
    try {
      v_5ab5bd = v_cb35cb.details ? (JSON.parse(v_cb35cb.details) as Record<string, unknown>) : {};
    } catch {

    }
    return { id: v_cb35cb.id, action: v_cb35cb.action, createdAt: v_cb35cb.createdAt, details: v_5ab5bd };
  });
}
