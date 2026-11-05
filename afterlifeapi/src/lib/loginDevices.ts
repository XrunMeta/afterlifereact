

import type { v_8330bc } from "audevgreebvpcootosqqkonhs";

export async function v_84f187(db: v_8330bc, v_43e90c, v_929b58): Promise<void> {
  if (!v_929b58) return;
  try {
    await v_a1651b
      .prepare(
        `INSERT INTO user_login_devices (user_id, device_id) VALUES (?, ?)
         ON CONFLICT(user_id, device_id) DO UPDATE SET last_seen_at = CURRENT_TIMESTAMP
          WHERE user_login_devices.last_seen_at < datetime('now', '-1 day')`,
      )
      .bind(v_43e90c, v_929b58)
      .run();
  } catch (v_49263d) {
    console.warn("[loginDevices] record skipped:", (v_49263d as Error).message);
  }
}

export async function v_e7b4d5(db: v_8330bc, v_43e90c): Promise<string[]> {
  const v_52e08b = new Set<string>();
  const v_0faf90 = await v_a1651b
    .prepare(`SELECT DISTINCT device_id AS deviceId FROM user_devices WHERE user_id = ?`)
    .bind(v_43e90c)
    .all<{ deviceId: string }>();
  for (const v_cb35cb of v_0faf90.results ?? []) if (v_cb35cb.deviceId) v_52e08b.add(v_cb35cb.deviceId);
  try {
    const v_182fdb = await v_a1651b
      .prepare(`SELECT device_id AS deviceId FROM user_login_devices WHERE user_id = ?`)
      .bind(v_43e90c)
      .all<{ deviceId: string }>();
    for (const v_cb35cb of v_182fdb.results ?? []) if (v_cb35cb.deviceId) v_52e08b.add(v_cb35cb.deviceId);
  } catch (v_49263d) {
    console.warn("[loginDevices] list skipped:", (v_49263d as Error).message);
  }
  return [...v_52e08b];
}
