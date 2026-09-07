

export function adjust(arpabets: string[]): string[] {
  let s = ' ' + arpabets.join(' ') + ' $';
  s = s.replace(/\d/g, '');
  s = s.replace(/ T S /g, ' TS ');
  s = s.replace(/ D Z /g, ' DZ ');
  s = s.replace(/ AW ER /g, ' AWER ');
  s = s.replace(/ IH R \$/g, ' IH ER ');
  s = s.replace(/ EH R \$/g, ' EH ER ');
  s = s.replace(/ \$/g, '');
  return s.replace(/^[$ ]+|[$ ]+$/g, '').split(/\s+/);
}

export function to_choseong(arpabet: string): string {
  const d: Record<string, string> = {
    B: 'ᄇ', CH: 'ᄎ', D: 'ᄃ', DH: 'ᄃ', DZ: 'ᄌ',
    F: 'ᄑ', G: 'ᄀ', HH: 'ᄒ', JH: 'ᄌ', K: 'ᄏ',
    L: 'ᄅ', M: 'ᄆ', N: 'ᄂ', NG: 'ᄋ', P: 'ᄑ',
    R: 'ᄅ', S: 'ᄉ', SH: 'ᄉ', T: 'ᄐ', TH: 'ᄉ',
    TS: 'ᄎ', V: 'ᄇ', W: 'W', Y: 'Y', Z: 'ᄌ',
    ZH: 'ᄌ',
  };
  return d[arpabet] ?? arpabet;
}

export function to_jungseong(arpabet: string): string {
  const d: Record<string, string> = {
    AA: 'ᅡ', AE: 'ᅢ', AH: 'ᅥ', AO: 'ᅩ', AW: 'ᅡ우',
    AWER: 'ᅡ워', AY: 'ᅡ이', EH: 'ᅦ', ER: 'ᅥ',
    EY: 'ᅦ이', IH: 'ᅵ', IY: 'ᅵ', OW: 'ᅩ', OY: 'ᅩ이',
    UH: 'ᅮ', UW: 'ᅮ',
  };
  return d[arpabet] ?? arpabet;
}

export function to_jongseong(arpabet: string): string {
  const d: Record<string, string> = {
    B: 'ᆸ', CH: 'ᆾ', D: 'ᆮ', DH: 'ᆮ', F: 'ᇁ',
    G: 'ᆨ', HH: 'ᇂ', JH: 'ᆽ', K: 'ᆨ', L: 'ᆯ',
    M: 'ᆷ', N: 'ᆫ', NG: 'ᆼ', P: 'ᆸ', R: 'ᆯ',
    S: 'ᆺ', SH: 'ᆺ', T: 'ᆺ', TH: 'ᆺ', V: 'ᆸ',
    W: 'ᆼ', Y: 'ᆼ', Z: 'ᆽ', ZH: 'ᆽ',
  };
  return d[arpabet] ?? arpabet;
}

export function reconstruct(str: string): string {
  const pairs: [string, string][] = [
    ['그W', 'ᄀW'],
    ['흐W', 'ᄒW'],
    ['크W', 'ᄏW'],
    ['ᄂYᅥ', '니어'],
    ['ᄃYᅥ', '디어'],
    ['ᄅYᅥ', '리어'],
    ['Yᅵ', 'ᅵ'],
    ['Yᅡ', 'ᅣ'],
    ['Yᅢ', 'ᅤ'],
    ['Yᅥ', 'ᅧ'],
    ['Yᅦ', 'ᅨ'],
    ['Yᅩ', 'ᅭ'],
    ['Yᅮ', 'ᅲ'],
    ['Wᅡ', 'ᅪ'],
    ['Wᅢ', 'ᅫ'],
    ['Wᅥ', 'ᅯ'],
    ['Wᅩ', 'ᅯ'],
    ['Wᅮ', 'ᅮ'],
    ['Wᅦ', 'ᅰ'],
    ['Wᅵ', 'ᅱ'],
    ['ᅳᅵ', 'ᅴ'],
    ['Y', 'ᅵ'],
    ['W', 'ᅮ'],
  ];
  let out = str;
  for (const [pattern, replacement] of pairs) {
    out = out.split(pattern).join(replacement);
  }
  return out;
}
