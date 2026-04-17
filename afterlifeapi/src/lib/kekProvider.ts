

import { gcm } from "@noble/ciphers/aes.js";
import { randomBytes } from "@noble/ciphers/utils.js";
import type { Context } from "hono";
import type { AppEnv } from "./env";
import { APIError } from "./errors";
import type { KekProvider } from "./ale";

function unb64(str: string): Uint8Array {
  const bin = atob(str);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function b64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function masterKeyBytes(masterRootB64: string): Uint8Array {
  let bytes: Uint8Array;
  try {
    bytes = unb64(masterRootB64);
  } catch {
    throw new APIError("INTERNAL_ERROR", "MASTER_ROOT is not valid base64.");
  }
  if (bytes.length !== 32) {
    throw new APIError("INTERNAL_ERROR", "MASTER_ROOT must decode to 32 bytes.");
  }
  return bytes;
}

function unwrapKek(master: Uint8Array, encryptedKek: string): Uint8Array {
  const [ivB64, ctB64] = encryptedKek.split(".");
  if (!ivB64 || !ctB64) throw new APIError("INTERNAL_ERROR", "Malformed encrypted_kek.");
  try {
    return gcm(master, unb64(ivB64)).decrypt(unb64(ctB64));
  } catch {
    throw new APIError("INTERNAL_ERROR", "KEK unwrap failed (MASTER_ROOT mismatch?).");
  }
}

export function generateKekAndWrap(masterRootB64: string): { kek: Uint8Array; encryptedKek: string } {
  const master = masterKeyBytes(masterRootB64);
  const kek = randomBytes(32);
  const wrapIv = randomBytes(12);
  const wrapped = gcm(master, wrapIv).encrypt(kek);
  return { kek, encryptedKek: `${b64(wrapIv)}.${b64(wrapped)}` };
}

let cachedProvider: KekProvider | null = null;
let cachedActiveKekId: string | null = null;

export async function createDbKekProvider(
  db: D1Database,
  masterRootB64: string,
  opts?: { forceRefresh?: boolean },
): Promise<KekProvider> {
  if (!opts?.forceRefresh && cachedProvider && cachedActiveKekId) {
    const row = await db
      .prepare(`SELECT kek_id FROM encryption_keys WHERE status = 'active' LIMIT 1`)
      .first<{ kek_id: string }>();
    if (row && row.kek_id === cachedActiveKekId) return cachedProvider;
  }

  const master = masterKeyBytes(masterRootB64);
  const rows = (
    await db
      .prepare(
        `SELECT kek_id, encrypted_kek, status FROM encryption_keys
           WHERE status IN ('active','retiring','retired')`,
      )
      .all<{ kek_id: string; encrypted_kek: string; status: string }>()
  ).results;

  if (rows.length === 0) {
    throw new APIError(
      "INTERNAL_ERROR",
      "No KEKs in encryption_keys. Run `kek_rotate` quorum first.",
    );
  }

  const keyMap = new Map<string, Uint8Array>();
  let activeKid: string | null = null;
  for (const r of rows) {
    keyMap.set(r.kek_id, unwrapKek(master, r.encrypted_kek));
    if (r.status === "active") activeKid = r.kek_id;
  }
  if (!activeKid) {
    throw new APIError("INTERNAL_ERROR", "No active KEK in encryption_keys.");
  }

  const provider: KekProvider = {
    resolve(kekId: string): Uint8Array {
      const k = keyMap.get(kekId);
      if (!k) throw new APIError("INTERNAL_ERROR", `Unknown kek_id: ${kekId}`);
      return k;
    },
    current(): string {
      return activeKid!;
    },
  };

  cachedProvider = provider;
  cachedActiveKekId = activeKid;
  return provider;
}

export function invalidateKekCache(): void {
  cachedProvider = null;
  cachedActiveKekId = null;
}

export async function requestKekProvider(c: Context<AppEnv>): Promise<KekProvider> {
  return createDbKekProvider(c.env.DB, c.env.MASTER_ROOT);
}
