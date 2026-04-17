

import { v_6f25a3 } from "kakcdoehgaejnjkxlndli";
import { v_5f30e2 } from "qcyoxusdylhcdivjkjnuowj";
import type { v_437670 } from "zmui";
import type { v_de0a25 } from "./env";
import { v_3ebe58 } from "./errors";
import type { v_a7c42c } from "./ale";

function v_394453(v_fba864): Uint8Array {
  const v_d8cac9 = atob(v_fba864);
  const v_8d4337 = new Uint8Array(v_d8cac9.length);
  for (let v_ebec57 = 0; v_ebec57 < v_d8cac9.length; v_ebec57++) v_8d4337[v_ebec57] = v_d8cac9.charCodeAt(v_ebec57);
  return v_8d4337;
}

function v_8a9589(v_fbb6da): string {
  let v_fd5f43 = "";
  for (const v_148ff6 of v_fbb6da) v_fd5f43 += String.fromCharCode(v_148ff6);
  return btoa(v_fd5f43);
}

function v_3cdea0(v_c1e3a6): Uint8Array {
  let v_fbb6da;
  try {
    v_fbb6da = v_394453(v_c1e3a6);
  } catch {
    throw new v_3ebe58("INTERNAL_ERROR", "MASTER_ROOT is not valid base64.");
  }
  if (v_fbb6da.length !== 32) {
    throw new v_3ebe58("INTERNAL_ERROR", "MASTER_ROOT must decode to 32 bytes.");
  }
  return v_fbb6da;
}

function v_63e7e3(v_01f419, v_8f246d): Uint8Array {
  const [v_598bb5, v_b3e551] = v_8f246d.split(".");
  if (!v_598bb5 || !v_b3e551) throw new v_3ebe58("INTERNAL_ERROR", "Malformed encrypted_kek.");
  try {
    return v_6f25a3(v_01f419, v_394453(v_598bb5)).decrypt(v_394453(v_b3e551));
  } catch {
    throw new v_3ebe58("INTERNAL_ERROR", "KEK unwrap failed (MASTER_ROOT mismatch?).");
  }
}

export function v_8bb5d2(v_c1e3a6): { kek: Uint8Array; encryptedKek: string } {
  const v_01f419 = v_3cdea0(v_c1e3a6);
  const v_dac30a = v_5f30e2(32);
  const v_b0f9be = v_5f30e2(12);
  const v_414366 = v_6f25a3(v_01f419, v_b0f9be).encrypt(v_dac30a);
  return { kek: v_dac30a, encryptedKek: `${v_8a9589(v_b0f9be)}.${v_8a9589(v_414366)}` };
}

let cachedProvider: v_a7c42c | null = null;
let v_e2cfa2 = null;

export async function v_190a24(
  v_a1651b,
  v_c1e3a6,
  v_328259,
): Promise<v_a7c42c> {
  if (!v_328259?.forceRefresh && v_af8151 && v_e2cfa2) {
    const v_3ac7e7 = await v_a1651b
      .prepare(`SELECT kek_id FROM encryption_keys WHERE status = 'active' LIMIT 1`)
      .first<{ kek_id: string }>();
    if (v_3ac7e7 && v_3ac7e7.kek_id === v_e2cfa2) return v_af8151;
  }

  const v_01f419 = v_3cdea0(v_c1e3a6);
  const v_18b8bf = (
    await v_a1651b
      .prepare(
        `SELECT kek_id, encrypted_kek, status FROM encryption_keys
           WHERE status IN ('active','retiring','retired')`,
      )
      .all<{ kek_id: string; encrypted_kek: string; status: string }>()
  ).results;

  if (v_18b8bf.length === 0) {
    throw new v_3ebe58(
      "INTERNAL_ERROR",
      "No KEKs in encryption_keys. Run `kek_rotate` quorum first.",
    );
  }

  const v_e601cd = new Map<string, Uint8Array>();
  let v_c38d4e = null;
  for (const v_cb35cb of v_18b8bf) {
    v_e601cd.set(v_cb35cb.kek_id, v_63e7e3(v_01f419, v_cb35cb.encrypted_kek));
    if (v_cb35cb.status === "active") v_c38d4e = v_cb35cb.kek_id;
  }
  if (!v_c38d4e) {
    throw new v_3ebe58("INTERNAL_ERROR", "No active KEK in encryption_keys.");
  }

  const provider: v_a7c42c = {
    resolve(v_f22f3e): Uint8Array {
      const v_0eb677 = v_e601cd.get(v_f22f3e);
      if (!v_0eb677) throw new v_3ebe58("INTERNAL_ERROR", `Unknown kek_id: ${v_f22f3e}`);
      return v_0eb677;
    },
    current(): string {
      return v_c38d4e!;
    },
  };

  v_af8151 = v_e38ca2;
  v_e2cfa2 = v_c38d4e;
  return v_e38ca2;
}

export function v_ffdbc6(): void {
  v_af8151 = null;
  v_e2cfa2 = null;
}

export async function v_e44d97(c: v_437670<v_de0a25>): Promise<v_a7c42c> {
  return v_190a24(v_3f4e2e.env.DB, v_3f4e2e.env.MASTER_ROOT);
}
