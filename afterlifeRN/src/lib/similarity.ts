

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = cur;
  }
  return prev[n];
}

const CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
const JUNG = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ";
const JONG = ["", "ㄱ","ㄲ","ㄳ","ㄴ","ㄵ","ㄶ","ㄷ","ㄹ","ㄺ","ㄻ","ㄼ","ㄽ","ㄾ","ㄿ","ㅀ","ㅁ","ㅂ","ㅄ","ㅅ","ㅆ","ㅇ","ㅈ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];

function decomposeHangul(str: string): string {
  let out = "";
  for (const ch of str) {
    const code = ch.charCodeAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const idx = code - 0xac00;
      out += CHO[Math.floor(idx / 588)] + JUNG[Math.floor((idx % 588) / 28)] + JONG[idx % 28];
    } else {
      out += ch;
    }
  }
  return out;
}

export function similarityScore(query: string, target: string | null | undefined): number {
  const q = (query ?? "").toLowerCase().trim();
  const t = (target ?? "").toLowerCase().trim();
  if (!q || !t) return 0;
  if (t.includes(q) || q.includes(t)) return 1;
  const ratio = (a: string, b: string): number => {
    const da = decomposeHangul(a);
    const db = decomposeHangul(b);
    const maxLen = Math.max(da.length, db.length);
    return maxLen === 0 ? 0 : 1 - levenshtein(da, db) / maxLen;
  };
  let best = ratio(q, t);
  for (const tok of t.split(/\s+/)) {
    if (tok) best = Math.max(best, ratio(q, tok));
  }
  return best;
}

export const SEARCH_SIMILARITY_THRESHOLD = 0.7;

export function fuzzyMatch(query: string, target: string | null | undefined): boolean {
  return similarityScore(query, target) >= SEARCH_SIMILARITY_THRESHOLD;
}
