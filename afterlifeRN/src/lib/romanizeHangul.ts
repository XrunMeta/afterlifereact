

const v_b34939 = ["g", "kk", "n", "d", "tt", "r", "m", "b", "pp", "s", "ss", "", "j", "jj", "ch", "k", "t", "p", "h"];
const v_c69b43 = [
  "a", "ae", "ya", "yae", "eo", "e", "yeo", "ye", "o", "wa", "wae",
  "oe", "yo", "u", "wo", "we", "wi", "yu", "eu", "ui", "i",
];

const v_c1a609 = [
  "", "k", "k", "k", "n", "n", "n", "t", "l", "k", "m", "l", "l", "l", "p", "l",
  "m", "p", "p", "t", "t", "ng", "t", "t", "k", "t", "p", "t",
];

const v_fa7db7 = 0xac00;
const v_dfc6fa = 0xd7a3;

export function v_6cba83(v_9b6134): string {
  let v_8d4337 = "";
  for (const v_10a17d of v_9b6134) {
    const v_c99bd2 = v_10a17d.codePointAt(0)!;
    if (v_c99bd2 < v_fa7db7 || v_c99bd2 > v_dfc6fa) {
      v_8d4337 += v_10a17d;
      continue;
    }
    const v_e86ad8 = v_c99bd2 - v_fa7db7;
    const v_fc6010 = Math.floor(v_e86ad8 / (21 * 28));
    const v_c91d28 = Math.floor((v_e86ad8 % (21 * 28)) / 28);
    const v_9610b8 = v_e86ad8 % 28;
    v_8d4337 += v_b34939[v_fc6010] + v_c69b43[v_c91d28] + v_c1a609[v_9610b8];
  }
  return v_8d4337;
}
