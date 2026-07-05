

export type PersonaDict = Record<string, unknown>;

export interface PersonaLayers {
  l1: PersonaDict | null;  
  l2: PersonaDict | null;  
}

const v_da89e1 = new Set<string>([
  "tone",
  "personality_core",
  "mood_overrides",
  "voice_style",
  "speech_patterns",
]);

const v_c549b1 = new Set<string>([
  "memory_summary",
  "relationship",
  "context",
  "recent_topics",
  "relation",
  "preference_personal",
  "memories_personal",   
  "preference_history",   
]);

export function v_e97fae(v_479f05): PersonaDict | null {
  if (!v_479f05) return null;
  try {
    const v_8decf8 = JSON.parse(v_479f05);
    if (v_8decf8 && typeof v_8decf8 === "object" && !Array.isArray(v_8decf8)) {
      return v_8decf8 as PersonaDict;
    }
    return null;
  } catch {
    return null;
  }
}

export function v_24564b(v_88055a): PersonaDict {
  const { l1: v_020b4b, l2: v_1af19b } = v_88055a;
  const v_8d4337 = {};

  if (v_020b4b) {
    for (const [v_0eb677, v_81e2ef] of Object.entries(v_020b4b)) {
      if (v_81e2ef !== undefined) v_8d4337[v_0eb677] = v_81e2ef;
    }
  }

  if (v_1af19b) {
    for (const [v_0eb677, v_81e2ef] of Object.entries(v_1af19b)) {
      if (v_81e2ef === undefined) continue;
      if (v_da89e1.has(v_0eb677)) continue; 
      if (v_c549b1.has(v_0eb677) || !(v_0eb677 in v_8d4337)) {
        v_8d4337[v_0eb677] = v_81e2ef;
      }

    }
  }

  return v_8d4337;
}

export function v_21ac3e(v_0365dc): PersonaDict {
  const v_020b4b = v_e97fae(v_0365dc);
  return v_24564b({ l1: v_020b4b, l2: null });
}
