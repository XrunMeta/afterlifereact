

import { scrypt } from "@noble/hashes/scrypt.js";
import { randomBytes } from "@noble/ciphers/utils.js";
import { APIError } from "./errors";

const N = 1 << 15; 
const r = 8;
const p = 1;
const KEY_LEN = 32;

function b64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/=+$/, "");
}

function unb64(str: string): Uint8Array {
  const pad = str.length % 4 ? 4 - (str.length % 4) : 0;
  const bin = atob(str + "=".repeat(pad));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function hashPassword(password: string): Promise<string> {

  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{7,}$/.test(password)) {
    throw new APIError(
      "VALIDATION_FAILED",
      "Password must be 7+ chars with lowercase, uppercase, and digit.",
    );
  }
  const salt = randomBytes(16);
  const derived = scrypt(new TextEncoder().encode(password), salt, { N, r, p, dkLen: KEY_LEN });
  return `$scrypt$N=${N},r=${r},p=${p}$${b64(salt)}$${b64(derived)}`;
}

export async function verifyPassword(password: string, phc: string): Promise<boolean> {
  const parts = phc.split("$");
  if (parts.length !== 5 || parts[1] !== "scrypt") return false;
  const paramsStr = parts[2] ?? "";
  const saltB64 = parts[3] ?? "";
  const hashB64 = parts[4] ?? "";
  const params = Object.fromEntries(
    paramsStr.split(",").map((kv) => {
      const [k, v] = kv.split("=");
      return [k ?? "", Number(v ?? "0")];
    }),
  );
  const Nv = params["N"] ?? 0;
  const rv = params["r"] ?? 0;
  const pv = params["p"] ?? 0;
  if (!Nv || !rv || !pv) return false;
  const salt = unb64(saltB64);
  const expected = unb64(hashB64);
  const derived = scrypt(new TextEncoder().encode(password), salt, {
    N: Nv,
    r: rv,
    p: pv,
    dkLen: expected.length,
  });
  return timingSafeEqual(derived, expected);
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}
