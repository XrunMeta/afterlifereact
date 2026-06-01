

import { v_24564b, type v_1f7dcf } from "./personaResolver";
import type { v_6679b6 } from "./systemPersona";

export interface PersonaBundle {
  l0: v_6679b6;
  cloneId: string;
  persona: v_1f7dcf;
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
  v_6e0fd3
): PersonaBundle {
  return { l0: v_b6c480, cloneId: String(v_6e0fd3), persona: v_5ed063 };
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
