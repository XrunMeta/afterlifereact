

export function link1(inp: string): string {
  const pairs: [string, string][] = [
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
  return applyPairs(inp, pairs);
}

export function link2(inp: string): string {
  const pairs: [string, string][] = [
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
  return applyPairs(inp, pairs);
}

export function link3(inp: string): string {
  return inp;
}

export function link4(inp: string): string {
  const pairs: [string, string][] = [
    ['ᇂᄋ', 'ᄋ'], 
    ['ᆭᄋ', 'ᄂ'], 
    ['ᆶᄋ', 'ᄅ'], 
  ];
  return applyPairs(inp, pairs);
}

function applyPairs(inp: string, pairs: [string, string][]): string {
  let out = inp;
  for (const [pattern, replacement] of pairs) {
    out = out.split(pattern).join(replacement);
  }
  return out;
}
