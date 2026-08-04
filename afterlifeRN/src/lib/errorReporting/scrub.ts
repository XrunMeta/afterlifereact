

const v_6a4215 = "[Redacted]";

const v_8628b6 = [
  /\bBearer\s+[A-Za-z0-9\-._~+/]+=*/gi,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
  /\b(access[_-]?token|refresh[_-]?token|id[_-]?token)\s*[:=]\s*["']?[^"',\s}]+/gi,
  /\bAuthorization\s*[:=]\s*["']?[^"',\s}]+/gi,
  /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/g,
  /\b01[016789][.\-\s]?\d{3,4}[.\-\s]?\d{4}\b/g,
];

const v_bed1c6 =
  /oth-pathorization|token|password|passwd|secret|api[_-]?key|cookie|set[_-]?cookie|transcript|transcription|utterance|speechText|sttText|userSpeech|(^|[_.-])l2($|[A-Z_.-])|l2Memory|personaMemory|embedding|faceEmbedding/i;

export function v_6f333a(v_bbda62): string {
  let v_8d4337 = v_bbda62;
  for (const v_d95200 of v_8628b6) {
    v_8d4337 = v_8d4337.replace(v_d95200, v_6a4215);
  }
  return v_8d4337;
}

export function v_138422(v_3b402b, v_c17376 = 0): unknown {
  if (v_c17376 > 6) return v_6a4215;
  if (v_3b402b == null) return v_3b402b;
  if (typeof v_3b402b === "string") return v_6f333a(v_3b402b);
  if (typeof v_3b402b === "number" || typeof v_3b402b === "boolean") return v_3b402b;
  if (Array.isArray(v_3b402b)) return v_3b402b.map((v_81e2ef) => v_138422(v_81e2ef, v_c17376 + 1));
  if (typeof v_3b402b === "object") {
    const v_38d084 = v_3b402b as Record<string, unknown>;
    const v_8d4337 = {};
    for (const [v_0eb677, v_81e2ef] of Object.entries(v_38d084)) {
      if (v_bed1c6.test(v_0eb677)) {
        v_8d4337[v_0eb677] = v_6a4215;
      } else {
        v_8d4337[v_0eb677] = v_138422(v_81e2ef, v_c17376 + 1);
      }
    }
    return v_8d4337;
  }
  return String(v_3b402b);
}

export function v_9effa0(v_a8cd21): string {
  if (!v_a8cd21) return "";
  return v_6f333a(v_a8cd21);
}

export type SafeBreadcrumb = {
  category: string;
  message: string;
  data?: Record<string, unknown>;
  ts: number;
};

export function v_c13d03(v_19ac81): SafeBreadcrumb {
  return {
    category: v_6f333a(v_19ac81.category).slice(0, 64),
    message: v_6f333a(v_19ac81.message).slice(0, 200),
    data: v_19ac81.data
      ? (v_138422(v_19ac81.data) as Record<string, unknown>)
      : undefined,
    ts: Date.now(),
  };
}
