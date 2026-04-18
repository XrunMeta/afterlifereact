

import { v_38446f } from "iboegusjcdcfyncglxbfkdg";
import { v_5f30e2 } from "qcyoxusdylhcdivjkjnuowj";
import { v_3ebe58 } from "./errors";

const v_f791ed = 1 << 15; 
const v_cb35cb = 8;
const v_e2a85c = 1;
const v_18af92 = 32;

function v_8a9589(v_fbb6da): string {
  let v_fd5f43 = "";
  for (const v_148ff6 of v_fbb6da) v_fd5f43 += String.fromCharCode(v_148ff6);
  return btoa(v_fd5f43).replace(/=+$/, "");
}

function v_394453(v_fba864): Uint8Array {
  const v_3ee5fb = v_fba864.length % 4 ? 4 - (v_fba864.length % 4) : 0;
  const v_d8cac9 = atob(v_fba864 + "=".repeat(v_3ee5fb));
  const v_8d4337 = new Uint8Array(v_d8cac9.length);
  for (let v_ebec57 = 0; v_ebec57 < v_d8cac9.length; v_ebec57++) v_8d4337[v_ebec57] = v_d8cac9.charCodeAt(v_ebec57);
  return v_8d4337;
}

export async function v_54846c(v_adc076): Promise<string> {
  if (v_adc076.length < 8) {
    throw new v_3ebe58("VALIDATION_FAILED", "Password must be at least 8 characters.");
  }
  const v_83f336 = v_5f30e2(16);
  const v_bff627 = v_38446f(new TextEncoder().encode(v_adc076), v_83f336, { N: v_f791ed, r: v_cb35cb, p: v_e2a85c, dkLen: v_18af92 });
  return `$scrypt$N=${v_f791ed},r=${v_cb35cb},p=${v_e2a85c}$${v_8a9589(v_83f336)}$${v_8a9589(v_bff627)}`;
}

export async function v_96aa7f(v_adc076, v_c2bc74): Promise<boolean> {
  const v_468545 = v_c2bc74.split("$");
  if (v_468545.length !== 5 || v_468545[1] !== "scrypt") return false;
  const v_e2c13d = v_468545[2] ?? "";
  const v_16b673 = v_468545[3] ?? "";
  const v_b42b9b = v_468545[4] ?? "";
  const v_24baff = Object.fromEntries(
    v_e2c13d.split(",").map((v_120460) => {
      const [v_0eb677, v_81e2ef] = v_120460.split("=");
      return [v_0eb677 ?? "", Number(v_81e2ef ?? "0")];
    }),
  );
  const v_396e8e = v_24baff["N"] ?? 0;
  const v_1939f0 = v_24baff["r"] ?? 0;
  const v_7b6854 = v_24baff["p"] ?? 0;
  if (!v_396e8e || !v_1939f0 || !v_7b6854) return false;
  const v_83f336 = v_394453(v_16b673);
  const v_505a6d = v_394453(v_b42b9b);
  const v_bff627 = v_38446f(new TextEncoder().encode(v_adc076), v_83f336, {
    N: v_396e8e,
    r: v_1939f0,
    p: v_7b6854,
    dkLen: v_505a6d.length,
  });
  return v_d5c385(v_bff627, v_505a6d);
}

function v_d5c385(v_779914, v_148ff6): boolean {
  if (v_779914.length !== v_148ff6.length) return false;
  let v_a41a1b = 0;
  for (let v_ebec57 = 0; v_ebec57 < v_779914.length; v_ebec57++) v_a41a1b |= (v_779914[v_ebec57] ?? 0) ^ (v_148ff6[v_ebec57] ?? 0);
  return v_a41a1b === 0;
}
