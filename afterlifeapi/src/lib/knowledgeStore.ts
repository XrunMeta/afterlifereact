
export interface KnowledgeItem {
  key: string;
  q: string | null;
  a: string;
  updated_at: number;
}
export interface KnowledgeInput {
  key?: string | null;
  q?: string | null;
  a: string;
}

export const v_5636c2 = 30;
export const v_784376 = 3000;
const v_5fbfe3 = new Set(["__proto__", "constructor", "prototype"]);
const v_783c98 = /^_free_(\d+)$/;

export function v_038cdc(
  v_b50631,
  v_5c2f9f,
): { ok: true; items: KnowledgeItem[] } | { ok: false; error: string } {
  if (!Array.isArray(v_b50631)) return { ok: false, error: "items must be an array" };

  let v_77d1e6 = 0;
  for (const v_23805a of v_b50631) {
    const v_35f85c = typeof v_23805a?.key === "string" ? v_23805a.key.match(v_783c98) : null;
    if (v_35f85c) v_77d1e6 = Math.max(v_77d1e6, Number(v_35f85c[1]));
  }

  const v_fd7614 = new Map<string, KnowledgeItem>();
  for (const v_23805a of v_b50631) {
    if (!v_23805a || typeof v_23805a.a !== "string") continue;
    const v_779914 = v_23805a.a.trim();
    let v_b24339 = typeof v_23805a.key === "string" ? v_23805a.key.trim() : "";
    if (v_b24339 && v_5fbfe3.has(v_b24339)) return { ok: false, error: `blocked key: ${v_b24339}` };
    if (!v_779914) {

      if (v_b24339) v_fd7614.delete(v_b24339);
      continue;
    }
    if (!v_b24339) v_b24339 = `_free_${++v_77d1e6}`;
    const v_ab6401 = typeof v_23805a.q === "string" && v_23805a.q.trim() ? v_23805a.q : null;
    v_fd7614.set(v_b24339, { key: v_b24339, q: v_ab6401, a: v_779914, updated_at: v_5c2f9f }); 
  }

  const v_4622b9 = [...v_fd7614.values()];
  if (v_4622b9.length > v_5636c2)
    return { ok: false, error: `too many items: max ${v_5636c2}` };
  const v_c83285 = v_4622b9.reduce((v_fd5f43, v_ebec57) => v_fd5f43 + v_ebec57.a.length, 0);
  if (v_c83285 > v_784376)
    return { ok: false, error: `knowledge too long: max ${v_784376} chars` };
  return { ok: true, items: v_4622b9 };
}
