import { APIError } from "./errors";

type Payload = Record<string, unknown> & {
  sub: number | string;
  exp?: number;
  iat?: number;
  jti?: string;
  iss?: string;
  aud?: string;
};

const ACCESS_TTL_SEC = 15 * 60;
const REFRESH_TTL_SEC = 8 * 60 * 60;

export const JWT_ISS = "afterlife-api";
export const JWT_AUD = "session";

function b64urlEncode(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function b64urlDecode(str: string): Uint8Array {
  const pad = str.length % 4 ? 4 - (str.length % 4) : 0;
  const b64 = (str + "=".repeat(pad)).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

const enc = new TextEncoder();

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function sign(data: string, secret: string): Promise<string> {
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return b64urlEncode(new Uint8Array(sig));
}

async function verify(data: string, sigB64: string, secret: string): Promise<boolean> {
  const key = await hmacKey(secret);
  return crypto.subtle.verify("HMAC", key, b64urlDecode(sigB64), enc.encode(data));
}

export async function issueToken(
  payload: Payload,
  secret: string,
  ttlSec: number,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const full: Payload = {
    iat: now,
    exp: now + ttlSec,
    jti: crypto.randomUUID(),
    iss: JWT_ISS,
    aud: JWT_AUD,
    ...payload,
  };
  const header = b64urlEncode(enc.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = b64urlEncode(enc.encode(JSON.stringify(full)));
  const data = `${header}.${body}`;
  const sig = await sign(data, secret);
  return `${data}.${sig}`;
}

export async function verifyToken<T extends Payload = Payload>(
  token: string,
  secret: string,
): Promise<T> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new APIError("UNAUTHENTICATED", "Malformed token.");
  const [h, b, s] = parts as [string, string, string];
  const data = `${h}.${b}`;
  const ok = await verify(data, s, secret);
  if (!ok) throw new APIError("UNAUTHENTICATED", "Invalid signature.");
  let payload: Payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(b64urlDecode(b))) as Payload;
  } catch {
    throw new APIError("UNAUTHENTICATED", "Malformed payload.");
  }
  if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
    throw new APIError("UNAUTHENTICATED", "Token expired.");
  }
  if (payload.iss !== JWT_ISS) throw new APIError("UNAUTHENTICATED", "Issuer mismatch.");
  if (payload.aud !== JWT_AUD) throw new APIError("UNAUTHENTICATED", "Audience mismatch.");
  return payload as T;
}

export function issueAccess(payload: Payload, secret: string) {
  return issueToken(payload, secret, ACCESS_TTL_SEC);
}

export function issueRefresh(payload: Payload, secret: string) {
  return issueToken(payload, secret, REFRESH_TTL_SEC);
}

export const JWT_TTL = { access: ACCESS_TTL_SEC, refresh: REFRESH_TTL_SEC };
