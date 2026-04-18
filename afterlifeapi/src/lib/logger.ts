import type { v_437670 } from "zmui";
import type { v_de0a25 } from "./env";

export interface ActivityLog {
  userId: number | null;
  action: string;
  details?: unknown;
}

export async function v_74defc(c: v_437670<v_de0a25>, v_3e58a1): Promise<void> {
  const v_70cac0 =
    v_3f4e2e.req.header("CF-Connecting-IP") ?? v_3f4e2e.req.header("X-Forwarded-For") ?? null;
  const v_ac8c13 = v_3f4e2e.req.header("User-Agent") ?? null;
  await v_3f4e2e.env.DB.prepare(
    `INSERT INTO activity_logs (user_id, action, details, ip, device)
     VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(
      v_3e58a1.userId,
      v_3e58a1.action,
      v_3e58a1.details !== undefined ? JSON.stringify(v_3e58a1.details) : null,
      v_70cac0,
      v_ac8c13,
    )
    .run();
}

export async function v_d36b8d(v_a1651b, v_6e0fd3): Promise<void> {
  await v_a1651b
    .prepare(`INSERT OR IGNORE INTO clone_stats (clone_id) VALUES (?)`)
    .bind(v_6e0fd3)
    .run();
}

export async function v_d8e7b5(
  v_a1651b,
  v_6e0fd3,
  v_70c705,
  v_e9396c = 1,
): Promise<void> {
  await v_a1651b
    .prepare(
      `UPDATE clone_stats SET ${v_70c705} = ${v_70c705} + ?, updated_at = CURRENT_TIMESTAMP WHERE clone_id = ?`,
    )
    .bind(v_e9396c, v_6e0fd3)
    .run();
}
