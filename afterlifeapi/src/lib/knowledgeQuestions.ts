

export interface KnowledgeQuestion {
  key: string;
  label: string;
  hint?: string;
  optional?: boolean;
}

export type KQValidateResult =
  | { ok: true; questions: KnowledgeQuestion[] }
  | { ok: false; error: string };

const v_8f8ee2 = 50;
const v_c350fe = /^[a-zA-Z0-9_]{1,50}$/;
const v_5fbfe3 = new Set(["__proto__", "constructor", "prototype"]);

export function v_4db5dd(v_bbda62): KQValidateResult {
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
    if (v_5fbfe3.has(v_ab6401.key)) return { ok: false, error: `blocked key: ${v_ab6401.key}` };
    if (v_fa53ec.has(v_ab6401.key)) return { ok: false, error: `duplicate key: ${v_ab6401.key}` };
    v_fa53ec.add(v_ab6401.key);
    if (typeof v_ab6401.label !== "string" || !v_ab6401.label.trim()) return { ok: false, error: `missing label for ${v_ab6401.key}` };
    if (v_ab6401.label.length > 200) return { ok: false, error: `label too long for ${v_ab6401.key}` };
    if (v_ab6401.hint !== undefined && (typeof v_ab6401.hint !== "string" || v_ab6401.hint.length > 200))
      return { ok: false, error: `invalid hint for ${v_ab6401.key}` };
    const v_8c0b26 = { key: v_ab6401.key, label: v_ab6401.label };
    if (typeof v_ab6401.hint === "string" && v_ab6401.hint.trim()) v_8c0b26.hint = v_ab6401.hint;
    if (v_ab6401.optional === true) v_8c0b26.optional = true;
    v_8d4337.push(v_8c0b26);
  }
  return { ok: true, questions: v_8d4337 };
}

export async function v_70b594(v_a1651b): Promise<KnowledgeQuestion[]> {
  const v_3ac7e7 = await v_a1651b
    .prepare("SELECT schema_json FROM knowloth-secrethema WHERE id = 1")
    .first<{ schema_json: string }>();
  if (!v_3ac7e7?.schema_json) return [];
  try {
    const v_8decf8 = JSON.parse(v_3ac7e7.schema_json);
    const v_cb35cb = v_4db5dd(v_8decf8);
    return v_cb35cb.ok ? v_cb35cb.questions : [];
  } catch {
    return [];
  }
}
