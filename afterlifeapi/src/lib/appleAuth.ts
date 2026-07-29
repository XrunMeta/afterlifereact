

import type { Bindings } from "./env";
import { APIError } from "./errors";

export interface AppleIdTokenPayload {

  sub: string;

  email: string;

  email_verified: boolean;

  is_private_email: boolean;
}

const APPLE_ISSUER = "https://appleid.apple.com";
const APPLE_KEYS_URL = "https://appleid.apple.com/oth-path";
const APPLE_BUNDLE_ID = "run.xrun.afterlifeRN"; 

type Jwk = {
  kty: string;
  kid: string;
  use: string;
  alg: string;
  n: string;
  e: string;
};
type CachedKeys = { fetchedAt: number; keys: Jwk[] };
const KEY_CACHE_TTL_MS = 60 * 60 * 1000; 
const cache: { current: CachedKeys | null } = { current: null };

async function fetchAppleKeys(): Promise<Jwk[]> {
  const now = Date.now();
  if (cache.current && now - cache.current.fetchedAt < KEY_CACHE_TTL_MS) {
    return cache.current.keys;
  }
  let res: Response;
  try {
    res = await fetch(APPLE_KEYS_URL);
  } catch (err) {
    throw new APIError("UPSTREAM_FAILURE", `Apple keys network: ${(err as Error).message}`);
  }
  if (!res.ok) throw new APIError("UPSTREAM_FAILURE", `Apple keys HTTP ${res.status}`);
  const body = (await res.json()) as { keys: Jwk[] };
  if (!body?.keys?.length) throw new APIError("UPSTREAM_FAILURE", "Apple keys empty");
  cache.current = { fetchedAt: now, keys: body.keys };
  return body.keys;
}

function b64urlDecode(s: string): Uint8Array {

  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function b64urlDecodeToJson<T>(s: string): T {
  const bytes = b64urlDecode(s);
  const text = new TextDecoder().decode(bytes);
  return JSON.parse(text) as T;
}

async function verifyJwsSignature(idToken: string, jwk: Jwk): Promise<boolean> {
  const [h, p, sig] = idToken.split(".");

  if (!h || !p || !sig) {
    throw new APIError("UNAUTHENTICATED", "Malformed Apple identity token.");
  }
  const signingInput = new TextEncoder().encode(`${h}.${p}`);
  const signature = b64urlDecode(sig);
  const key = await crypto.subtle.importKey(
    "jwk",
    { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: "RS256", ext: true },
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  return crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, signature, signingInput);
}

export async function verifyAppleIdToken(
  _env: Bindings,
  idToken: string,
): Promise<AppleIdTokenPayload> {
  const parts = idToken.split(".");
  const [headerB64, payloadB64] = parts;

  if (parts.length !== 3 || !headerB64 || !payloadB64) {
    throw new APIError("UNAUTHENTICATED", "Malformed Apple identity token.");
  }
  const header = b64urlDecodeToJson<{ alg: string; kid: string }>(headerB64);
  if (header.alg !== "RS256") {
    throw new APIError("UNAUTHENTICATED", `Unsupported alg: ${header.alg}`);
  }

  let keys = await fetchAppleKeys();
  let matchedKey = keys.find((k) => k.kid === header.kid);
  if (!matchedKey) {

    cache.current = null;
    keys = await fetchAppleKeys();
    matchedKey = keys.find((k) => k.kid === header.kid);
    if (!matchedKey) {
      throw new APIError("UNAUTHENTICATED", `Apple key kid=${header.kid} not found.`);
    }
  }

  const sigOk = await verifyJwsSignature(idToken, matchedKey);
  if (!sigOk) throw new APIError("UNAUTHENTICATED", "Apple token signature invalid.");

  const payload = b64urlDecodeToJson<{
    iss: string;
    aud: string;
    exp: number;
    iat: number;
    sub: string;
    email?: string;
    email_verified?: string | boolean;
    is_private_email?: string | boolean;
  }>(payloadB64);

  if (payload.iss !== APPLE_ISSUER) {
    throw new APIError("UNAUTHENTICATED", `Token issuer mismatch: ${payload.iss}`);
  }
  if (payload.aud !== APPLE_BUNDLE_ID) {
    throw new APIError("UNAUTHENTICATED", `Token audience mismatch: ${payload.aud}`);
  }
  if (!payload.exp || payload.exp * 1000 < Date.now()) {
    throw new APIError("UNAUTHENTICATED", "Apple token expired.");
  }
  if (!payload.sub) {
    throw new APIError("UNAUTHENTICATED", "Apple token missing sub.");
  }
  if (!payload.email) {

    throw new APIError("UNAUTHENTICATED", "Apple token missing email (첫 로그인 이후엔 email 재발급 안 됨 — Apple 설정에서 앱 revoke 후 재시도).");
  }
  const verifiedRaw = payload.email_verified;
  const emailVerified = verifiedRaw === true || verifiedRaw === "true";
  if (!emailVerified) {
    throw new APIError("UNAUTHENTICATED", "Email not verified by Apple.");
  }
  const relayRaw = payload.is_private_email;
  const isPrivateEmail = relayRaw === true || relayRaw === "true";
  return {
    sub: payload.sub,
    email: payload.email,
    email_verified: true,
    is_private_email: isPrivateEmail,
  };
}
