

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
const MAX_QUESTIONS = 50;
const KEY_REGEX = /^[a-zA-Z0-9_]{1,50}$/;
const TARGET_FIELD_BLOCKED = new Set(["__proto__", "constructor", "prototype"]);

export function validatePersonaQuestions(input: unknown): ValidateResult {
  if (!Array.isArray(input)) return { ok: false, error: "schema must be an array" };
  if (input.length > MAX_QUESTIONS)
    return { ok: false, error: `too many questions: max ${MAX_QUESTIONS}` };
  const keys = new Set<string>();
  const out: PersonaQuestion[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== "object") return { ok: false, error: "question must be an object" };
    const q = raw as Record<string, unknown>;
    if (typeof q.key !== "string" || !q.key.trim()) return { ok: false, error: "missing key" };
    if (!KEY_REGEX.test(q.key)) return { ok: false, error: `invalid key format: ${q.key}` };
    if (keys.has(q.key)) return { ok: false, error: `duplicate key: ${q.key}` };
    keys.add(q.key);
    if (typeof q.type !== "string" || !TYPES.includes(q.type as PersonaQuestionType))
      return { ok: false, error: `invalid type for ${q.key}` };
    if (typeof q.label !== "string" || !q.label.trim()) return { ok: false, error: `missing label for ${q.key}` };
    if (q.label.length > 200) return { ok: false, error: `label too long for ${q.key}` };
    if (q.type === "fixed_choice") {
      if (!Array.isArray(q.options) || q.options.length === 0)
        return { ok: false, error: `fixed_choice ${q.key} needs options` };
      if (!q.options.every((o) => typeof o === "string"))
        return { ok: false, error: `options must be strings for ${q.key}` };
      if (q.options.length > 20)
        return { ok: false, error: `options too many for ${q.key}: max 20` };
      for (const o of q.options as string[]) {
        if (o.length > 200) return { ok: false, error: `option value too long for ${q.key}` };
      }
    }
    if (q.options_include !== undefined) {
      if (!Array.isArray(q.options_include))
        return { ok: false, error: `options_include must be array for ${q.key}` };
      if (q.options_include.length > 20)
        return { ok: false, error: `options_include too many for ${q.key}: max 20` };
      for (const o of q.options_include as unknown[]) {
        if (typeof o !== "string") return { ok: false, error: `options_include items must be strings for ${q.key}` };
        if ((o as string).length > 200) return { ok: false, error: `options_include value too long for ${q.key}` };
      }
    }
    if (q.targetField !== undefined) {
      if (typeof q.targetField !== "string" || !KEY_REGEX.test(q.targetField))
        return { ok: false, error: `invalid targetField format for ${q.key}` };
      if (TARGET_FIELD_BLOCKED.has(q.targetField))
        return { ok: false, error: `forbidden targetField for ${q.key}: ${q.targetField}` };
    }
    if (q.showWhen !== undefined) {
      if (!q.showWhen || typeof q.showWhen !== "object" || Array.isArray(q.showWhen))
        return { ok: false, error: `showWhen must be an object for ${q.key}` };
      for (const [refKey, val] of Object.entries(q.showWhen as Record<string, unknown>)) {
        if (typeof val !== "string" || val.length > 200)
          return { ok: false, error: `showWhen value too long for ${q.key}` };

        if (refKey === q.key)
          return { ok: false, error: `showWhen self-reference not allowed for ${q.key}` };
      }
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

  const adjMap = new Map<string, string[]>();
  for (const q of out) {
    if (q.showWhen) adjMap.set(q.key, Object.keys(q.showWhen));
  }
  const visited = new Set<string>();
  const inStack = new Set<string>();
  function hasCycle(node: string): boolean {
    if (inStack.has(node)) return true;
    if (visited.has(node)) return false;
    visited.add(node);
    inStack.add(node);
    for (const neighbor of adjMap.get(node) ?? []) {
      if (hasCycle(neighbor)) return true;
    }
    inStack.delete(node);
    return false;
  }
  for (const q of out) {
    if (!visited.has(q.key) && hasCycle(q.key)) {
      return { ok: false, error: `showWhen circular reference detected involving: ${q.key}` };
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
