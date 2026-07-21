

const v_8a8a62 = 0xac00;
const v_af654b = 0xd7a3;
const v_9bbea4 = 28;

function v_0671ac(v_620da0): boolean {
  if (!v_620da0) return false;
  const v_c99bd2 = v_620da0.charCodeAt(0);
  if (v_c99bd2 < v_8a8a62 || v_c99bd2 > v_af654b) return false;
  return (v_c99bd2 - v_8a8a62) % v_9bbea4 !== 0;
}

function v_df08a9(v_620da0): boolean {
  if (!v_620da0) return false;
  const v_c99bd2 = v_620da0.charCodeAt(0);
  if (v_c99bd2 < v_8a8a62 || v_c99bd2 > v_af654b) return false;
  return (v_c99bd2 - v_8a8a62) % v_9bbea4 === 8; 
}

export function v_c50f83(v_ea7a24, v_1833e7): string {
  const v_51c9d7 = (v_1833e7 ?? "").trim() || "이 친구";
  const v_506e86 = v_51c9d7[v_51c9d7.length - 1];
  const v_148ff6 = v_0671ac(v_506e86);
  const v_fa8a9a = v_df08a9(v_506e86);
  return v_ea7a24
    .replace(/\{name\}은\/는/g, `${v_51c9d7}${v_148ff6 ? "은" : "는"}`)
    .replace(/\{name\}이\/가/g, `${v_51c9d7}${v_148ff6 ? "이" : "가"}`)
    .replace(/\{name\}을\/를/g, `${v_51c9d7}${v_148ff6 ? "을" : "를"}`)
    .replace(/\{name\}과\/와/g, `${v_51c9d7}${v_148ff6 ? "과" : "와"}`)
    .replace(/\{name\}로\/으로/g, `${v_51c9d7}${v_148ff6 && !v_fa8a9a ? "으로" : "로"}`)
    .replace(/\{name\}/g, v_51c9d7);
}
