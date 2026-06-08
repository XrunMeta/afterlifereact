

export function v_417fc7(v_779914, v_148ff6): number {
  const v_35f85c = v_779914.length;
  const v_f4e98d = v_148ff6.length;
  if (v_35f85c === 0) return v_f4e98d;
  if (v_f4e98d === 0) return v_35f85c;
  let v_ba2215 = new Array<number>(v_f4e98d + 1);
  for (let v_b75e36 = 0; v_b75e36 <= v_f4e98d; v_b75e36++) v_ba2215[v_b75e36] = v_b75e36;
  for (let v_ebec57 = 1; v_ebec57 <= v_35f85c; v_ebec57++) {
    const v_c3bc75 = new Array<number>(v_f4e98d + 1);
    v_c3bc75[0] = v_ebec57;
    for (let v_b75e36 = 1; v_b75e36 <= v_f4e98d; v_b75e36++) {
      const v_4bf933 = v_779914[v_ebec57 - 1] === v_148ff6[v_b75e36 - 1] ? 0 : 1;
      v_c3bc75[v_b75e36] = Math.min(v_ba2215[v_b75e36]! + 1, v_c3bc75[v_b75e36 - 1]! + 1, v_ba2215[v_b75e36 - 1]! + v_4bf933);
    }
    v_ba2215 = v_c3bc75;
  }
  return v_ba2215[v_f4e98d]!;
}

const v_cf0120 = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
const v_b05477 = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ";
const v_7fa4cc = ["", "ㄱ","ㄲ","ㄳ","ㄴ","ㄵ","ㄶ","ㄷ","ㄹ","ㄺ","ㄻ","ㄼ","ㄽ","ㄾ","ㄿ","ㅀ","ㅁ","ㅂ","ㅄ","ㅅ","ㅆ","ㅇ","ㅈ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
function v_3fda3e(v_fba864): string {
  let v_8d4337 = "";
  for (const v_10a17d of v_fba864) {
    const v_c99bd2 = v_10a17d.charCodeAt(0);
    if (v_c99bd2 >= 0xac00 && v_c99bd2 <= 0xd7a3) {
      const v_e86ad8 = v_c99bd2 - 0xac00;
      v_8d4337 += v_cf0120[Math.floor(v_e86ad8 / 588)]! + v_b05477[Math.floor((v_e86ad8 % 588) / 28)]! + v_7fa4cc[v_e86ad8 % 28]!;
    } else {
      v_8d4337 += v_10a17d;
    }
  }
  return v_8d4337;
}

export function v_e0041f(v_7c5791, v_5f5d6d): number {
  const v_ab6401 = (v_7c5791 ?? "").toLowerCase().trim();
  const v_8d41d7 = (v_5f5d6d ?? "").toLowerCase().trim();
  if (!v_ab6401 || !v_8d41d7) return 0;
  if (v_8d41d7.includes(v_ab6401) || v_ab6401.includes(v_8d41d7)) return 1;

  const v_80396f = (v_779914, v_148ff6): number => {
    const v_0a0f75 = v_3fda3e(v_779914);
    const v_a1651b = v_3fda3e(v_148ff6);
    const v_bb387f = Math.max(v_0a0f75.length, v_a1651b.length);
    return v_bb387f === 0 ? 0 : 1 - v_417fc7(v_0a0f75, v_a1651b) / v_bb387f;
  };
  let v_643757 = v_80396f(v_ab6401, v_8d41d7);
  for (const v_ea333d of v_8d41d7.split(/\s+/)) {
    if (v_ea333d) v_643757 = Math.max(v_643757, v_80396f(v_ab6401, v_ea333d));
  }
  return v_643757;
}

export const v_cfdcb0 = 0.7;
