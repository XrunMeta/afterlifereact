

export type BlacklistValidateResult =
  | { ok: true; words: string[] }
  | { ok: false; error: string };

const MAX_WORDS = 500;
const MAX_WORD_LEN = 100;

export function validateBlacklist(input: unknown): BlacklistValidateResult {
  if (!Array.isArray(input)) return { ok: false, error: "blacklist must be an array" };
  if (input.length > MAX_WORDS)
    return { ok: false, error: `too many words: max ${MAX_WORDS}` };
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input) {
    if (typeof raw !== "string") return { ok: false, error: "each entry must be a string" };
    const w = raw.trim();
    if (!w) continue; 
    if (w.length > MAX_WORD_LEN) return { ok: false, error: `word too long: max ${MAX_WORD_LEN}` };
    if (seen.has(w)) continue; 
    seen.add(w);
    out.push(w);
  }
  return { ok: true, words: out };
}

export async function loadBlacklist(db: D1Database): Promise<string[]> {
  const row = await db
    .prepare("SELECT blacklist_json FROM knowledge_blacklist WHERE id = 1")
    .first<{ blacklist_json: string }>();
  if (!row?.blacklist_json) return [];
  try {
    const parsed = JSON.parse(row.blacklist_json);
    const r = validateBlacklist(parsed);
    return r.ok ? r.words : [];
  } catch {
    return [];
  }
}

export function findBlacklistHit(answer: string, blacklist: string[]): string | null {
  if (!answer || blacklist.length === 0) return null;
  const lower = answer.toLowerCase();
  for (const w of blacklist) {
    if (!w) continue;
    if (lower.includes(w.toLowerCase())) return w;
  }
  return null;
}
