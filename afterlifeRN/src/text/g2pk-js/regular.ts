

export function v_2ec098(v_fb6823): string {
  const v_015ea2 = [
    ['ᆨᄋ', 'ᄀ'], 
    ['ᆩᄋ', 'ᄁ'], 
    ['ᆫᄋ', 'ᄂ'], 
    ['ᆮᄋ', 'ᄃ'], 
    ['ᆯᄋ', 'ᄅ'], 
    ['ᆷᄋ', 'ᄆ'], 
    ['ᆸᄋ', 'ᄇ'], 
    ['ᆺᄋ', 'ᄉ'], 
    ['ᆻᄋ', 'ᄊ'], 
    ['ᆽᄋ', 'ᄌ'], 
    ['ᆾᄋ', 'ᄎ'], 
    ['ᆿᄋ', 'ᄏ'], 
    ['ᇀᄋ', 'ᄐ'], 
    ['ᇁᄋ', 'ᄑ'], 
  ];
  return v_6db491(v_fb6823, v_015ea2);
}

export function v_9dd85e(v_fb6823): string {
  const v_015ea2 = [
    ['ᆪᄋ', 'ᆨᄊ'], 
    ['ᆬᄋ', 'ᆫᄌ'], 
    ['ᆰᄋ', 'ᆯᄀ'], 
    ['ᆱᄋ', 'ᆯᄆ'], 
    ['ᆲᄋ', 'ᆯᄇ'], 
    ['ᆳᄋ', 'ᆯᄊ'], 
    ['ᆴᄋ', 'ᆯᄐ'], 
    ['ᆵᄋ', 'ᆯᄑ'], 
    ['ᆹᄋ', 'ᆸᄊ'], 
  ];
  return v_6db491(v_fb6823, v_015ea2);
}

export function v_f63d0d(v_fb6823): string {
  return v_fb6823;
}

export function v_0992d4(v_fb6823): string {
  const v_015ea2 = [
    ['ᇂᄋ', 'ᄋ'], 
    ['ᆭᄋ', 'ᄂ'], 
    ['ᆶᄋ', 'ᄅ'], 
  ];
  return v_6db491(v_fb6823, v_015ea2);
}

function v_6db491(v_fb6823, v_015ea2): string {
  let v_8d4337 = v_fb6823;
  for (const [v_2b8b40, v_4a36a4] of v_015ea2) {
    v_8d4337 = v_8d4337.split(v_2b8b40).join(v_4a36a4);
  }
  return v_8d4337;
}
