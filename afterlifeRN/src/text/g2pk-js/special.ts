

export function v_2471e7(v_fb6823): string {
  return v_fb6823.replace(/([ᄌᄍᄎ])ᅧ/g, '$1ᅥ');
}

export function v_67bde0(v_fb6823, v_8aa332 = false): string {
  if (!v_8aa332) return v_fb6823;
  return v_fb6823.replace(/([ᄀᄁᄃᄄᄅᄆᄇᄈᄌᄍᄎᄏᄐᄑᄒ])ᅨ/g, '$1ᅦ');
}

export function v_15303b(v_fb6823): string {
  return v_fb6823.replace(/([ᄀᄁᄂᄃᄄᄅᄆᄇᄈᄉᄊᄌᄍᄎᄏᄐᄑᄒ])ᅴ/g, '$1ᅵ');
}

export function v_4b72fc(v_fb6823, v_8aa332 = false): string {
  if (v_8aa332) return v_fb6823.replace(/의\/J/g, '에');
  return v_fb6823.replace(/\/J/g, '');
}

export function v_506635(v_fb6823, v_8aa332 = false): string {
  if (!v_8aa332) return v_fb6823;
  return v_fb6823.replace(/(\Sᄋ)ᅴ/g, '$1ᅵ');
}

export function v_2a7e6c(v_fb6823): string {
  let v_8d4337 = v_fb6823;
  v_8d4337 = v_8d4337.replace(/([그])ᆮᄋ/g, '$1ᄉ');
  v_8d4337 = v_8d4337.replace(/([으])[ᆽᆾᇀᇂ]ᄋ/g, '$1ᄉ');
  v_8d4337 = v_8d4337.replace(/([으])[ᆿ]ᄋ/g, '$1ᄀ');
  v_8d4337 = v_8d4337.replace(/([으])[ᇁ]ᄋ/g, '$1ᄇ');
  return v_8d4337;
}

export function v_0a3d58(v_fb6823): string {
  return v_fb6823.replace(/ᆰ\/P([ᄀᄁ])/g, 'ᆯᄁ');
}

export function v_d02757(v_fb6823): string {
  let v_8d4337 = v_fb6823;
  v_8d4337 = v_8d4337.replace(/([ᆲᆴ])\/Pᄀ/g, '$1ᄁ');
  v_8d4337 = v_8d4337.replace(/([ᆲᆴ])\/Pᄃ/g, '$1ᄄ');
  v_8d4337 = v_8d4337.replace(/([ᆲᆴ])\/Pᄉ/g, '$1ᄊ');
  v_8d4337 = v_8d4337.replace(/([ᆲᆴ])\/Pᄌ/g, '$1ᄍ');
  return v_8d4337;
}

export function v_64bb73(v_fb6823): string {
  const v_015ea2 = [
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
  let v_8d4337 = v_fb6823;
  for (const [v_2b8b40, v_4a36a4] of v_015ea2) {
    v_8d4337 = v_8d4337.replace(v_2b8b40, v_4a36a4);
  }
  return v_8d4337;
}

export function v_cf4513(v_fb6823): string {
  const v_ff1ed6 = '($|[^ᄋᄒ])';
  let v_8d4337 = v_fb6823;
  v_8d4337 = v_8d4337.replace(new RegExp(`(바)ᆲ${v_ff1ed6}`, 'g'), '$1ᆸ$2');
  v_8d4337 = v_8d4337.replace(/(너)ᆲ([ᄌᄍ]ᅮ|[ᄃᄄ]ᅮ)/g, '$1ᆸ$2');
  return v_8d4337;
}

export function v_272869(v_fb6823): string {
  let v_8d4337 = v_fb6823;
  v_8d4337 = v_8d4337.replace(/ᆮᄋ([ᅵᅧ])/g, 'ᄌ$1');
  v_8d4337 = v_8d4337.replace(/ᇀᄋ([ᅵᅧ])/g, 'ᄎ$1');
  v_8d4337 = v_8d4337.replace(/ᆴᄋ([ᅵᅧ])/g, 'ᆯᄎ$1');
  v_8d4337 = v_8d4337.replace(/ᆮᄒ([ᅵ])/g, 'ᄎ$1');
  return v_8d4337;
}

export function v_4cc7dd(v_fb6823): string {
  const v_015ea2 = [
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
  let v_8d4337 = v_fb6823;
  for (const [v_2b8b40, v_4a36a4] of v_015ea2) {
    v_8d4337 = v_8d4337.replace(v_2b8b40, v_4a36a4);
  }
  return v_8d4337;
}
