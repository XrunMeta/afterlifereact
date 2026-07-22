

const HANGUL_BASE = 0xac00;
const HANGUL_END = 0xd7a3;
const JONGSEONG_COUNT = 28;

function hasBatchim(char: string | undefined): boolean {
  if (!char) return false;
  const code = char.charCodeAt(0);
  if (code < HANGUL_BASE || code > HANGUL_END) return false;
  return (code - HANGUL_BASE) % JONGSEONG_COUNT !== 0;
}

function isRieulBatchim(char: string | undefined): boolean {
  if (!char) return false;
  const code = char.charCodeAt(0);
  if (code < HANGUL_BASE || code > HANGUL_END) return false;
  return (code - HANGUL_BASE) % JONGSEONG_COUNT === 8; 
}

export function fillName(template: string, name: string | null | undefined): string {
  const safeName = (name ?? "").trim() || "이 친구";
  const last = safeName[safeName.length - 1];
  const b = hasBatchim(last);
  const rieul = isRieulBatchim(last);
  return template
    .replace(/\{name\}은\/는/g, `${safeName}${b ? "은" : "는"}`)
    .replace(/\{name\}이\/가/g, `${safeName}${b ? "이" : "가"}`)
    .replace(/\{name\}을\/를/g, `${safeName}${b ? "을" : "를"}`)
    .replace(/\{name\}과\/와/g, `${safeName}${b ? "과" : "와"}`)
    .replace(/\{name\}로\/으로/g, `${safeName}${b && !rieul ? "으로" : "로"}`)
    .replace(/\{name\}/g, safeName);
}
