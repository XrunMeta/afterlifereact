

export type Viseme =
  | 'REST' | 'A' | 'E' | 'I' | 'O' | 'U' | 'EO' | 'EU' | 'BILAB' | 'DENT';

export interface VisemeEvent {
  v: Viseme;
  dur_ms: number;
}

const v_a93876 = {
  'ㅏ': 'A', 'ㅑ': 'A',
  'ㅐ': 'E', 'ㅔ': 'E', 'ㅒ': 'E', 'ㅖ': 'E', 'ㅢ': 'E',
  'ㅣ': 'I',
  'ㅗ': 'O', 'ㅛ': 'O', 'ㅘ': 'O', 'ㅙ': 'O', 'ㅚ': 'O',
  'ㅜ': 'U', 'ㅠ': 'U', 'ㅝ': 'U', 'ㅞ': 'U', 'ㅟ': 'U',
  'ㅓ': 'EO', 'ㅕ': 'EO',
  'ㅡ': 'EU',
};

const v_85ec1a = new Set(['ㅁ', 'ㅂ', 'ㅍ', 'ㅃ']);
const v_475d46 = new Set(['ㅁ', 'ㅂ', 'ㅍ']);

const v_fcd046 = 0xAC00;
const v_af654b = 0xD7A3;
const v_b34939 = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
const v_c69b43 = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ';
const v_c1a609 = ' ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ';

interface Decomposed {
  ini: string;
  med: string;
  fin: string;
}

function v_6cdf3e(v_10a17d): Decomposed | null {
  const v_c99bd2 = v_10a17d.charCodeAt(0);
  if (v_c99bd2 < v_fcd046 || v_c99bd2 > v_af654b) return null;
  const v_3bbadf = v_c99bd2 - v_fcd046;
  const v_b594db = v_b34939[Math.floor(v_3bbadf / (21 * 28))];
  const v_37a40d = v_c69b43[Math.floor((v_3bbadf % (21 * 28)) / 28)];
  const v_3029ec = v_3bbadf % 28;
  const v_b57483 = v_c1a609[v_3029ec];
  const v_2c9b76 = v_b57483.trim();
  return { ini: v_b594db, med: v_37a40d, fin: v_2c9b76 };
}

export function v_b65e4f(v_9b6134, v_57324b): VisemeEvent[] {
  const v_bf9904 = [];

  for (const v_10a17d of v_9b6134) {
    const v_468545 = v_6cdf3e(v_10a17d);
    if (v_468545 === null) {
      if (v_10a17d.trim() === '') {
        v_bf9904.push({ v: 'REST' });
      } else {
        v_bf9904.push({ v: 'A' });
      }
      continue;
    }
    const { ini: v_b594db, med: v_37a40d, fin: v_2c9b76 } = v_468545;
    if (v_85ec1a.has(v_b594db)) v_bf9904.push({ v: 'BILAB' });
    v_bf9904.push({ v: v_a93876[v_37a40d] ?? 'A' });
    if (v_475d46.has(v_2c9b76)) v_bf9904.push({ v: 'BILAB' });
  }

  if (v_bf9904.length === 0) {
    return [{ v: 'REST', dur_ms: 200 }];
  }

  if (v_57324b === undefined || v_57324b === null) {
    for (const v_1d299c of v_bf9904) {
      if (v_1d299c.v === 'BILAB') v_1d299c.dur_ms = 80;
      else if (v_1d299c.v === 'REST') v_1d299c.dur_ms = 150;
      else v_1d299c.dur_ms = 200;
    }
  } else {
    const v_e5c9ed = v_bf9904.map(v_9e86fd =>
      v_9e86fd.v === 'BILAB' ? 0.4 : v_9e86fd.v === 'REST' ? 0.7 : 1.0
    );
    const v_56a76b = v_e5c9ed.reduce((v_779914, v_148ff6) => v_779914 + v_148ff6, 0);
    v_bf9904.forEach((v_1d299c, v_ebec57) => {
      v_1d299c.dur_ms = Math.max(30, Math.floor(v_57324b * (v_e5c9ed[v_ebec57] / v_56a76b)));
    });

    const v_c3bc75 = v_bf9904.reduce((v_779914, v_9e86fd) => v_779914 + (v_9e86fd.dur_ms ?? 0), 0);
    const v_a41a1b = v_57324b - v_c3bc75;
    if (v_a41a1b !== 0) {
      const v_506e86 = v_bf9904[v_bf9904.length - 1];
      v_506e86.dur_ms = Math.max(30, (v_506e86.dur_ms ?? 0) + v_a41a1b);
    }
  }

  return v_bf9904 as VisemeEvent[];
}
