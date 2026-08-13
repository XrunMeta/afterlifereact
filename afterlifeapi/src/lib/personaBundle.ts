

import { v_24564b, type v_1f7dcf } from "./personaResolver";
import type { v_6679b6 } from "./systemPersona";

export interface PersonaBundle {
  l0: v_6679b6;
  cloneId: string;
  persona: v_1f7dcf;

  viewer: { displayName: string | null; ownerPersonId?: number | null };
}

function v_4c95c2(v_fd5f43): v_1f7dcf | null {
  if (!v_fd5f43) return null;
  try {
    const v_81e2ef = JSON.parse(v_fd5f43);
    return v_81e2ef && typeof v_81e2ef === "object" ? (v_81e2ef as v_1f7dcf) : null;
  } catch {
    return null;
  }
}

export async function v_db508f(
  v_a1651b,
  v_6e0fd3
): Promise<{ l1: v_1f7dcf | null; l2: v_1f7dcf | null }> {
  const v_3ac7e7 = await v_a1651b
    .prepare("SELECT l1_profile, l2_profile FROM clones WHERE id = ?")
    .bind(v_6e0fd3)
    .first<{ l1_profile: string | null; l2_profile: string | null }>();
  return { l1: v_4c95c2(v_3ac7e7?.l1_profile ?? null), l2: v_4c95c2(v_3ac7e7?.l2_profile ?? null) };
}

export function v_445ba7(
  l0: v_6679b6,
  persona: v_1f7dcf,
  v_6e0fd3,
  v_debed8
): PersonaBundle {
  return {
    l0: v_b6c480,
    cloneId: String(v_6e0fd3),
    persona: v_5ed063,
    viewer: v_debed8 ?? { displayName: null, ownerPersonId: null },
  };
}

export async function v_83a5b9(
  v_a1651b,
  v_6e0fd3,
  v_43e90c
): Promise<number | null> {
  const v_3ac7e7 = await v_a1651b
    .prepare(
      "SELECT json_extract(data, '$.owner_person_id') AS owner FROM clone_ont WHERE clone_id = ? AND user_id = ?"
    )
    .bind(v_6e0fd3, v_43e90c)
    .first<{ owner: number | string | null }>();
  const v_479f05 = v_3ac7e7?.owner;
  if (v_479f05 == null) return null;
  const v_f4e98d = typeof v_479f05 === "number" ? v_479f05 : Number(v_479f05);
  return Number.isInteger(v_f4e98d) && v_f4e98d > 0 ? v_f4e98d : null;
}

export async function v_a752e9(
  v_a1651b,
  v_6e0fd3,
  v_43e90c,
  v_ca1ec5
): Promise<boolean> {
  const v_8f00b9 = await v_a1651b
    .prepare(
      `UPDATE clone_ont
          SET data = json_set(COALESCE(data, '{}'), '$.owner_person_id', ?)
        WHERE clone_id = ? AND user_id = ?
          AND json_extract(COALESCE(data, '{}'), '$.owner_person_id') IS NULL`
    )
    .bind(v_ca1ec5, v_6e0fd3, v_43e90c)
    .run();
  return (v_8f00b9.meta?.changes ?? 0) > 0;
}

const v_f4c771 = [
  "memory_summary", "relationship", "context", "recent_topics",   
  "relation", "preference_personal", "memories_personal",          
  "preference_history",                                            

  "relation_category", "relation_subtype", "relation_episode", "address_form",
  "speech_form", "job_category", "job_detail",
] as const;

export async function v_20b0e8(
  v_a1651b,
  v_6e0fd3,
  v_43e90c
): Promise<v_1f7dcf | null> {
  const v_3ac7e7 = await v_a1651b
    .prepare("SELECT data FROM clone_ont WHERE clone_id = ? AND user_id = ?")
    .bind(v_6e0fd3, v_43e90c)
    .first<{ data: string | null }>();
  if (!v_3ac7e7?.data) return null;
  let v_8decf8;
  try {
    v_8decf8 = JSON.parse(v_3ac7e7.data);
  } catch {
    return null;
  }
  const v_8d4337 = {};
  for (const v_0eb677 of v_f4c771) {
    const v_81e2ef = v_8decf8[v_0eb677];
    if (v_81e2ef == null) continue;
    if (typeof v_81e2ef === "string" && v_81e2ef.length === 0) continue;
    if (Array.isArray(v_81e2ef) && v_81e2ef.length === 0) continue;
    if (typeof v_81e2ef === "object" && !Array.isArray(v_81e2ef) && Object.keys(v_81e2ef).length === 0) continue;
    v_8d4337[v_0eb677] = v_81e2ef;
  }
  return Object.keys(v_8d4337).length ? (v_8d4337 as v_1f7dcf) : null;
}

export function v_56dc8c(l1: v_1f7dcf | null): v_1f7dcf | null {
  if (!v_020b4b) return null;
  const v_3555ae = (v_020b4b as { attrs?: Record<string, unknown> }).attrs;
  if (v_3555ae && typeof v_3555ae === "object") {
    const { attrs: v_9bd854, ...v_83bbcd } = v_020b4b as Record<string, unknown>;
    return { ...v_3555ae, ...v_83bbcd };  
  }
  return v_020b4b;
}
