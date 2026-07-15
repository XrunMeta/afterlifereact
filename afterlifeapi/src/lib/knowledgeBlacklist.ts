

export type BlacklistValidateResult =
  | { ok: true; words: string[] }
  | { ok: false; error: string };

const v_8b0549 = 500;
const v_afa8b1 = 100;

export function v_1809f7(v_bbda62): BlacklistValidateResult {
  if (!Array.isArray(v_bbda62)) return { ok: false, error: "blacklist must be an array" };
  if (v_bbda62.length > v_8b0549)
    return { ok: false, error: `too many words: max ${v_8b0549}` };
  const v_110a8b = new Set<string>();
  const v_8d4337 = [];
  for (const v_479f05 of v_bbda62) {
    if (typeof v_479f05 !== "string") return { ok: false, error: "each entry must be a string" };
    const v_32f7b8 = v_479f05.trim();
    if (!v_32f7b8) continue; 
    if (v_32f7b8.length > v_afa8b1) return { ok: false, error: `word too long: max ${v_afa8b1}` };
    if (v_110a8b.has(v_32f7b8)) continue; 
    v_110a8b.add(v_32f7b8);
    v_8d4337.push(v_32f7b8);
  }
  return { ok: true, words: v_8d4337 };
}

export async function v_cba618(v_a1651b): Promise<string[]> {
  const v_3ac7e7 = await v_a1651b
    .prepare("SELECT blacklist_json FROM knowledge_blacklist WHERE id = 1")
    .first<{ blacklist_json: string }>();
  if (!v_3ac7e7?.blacklist_json) return [];
  try {
    const v_8decf8 = JSON.parse(v_3ac7e7.blacklist_json);
    const v_cb35cb = v_1809f7(v_8decf8);
    return v_cb35cb.ok ? v_cb35cb.words : [];
  } catch {
    return [];
  }
}

export function v_71b908(v_343c90, v_43516e): string | null {
  if (!v_343c90 || v_43516e.length === 0) return null;
  const v_1cfe9a = v_343c90.toLowerCase();
  for (const v_32f7b8 of v_43516e) {
    if (!v_32f7b8) continue;
    if (v_1cfe9a.includes(v_32f7b8.toLowerCase())) return v_32f7b8;
  }
  return null;
}
