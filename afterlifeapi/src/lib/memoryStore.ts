

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
  env: v_273a0c, v_6e0fd3, v_43e90c, v_9390e8, v_a46f95 = false,
): Promise<void> {
  await v_c9c489.DB.prepare(
    `INSERT INTO clone_ont (clone_id, user_id, data, updated_at, auto_learned_at)
     VALUES (?, ?, ?, unixepoch(), ?)
     ON CONFLICT(clone_id, user_id) DO UPDATE SET
       data = excluded.data,
       updated_at = excluded.updated_at,
       auto_learned_at = COALESCE(excluded.auto_learned_at, clone_ont.auto_learned_at)`,
  ).bind(v_6e0fd3, v_43e90c, v_9390e8, v_a46f95 ? Math.floor(Date.now() / 1000) : null).run();
  await v_c9c489.KV_ONT.put(`l2:${v_6e0fd3}:${v_43e90c}`, v_9390e8);
}

const v_a680d4 = 16 * 1024;   
const v_90cfe0 = 50;          

export interface L2Extraction {
  preference_personal?: Record<string, unknown>; 
  relation?: string | null;                       
  memories_personal?: string[];                   
}

export async function v_0ac5b7(
  env: v_273a0c,
  v_6e0fd3,
  v_43e90c,
  v_631e71,
  v_04e790,
): Promise<{ rev: number; skipped: boolean }> {
  const v_e1ccab =
    v_631e71.preference_personal != null &&
    Object.keys(v_631e71.preference_personal).length > 0;
  const v_093c06 =
    typeof v_631e71.relation === "string" && v_631e71.relation.trim().length > 0;
  const v_129c51 = Array.isArray(v_631e71.memories_personal)
    ? v_631e71.memories_personal.map((v_35f85c) => String(v_35f85c).trim()).filter(Boolean)
    : [];
  const v_486bc9 = v_129c51.length > 0;
  if (!v_e1ccab && !v_093c06 && !v_486bc9) {

    return { rev: 0, skipped: true };
  }

  const v_479f05 = await v_3821c0(v_c9c489, v_6e0fd3, v_43e90c);
  let v_275ccd = {
    address: null,
    memories_personal: [],
    relation: null,
    preference_personal: {},
    _meta: { layer: "L2", rev: 0 },
  };
  if (v_479f05) {
    try {
      const v_8decf8 = JSON.parse(v_479f05);
      if (v_8decf8 && typeof v_8decf8 === "object") {
        v_275ccd = v_8decf8 as Record<string, unknown>;
      }
    } catch {
      console.error(`[D1_CORRUPT] l2:${v_6e0fd3}:uid:${String(v_43e90c).slice(-3)} — overwriting on auto-learn`);
    }
  }
  const v_ab4c96 = (v_275ccd._meta ?? {}) as Record<string, unknown>;
  const v_7d3ae6 = typeof v_ab4c96.rev === "number" ? v_ab4c96.rev : 0;

  const v_d5158a = Array.isArray(v_275ccd.memories_personal)
    ? (v_275ccd.memories_personal as unknown[]).map((v_35f85c) => String(v_35f85c))
    : [];
  const v_3bfd8d = v_486bc9
    ? (() => {
        const v_d38aef = new Set(v_129c51);
        return [...v_d5158a.filter((v_35f85c) => !v_d38aef.has(v_35f85c)), ...v_129c51].slice(-v_90cfe0);
      })()
    : v_d5158a;

  const v_5c2f9f = new Date().toISOString();
  const v_a448ad = {
    address: v_275ccd.address ?? null,
    memories_personal: v_3bfd8d,
    relation: v_093c06 ? v_631e71.relation!.trim() : v_275ccd.relation ?? null,
    preference_personal: v_e1ccab
      ? {
          ...((v_275ccd.preference_personal as Record<string, unknown>) ?? {}),
          ...v_631e71.preference_personal,
        }
      : v_275ccd.preference_personal ?? {},

    ...(v_275ccd.memory_summary !== undefined ? { memory_summary: v_275ccd.memory_summary } : {}),
    ...(v_275ccd.relationship !== undefined ? { relationship: v_275ccd.relationship } : {}),
    ...(v_275ccd.context !== undefined ? { context: v_275ccd.context } : {}),
    ...(v_275ccd.recent_topics !== undefined ? { recent_topics: v_275ccd.recent_topics } : {}),
    _meta: { layer: "L2", rev: v_7d3ae6 + 1, auto_learned_at: v_5c2f9f, source: v_04e790, updated_at: v_5c2f9f },
  };

  let v_4f3411 = JSON.stringify(v_a448ad);
  while (
    v_4f3411.length > v_a680d4 &&
    (v_a448ad.memories_personal as string[]).length > 0
  ) {
    (v_a448ad.memories_personal as string[]).shift(); 
    v_4f3411 = JSON.stringify(v_a448ad);
  }
  if (v_4f3411.length > v_a680d4) {
    throw new Error(`L2 payload too large (${v_4f3411.length}B > ${v_a680d4}B).`);
  }
  await v_5729a9(v_c9c489, v_6e0fd3, v_43e90c, v_4f3411, true); 
  return { rev: v_7d3ae6 + 1, skipped: false };
}
