

export const v_026a6e = "ko";

const v_92f7f7 = new Set([
  "ko", "en", "ja", "zh", "es", "fr", "id", "de", "it", "ru", "pt", "vi", "th", "ar", "hi",
  "tr", "nl", "pl", "ms", "tl",
]);
const v_792c1f = /^\s*<\s*lang\s*=\s*([A-Za-z]{2,3})(?:[-_][A-Za-z]{2,4})?\s*>\s*/i;
const v_031767 = /<\s*lang\s*=\s*[A-Za-z_-]{0,10}\s*>?/gi;

export function v_97036c(v_c99bd2): string | null {
  if (typeof v_c99bd2 !== "string") return null;
  const v_694b25 = v_c99bd2.trim().toLowerCase().split(/[-_]/, 1)[0] ?? "";
  return v_92f7f7.has(v_694b25) ? v_694b25 : null;
}

export function v_5c6e27(v_9b6134, v_0debf4): { lang: string; text: string } {
  const v_9eebad = v_97036c(v_0debf4) ?? v_026a6e;
  let v_fd5f43 = v_9b6134 ?? "";
  let v_5254bf = null;
  const v_35f85c = v_792c1f.exec(v_fd5f43);
  if (v_35f85c) {
    v_5254bf = v_97036c(v_35f85c[1]);
    v_fd5f43 = v_fd5f43.slice(v_35f85c[0].length);
  }
  v_fd5f43 = v_fd5f43.replace(v_031767, "").trim();
  return { lang: v_5254bf ?? v_9eebad, text: v_fd5f43 };
}
