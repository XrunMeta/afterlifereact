import type { Context } from "hono";
import type { Env } from "../index";

interface LogParams {
  userId: string;
  cloneId?: string;
  action: string;
  metadata?: Record<string, any>;
}

export async function logActivity(c: Context<Env>, params: LogParams) {
  const id = crypto.randomUUID();
  const ip = c.req.header("CF-Connecting-IP") || c.req.header("X-Forwarded-For") || "";
  const device = c.req.header("User-Agent") || "";

  await c.env.DB.prepare(
    "INSERT INTO activity_logs (id, user_id, clone_id, action, metadata, ip, device) VALUES (?, ?, ?, ?, ?, ?, ?)"
  )
    .bind(
      id,
      params.userId,
      params.cloneId || null,
      params.action,
      params.metadata ? JSON.stringify(params.metadata) : null,
      ip,
      device
    )
    .run();
}

export async function updateCloneStat(
  db: D1Database,
  cloneId: string,
  field: string,
  increment: number = 1
) {
  await db
    .prepare(
      `UPDATE clone_stats SET ${field} = ${field} + ?, updated_at = datetime('now') WHERE clone_id = ?`
    )
    .bind(increment, cloneId)
    .run();
}

export async function ensureCloneStats(db: D1Database, cloneId: string) {
  await db
    .prepare("INSERT OR IGNORE INTO clone_stats (clone_id) VALUES (?)")
    .bind(cloneId)
    .run();
}
