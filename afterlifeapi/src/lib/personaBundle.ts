

import { resolvePersona, type PersonaDict } from "./personaResolver";
import type { SystemPersona } from "./systemPersona";

export interface PersonaBundle {
  l0: SystemPersona;
  cloneId: string;
  persona: PersonaDict;
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
  return { l1: parseJson(row?.l1_profile ?? null), l2: parseJson(row?.l2_profile ?? null) };
}

export function buildPersonaBundle(
  l0: SystemPersona,
  persona: PersonaDict,
  cloneId: number
): PersonaBundle {
  return { l0, cloneId: String(cloneId), persona };
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
