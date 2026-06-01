

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
const v_8f8ee2 = 50;
const v_c350fe = /^[a-zA-Z0-9_]{1,50}$/;

const v_2905ae = new Set(["__proto__", "constructor", "prototype", "attrs"]);

export function v_02d529(v_bbda62): ValidateResult {
  if (!Array.isArray(v_bbda62)) return { ok: false, error: "schema must be an array" };
  if (v_bbda62.length > v_8f8ee2)
    return { ok: false, error: `too many questions: max ${v_8f8ee2}` };
  const v_fa53ec = new Set<string>();
  const v_8d4337 = [];
  for (const v_479f05 of v_bbda62) {
    if (!v_479f05 || typeof v_479f05 !== "object") return { ok: false, error: "question must be an object" };
    const v_ab6401 = v_479f05 as Record<string, unknown>;
    if (typeof v_ab6401.key !== "string" || !v_ab6401.key.trim()) return { ok: false, error: "missing key" };
    if (!v_c350fe.test(v_ab6401.key)) return { ok: false, error: `invalid key format: ${v_ab6401.key}` };
    if (v_fa53ec.has(v_ab6401.key)) return { ok: false, error: `duplicate key: ${v_ab6401.key}` };
    v_fa53ec.add(v_ab6401.key);
    if (typeof v_ab6401.type !== "string" || !v_d8632e.includes(v_ab6401.type as PersonaQuestionType))
      return { ok: false, error: `invalid type for ${v_ab6401.key}` };
    if (typeof v_ab6401.label !== "string" || !v_ab6401.label.trim()) return { ok: false, error: `missing label for ${v_ab6401.key}` };
    if (v_ab6401.label.length > 200) return { ok: false, error: `label too long for ${v_ab6401.key}` };
    if (v_ab6401.type === "fixed_choice") {
      if (!Array.isArray(v_ab6401.options) || v_ab6401.options.length === 0)
        return { ok: false, error: `fixed_choice ${v_ab6401.key} needs options` };
      if (!v_ab6401.options.every((v_b6c474) => typeof v_b6c474 === "string"))
        return { ok: false, error: `options must be strings for ${v_ab6401.key}` };
      if (v_ab6401.options.length > 20)
        return { ok: false, error: `options too many for ${v_ab6401.key}: max 20` };
      for (const v_b6c474 of v_ab6401.options as string[]) {
        if (v_b6c474.length > 200) return { ok: false, error: `option value too long for ${v_ab6401.key}` };
      }
    }
    if (v_ab6401.options_include !== undefined) {
      if (!Array.isArray(v_ab6401.options_include))
        return { ok: false, error: `options_include must be array for ${v_ab6401.key}` };
      if (v_ab6401.options_include.length > 20)
        return { ok: false, error: `options_include too many for ${v_ab6401.key}: max 20` };
      for (const v_b6c474 of v_ab6401.options_include as unknown[]) {
        if (typeof v_b6c474 !== "string") return { ok: false, error: `options_include items must be strings for ${v_ab6401.key}` };
        if ((v_b6c474 as string).length > 200) return { ok: false, error: `options_include value too long for ${v_ab6401.key}` };
      }
    }
    if (v_ab6401.targetField !== undefined) {
      if (typeof v_ab6401.targetField !== "string" || !v_c350fe.test(v_ab6401.targetField))
        return { ok: false, error: `invalid targetField format for ${v_ab6401.key}` };
      if (v_2905ae.has(v_ab6401.targetField))
        return { ok: false, error: `forbidden targetField for ${v_ab6401.key}: ${v_ab6401.targetField}` };
    }
    if (v_ab6401.showWhen !== undefined) {
      if (!v_ab6401.showWhen || typeof v_ab6401.showWhen !== "object" || Array.isArray(v_ab6401.showWhen))
        return { ok: false, error: `showWhen must be an object for ${v_ab6401.key}` };
      for (const [v_3c1d34, v_a057b5] of Object.entries(v_ab6401.showWhen as Record<string, unknown>)) {
        if (typeof v_a057b5 !== "string" || v_a057b5.length > 200)
          return { ok: false, error: `showWhen value too long for ${v_ab6401.key}` };

        if (v_3c1d34 === v_ab6401.key)
          return { ok: false, error: `showWhen self-reference not allowed for ${v_ab6401.key}` };
      }
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

  const v_a870e6 = new Map<string, string[]>();
  for (const v_ab6401 of v_8d4337) {
    if (v_ab6401.showWhen) v_a870e6.set(v_ab6401.key, Object.keys(v_ab6401.showWhen));
  }
  const v_79f44d = new Set<string>();
  const v_124ffc = new Set<string>();
  function v_19bf6f(v_aab306): boolean {
    if (v_124ffc.has(v_aab306)) return true;
    if (v_79f44d.has(v_aab306)) return false;
    v_79f44d.add(v_aab306);
    v_124ffc.add(v_aab306);
    for (const v_6f269b of v_a870e6.get(v_aab306) ?? []) {
      if (v_19bf6f(v_6f269b)) return true;
    }
    v_124ffc.delete(v_aab306);
    return false;
  }
  for (const v_ab6401 of v_8d4337) {
    if (!v_79f44d.has(v_ab6401.key) && v_19bf6f(v_ab6401.key)) {
      return { ok: false, error: `showWhen circular reference detected involving: ${v_ab6401.key}` };
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
