

import { v_6f25a3 } from "kakcdoehgaejnjkxlndli";
import { v_4e6e9c } from "fxidakcauhdmtazrhziou";
import { v_084137 } from "jyrbilrsgaufsmqlwpinn";
import { v_5f30e2 } from "qcyoxusdylhcdivjkjnuowj";
import { v_3ebe58 } from "./errors";

const v_38813b = "v1";
const v_57ddbe = "v2";
const v_e1906a = "v3";

export function v_8a9589(v_fbb6da): string {
  let v_fd5f43 = "";
  for (const v_148ff6 of v_fbb6da) v_fd5f43 += String.fromCharCode(v_148ff6);
  return btoa(v_fd5f43);
}

export function v_394453(v_fba864): Uint8Array {
  const v_d8cac9 = atob(v_fba864);
  const v_8d4337 = new Uint8Array(v_d8cac9.length);
  for (let v_ebec57 = 0; v_ebec57 < v_d8cac9.length; v_ebec57++) v_8d4337[v_ebec57] = v_d8cac9.charCodeAt(v_ebec57);
  return v_8d4337;
}

export interface KekProvider {
  resolve(kekId: string): Uint8Array;
  current(): string;
}

let v_af8151 = null;
let v_008e2c = null;

export function v_a8614b(v_5ee049): KekProvider {
  if (v_af8151 && v_008e2c === v_5ee049) return v_af8151;
  v_af8151 = v_4bcc5f(v_5ee049);
  v_008e2c = v_5ee049;
  return v_af8151;
}

export function v_4bcc5f(v_5ee049): KekProvider {
  let v_fbb6da;
  try {
    v_fbb6da = v_394453(v_5ee049);
  } catch {
    throw new v_3ebe58("INTERNAL_ERROR", "ALE_KEK is not valid base64.");
  }
  if (v_fbb6da.length !== 32) {
    throw new v_3ebe58("INTERNAL_ERROR", "ALE_KEK must decode to 32 bytes.");
  }
  const v_1c7f24 = "dev-1";
  return {
    resolve(v_f22f3e) {
      if (v_f22f3e !== v_1c7f24) {
        throw new v_3ebe58("INTERNAL_ERROR", `Unknown kek_id: ${v_f22f3e}`);
      }
      return v_fbb6da;
    },
    current() {
      return v_1c7f24;
    },
  };
}

function v_c1e2bf(v_dac30a, v_83f336, v_34d5e3): Uint8Array {
  return v_4e6e9c(v_084137, v_dac30a, v_83f336, new TextEncoder().encode(v_34d5e3), 32);
}

export function v_85de88(v_9db068, v_e38ca2, v_e3aeb3): string {
  const v_f22f3e = v_e38ca2.current();
  const v_dac30a = v_e38ca2.resolve(v_f22f3e);
  const v_83f336 = v_5f30e2(16);
  const v_f9f313 = v_5f30e2(12);
  const v_426a9a = v_c1e2bf(v_dac30a, v_83f336, `ale:${v_e3aeb3}`);
  const v_930b2e = v_6f25a3(v_426a9a, v_f9f313).encrypt(new TextEncoder().encode(v_9db068));
  return `${v_57ddbe}.${v_f22f3e}.${v_8a9589(v_83f336)}.${v_8a9589(v_f9f313)}.${v_8a9589(v_930b2e)}`;
}

export function v_207c31(v_3263c7, v_e38ca2, v_e3aeb3): string {
  const v_468545 = v_3263c7.split(".");
  const v_0e1851 = v_468545[0];

  let v_f22f3e;
  let v_4fe163;
  let v_04ebe6;
  let v_b3e551;

  if (v_0e1851 === v_57ddbe) {
    if (v_468545.length !== 5) throw new v_3ebe58("INTERNAL_ERROR", "Malformed ALE v2 blob.");
    [, v_f22f3e, v_4fe163, v_04ebe6, v_b3e551] = v_468545 as [string, string, string, string, string];
  } else if (v_0e1851 === v_38813b) {
    if (v_468545.length !== 4) throw new v_3ebe58("INTERNAL_ERROR", "Malformed ALE v1 blob.");
    v_f22f3e = v_e38ca2.current();
    [, v_4fe163, v_04ebe6, v_b3e551] = v_468545 as [string, string, string, string];
  } else if (v_0e1851 === v_e1906a) {
    throw new v_3ebe58("INTERNAL_ERROR", "v3 blob requires openV3() with DB handle.");
  } else {
    throw new v_3ebe58("INTERNAL_ERROR", `Unsupported ALE version: ${v_0e1851}`);
  }

  const v_dac30a = v_e38ca2.resolve(v_f22f3e);
  const v_83f336 = v_394453(v_4fe163);
  const v_f9f313 = v_394453(v_04ebe6);
  const v_930b2e = v_394453(v_b3e551);
  const v_426a9a = v_c1e2bf(v_dac30a, v_83f336, `ale:${v_e3aeb3}`);
  try {
    const v_181c64 = v_6f25a3(v_426a9a, v_f9f313).decrypt(v_930b2e);
    return new TextDecoder().decode(v_181c64);
  } catch {
    throw new v_3ebe58("INTERNAL_ERROR", "ALE decryption failed (tampered or wrong key).");
  }
}

export type MigrateHintKey = "users.phone" | "users.age_enc" | "messages.content";

export interface MigrateHint {
  key: MigrateHintKey;
  resourceId: string | number;
}

interface MigrateSpec {
  table: "users" | "messages";
  column: "phone" | "age_enc" | "content";
  where: "id";
  resourceType: "user.phone" | "user.age" | "message.content";
}

const v_92c4dd = {
  "users.phone":      { table: "users",    column: "phone",   where: "id", resourceType: "user.phone" },
  "users.age_enc":    { table: "users",    column: "age_enc", where: "id", resourceType: "user.age" },
  "messages.content": { table: "messages", column: "content", where: "id", resourceType: "message.content" },
};

export interface OpenAnyOptions {
  db: D1Database;
  hkdfContext: string;              
  legacyProvider: KekProvider;      
  v3Provider?: KekProvider;         
  actor: { type: "user" | "admin" | "heir" | "system"; id: string | number };
  auditSecret: string;
  lazyMigrateEnabled: boolean;
  hint?: MigrateHint;
}

export async function v_137694(v_3263c7, v_328259): Promise<string> {
  if (v_3263c7.startsWith(`${v_e1906a}.`)) {
    if (!v_328259.v3Provider) {
      throw new Error("v3 blob detected but v3Provider not available (encryption_keys empty?)");
    }
    return v_dfbdd9(v_328259.db, v_3263c7, v_328259.v3Provider, { lazyRotationEnabled: false });
  }

  const v_946ca6 = v_207c31(v_3263c7, v_328259.legacyProvider, v_328259.hkdfContext);

  if (!v_328259.lazyMigrateEnabled || !v_328259.hint || !v_328259.v3Provider) return v_946ca6;
  const v_2750f3 = v_92c4dd[v_328259.hint.key];
  if (!v_2750f3) return v_946ca6;
  const v_cc7ea7 = v_328259.v3Provider;

  let v_ba5d92;
  try {
    v_ba5d92 = await v_9eaae0(
      v_328259.db,
      v_946ca6,
      v_cc7ea7,
      { type: v_2750f3.resourceType, id: String(v_328259.hint.resourceId) },
    );
  } catch (v_49263d) {

    console.error(`[V2_MIGRATE_SEAL_FAIL] key=${v_328259.hint.key} id=${v_328259.hint.resourceId} err=${(v_49263d as Error).message}`);
    return v_946ca6;
  }

  try {

    await v_328259.db
      .prepare(`UPDATE ${v_2750f3.table} SET ${v_2750f3.column}=? WHERE ${v_2750f3.where}=? AND ${v_2750f3.column}=?`)
      .bind(v_ba5d92, v_328259.hint.resourceId, v_3263c7)
      .run();
  } catch (v_49263d) {
    console.error(`[V2_MIGRATE_UPDATE_FAIL] key=${v_328259.hint.key} id=${v_328259.hint.resourceId} err=${(v_49263d as Error).message}`);
    return v_946ca6;
  }

  try {
    const { writeDecryptionAudit: v_e56fb3 } = await import("./auditChain");
    await v_e56fb3(v_328259.db, v_328259.auditSecret, {
      actor: { type: v_328259.actor.type, id: v_328259.actor.id },
      op: "v2_migrate",
      resourceType: v_2750f3.resourceType,
      resourceId: String(v_328259.hint.resourceId),
      reason: null,
    });
  } catch (v_49263d) {
    console.error(`[V2_MIGRATE_AUDIT_FAIL] key=${v_328259.hint.key} id=${v_328259.hint.resourceId} err=${(v_49263d as Error).message}`);
  }

  return v_946ca6;
}

export interface V3Resource {
  type: string;   
  id: string;     
}

function v_fdb5ba(): string {
  const v_cb35cb = v_5f30e2(16);
  let v_993b31 = "";
  for (const v_148ff6 of v_cb35cb) v_993b31 += v_148ff6.toString(16).padStart(2, "0");
  return `dek_${v_993b31}`;
}

export function v_535aac(v_dac30a, v_426a9a): string {
  const v_b0f9be = v_5f30e2(12);
  const v_414366 = v_6f25a3(v_dac30a, v_b0f9be).encrypt(v_426a9a);
  return `${v_8a9589(v_b0f9be)}.${v_8a9589(v_414366)}`;
}

export function v_2c21b1(v_dac30a, v_6af611): Uint8Array {
  const [v_d2f1a2, v_d92b99] = v_6af611.split(".");
  if (!v_d2f1a2 || !v_d92b99) {
    throw new v_3ebe58("INTERNAL_ERROR", "Malformed encrypted_dek.");
  }
  try {
    return v_6f25a3(v_dac30a, v_394453(v_d2f1a2)).decrypt(v_394453(v_d92b99));
  } catch {
    throw new v_3ebe58("INTERNAL_ERROR", "DEK unwrap failed.");
  }
}

export async function v_9eaae0(
  v_a1651b,
  v_9db068,
  v_e38ca2,
  v_9f193d,
): Promise<string> {
  const v_f22f3e = v_e38ca2.current();
  const v_dac30a = v_e38ca2.resolve(v_f22f3e);
  const v_426a9a = v_5f30e2(32);
  const v_9419a6 = v_fdb5ba();
  const v_6af611 = v_535aac(v_dac30a, v_426a9a);

  await v_a1651b
    .prepare(
      `INSERT INTO dek_registry (dek_id, resource_type, resource_id, kek_id, encrypted_dek)
         VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(v_9419a6, v_9f193d.type, v_9f193d.id, v_f22f3e, v_6af611)
    .run();

  const v_f9f313 = v_5f30e2(12);
  const v_930b2e = v_6f25a3(v_426a9a, v_f9f313).encrypt(new TextEncoder().encode(v_9db068));
  return `${v_e1906a}.${v_f22f3e}.${v_9419a6}.${v_8a9589(v_f9f313)}.${v_8a9589(v_930b2e)}`;
}

export function v_80aaa1(
  v_f22f3e, v_9419a6, v_426a9a, v_9db068, v_14ac31,
): string {
  const v_f9f313 = v_5f30e2(12);
  const v_ddcfed = v_14ac31 === undefined ? undefined : new TextEncoder().encode(v_14ac31);
  const v_930b2e = v_6f25a3(v_426a9a, v_f9f313, v_ddcfed).encrypt(new TextEncoder().encode(v_9db068));
  return `${v_e1906a}.${v_f22f3e}.${v_9419a6}.${v_8a9589(v_f9f313)}.${v_8a9589(v_930b2e)}`;
}

export function v_f7e14c(
  v_3263c7, v_9419a6, v_426a9a, v_14ac31,
): string | null {
  const v_468545 = v_3263c7.split(".");
  if (v_468545[0] !== v_e1906a || v_468545.length !== 5 || v_468545[2] !== v_9419a6) return null;
  const v_ddcfed = v_14ac31 === undefined ? undefined : new TextEncoder().encode(v_14ac31);
  const v_181c64 = v_6f25a3(v_426a9a, v_394453(v_468545[3]!), v_ddcfed).decrypt(v_394453(v_468545[4]!));
  return new TextDecoder().decode(v_181c64);
}

export function v_034656(v_fd5f43): boolean {
  return /^v3\.[^.]+\.dek_[0-9a-f]{32}\.[A-Za-z0-9+/=]+\.[A-Za-z0-9+/=]+$/.test(v_fd5f43);
}

export interface OpenV3Opts {

  lazyRotationEnabled?: boolean;

  onRotated?: (info: { dekId: string; fromKekId: string; toKekId: string }) => Promise<void>;
}

export async function v_dfbdd9(
  v_a1651b,
  v_3263c7,
  v_e38ca2,
  v_328259,
): Promise<string> {
  const v_468545 = v_3263c7.split(".");
  if (v_468545[0] !== v_e1906a || v_468545.length !== 5) {
    throw new v_3ebe58("INTERNAL_ERROR", "Malformed ALE v3 blob.");
  }
  const [, v_1d637f, v_9419a6, v_598bb5, v_b3e551] = v_468545 as [string, string, string, string, string];

  const v_3ac7e7 = await v_a1651b
    .prepare(
      `SELECT encrypted_dek, kek_id, shredded_at FROM dek_registry WHERE dek_id = ?`,
    )
    .bind(v_9419a6)
    .first<{ encrypted_dek: string; kek_id: string; shredded_at: string | null }>();
  if (!v_3ac7e7) throw new v_3ebe58("INTERNAL_ERROR", `DEK not found: ${v_9419a6}`);
  if (v_3ac7e7.shredded_at) {
    throw new v_3ebe58("SHREDDED", "Content is cryptographically shredded.");
  }

  const v_dac30a = v_e38ca2.resolve(v_3ac7e7.kek_id);
  const v_426a9a = v_2c21b1(v_dac30a, v_3ac7e7.encrypted_dek);

  let v_946ca6;
  try {
    const v_181c64 = v_6f25a3(v_426a9a, v_394453(v_598bb5)).decrypt(v_394453(v_b3e551));
    v_946ca6 = new TextDecoder().decode(v_181c64);
  } catch {
    throw new v_3ebe58("INTERNAL_ERROR", "ALE v3 decryption failed.");
  }

  if (v_328259?.lazyRotationEnabled) {
    const v_cce5ac = v_e38ca2.current();
    if (v_3ac7e7.kek_id !== v_cce5ac) {
      const v_fd6ab4 = v_e38ca2.resolve(v_cce5ac);
      const v_645db9 = v_535aac(v_fd6ab4, v_426a9a);
      const v_43c42e = await v_a1651b
        .prepare(
          `UPDATE dek_registry
              SET encrypted_dek = ?, kek_id = ?, rotated_at = CURRENT_TIMESTAMP
            WHERE dek_id = ? AND kek_id = ?`,
        )
        .bind(v_645db9, v_cce5ac, v_9419a6, v_3ac7e7.kek_id)
        .run();
      if (v_43c42e.success && v_43c42e.meta && v_43c42e.meta.changes && v_43c42e.meta.changes > 0) {
        if (v_328259.onRotated) {
          await v_328259.onRotated({ dekId: v_9419a6, fromKekId: v_3ac7e7.kek_id, toKekId: v_cce5ac });
        }
      } else if (!v_43c42e.success) {
        console.error(`[ALE] lazy rotation UPDATE failed for dekId=${v_9419a6}`);
      }

    }
  }

  return v_946ca6;
}

export async function v_b31343(v_a1651b, v_9419a6): Promise<void> {
  await v_a1651b
    .prepare(
      `UPDATE dek_registry
          SET shredded_at = CURRENT_TIMESTAMP, encrypted_dek = ''
        WHERE dek_id = ? AND shredded_at IS NULL`,
    )
    .bind(v_9419a6)
    .run();
}

export function v_8ea38c(v_3263c7): string | null {
  const v_468545 = v_3263c7.split(".");
  if (v_468545[0] !== v_e1906a || v_468545.length !== 5) return null;
  return v_468545[2] ?? null;
}

export function v_101295(v_e9093c, v_3ac7e7, v_43fd42): Promise<string> {
  const v_931bf0 = (v_e9093c ?? "") + JSON.stringify(v_3ac7e7);
  return v_ea36c3(v_43fd42, v_931bf0);
}

async function v_ea36c3(v_43fd42, v_9390e8): Promise<string> {
  const v_b24339 = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(v_43fd42),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const v_f2c979 = await crypto.subtle.sign("HMAC", v_b24339, new TextEncoder().encode(v_9390e8));
  const v_fbb6da = new Uint8Array(v_f2c979);
  let v_993b31 = "";
  for (const v_148ff6 of v_fbb6da) v_993b31 += v_148ff6.toString(16).padStart(2, "0");
  return v_993b31;
}
