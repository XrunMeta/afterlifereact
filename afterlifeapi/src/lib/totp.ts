

import { hmac } from "@noble/hashes/hmac.js";
import { sha1 } from "@noble/hashes/legacy.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { randomBytes } from "@noble/ciphers/utils.js";

const PERIOD = 30;
const DIGITS = 6;
const B32_ALPH = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(bytes: Uint8Array): string {
  let out = "";
  let buf = 0;
  let bits = 0;
  for (const b of bytes) {
    buf = (buf << 8) | b;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      out += B32_ALPH[(buf >> bits) & 0x1f];
    }
  }
  if (bits > 0) out += B32_ALPH[(buf << (5 - bits)) & 0x1f];
  return out;
}

export function base32Decode(str: string): Uint8Array {
  const clean = str.replace(/=+$/g, "").toUpperCase().replace(/\s+/g, "");
  const out: number[] = [];
  let buf = 0;
  let bits = 0;
  for (const ch of clean) {
    const v = B32_ALPH.indexOf(ch);
    if (v < 0) continue;
    buf = (buf << 5) | v;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      out.push((buf >> bits) & 0xff);
    }
  }
  return new Uint8Array(out);
}

function counterBytes(counter: number): Uint8Array {
  const b = new Uint8Array(8);

  let c = counter;
  for (let i = 7; i >= 0; i--) {
    b[i] = c & 0xff;
    c = Math.floor(c / 256);
  }
  return b;
}

function hotp(secret: Uint8Array, counter: number): string {
  const h = hmac(sha1, secret, counterBytes(counter));
  const offset = (h[h.length - 1] ?? 0) & 0x0f;
  const code =
    (((h[offset] ?? 0) & 0x7f) << 24) |
    (((h[offset + 1] ?? 0) & 0xff) << 16) |
    (((h[offset + 2] ?? 0) & 0xff) << 8) |
    ((h[offset + 3] ?? 0) & 0xff);
  return (code % 10 ** DIGITS).toString().padStart(DIGITS, "0");
}

export function generateTotp(secretB32: string, nowSec: number = Math.floor(Date.now() / 1000)): string {
  const counter = Math.floor(nowSec / PERIOD);
  return hotp(base32Decode(secretB32), counter);
}

export function verifyTotp(
  secretB32: string,
  code: string,
  lastUsedCounter: number | null,
  nowSec: number = Math.floor(Date.now() / 1000),
): number | null {
  if (!/^\d{6}$/.test(code)) return null;
  const secret = base32Decode(secretB32);
  const center = Math.floor(nowSec / PERIOD);
  for (const delta of [0, -1, 1]) {
    const counter = center + delta;
    if (lastUsedCounter !== null && counter <= lastUsedCounter) continue;
    if (hotp(secret, counter) === code) return counter;
  }
  return null;
}

export function randomTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

export function otpauthUrl(opts: { issuer: string; account: string; secretB32: string }): string {
  const label = encodeURIComponent(`${opts.issuer}:${opts.account}`);
  const params = new URLSearchParams({
    secret: opts.secretB32,
    issuer: opts.issuer,
    algorithm: "SHA1",
    digits: String(DIGITS),
    period: String(PERIOD),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

export interface RecoveryCodeBundle {
  plaintext: string[];   
  hashes: string[];      
}

function hashCode(code: string): string {
  const bytes = sha256(new TextEncoder().encode(code));
  let hex = "";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return hex;
}

export function generateRecoveryCodes(count = 10): RecoveryCodeBundle {
  const plaintext: string[] = [];
  const hashes: string[] = [];
  for (let i = 0; i < count; i++) {
    const raw = randomBytes(5);
    const code = base32Encode(raw);   
    const pretty = `${code.slice(0, 4)}-${code.slice(4, 8)}`;
    plaintext.push(pretty);
    hashes.push(hashCode(pretty));
  }
  return { plaintext, hashes };
}

export function consumeRecoveryCode(stored: string[], input: string): string[] | null {
  const normalized = input.trim().toUpperCase();
  const h = hashCode(normalized);
  const idx = stored.indexOf(h);
  if (idx < 0) return null;
  const next = stored.slice();
  next.splice(idx, 1);
  return next;
}
