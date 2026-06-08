

export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    const cur = new Array<number>(n + 1);
    cur[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + cost);
    }
    prev = cur;
  }
  return prev[n]!;
}

export function similarityScore(query: string, target: string | null | undefined): number {
  const q = (query ?? "").toLowerCase().trim();
  const t = (target ?? "").toLowerCase().trim();
  if (!q || !t) return 0;
  if (t.includes(q) || q.includes(t)) return 1;
  const ratio = (a: string, b: string): number => {
    const maxLen = Math.max(a.length, b.length);
    return maxLen === 0 ? 0 : 1 - levenshtein(a, b) / maxLen;
  };
  let best = ratio(q, t);
  for (const tok of t.split(/\s+/)) {
    if (tok) best = Math.max(best, ratio(q, tok));
  }
  return best;
}

export const SEARCH_SIMILARITY_THRESHOLD = 0.7;
