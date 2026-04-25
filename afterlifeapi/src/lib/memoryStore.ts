

import type { Bindings } from './env';

export async function readCtx(env: Bindings, cloneId: number): Promise<string | null> {
  const cached = await env.KV_CTX.get(`ctx:${cloneId}`);
  if (cached !== null) return cached;
  const row = await env.DB.prepare(
    'SELECT data FROM clone_ctx WHERE clone_id = ?'
  ).bind(cloneId).first<{ data: string }>();
  if (row?.data != null) {
    await env.KV_CTX.put(`ctx:${cloneId}`, row.data);
    return row.data;
  }
  return null;
}

export async function writeCtx(env: Bindings, cloneId: number, data: string): Promise<void> {
  await env.DB.prepare(
    'INSERT OR REPLACE INTO clone_ctx (clone_id, data, updated_at) VALUES (?, ?, unixepoch())'
  ).bind(cloneId, data).run();
  await env.KV_CTX.put(`ctx:${cloneId}`, data);
}

export async function readShared(
  env: Bindings, cloneId: number
): Promise<{ events: string; version: number } | null> {
  const [cachedEvents, cachedVer] = await Promise.all([
    env.KV_SHARED.get(`shared:${cloneId}`),
    env.KV_SHARED_VER.get(`shared_versions:${cloneId}`),
  ]);
  if (cachedEvents !== null) {
    return { events: cachedEvents, version: cachedVer ? Number(cachedVer) : 0 };
  }
  const row = await env.DB.prepare(
    'SELECT events, version FROM clone_shared WHERE clone_id = ?'
  ).bind(cloneId).first<{ events: string; version: number }>();
  if (row) {
    await Promise.all([
      env.KV_SHARED.put(`shared:${cloneId}`, row.events),
      env.KV_SHARED_VER.put(`shared_versions:${cloneId}`, String(row.version)),
    ]);
    return { events: row.events, version: row.version };
  }
  return null;
}

export async function writeShared(
  env: Bindings, cloneId: number, events: string, version: number
): Promise<void> {
  await env.DB.prepare(
    'INSERT OR REPLACE INTO clone_shared (clone_id, events, version, updated_at) VALUES (?, ?, ?, unixepoch())'
  ).bind(cloneId, events, version).run();
  await Promise.all([
    env.KV_SHARED.put(`shared:${cloneId}`, events),
    env.KV_SHARED_VER.put(`shared_versions:${cloneId}`, String(version)),
  ]);
}

export async function readOnt(env: Bindings, cloneId: number, userId: number): Promise<string | null> {
  const key = `l2:${cloneId}:${userId}`;
  const cached = await env.KV_ONT.get(key);
  if (cached !== null) return cached;
  const row = await env.DB.prepare(
    'SELECT data FROM clone_ont WHERE clone_id = ? AND user_id = ?'
  ).bind(cloneId, userId).first<{ data: string }>();
  if (row?.data != null) {
    await env.KV_ONT.put(key, row.data);
    return row.data;
  }
  return null;
}

export async function writeOnt(
  env: Bindings, cloneId: number, userId: number, data: string
): Promise<void> {
  await env.DB.prepare(
    'INSERT OR REPLACE INTO clone_ont (clone_id, user_id, data, updated_at) VALUES (?, ?, ?, unixepoch())'
  ).bind(cloneId, userId, data).run();
  await env.KV_ONT.put(`l2:${cloneId}:${userId}`, data);
}
