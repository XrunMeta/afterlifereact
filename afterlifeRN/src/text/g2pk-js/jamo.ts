

export const CHO_JAMO = [
  'ᄀ', 
  'ᄁ', 
  'ᄂ', 
  'ᄃ', 
  'ᄄ', 
  'ᄅ', 
  'ᄆ', 
  'ᄇ', 
  'ᄈ', 
  'ᄉ', 
  'ᄊ', 
  'ᄋ', 
  'ᄌ', 
  'ᄍ', 
  'ᄎ', 
  'ᄏ', 
  'ᄐ', 
  'ᄑ', 
  'ᄒ', 
] as const;

export const JUNG_JAMO = [
  'ᅡ', 
  'ᅢ', 
  'ᅣ', 
  'ᅤ', 
  'ᅥ', 
  'ᅦ', 
  'ᅧ', 
  'ᅨ', 
  'ᅩ', 
  'ᅪ', 
  'ᅫ', 
  'ᅬ', 
  'ᅭ', 
  'ᅮ', 
  'ᅯ', 
  'ᅰ', 
  'ᅱ', 
  'ᅲ', 
  'ᅳ', 
  'ᅴ', 
  'ᅵ', 
] as const;

export const JONG_JAMO = [
  '', 
  'ᆨ', 
  'ᆩ', 
  'ᆪ', 
  'ᆫ', 
  'ᆬ', 
  'ᆭ', 
  'ᆮ', 
  'ᆯ', 
  'ᆰ', 
  'ᆱ', 
  'ᆲ', 
  'ᆳ', 
  'ᆴ', 
  'ᆵ', 
  'ᆶ', 
  'ᆷ', 
  'ᆸ', 
  'ᆹ', 
  'ᆺ', 
  'ᆻ', 
  'ᆼ', 
  'ᆽ', 
  'ᆾ', 
  'ᆿ', 
  'ᇀ', 
  'ᇁ', 
  'ᇂ', 
] as const;

const CHO_TO_COMPAT: Record<string, string> = {
  'ᄀ': 'ㄱ', 'ᄁ': 'ㄲ', 'ᄂ': 'ㄴ', 'ᄃ': 'ㄷ', 'ᄄ': 'ㄸ',
  'ᄅ': 'ㄹ', 'ᄆ': 'ㅁ', 'ᄇ': 'ㅂ', 'ᄈ': 'ㅃ', 'ᄉ': 'ㅅ',
  'ᄊ': 'ㅆ', 'ᄋ': 'ㅇ', 'ᄌ': 'ㅈ', 'ᄍ': 'ㅉ', 'ᄎ': 'ㅊ',
  'ᄏ': 'ㅋ', 'ᄐ': 'ㅌ', 'ᄑ': 'ㅍ', 'ᄒ': 'ㅎ',
};

const JUNG_TO_COMPAT: Record<string, string> = {
  'ᅡ': 'ㅏ', 'ᅢ': 'ㅐ', 'ᅣ': 'ㅑ', 'ᅤ': 'ㅒ', 'ᅥ': 'ㅓ',
  'ᅦ': 'ㅔ', 'ᅧ': 'ㅕ', 'ᅨ': 'ㅖ', 'ᅩ': 'ㅗ', 'ᅪ': 'ㅘ',
  'ᅫ': 'ㅙ', 'ᅬ': 'ㅚ', 'ᅭ': 'ㅛ', 'ᅮ': 'ㅜ', 'ᅯ': 'ㅝ',
  'ᅰ': 'ㅞ', 'ᅱ': 'ㅟ', 'ᅲ': 'ㅠ', 'ᅳ': 'ㅡ', 'ᅴ': 'ㅢ',
  'ᅵ': 'ㅣ',
};

const JONG_TO_COMPAT: Record<string, string> = {
  'ᆨ': 'ㄱ', 'ᆩ': 'ㄲ', 'ᆪ': 'ㄳ', 'ᆫ': 'ㄴ', 'ᆬ': 'ㄵ',
  'ᆭ': 'ㄶ', 'ᆮ': 'ㄷ', 'ᆯ': 'ㄹ', 'ᆰ': 'ㄺ', 'ᆱ': 'ㄻ',
  'ᆲ': 'ㄼ', 'ᆳ': 'ㄽ', 'ᆴ': 'ㄾ', 'ᆵ': 'ㄿ', 'ᆶ': 'ㅀ',
  'ᆷ': 'ㅁ', 'ᆸ': 'ㅂ', 'ᆹ': 'ㅄ', 'ᆺ': 'ㅅ', 'ᆻ': 'ㅆ',
  'ᆼ': 'ㅇ', 'ᆽ': 'ㅈ', 'ᆾ': 'ㅊ', 'ᆿ': 'ㅋ', 'ᇀ': 'ㅌ',
  'ᇁ': 'ㅍ', 'ᇂ': 'ㅎ',
};

const HANGUL_START = 0xac00; 
const HANGUL_END = 0xd7a3; 

export function isHangul(ch: string): boolean {
  const code = ch.charCodeAt(0);
  return code >= HANGUL_START && code <= HANGUL_END;
}

export function isCompatJamo(ch: string): boolean {
  const code = ch.charCodeAt(0);
  return code >= 0x3131 && code <= 0x3163;
}

export function h2j(ch: string): [string, string, string] | null {
  if (!isHangul(ch)) return null;
  const code = ch.charCodeAt(0) - HANGUL_START;
  const choIdx = Math.floor(code / (21 * 28));
  const jungIdx = Math.floor((code % (21 * 28)) / 28);
  const jongIdx = code % 28;
  return [CHO_JAMO[choIdx], JUNG_JAMO[jungIdx], JONG_JAMO[jongIdx]];
}

export function j2h(cho: string, jung: string, jong: string = ''): string | null {
  const choIdx = CHO_JAMO.indexOf(cho as any);
  const jungIdx = JUNG_JAMO.indexOf(jung as any);
  const jongIdx = JONG_JAMO.indexOf(jong as any);
  if (choIdx < 0 || jungIdx < 0 || jongIdx < 0) return null;
  return String.fromCharCode(HANGUL_START + choIdx * 21 * 28 + jungIdx * 28 + jongIdx);
}

export function decompose(text: string): string {
  const parts: string[] = [];
  for (const ch of text) {
    const j = h2j(ch);
    if (j) {
      parts.push(j[0], j[1]);
      if (j[2]) parts.push(j[2]);
    } else {
      parts.push(ch);
    }
  }
  return parts.join('');
}

export function compose(text: string): string {
  const out: string[] = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (CHO_JAMO.indexOf(ch as any) >= 0 && i + 1 < text.length) {
      const jung = text[i + 1];
      if (JUNG_JAMO.indexOf(jung as any) >= 0) {

        const maybeJong = text[i + 2];
        const isJong =
          maybeJong &&
          JONG_JAMO.indexOf(maybeJong as any) > 0 &&
          (i + 3 >= text.length || CHO_JAMO.indexOf(text[i + 3] as any) < 0);
        const syllable = isJong ? j2h(ch, jung, maybeJong) : j2h(ch, jung, '');
        if (syllable) {
          out.push(syllable);
          i += isJong ? 3 : 2;
          continue;
        }
      }
    }
    out.push(ch);
    i += 1;
  }
  return out.join('');
}

export function toCompat(text: string): string {
  const out: string[] = [];
  for (const ch of text) {
    out.push(CHO_TO_COMPAT[ch] || JUNG_TO_COMPAT[ch] || JONG_TO_COMPAT[ch] || ch);
  }
  return out.join('');
}
