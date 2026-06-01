

export type PersonaQuestionType = "gemma_choice" | "fixed_choice" | "text";

export interface PersonaQuestion {
  key: string;
  type: PersonaQuestionType;
  label: string;
  targetField?: string;            
  options?: string[];              
  options_include?: string[];      
  showWhen?: Record<string, string>; 
  optional?: boolean;
}

export type ValidateResult =
  | { ok: true; questions: PersonaQuestion[] }
  | { ok: false; error: string };

const TYPES: PersonaQuestionType[] = ["gemma_choice", "fixed_choice", "text"];

export function validatePersonaQuestions(input: unknown): ValidateResult {
  if (!Array.isArray(input)) return { ok: false, error: "schema must be an array" };
  const keys = new Set<string>();
  const out: PersonaQuestion[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== "object") return { ok: false, error: "question must be an object" };
    const q = raw as Record<string, unknown>;
    if (typeof q.key !== "string" || !q.key.trim()) return { ok: false, error: "missing key" };
    if (keys.has(q.key)) return { ok: false, error: `duplicate key: ${q.key}` };
    keys.add(q.key);
    if (typeof q.type !== "string" || !TYPES.includes(q.type as PersonaQuestionType))
      return { ok: false, error: `invalid type for ${q.key}` };
    if (typeof q.label !== "string" || !q.label.trim()) return { ok: false, error: `missing label for ${q.key}` };
    if (q.type === "fixed_choice") {
      if (!Array.isArray(q.options) || q.options.length === 0)
        return { ok: false, error: `fixed_choice ${q.key} needs options` };
      if (!q.options.every((o) => typeof o === "string"))
        return { ok: false, error: `options must be strings for ${q.key}` };
    }
    out.push(raw as PersonaQuestion);
  }

  for (const q of out) {
    if (q.showWhen) {
      for (const ref of Object.keys(q.showWhen)) {
        if (!keys.has(ref)) return { ok: false, error: `showWhen references unknown key: ${ref}` };
      }
    }
  }
  return { ok: true, questions: out };
}

export async function loadPersonaQuestions(db: D1Database): Promise<PersonaQuestion[]> {
  const row = await db
    .prepare("SELECT schema_json FROM persona_question_schema WHERE id = 1")
    .first<{ schema_json: string }>();
  if (!row?.schema_json) return [];
  try {
    const parsed = JSON.parse(row.schema_json);
    const r = validatePersonaQuestions(parsed);
    return r.ok ? r.questions : [];
  } catch {
    return [];
  }
}
