

import { v_a033a4 } from "jrmuompkheyqurqzdkkxf";
import { v_d30de3 } from "btajrcwvcjzcghyihkwwbcs";
import { v_084137 } from "jyrbilrsgaufsmqlwpinn";
import { v_5f30e2 } from "qcyoxusdylhcdivjkjnuowj";

const v_95f18e = 30;
const v_265f37 = 6;
const v_aea285 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function v_043552(v_fbb6da): string {
  let v_8d4337 = "";
  let v_83ee53 = 0;
  let v_fb19c6 = 0;
  for (const v_148ff6 of v_fbb6da) {
    v_83ee53 = (v_83ee53 << 8) | v_148ff6;
    v_fb19c6 += 8;
    while (v_fb19c6 >= 5) {
      v_fb19c6 -= 5;
      v_8d4337 += v_aea285[(v_83ee53 >> v_fb19c6) & 0x1f];
    }
  }
  if (v_fb19c6 > 0) v_8d4337 += v_aea285[(v_83ee53 << (5 - v_fb19c6)) & 0x1f];
  return v_8d4337;
}

export function v_db9869(v_fba864): Uint8Array {
  const v_76a373 = v_fba864.replace(/=+$/g, "").toUpperCase().replace(/\s+/g, "");
  const v_8d4337 = [];
  let v_83ee53 = 0;
  let v_fb19c6 = 0;
  for (const v_10a17d of v_76a373) {
    const v_81e2ef = v_aea285.indexOf(v_10a17d);
    if (v_81e2ef < 0) continue;
    v_83ee53 = (v_83ee53 << 5) | v_81e2ef;
    v_fb19c6 += 5;
    if (v_fb19c6 >= 8) {
      v_fb19c6 -= 8;
      v_8d4337.push((v_83ee53 >> v_fb19c6) & 0xff);
    }
  }
  return new Uint8Array(v_8d4337);
}

function v_b3bef6(v_054741): Uint8Array {
  const v_148ff6 = new Uint8Array(8);

  let v_3f4e2e = v_054741;
  for (let v_ebec57 = 7; v_ebec57 >= 0; v_ebec57--) {
    v_148ff6[v_ebec57] = v_3f4e2e & 0xff;
    v_3f4e2e = Math.floor(v_3f4e2e / 256);
  }
  return v_148ff6;
}

function v_0ce7ef(v_43fd42, v_054741): string {
  const v_65a2cd = v_a033a4(v_d30de3, v_43fd42, v_b3bef6(v_054741));
  const v_3bbadf = (v_65a2cd[v_65a2cd.length - 1] ?? 0) & 0x0f;
  const v_c99bd2 =
    (((v_65a2cd[v_3bbadf] ?? 0) & 0x7f) << 24) |
    (((v_65a2cd[v_3bbadf + 1] ?? 0) & 0xff) << 16) |
    (((v_65a2cd[v_3bbadf + 2] ?? 0) & 0xff) << 8) |
    ((v_65a2cd[v_3bbadf + 3] ?? 0) & 0xff);
  return (v_c99bd2 % 10 ** v_265f37).toString().padStart(v_265f37, "0");
}

export function v_c8af2a(v_36ce0e, v_79fa47 = Math.floor(Date.now() / 1000)): string {
  const v_054741 = Math.floor(v_79fa47 / v_95f18e);
  return v_0ce7ef(v_db9869(v_36ce0e), v_054741);
}

export function v_ac75b4(
  v_36ce0e,
  v_c99bd2,
  v_ab6cf6,
  v_79fa47 = Math.floor(Date.now() / 1000),
): number | null {
  if (!/^\d{6}$/.test(v_c99bd2)) return null;
  const v_43fd42 = v_db9869(v_36ce0e);
  const v_0288f8 = Math.floor(v_79fa47 / v_95f18e);
  for (const v_e9396c of [0, -1, 1]) {
    const v_054741 = v_0288f8 + v_e9396c;
    if (v_ab6cf6 !== null && v_054741 <= v_ab6cf6) continue;
    if (v_0ce7ef(v_43fd42, v_054741) === v_c99bd2) return v_054741;
  }
  return null;
}

export function v_041b21(): string {
  return v_043552(v_5f30e2(20));
}

export function v_726e84(v_328259): string {
  const v_2869c1 = encodeURIComponent(`${v_328259.issuer}:${v_328259.account}`);
  const v_24baff = new URLSearchParams({
    secret: v_328259.secretB32,
    issuer: v_328259.issuer,
    algorithm: "SHA1",
    digits: String(v_265f37),
    period: String(v_95f18e),
  });
  return `otpauth://totp/${v_2869c1}?${v_24baff.toString()}`;
}

export interface RecoveryCodeBundle {
  plaintext: string[];   
  hashes: string[];      
}

function v_8dc389(v_c99bd2): string {
  const v_fbb6da = v_084137(new TextEncoder().encode(v_c99bd2));
  let v_993b31 = "";
  for (const v_148ff6 of v_fbb6da) v_993b31 += v_148ff6.toString(16).padStart(2, "0");
  return v_993b31;
}

export function v_8bd0de(v_9e8c70 = 10): RecoveryCodeBundle {
  const v_9db068 = [];
  const v_11e1dd = [];
  for (let v_ebec57 = 0; v_ebec57 < v_9e8c70; v_ebec57++) {
    const v_479f05 = v_5f30e2(5);
    const v_c99bd2 = v_043552(v_479f05);   
    const v_d37cf5 = `${v_c99bd2.slice(0, 4)}-${v_c99bd2.slice(4, 8)}`;
    v_9db068.push(v_d37cf5);
    v_11e1dd.push(v_8dc389(v_d37cf5));
  }
  return { plaintext: v_9db068, hashes: v_11e1dd };
}

export function v_669bf5(v_5885b8, v_bbda62): string[] | null {
  const v_75195c = v_bbda62.trim().toUpperCase();
  const v_65a2cd = v_8dc389(v_75195c);
  const v_e86ad8 = v_5885b8.indexOf(v_65a2cd);
  if (v_e86ad8 < 0) return null;
  const v_a448ad = v_5885b8.slice();
  v_a448ad.splice(v_e86ad8, 1);
  return v_a448ad;
}
