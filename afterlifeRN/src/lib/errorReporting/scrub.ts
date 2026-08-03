

const REDACTED = "[Redacted]";

const TOKEN_PATTERNS: RegExp[] = [
  /\bBearer\s+[A-Za-z0-9\-._~+/]+=*/gi,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
  /\b(access[_-]?token|refresh[_-]?token|id[_-]?token)\s*[:=]\s*["']?[^"',\s}]+/gi,
  /\bAuthorization\s*[:=]\s*["']?[^"',\s}]+/gi,
  /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/g,
  /\b01[016789][.\-\s]?\d{3,4}[.\-\s]?\d{4}\b/g,
];

const SENSITIVE_KEY =
  /oth-pathorization|token|password|passwd|secret|api[_-]?key|cookie|set[_-]?cookie|transcript|transcription|utterance|speechText|sttText|userSpeech|(^|[_.-])l2($|[A-Z_.-])|l2Memory|personaMemory|embedding|faceEmbedding/i;

export function scrubString(input: string): string {
  let out = input;
  for (const re of TOKEN_PATTERNS) {
    out = out.replace(re, REDACTED);
  }
  return out;
}

export function scrubValue(value: unknown, depth = 0): unknown {
  if (depth > 6) return REDACTED;
  if (value == null) return value;
  if (typeof value === "string") return scrubString(value);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.map((v) => scrubValue(v, depth + 1));
  if (typeof value === "object") {
    const src = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(src)) {
      if (SENSITIVE_KEY.test(k)) {
        out[k] = REDACTED;
      } else {
        out[k] = scrubValue(v, depth + 1);
      }
    }
    return out;
  }
  return String(value);
}

export function scrubErrorMessage(message: string | undefined): string {
  if (!message) return "";
  return scrubString(message);
}

export type SafeBreadcrumb = {
  category: string;
  message: string;
  data?: Record<string, unknown>;
  ts: number;
};

export function scrubBreadcrumb(bc: {
  category: string;
  message: string;
  data?: Record<string, unknown>;
}): SafeBreadcrumb {
  return {
    category: scrubString(bc.category).slice(0, 64),
    message: scrubString(bc.message).slice(0, 200),
    data: bc.data
      ? (scrubValue(bc.data) as Record<string, unknown>)
      : undefined,
    ts: Date.now(),
  };
}
