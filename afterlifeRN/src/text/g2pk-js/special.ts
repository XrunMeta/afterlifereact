

export function jyeo(inp: string): string {
  return inp.replace(/([ᄌᄍᄎ])ᅧ/g, '$1ᅥ');
}

export function ye(inp: string, descriptive: boolean = false): string {
  if (!descriptive) return inp;
  return inp.replace(/([ᄀᄁᄃᄄᄅᄆᄇᄈᄌᄍᄎᄏᄐᄑᄒ])ᅨ/g, '$1ᅦ');
}

export function consonant_ui(inp: string): string {
  return inp.replace(/([ᄀᄁᄂᄃᄄᄅᄆᄇᄈᄉᄊᄌᄍᄎᄏᄐᄑᄒ])ᅴ/g, '$1ᅵ');
}

export function josa_ui(inp: string, descriptive: boolean = false): string {
  if (descriptive) return inp.replace(/의\/J/g, '에');
  return inp.replace(/\/J/g, '');
}

export function vowel_ui(inp: string, descriptive: boolean = false): string {
  if (!descriptive) return inp;
  return inp.replace(/(\Sᄋ)ᅴ/g, '$1ᅵ');
}

export function jamo(inp: string): string {
  let out = inp;
  out = out.replace(/([그])ᆮᄋ/g, '$1ᄉ');
  out = out.replace(/([으])[ᆽᆾᇀᇂ]ᄋ/g, '$1ᄉ');
  out = out.replace(/([으])[ᆿ]ᄋ/g, '$1ᄀ');
  out = out.replace(/([으])[ᇁ]ᄋ/g, '$1ᄇ');
  return out;
}

export function rieulgiyeok(inp: string): string {
  return inp.replace(/ᆰ\/P([ᄀᄁ])/g, 'ᆯᄁ');
}

export function rieulbieub(inp: string): string {
  let out = inp;
  out = out.replace(/([ᆲᆴ])\/Pᄀ/g, '$1ᄁ');
  out = out.replace(/([ᆲᆴ])\/Pᄃ/g, '$1ᄄ');
  out = out.replace(/([ᆲᆴ])\/Pᄉ/g, '$1ᄊ');
  out = out.replace(/([ᆲᆴ])\/Pᄌ/g, '$1ᄍ');
  return out;
}

export function verb_nieun(inp: string): string {
  const pairs: [RegExp, string][] = [
    [/([ᆫᆷ])\/Pᄀ/g, '$1ᄁ'],
    [/([ᆫᆷ])\/Pᄃ/g, '$1ᄄ'],
    [/([ᆫᆷ])\/Pᄉ/g, '$1ᄊ'],
    [/([ᆫᆷ])\/Pᄌ/g, '$1ᄍ'],

    [/ᆬ\/Pᄀ/g, 'ᆫᄁ'],
    [/ᆬ\/Pᄃ/g, 'ᆫᄄ'],
    [/ᆬ\/Pᄉ/g, 'ᆫᄊ'],
    [/ᆬ\/Pᄌ/g, 'ᆫᄍ'],

    [/ᆱ\/Pᄀ/g, 'ᆷᄁ'],
    [/ᆱ\/Pᄃ/g, 'ᆷᄄ'],
    [/ᆱ\/Pᄉ/g, 'ᆷᄊ'],
    [/ᆱ\/Pᄌ/g, 'ᆷᄍ'],
  ];
  let out = inp;
  for (const [pattern, replacement] of pairs) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

export function balb(inp: string): string {
  const syllableFinalOrConsonants = '($|[^ᄋᄒ])';
  let out = inp;
  out = out.replace(new RegExp(`(바)ᆲ${syllableFinalOrConsonants}`, 'g'), '$1ᆸ$2');
  out = out.replace(/(너)ᆲ([ᄌᄍ]ᅮ|[ᄃᄄ]ᅮ)/g, '$1ᆸ$2');
  return out;
}

export function palatalize(inp: string): string {
  let out = inp;
  out = out.replace(/ᆮᄋ([ᅵᅧ])/g, 'ᄌ$1');
  out = out.replace(/ᇀᄋ([ᅵᅧ])/g, 'ᄎ$1');
  out = out.replace(/ᆴᄋ([ᅵᅧ])/g, 'ᆯᄎ$1');
  out = out.replace(/ᆮᄒ([ᅵ])/g, 'ᄎ$1');
  return out;
}

export function modifying_rieul(inp: string): string {
  const pairs: [RegExp, string][] = [
    [/ᆯ\/E ᄀ/g, 'ᆯ ᄁ'],
    [/ᆯ\/E ᄃ/g, 'ᆯ ᄄ'],
    [/ᆯ\/E ᄇ/g, 'ᆯ ᄈ'],
    [/ᆯ\/E ᄉ/g, 'ᆯ ᄊ'],
    [/ᆯ\/E ᄌ/g, 'ᆯ ᄍ'],

    [/ᆯ걸/g, 'ᆯ껄'],
    [/ᆯ밖에/g, 'ᆯ빠께'],
    [/ᆯ세라/g, 'ᆯ쎄라'],
    [/ᆯ수록/g, 'ᆯ쑤록'],
    [/ᆯ지라도/g, 'ᆯ찌라도'],
    [/ᆯ지언정/g, 'ᆯ찌언정'],
    [/ᆯ진대/g, 'ᆯ찐대'],
  ];
  let out = inp;
  for (const [pattern, replacement] of pairs) {
    out = out.replace(pattern, replacement);
  }
  return out;
}
