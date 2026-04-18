

export type PersonaDict = Record<string, unknown>;

export interface PersonaLayers {
  l1: PersonaDict | null;  
  l2: PersonaDict | null;  
}

const L1_FORCE_FIELDS = new Set<string>([
  "tone",
  "personality_core",
  "mood_overrides",
  "voice_style",
  "speech_patterns",
]);

const L2_OVERRIDE_FIELDS = new Set<string>([
  "memory_summary",
  "relationship",
  "context",
  "recent_topics",
]);

export function parseLayer(raw: string | null): PersonaDict | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as PersonaDict;
    }
    return null;
  } catch {
    return null;
  }
}

export function resolvePersona(layers: PersonaLayers): PersonaDict {
  const { l1, l2 } = layers;
  const out: PersonaDict = {};

  if (l1) {
    for (const [k, v] of Object.entries(l1)) {
      if (v !== undefined) out[k] = v;
    }
  }

  if (l2) {
    for (const [k, v] of Object.entries(l2)) {
      if (v === undefined) continue;
      if (L1_FORCE_FIELDS.has(k)) continue; 
      if (L2_OVERRIDE_FIELDS.has(k) || !(k in out)) {
        out[k] = v;
      }

    }
  }

  return out;
}

export function resolveLegacyPersona(personaRaw: string | null): PersonaDict {
  const l1 = parseLayer(personaRaw);
  return resolvePersona({ l1, l2: null });
}
