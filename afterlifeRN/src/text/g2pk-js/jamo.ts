

export const v_918b4d = [
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

export const v_8d86fb = [
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

export const v_a826b2 = [
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

const v_3b005e = {
  'ᄀ': 'ㄱ', 'ᄁ': 'ㄲ', 'ᄂ': 'ㄴ', 'ᄃ': 'ㄷ', 'ᄄ': 'ㄸ',
  'ᄅ': 'ㄹ', 'ᄆ': 'ㅁ', 'ᄇ': 'ㅂ', 'ᄈ': 'ㅃ', 'ᄉ': 'ㅅ',
  'ᄊ': 'ㅆ', 'ᄋ': 'ㅇ', 'ᄌ': 'ㅈ', 'ᄍ': 'ㅉ', 'ᄎ': 'ㅊ',
  'ᄏ': 'ㅋ', 'ᄐ': 'ㅌ', 'ᄑ': 'ㅍ', 'ᄒ': 'ㅎ',
};

const v_5c2db8 = {
  'ᅡ': 'ㅏ', 'ᅢ': 'ㅐ', 'ᅣ': 'ㅑ', 'ᅤ': 'ㅒ', 'ᅥ': 'ㅓ',
  'ᅦ': 'ㅔ', 'ᅧ': 'ㅕ', 'ᅨ': 'ㅖ', 'ᅩ': 'ㅗ', 'ᅪ': 'ㅘ',
  'ᅫ': 'ㅙ', 'ᅬ': 'ㅚ', 'ᅭ': 'ㅛ', 'ᅮ': 'ㅜ', 'ᅯ': 'ㅝ',
  'ᅰ': 'ㅞ', 'ᅱ': 'ㅟ', 'ᅲ': 'ㅠ', 'ᅳ': 'ㅡ', 'ᅴ': 'ㅢ',
  'ᅵ': 'ㅣ',
};

const v_439336 = {
  'ᆨ': 'ㄱ', 'ᆩ': 'ㄲ', 'ᆪ': 'ㄳ', 'ᆫ': 'ㄴ', 'ᆬ': 'ㄵ',
  'ᆭ': 'ㄶ', 'ᆮ': 'ㄷ', 'ᆯ': 'ㄹ', 'ᆰ': 'ㄺ', 'ᆱ': 'ㄻ',
  'ᆲ': 'ㄼ', 'ᆳ': 'ㄽ', 'ᆴ': 'ㄾ', 'ᆵ': 'ㄿ', 'ᆶ': 'ㅀ',
  'ᆷ': 'ㅁ', 'ᆸ': 'ㅂ', 'ᆹ': 'ㅄ', 'ᆺ': 'ㅅ', 'ᆻ': 'ㅆ',
  'ᆼ': 'ㅇ', 'ᆽ': 'ㅈ', 'ᆾ': 'ㅊ', 'ᆿ': 'ㅋ', 'ᇀ': 'ㅌ',
  'ᇁ': 'ㅍ', 'ᇂ': 'ㅎ',
};

const v_fcd046 = 0xac00; 
const v_af654b = 0xd7a3; 

export function v_9e718c(v_10a17d): boolean {
  const v_c99bd2 = v_10a17d.charCodeAt(0);
  return v_c99bd2 >= v_fcd046 && v_c99bd2 <= v_af654b;
}

export function v_21738e(v_10a17d): boolean {
  const v_c99bd2 = v_10a17d.charCodeAt(0);
  return v_c99bd2 >= 0x3131 && v_c99bd2 <= 0x3163;
}

export function v_47f2de(v_10a17d): [string, string, string] | null {
  if (!v_9e718c(v_10a17d)) return null;
  const v_c99bd2 = v_10a17d.charCodeAt(0) - v_fcd046;
  const v_46306a = Math.floor(v_c99bd2 / (21 * 28));
  const v_6f5bcb = Math.floor((v_c99bd2 % (21 * 28)) / 28);
  const v_ac9546 = v_c99bd2 % 28;
  return [v_918b4d[v_46306a], v_8d86fb[v_6f5bcb], v_a826b2[v_ac9546]];
}

export function v_f010bf(v_c5aa46, v_7258bc, v_031dcd = ''): string | null {
  const v_46306a = v_918b4d.indexOf(v_c5aa46 as any);
  const v_6f5bcb = v_8d86fb.indexOf(v_7258bc as any);
  const v_ac9546 = v_a826b2.indexOf(v_031dcd as any);
  if (v_46306a < 0 || v_6f5bcb < 0 || v_ac9546 < 0) return null;
  return String.fromCharCode(v_fcd046 + v_46306a * 21 * 28 + v_6f5bcb * 28 + v_ac9546);
}

export function v_c33aa1(v_9b6134): string {
  const v_468545 = [];
  for (const v_10a17d of v_9b6134) {
    const v_b75e36 = v_47f2de(v_10a17d);
    if (v_b75e36) {
      v_468545.push(v_b75e36[0], v_b75e36[1]);
      if (v_b75e36[2]) v_468545.push(v_b75e36[2]);
    } else {
      v_468545.push(v_10a17d);
    }
  }
  return v_468545.join('');
}

export function v_0f06d0(v_9b6134): string {
  const v_8d4337 = [];
  let v_ebec57 = 0;
  while (v_ebec57 < v_9b6134.length) {
    const v_10a17d = v_9b6134[v_ebec57];
    if (v_918b4d.indexOf(v_10a17d as any) >= 0 && v_ebec57 + 1 < v_9b6134.length) {
      const v_7258bc = v_9b6134[v_ebec57 + 1];
      if (v_8d86fb.indexOf(v_7258bc as any) >= 0) {

        const v_0e6657 = v_9b6134[v_ebec57 + 2];
        const v_f822b2 =
          v_0e6657 &&
          v_a826b2.indexOf(v_0e6657 as any) > 0 &&
          (v_ebec57 + 3 >= v_9b6134.length || v_918b4d.indexOf(v_9b6134[v_ebec57 + 3] as any) < 0);
        const v_74ae35 = v_f822b2 ? v_f010bf(v_10a17d, v_7258bc, v_0e6657) : v_f010bf(v_10a17d, v_7258bc, '');
        if (v_74ae35) {
          v_8d4337.push(v_74ae35);
          v_ebec57 += v_f822b2 ? 3 : 2;
          continue;
        }
      }
    }
    v_8d4337.push(v_10a17d);
    v_ebec57 += 1;
  }
  return v_8d4337.join('');
}

export function v_4bb4ce(v_9b6134): string {
  const v_8d4337 = [];
  for (const v_10a17d of v_9b6134) {
    v_8d4337.push(v_3b005e[v_10a17d] || v_5c2db8[v_10a17d] || v_439336[v_10a17d] || v_10a17d);
  }
  return v_8d4337.join('');
}
