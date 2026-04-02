import type { v_437670 } from "zmui";
import type { v_4bcb54 } from "../index";

interface LogParams {
  userId: string;
  cloneId?: string;
  action: string;
  metadata?: Record<string, any>;
}

export async function v_74defc(c: v_437670<v_4bcb54>, v_24baff) {
  const v_389afb = crypto.randomUUID();
  const v_70cac0 = v_3f4e2e.req.header("CF-Connecting-IP") || v_3f4e2e.req.header("X-Forwarded-For") || "";
  const v_ac8c13 = v_3f4e2e.req.header("User-Agent") || "";

  await v_3f4e2e.env.DB.prepare(
    "INSERT INTO activity_logs (id, user_id, clone_id, action, metadata, ip, device) VALUES (?, ?, ?, ?, ?, ?, ?)"
  )
    .bind(
      v_389afb,
      v_24baff.userId,
      v_24baff.cloneId || null,
      v_24baff.action,
      v_24baff.metadata ? JSON.stringify(v_24baff.metadata) : null,
      v_70cac0,
      v_ac8c13
    )
    .run();
}

export async function v_0f7c57(
  v_a1651b,
  v_6e0fd3,
  v_70c705,
  v_f95211 = 1
) {
  await v_a1651b
    .prepare(
      `UPDATE clone_stats SET ${v_70c705} = ${v_70c705} + ?, updated_at = datetime('now') WHERE clone_id = ?`
    )
    .bind(v_f95211, v_6e0fd3)
    .run();
}

export async function v_d36b8d(v_a1651b, v_6e0fd3) {
  await v_a1651b
    .prepare("INSERT OR IGNORE INTO clone_stats (clone_id) VALUES (?)")
    .bind(v_6e0fd3)
    .run();
}
