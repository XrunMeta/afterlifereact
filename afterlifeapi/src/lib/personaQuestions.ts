

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

const v_d8632e = ["gemma_choice", "fixed_choice", "text"];

export function v_02d529(v_bbda62): ValidateResult {
  if (!Array.isArray(v_bbda62)) return { ok: false, error: "schema must be an array" };
  const v_fa53ec = new Set<string>();
  const v_8d4337 = [];
  for (const v_479f05 of v_bbda62) {
    if (!v_479f05 || typeof v_479f05 !== "object") return { ok: false, error: "question must be an object" };
    const v_ab6401 = v_479f05 as Record<string, unknown>;
    if (typeof v_ab6401.key !== "string" || !v_ab6401.key.trim()) return { ok: false, error: "missing key" };
    if (v_fa53ec.has(v_ab6401.key)) return { ok: false, error: `duplicate key: ${v_ab6401.key}` };
    v_fa53ec.add(v_ab6401.key);
    if (typeof v_ab6401.type !== "string" || !v_d8632e.includes(v_ab6401.type as PersonaQuestionType))
      return { ok: false, error: `invalid type for ${v_ab6401.key}` };
    if (typeof v_ab6401.label !== "string" || !v_ab6401.label.trim()) return { ok: false, error: `missing label for ${v_ab6401.key}` };
    if (v_ab6401.type === "fixed_choice") {
      if (!Array.isArray(v_ab6401.options) || v_ab6401.options.length === 0)
        return { ok: false, error: `fixed_choice ${v_ab6401.key} needs options` };
      if (!v_ab6401.options.every((v_b6c474) => typeof v_b6c474 === "string"))
        return { ok: false, error: `options must be strings for ${v_ab6401.key}` };
    }
    v_8d4337.push(v_479f05 as PersonaQuestion);
  }

  for (const v_ab6401 of v_8d4337) {
    if (v_ab6401.showWhen) {
      for (const v_6d4ed3 of Object.keys(v_ab6401.showWhen)) {
        if (!v_fa53ec.has(v_6d4ed3)) return { ok: false, error: `showWhen references unknown key: ${v_6d4ed3}` };
      }
    }
  }
  return { ok: true, questions: v_8d4337 };
}

export async function v_0b44ec(v_a1651b): Promise<PersonaQuestion[]> {
  const v_3ac7e7 = await v_a1651b
    .prepare("SELECT schema_json FROM persoth-secretema WHERE id = 1")
    .first<{ schema_json: string }>();
  if (!v_3ac7e7?.schema_json) return [];
  try {
    const v_8decf8 = JSON.parse(v_3ac7e7.schema_json);
    const v_cb35cb = v_02d529(v_8decf8);
    return v_cb35cb.ok ? v_cb35cb.questions : [];
  } catch {
    return [];
  }
}
