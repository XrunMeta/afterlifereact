

export function v_1ce372(v_1ffa92): string[] {
  let v_fd5f43 = ' ' + v_1ffa92.join(' ') + ' $';
  v_fd5f43 = v_fd5f43.replace(/\d/g, '');
  v_fd5f43 = v_fd5f43.replace(/ T S /g, ' TS ');
  v_fd5f43 = v_fd5f43.replace(/ D Z /g, ' DZ ');
  v_fd5f43 = v_fd5f43.replace(/ AW ER /g, ' AWER ');
  v_fd5f43 = v_fd5f43.replace(/ IH R \$/g, ' IH ER ');
  v_fd5f43 = v_fd5f43.replace(/ EH R \$/g, ' EH ER ');
  v_fd5f43 = v_fd5f43.replace(/ \$/g, '');
  return v_fd5f43.replace(/^[$ ]+|[$ ]+$/g, '').split(/\s+/);
}

export function v_9c81de(v_6e214c): string {
  const v_d5dda0 = {
    B: 'ᄇ', CH: 'ᄎ', D: 'ᄃ', DH: 'ᄃ', DZ: 'ᄌ',
    F: 'ᄑ', G: 'ᄀ', HH: 'ᄒ', JH: 'ᄌ', K: 'ᄏ',
    L: 'ᄅ', M: 'ᄆ', N: 'ᄂ', NG: 'ᄋ', P: 'ᄑ',
    R: 'ᄅ', S: 'ᄉ', SH: 'ᄉ', T: 'ᄐ', TH: 'ᄉ',
    TS: 'ᄎ', V: 'ᄇ', W: 'W', Y: 'Y', Z: 'ᄌ',
    ZH: 'ᄌ',
  };
  return v_d5dda0[v_6e214c] ?? v_6e214c;
}

export function v_b0e4ea(v_6e214c): string {
  const v_d5dda0 = {
    AA: 'ᅡ', AE: 'ᅢ', AH: 'ᅥ', AO: 'ᅩ', AW: 'ᅡ우',
    AWER: 'ᅡ워', AY: 'ᅡ이', EH: 'ᅦ', ER: 'ᅥ',
    EY: 'ᅦ이', IH: 'ᅵ', IY: 'ᅵ', OW: 'ᅩ', OY: 'ᅩ이',
    UH: 'ᅮ', UW: 'ᅮ',
  };
  return v_d5dda0[v_6e214c] ?? v_6e214c;
}

export function v_f5d721(v_6e214c): string {
  const v_d5dda0 = {
    B: 'ᆸ', CH: 'ᆾ', D: 'ᆮ', DH: 'ᆮ', F: 'ᇁ',
    G: 'ᆨ', HH: 'ᇂ', JH: 'ᆽ', K: 'ᆨ', L: 'ᆯ',
    M: 'ᆷ', N: 'ᆫ', NG: 'ᆼ', P: 'ᆸ', R: 'ᆯ',
    S: 'ᆺ', SH: 'ᆺ', T: 'ᆺ', TH: 'ᆺ', V: 'ᆸ',
    W: 'ᆼ', Y: 'ᆼ', Z: 'ᆽ', ZH: 'ᆽ',
  };
  return v_d5dda0[v_6e214c] ?? v_6e214c;
}

export function v_f130c3(v_fba864): string {
  const v_015ea2 = [
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
  let v_8d4337 = v_fba864;
  for (const [v_2b8b40, v_4a36a4] of v_015ea2) {
    v_8d4337 = v_8d4337.split(v_2b8b40).join(v_4a36a4);
  }
  return v_8d4337;
}
