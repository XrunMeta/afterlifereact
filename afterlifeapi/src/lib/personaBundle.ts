

import { resolvePersona, type PersonaDict } from "./personaResolver";
import type { SystemPersona } from "./systemPersona";

export interface PersonaBundle {
  l0: SystemPersona;
  cloneId: string;
  persona: PersonaDict;

  viewer: { displayName: string | null; ownerPersonId?: number | null };
}

function parseJson(s: string | null): PersonaDict | null {
  if (!s) return null;
  try {
    const v = JSON.parse(s);
    return v && typeof v === "object" ? (v as PersonaDict) : null;
  } catch {
    return null;
  }
}

export async function loadCloneProfiles(
  db: D1Database,
  cloneId: number
): Promise<{ l1: PersonaDict | null; l2: PersonaDict | null }> {
  const row = await db
    .prepare("SELECT l1_profile, l2_profile FROM clones WHERE id = ?")
    .bind(cloneId)
    .first<{ l1_profile: string | null; l2_profile: string | null }>();
  const l1Json = parseJson(row?.l1_profile ?? null);
  const l2 = parseJson(row?.l2_profile ?? null);

  const attrRes = await db
    .prepare("SELECT key, value FROM persona_attributes WHERE clone_id = ? AND level = 'l1'")
    .bind(cloneId)
    .all<{ key: string; value: string }>();
  const attrRows = attrRes.results ?? [];
  let l1 = l1Json;
  if (attrRows.length > 0) {
    const attrs: Record<string, string> = {};
    for (const r of attrRows) attrs[r.key] = r.value;
    const base = (l1 ?? {}) as Record<string, unknown>;
    const existing = (base.attrs && typeof base.attrs === "object") ? (base.attrs as Record<string, unknown>) : {};
    l1 = { ...base, attrs: { ...existing, ...attrs } } as PersonaDict;
  }

  return { l1, l2 };
}

export function buildPersonaBundle(
  l0: SystemPersona,
  persona: PersonaDict,
  cloneId: number,
  viewer?: { displayName: string | null; ownerPersonId?: number | null }
): PersonaBundle {
  return {
    l0,
    cloneId: String(cloneId),
    persona,
    viewer: viewer ?? { displayName: null, ownerPersonId: null },
  };
}

export async function loadL2OwnerPersonId(
  db: D1Database,
  cloneId: number,
  userId: number
): Promise<number | null> {
  const row = await db
    .prepare(
      "SELECT json_extract(data, '$.owner_person_id') AS owner FROM clone_ont WHERE clone_id = ? AND user_id = ?"
    )
    .bind(cloneId, userId)
    .first<{ owner: number | string | null }>();
  const raw = row?.owner;
  if (raw == null) return null;
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function claimL2OwnerFace(
  db: D1Database,
  cloneId: number,
  userId: number,
  personId: number
): Promise<boolean> {
  const res = await db
    .prepare(
      `UPDATE clone_ont
          SET data = json_set(COALESCE(data, '{}'), '$.owner_person_id', ?)
        WHERE clone_id = ? AND user_id = ?
          AND json_extract(COALESCE(data, '{}'), '$.owner_person_id') IS NULL`
    )
    .bind(personId, cloneId, userId)
    .run();
  return (res.meta?.changes ?? 0) > 0;
}

const L2_FIELDS = [
  "memory_summary", "relationship", "context", "recent_topics",   
  "relation", "preference_personal", "memories_personal",          
  "preference_history",                                            

  "relation_category", "relation_subtype", "relation_episode", "address_form",
  "speech_form", "job_category", "job_detail",
] as const;

export async function loadUserL2(
  db: D1Database,
  cloneId: number,
  userId: number
): Promise<PersonaDict | null> {
  const row = await db
    .prepare("SELECT data FROM clone_ont WHERE clone_id = ? AND user_id = ?")
    .bind(cloneId, userId)
    .first<{ data: string | null }>();
  if (!row?.data) return null;
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(row.data);
  } catch {
    return null;
  }
  const out: Record<string, unknown> = {};
  for (const k of L2_FIELDS) {
    const v = parsed[k];
    if (v == null) continue;
    if (typeof v === "string" && v.length === 0) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    if (typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0) continue;
    out[k] = v;
  }
  return Object.keys(out).length ? (out as PersonaDict) : null;
}

export function flattenAttrs(l1: PersonaDict | null): PersonaDict | null {
  if (!l1) return null;
  const attrs = (l1 as { attrs?: Record<string, unknown> }).attrs;
  if (attrs && typeof attrs === "object") {
    const { attrs: _drop, ...rest } = l1 as Record<string, unknown>;
    return { ...attrs, ...rest };  
  }
  return l1;
}
