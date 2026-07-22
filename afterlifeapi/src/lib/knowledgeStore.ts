
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

export const KNOWLEDGE_MAX_ITEMS = 200;
export const KNOWLEDGE_MAX_TOTAL_CHARS = 20000;
const KEY_BLOCKED = new Set(["__proto__", "constructor", "prototype"]);
const FREE_RE = /^_free_(\d+)$/;

export function normalizeKnowledge(
  inputs: KnowledgeInput[],
  now: number,
): { ok: true; items: KnowledgeItem[] } | { ok: false; error: string } {
  if (!Array.isArray(inputs)) return { ok: false, error: "items must be an array" };

  let freeMax = 0;
  for (const it of inputs) {
    const m = typeof it?.key === "string" ? it.key.match(FREE_RE) : null;
    if (m) freeMax = Math.max(freeMax, Number(m[1]));
  }

  const byKey = new Map<string, KnowledgeItem>();
  for (const it of inputs) {
    if (!it || typeof it.a !== "string") continue;
    const a = it.a.trim();
    let key = typeof it.key === "string" ? it.key.trim() : "";
    if (key && KEY_BLOCKED.has(key)) return { ok: false, error: `blocked key: ${key}` };
    if (!a) {

      if (key) byKey.delete(key);
      continue;
    }
    if (!key) key = `_free_${++freeMax}`;
    const q = typeof it.q === "string" && it.q.trim() ? it.q : null;
    byKey.set(key, { key, q, a, updated_at: now }); 
  }

  const items = [...byKey.values()];
  if (items.length > KNOWLEDGE_MAX_ITEMS)
    return { ok: false, error: `too many items: max ${KNOWLEDGE_MAX_ITEMS}` };
  const total = items.reduce((s, i) => s + i.a.length, 0);
  if (total > KNOWLEDGE_MAX_TOTAL_CHARS)
    return { ok: false, error: `knowledge too long: max ${KNOWLEDGE_MAX_TOTAL_CHARS} chars` };
  return { ok: true, items };
}
