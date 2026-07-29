

import type { v_273a0c } from "./env";
import { v_3ebe58 } from "./errors";

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

function v_fd17d9(env: v_273a0c): AppleSecrets {
  const { APPLE_IAP_KEY_P8: v_80a1ca, APPLE_IAP_KEY_ID: v_8014ae, APPLE_IAP_ISSUER_ID: v_1372cd, APPLE_IAP_BUNDLE_ID: v_b4d20e } = v_c9c489;
  if (!v_80a1ca || !v_8014ae || !v_1372cd || !v_b4d20e) {
    throw new v_3ebe58(
      "UPSTREAM_FAILURE",
      "Apple IAP not configured. Set APPLE_IAP_KEY_P8 / KEY_ID / ISSUER_ID / BUNDLE_ID secrets.",
    );
  }
  return {
    keyP8: v_80a1ca,
    keyId: v_8014ae,
    issuerId: v_1372cd,
    bundleId: v_b4d20e,
  };
}

function v_9330b8(v_546824): Uint8Array {
  const v_8a9589 = v_546824
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");
  const v_d8cac9 = atob(v_8a9589);
  const v_fbb6da = new Uint8Array(v_d8cac9.length);
  for (let v_ebec57 = 0; v_ebec57 < v_d8cac9.length; v_ebec57++) v_fbb6da[v_ebec57] = v_d8cac9.charCodeAt(v_ebec57);
  return v_fbb6da;
}

function v_c2e1c1(v_fbb6da): string {
  let v_fd5f43 = "";
  for (const v_148ff6 of v_fbb6da) v_fd5f43 += String.fromCharCode(v_148ff6);
  return btoa(v_fd5f43).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function v_fb5305(v_fba864): Uint8Array {
  const v_3ee5fb = v_fba864.length % 4 ? 4 - (v_fba864.length % 4) : 0;
  const v_8a9589 = (v_fba864 + "=".repeat(v_3ee5fb)).replace(/-/g, "+").replace(/_/g, "/");
  const v_d8cac9 = atob(v_8a9589);
  const v_8d4337 = new Uint8Array(v_d8cac9.length);
  for (let v_ebec57 = 0; v_ebec57 < v_d8cac9.length; v_ebec57++) v_8d4337[v_ebec57] = v_d8cac9.charCodeAt(v_ebec57);
  return v_8d4337;
}

const v_40aece = new TextEncoder();
const v_eef514 = new TextDecoder();

async function v_2a207b(v_e0ba15): Promise<string> {
  const v_5c2f9f = Math.floor(Date.now() / 1000);
  const v_ad8d0d = { alg: "ES256", kid: v_e0ba15.keyId, typ: "JWT" };
  const v_931bf0 = {
    iss: v_e0ba15.issuerId,
    iat: v_5c2f9f,
    exp: v_5c2f9f + 60 * 20,      
    aud: "appstoreconnect-v1",
    bid: v_e0ba15.bundleId,
  };

  const v_7004a9 = v_c2e1c1(v_40aece.encode(JSON.stringify(v_ad8d0d)));
  const v_dcf7bd = v_c2e1c1(v_40aece.encode(JSON.stringify(v_931bf0)));
  const v_9390e8 = `${v_7004a9}.${v_dcf7bd}`;

  const v_b24339 = await crypto.subtle.importKey(
    "pkcs8",
    v_9330b8(v_e0ba15.keyP8).buffer as ArrayBuffer,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const v_f2c979 = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    v_b24339,
    v_40aece.encode(v_9390e8),
  );
  return `${v_9390e8}.${v_c2e1c1(new Uint8Array(v_f2c979))}`;
}

function v_ad921d<T>(v_cf7834): T {
  const v_468545 = v_cf7834.split(".");
  if (v_468545.length !== 3) throw new v_3ebe58("VALIDATION_FAILED", "Malformed JWS.");
  const v_aa57be = v_468545[1]!;
  const v_7ecfd1 = v_eef514.decode(v_fb5305(v_aa57be));
  return JSON.parse(v_7ecfd1) as T;
}

export async function v_824292(
  env: v_273a0c,
  v_099d99,
): Promise<AppleTransactionInfo> {
  const v_e0ba15 = v_fd17d9(v_c9c489);
  const v_56b352 = await v_2a207b(v_e0ba15);
  const v_3f4675 = { Authorization: `Bearer ${v_56b352}` };

  const v_d8a9e2 = [
    { base: "https://oth-path.storekit.itunes.apple.com", envLabel: "Production" },
    { base: "https://oth-path.storekit-sandbox.itunes.apple.com", envLabel: "Sandbox" },
  ];

  let v_7b2f0c = null;
  for (const { base: v_694b25, envLabel: v_2ae330 } of v_d8a9e2) {
    const v_f71b56 = `${v_694b25}/inApps/v1/transactions/${encodeURIComponent(v_099d99)}`;
    const v_8f00b9 = await fetch(v_f71b56, { headers: v_3f4675 });
    if (v_8f00b9.status === 404) {
      v_7b2f0c = `${v_2ae330}: 404 not found`;
      continue; 
    }
    if (!v_8f00b9.ok) {
      const v_4d33b2 = await v_8f00b9.text();
      throw new v_3ebe58(
        "UPSTREAM_FAILURE",
        `Apple API ${v_8f00b9.status} in ${v_2ae330}: ${v_4d33b2.slice(0, 300)}`,
      );
    }
    const v_9390e8 = (await v_8f00b9.json()) as { signedTransactionInfo?: string };
    if (!v_9390e8.signedTransactionInfo) {
      throw new v_3ebe58("UPSTREAM_FAILURE", `Apple ${v_2ae330} missing signedTransactionInfo.`);
    }
    const v_34d5e3 = v_ad921d<AppleTransactionInfo>(v_9390e8.signedTransactionInfo);

    if (v_34d5e3.bundleId !== v_e0ba15.bundleId) {
      throw new v_3ebe58(
        "VALIDATION_FAILED",
        `bundleId mismatch: expected ${v_e0ba15.bundleId} got ${v_34d5e3.bundleId}`,
      );
    }

    if (v_34d5e3.environment !== v_2ae330) {
      console.warn(
        `[apple-iap] endpoint=${v_2ae330} but payload.environment=${v_34d5e3.environment} (tx=${v_34d5e3.transactionId})`,
      );
    }
    return v_34d5e3;
  }

  throw new v_3ebe58("NOT_FOUND", `Transaction not found in Apple (${v_7b2f0c}).`);
}
