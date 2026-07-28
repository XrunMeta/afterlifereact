

import type { Bindings } from "./env";
import { APIError } from "./errors";

export interface AppleTransactionInfo {
  transactionId: string;
  originalTransactionId: string;
  bundleId: string;
  productId: string;
  purchaseDate: number;          
  originalPurchaseDate: number;  
  quantity: number;
  type: "Consumable" | "Non-Consumable" | "Auto-Renewable Subscription" | "Non-Renewing Subscription";
  environment: "Sandbox" | "Production";

  expiresDate?: number;
  subscriptionGroupIdentifier?: string;

  revocationDate?: number;
  revocationReason?: number;
}

interface AppleSecrets {
  keyP8: string;
  keyId: string;
  issuerId: string;
  bundleId: string;
}

function readSecrets(env: Bindings): AppleSecrets {
  const { APPLE_IAP_KEY_P8, APPLE_IAP_KEY_ID, APPLE_IAP_ISSUER_ID, APPLE_IAP_BUNDLE_ID } = env;
  if (!APPLE_IAP_KEY_P8 || !APPLE_IAP_KEY_ID || !APPLE_IAP_ISSUER_ID || !APPLE_IAP_BUNDLE_ID) {
    throw new APIError(
      "UPSTREAM_FAILURE",
      "Apple IAP not configured. Set APPLE_IAP_KEY_P8 / KEY_ID / ISSUER_ID / BUNDLE_ID secrets.",
    );
  }
  return {
    keyP8: APPLE_IAP_KEY_P8,
    keyId: APPLE_IAP_KEY_ID,
    issuerId: APPLE_IAP_ISSUER_ID,
    bundleId: APPLE_IAP_BUNDLE_ID,
  };
}

function pemToPkcs8Bytes(pem: string): Uint8Array {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function b64urlEncode(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
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
const dec = new TextDecoder();

async function signAppStoreJwt(secrets: AppleSecrets): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "ES256", kid: secrets.keyId, typ: "JWT" };
  const payload = {
    iss: secrets.issuerId,
    iat: now,
    exp: now + 60 * 20,      
    aud: "appstoreconnect-v1",
    bid: secrets.bundleId,
  };

  const encH = b64urlEncode(enc.encode(JSON.stringify(header)));
  const encP = b64urlEncode(enc.encode(JSON.stringify(payload)));
  const data = `${encH}.${encP}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToPkcs8Bytes(secrets.keyP8).buffer as ArrayBuffer,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    enc.encode(data),
  );
  return `${data}.${b64urlEncode(new Uint8Array(sig))}`;
}

function parseJwsPayload<T>(jws: string): T {
  const parts = jws.split(".");
  if (parts.length !== 3) throw new APIError("VALIDATION_FAILED", "Malformed JWS.");
  const payloadB64 = parts[1]!;
  const json = dec.decode(b64urlDecode(payloadB64));
  return JSON.parse(json) as T;
}

export async function verifyAppleTransaction(
  env: Bindings,
  transactionId: string,
): Promise<AppleTransactionInfo> {
  const secrets = readSecrets(env);
  const jwt = await signAppStoreJwt(secrets);
  const headers = { Authorization: `Bearer ${jwt}` };

  const paths: Array<{ base: string; envLabel: "Production" | "Sandbox" }> = [
    { base: "https://oth-path.storekit.itunes.apple.com", envLabel: "Production" },
    { base: "https://oth-path.storekit-sandbox.itunes.apple.com", envLabel: "Sandbox" },
  ];

  let lastErr: string | null = null;
  for (const { base, envLabel } of paths) {
    const url = `${base}/inApps/v1/transactions/${encodeURIComponent(transactionId)}`;
    const res = await fetch(url, { headers });
    if (res.status === 404) {
      lastErr = `${envLabel}: 404 not found`;
      continue; 
    }
    if (!res.ok) {
      const body = await res.text();
      throw new APIError(
        "UPSTREAM_FAILURE",
        `Apple API ${res.status} in ${envLabel}: ${body.slice(0, 300)}`,
      );
    }
    const data = (await res.json()) as { signedTransactionInfo?: string };
    if (!data.signedTransactionInfo) {
      throw new APIError("UPSTREAM_FAILURE", `Apple ${envLabel} missing signedTransactionInfo.`);
    }
    const info = parseJwsPayload<AppleTransactionInfo>(data.signedTransactionInfo);

    if (info.bundleId !== secrets.bundleId) {
      throw new APIError(
        "VALIDATION_FAILED",
        `bundleId mismatch: expected ${secrets.bundleId} got ${info.bundleId}`,
      );
    }

    if (info.environment !== envLabel) {
      console.warn(
        `[apple-iap] endpoint=${envLabel} but payload.environment=${info.environment} (tx=${info.transactionId})`,
      );
    }
    return info;
  }

  throw new APIError("NOT_FOUND", `Transaction not found in Apple (${lastErr}).`);
}
