

export interface KnowledgeQuestion {
  key: string;
  label: string;
  hint?: string;
  optional?: boolean;
}

export type KQValidateResult =
  | { ok: true; questions: KnowledgeQuestion[] }
  | { ok: false; error: string };

const MAX_QUESTIONS = 50;
const KEY_REGEX = /^[a-zA-Z0-9_]{1,50}$/;
const KEY_BLOCKED = new Set(["__proto__", "constructor", "prototype"]);

export function validateKnowledgeQuestions(input: unknown): KQValidateResult {
  if (!Array.isArray(input)) return { ok: false, error: "schema must be an array" };
  if (input.length > MAX_QUESTIONS)
    return { ok: false, error: `too many questions: max ${MAX_QUESTIONS}` };
  const keys = new Set<string>();
  const out: KnowledgeQuestion[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== "object") return { ok: false, error: "question must be an object" };
    const q = raw as Record<string, unknown>;
    if (typeof q.key !== "string" || !q.key.trim()) return { ok: false, error: "missing key" };
    if (!KEY_REGEX.test(q.key)) return { ok: false, error: `invalid key format: ${q.key}` };
    if (KEY_BLOCKED.has(q.key)) return { ok: false, error: `blocked key: ${q.key}` };
    if (keys.has(q.key)) return { ok: false, error: `duplicate key: ${q.key}` };
    keys.add(q.key);
    if (typeof q.label !== "string" || !q.label.trim()) return { ok: false, error: `missing label for ${q.key}` };
    if (q.label.length > 200) return { ok: false, error: `label too long for ${q.key}` };
    if (q.hint !== undefined && (typeof q.hint !== "string" || q.hint.length > 200))
      return { ok: false, error: `invalid hint for ${q.key}` };
    const item: KnowledgeQuestion = { key: q.key, label: q.label };
    if (typeof q.hint === "string" && q.hint.trim()) item.hint = q.hint;
    if (q.optional === true) item.optional = true;
    out.push(item);
  }
  return { ok: true, questions: out };
}

export async function loadKnowledgeQuestions(db: D1Database): Promise<KnowledgeQuestion[]> {
  const row = await db
    .prepare("SELECT schema_json FROM knowledge_question_schema WHERE id = 1")
    .first<{ schema_json: string }>();
  if (!row?.schema_json) return [];
  try {
    const parsed = JSON.parse(row.schema_json);
    const r = validateKnowledgeQuestions(parsed);
    return r.ok ? r.questions : [];
  } catch {
    return [];
  }
}
