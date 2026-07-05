

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
  env: Bindings, cloneId: number, userId: number, data: string, markAutoLearned = false,
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO clone_ont (clone_id, user_id, data, updated_at, auto_learned_at)
     VALUES (?, ?, ?, unixepoch(), ?)
     ON CONFLICT(clone_id, user_id) DO UPDATE SET
       data = excluded.data,
       updated_at = excluded.updated_at,
       auto_learned_at = COALESCE(excluded.auto_learned_at, clone_ont.auto_learned_at)`,
  ).bind(cloneId, userId, data, markAutoLearned ? Math.floor(Date.now() / 1000) : null).run();
  await env.KV_ONT.put(`l2:${cloneId}:${userId}`, data);
}

const MAX_L2_BYTES = 16 * 1024;   
const MAX_MEMORIES = 50;          

export interface L2Extraction {
  preference_personal?: Record<string, unknown>; 
  relation?: string | null;                       
  memories_personal?: string[];                   
}

export async function updateOntFromExtraction(
  env: Bindings,
  cloneId: number,
  userId: number,
  extracted: L2Extraction,
  source: "call" | "chat",
): Promise<{ rev: number; skipped: boolean }> {
  const hasPref =
    extracted.preference_personal != null &&
    Object.keys(extracted.preference_personal).length > 0;
  const hasRel =
    typeof extracted.relation === "string" && extracted.relation.trim().length > 0;
  const newMems = Array.isArray(extracted.memories_personal)
    ? extracted.memories_personal.map((m) => String(m).trim()).filter(Boolean)
    : [];
  const hasMem = newMems.length > 0;
  if (!hasPref && !hasRel && !hasMem) {

    return { rev: 0, skipped: true };
  }

  const raw = await readOnt(env, cloneId, userId);
  let current: Record<string, unknown> = {
    address: null,
    memories_personal: [],
    relation: null,
    preference_personal: {},
    _meta: { layer: "L2", rev: 0 },
  };
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        current = parsed as Record<string, unknown>;
      }
    } catch {
      console.error(`[D1_CORRUPT] l2:${cloneId}:uid:${String(userId).slice(-3)} — overwriting on auto-learn`);
    }
  }
  const meta = (current._meta ?? {}) as Record<string, unknown>;
  const prevRev = typeof meta.rev === "number" ? meta.rev : 0;

  const curMems = Array.isArray(current.memories_personal)
    ? (current.memories_personal as unknown[]).map((m) => String(m))
    : [];
  const mergedMems = hasMem
    ? (() => {
        const newSet = new Set(newMems);
        return [...curMems.filter((m) => !newSet.has(m)), ...newMems].slice(-MAX_MEMORIES);
      })()
    : curMems;

  const now = new Date().toISOString();

  const PREF_HISTORY_CAP = 20;
  const curPref = (current.preference_personal as Record<string, unknown>) ?? {};
  const curHistory = Array.isArray(current.preference_history)
    ? (current.preference_history as Array<Record<string, unknown>>)
    : [];
  let nextHistory = curHistory;
  const trackHistory = env.L2_PREF_HISTORY_ENABLED === "1";
  if (trackHistory && hasPref) {
    const changes: Array<Record<string, unknown>> = [];
    for (const [k, v] of Object.entries(extracted.preference_personal!)) {
      if (Object.hasOwn(curPref, k) && curPref[k] !== v) {
        changes.push({ key: k, from: curPref[k], to: v, at: now });
      }
    }
    if (changes.length) nextHistory = [...curHistory, ...changes].slice(-PREF_HISTORY_CAP);
  }

  const next: Record<string, unknown> = {
    address: current.address ?? null,
    memories_personal: mergedMems,
    relation: hasRel ? extracted.relation!.trim() : current.relation ?? null,
    preference_personal: hasPref
      ? { ...curPref, ...extracted.preference_personal }
      : curPref,
    ...(nextHistory.length ? { preference_history: nextHistory } : {}),

    ...(current.memory_summary !== undefined ? { memory_summary: current.memory_summary } : {}),
    ...(current.relationship !== undefined ? { relationship: current.relationship } : {}),
    ...(current.context !== undefined ? { context: current.context } : {}),
    ...(current.recent_topics !== undefined ? { recent_topics: current.recent_topics } : {}),
    _meta: { layer: "L2", rev: prevRev + 1, auto_learned_at: now, source, updated_at: now },
  };

  let serialized = JSON.stringify(next);
  while (serialized.length > MAX_L2_BYTES) {
    if ((next.memories_personal as string[]).length > 0) {
      (next.memories_personal as string[]).shift(); 
    } else if (
      Array.isArray(next.preference_history) &&
      (next.preference_history as unknown[]).length > 0
    ) {
      (next.preference_history as unknown[]).shift(); 
    } else {
      break;
    }
    serialized = JSON.stringify(next);
  }
  if (serialized.length > MAX_L2_BYTES) {
    throw new Error(`L2 payload too large (${serialized.length}B > ${MAX_L2_BYTES}B).`);
  }
  await writeOnt(env, cloneId, userId, serialized, true); 
  return { rev: prevRev + 1, skipped: false };
}

export async function readOntPerson(
  env: Bindings, cloneId: number, personId: number,
): Promise<string | null> {
  const row = await env.DB.prepare(
    'SELECT data FROM clone_ont_person WHERE clone_id = ? AND person_id = ?'
  ).bind(cloneId, personId).first<{ data: string }>();
  return row?.data ?? null;
}

export async function writeOntPerson(
  env: Bindings, cloneId: number, personId: number, data: string, markAutoLearned = false,
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO clone_ont_person (clone_id, person_id, data, updated_at, auto_learned_at)
     VALUES (?, ?, ?, unixepoch(), ?)
     ON CONFLICT(clone_id, person_id) DO UPDATE SET
       data = excluded.data,
       updated_at = excluded.updated_at,
       auto_learned_at = COALESCE(excluded.auto_learned_at, clone_ont_person.auto_learned_at)`,
  ).bind(cloneId, personId, data, markAutoLearned ? Math.floor(Date.now() / 1000) : null).run();
}

export async function updateOntPersonFromExtraction(
  env: Bindings,
  cloneId: number,
  personId: number,
  extracted: L2Extraction,
  source: "call" | "chat",
): Promise<{ rev: number; skipped: boolean }> {
  const hasPref =
    extracted.preference_personal != null &&
    Object.keys(extracted.preference_personal).length > 0;
  const hasRel =
    typeof extracted.relation === "string" && extracted.relation.trim().length > 0;
  const newMems = Array.isArray(extracted.memories_personal)
    ? extracted.memories_personal.map((m) => String(m).trim()).filter(Boolean)
    : [];
  const hasMem = newMems.length > 0;
  if (!hasPref && !hasRel && !hasMem) {

    return { rev: 0, skipped: true };
  }

  const raw = await readOntPerson(env, cloneId, personId);
  let current: Record<string, unknown> = {
    address: null,
    memories_personal: [],
    relation: null,
    preference_personal: {},
    _meta: { layer: "L2p", rev: 0 },
  };
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        current = parsed as Record<string, unknown>;
      }
    } catch {
      console.error(`[D1_CORRUPT] l2p:${cloneId}:pid:${String(personId).slice(-3)} — overwriting on auto-learn`);
    }
  }
  const meta = (current._meta ?? {}) as Record<string, unknown>;
  const prevRev = typeof meta.rev === "number" ? meta.rev : 0;

  const curMems = Array.isArray(current.memories_personal)
    ? (current.memories_personal as unknown[]).map((m) => String(m))
    : [];
  const mergedMems = hasMem
    ? (() => {
        const newSet = new Set(newMems);
        return [...curMems.filter((m) => !newSet.has(m)), ...newMems].slice(-MAX_MEMORIES);
      })()
    : curMems;

  const now = new Date().toISOString();
  const next: Record<string, unknown> = {
    address: current.address ?? null,
    memories_personal: mergedMems,
    relation: hasRel ? extracted.relation!.trim() : current.relation ?? null,
    preference_personal: hasPref
      ? {
          ...((current.preference_personal as Record<string, unknown>) ?? {}),
          ...extracted.preference_personal,
        }
      : current.preference_personal ?? {},
    ...(current.memory_summary !== undefined ? { memory_summary: current.memory_summary } : {}),
    ...(current.relationship !== undefined ? { relationship: current.relationship } : {}),
    ...(current.context !== undefined ? { context: current.context } : {}),
    ...(current.recent_topics !== undefined ? { recent_topics: current.recent_topics } : {}),
    _meta: { layer: "L2p", rev: prevRev + 1, auto_learned_at: now, source, updated_at: now },
  };

  let serialized = JSON.stringify(next);
  while (
    serialized.length > MAX_L2_BYTES &&
    (next.memories_personal as string[]).length > 0
  ) {
    (next.memories_personal as string[]).shift();
    serialized = JSON.stringify(next);
  }
  if (serialized.length > MAX_L2_BYTES) {
    throw new Error(`L2' payload too large (${serialized.length}B > ${MAX_L2_BYTES}B).`);
  }
  await writeOntPerson(env, cloneId, personId, serialized, true);
  return { rev: prevRev + 1, skipped: false };
}
