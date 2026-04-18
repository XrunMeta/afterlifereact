import type { Context } from "hono";
import type { AppEnv } from "./env";

export interface ActivityLog {
  userId: number | null;
  action: string;
  details?: unknown;
}

export async function logActivity(c: Context<AppEnv>, log: ActivityLog): Promise<void> {
  const ip =
    c.req.header("CF-Connecting-IP") ?? c.req.header("X-Forwarded-For") ?? null;
  const device = c.req.header("User-Agent") ?? null;
  await c.env.DB.prepare(
    `INSERT INTO activity_logs (user_id, action, details, ip, device)
     VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(
      log.userId,
      log.action,
      log.details !== undefined ? JSON.stringify(log.details) : null,
      ip,
      device,
    )
    .run();
}

export async function ensureCloneStats(db: D1Database, cloneId: number): Promise<void> {
  await db
    .prepare(`INSERT OR IGNORE INTO clone_stats (clone_id) VALUES (?)`)
    .bind(cloneId)
    .run();
}

export async function bumpCloneStat(
  db: D1Database,
  cloneId: number,
  field: "followers_count" | "messages_count" | "gifts_count",
  delta = 1,
): Promise<void> {
  await db
    .prepare(
      `UPDATE clone_stats SET ${field} = ${field} + ?, updated_at = CURRENT_TIMESTAMP WHERE clone_id = ?`,
    )
    .bind(delta, cloneId)
    .run();
}
