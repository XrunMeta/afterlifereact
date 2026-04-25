

import type { v_273a0c } from './env';

export async function v_e86502(env: v_273a0c, v_6e0fd3): Promise<string | null> {
  const v_e2a6a6 = await v_c9c489.KV_CTX.get(`ctx:${v_6e0fd3}`);
  if (v_e2a6a6 !== null) return v_e2a6a6;
  const v_3ac7e7 = await v_c9c489.DB.prepare(
    'SELECT data FROM clone_ctx WHERE clone_id = ?'
  ).bind(v_6e0fd3).first<{ data: string }>();
  if (v_3ac7e7?.data != null) {
    await v_c9c489.KV_CTX.put(`ctx:${v_6e0fd3}`, v_3ac7e7.data);
    return v_3ac7e7.data;
  }
  return null;
}

export async function v_9c8187(env: v_273a0c, v_6e0fd3, v_9390e8): Promise<void> {
  await v_c9c489.DB.prepare(
    'INSERT OR REPLACE INTO clone_ctx (clone_id, data, updated_at) VALUES (?, ?, unixepoch())'
  ).bind(v_6e0fd3, v_9390e8).run();
  await v_c9c489.KV_CTX.put(`ctx:${v_6e0fd3}`, v_9390e8);
}

export async function v_fda4d7(
  env: v_273a0c, v_6e0fd3
): Promise<{ events: string; version: number } | null> {
  const [v_2b4a65, v_88d3b2] = await Promise.all([
    v_c9c489.KV_SHARED.get(`shared:${v_6e0fd3}`),
    v_c9c489.KV_SHARED_VER.get(`shared_versions:${v_6e0fd3}`),
  ]);
  if (v_2b4a65 !== null) {
    return { events: v_2b4a65, version: v_88d3b2 ? Number(v_88d3b2) : 0 };
  }
  const v_3ac7e7 = await v_c9c489.DB.prepare(
    'SELECT events, version FROM clone_shared WHERE clone_id = ?'
  ).bind(v_6e0fd3).first<{ events: string; version: number }>();
  if (v_3ac7e7) {
    await Promise.all([
      v_c9c489.KV_SHARED.put(`shared:${v_6e0fd3}`, v_3ac7e7.events),
      v_c9c489.KV_SHARED_VER.put(`shared_versions:${v_6e0fd3}`, String(v_3ac7e7.version)),
    ]);
    return { events: v_3ac7e7.events, version: v_3ac7e7.version };
  }
  return null;
}

export async function v_55eb2a(
  env: v_273a0c, v_6e0fd3, v_bf9904, v_0e1851
): Promise<void> {
  await v_c9c489.DB.prepare(
    'INSERT OR REPLACE INTO clone_shared (clone_id, events, version, updated_at) VALUES (?, ?, ?, unixepoch())'
  ).bind(v_6e0fd3, v_bf9904, v_0e1851).run();
  await Promise.all([
    v_c9c489.KV_SHARED.put(`shared:${v_6e0fd3}`, v_bf9904),
    v_c9c489.KV_SHARED_VER.put(`shared_versions:${v_6e0fd3}`, String(v_0e1851)),
  ]);
}

export async function v_3821c0(env: v_273a0c, v_6e0fd3, v_43e90c): Promise<string | null> {
  const v_b24339 = `l2:${v_6e0fd3}:${v_43e90c}`;
  const v_e2a6a6 = await v_c9c489.KV_ONT.get(v_b24339);
  if (v_e2a6a6 !== null) return v_e2a6a6;
  const v_3ac7e7 = await v_c9c489.DB.prepare(
    'SELECT data FROM clone_ont WHERE clone_id = ? AND user_id = ?'
  ).bind(v_6e0fd3, v_43e90c).first<{ data: string }>();
  if (v_3ac7e7?.data != null) {
    await v_c9c489.KV_ONT.put(v_b24339, v_3ac7e7.data);
    return v_3ac7e7.data;
  }
  return null;
}

export async function v_5729a9(
  env: v_273a0c, v_6e0fd3, v_43e90c, v_9390e8
): Promise<void> {
  await v_c9c489.DB.prepare(
    'INSERT OR REPLACE INTO clone_ont (clone_id, user_id, data, updated_at) VALUES (?, ?, ?, unixepoch())'
  ).bind(v_6e0fd3, v_43e90c, v_9390e8).run();
  await v_c9c489.KV_ONT.put(`l2:${v_6e0fd3}:${v_43e90c}`, v_9390e8);
}
