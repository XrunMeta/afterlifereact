

import type { v_273a0c } from "./env";
import { v_3ebe58 } from "./errors";

export interface GooglePlayTransactionInfo {
  productId: string;
  orderId: string;
  purchaseTime: number;   
  expiryTime?: number;    
  kind: "consumable" | "subscription";
  purchaseState?: number; 
  acknowledgementState?: number;
  regionCode?: string;

  autoRenewing?: boolean;
}

interface ServiceAccount {
  client_email: string;
  private_key: string;
  token_uri: string;
}

function v_cec848(env: v_273a0c): ServiceAccount {
  const { GOOGLE_PLAY_SERVICE_ACCOUNT_JSON: v_3fb03c } = v_c9c489;
  if (!v_3fb03c) {
    throw new v_3ebe58(
      "UPSTREAM_FAILURE",
      "Google Play not configured. Set GOOGLE_PLAY_SERVICE_ACCOUNT_JSON secret.",
    );
  }
  try {
    const v_89cd1b = JSON.parse(v_3fb03c) as {
      client_email?: string;
      private_key?: string;
      token_uri?: string;
    };
    if (!v_89cd1b.client_email || !v_89cd1b.private_key) {
      throw new Error("missing client_email/private_key");
    }
    return {
      client_email: v_89cd1b.client_email,
      private_key: v_89cd1b.private_key,
      token_uri: v_89cd1b.token_uri ?? "https://oauth2.googleapis.com/token",
    };
  } catch (v_49263d) {
    throw new v_3ebe58(
      "UPSTREAM_FAILURE",
      `Invalid GOOGLE_PLAY_SERVICE_ACCOUNT_JSON: ${(v_49263d as Error).message}`,
    );
  }
}

function v_548289(env: v_273a0c): string {
  const v_e2a85c = v_c9c489.ANDROID_PACKAGE_NAME;
  if (!v_e2a85c) throw new v_3ebe58("UPSTREAM_FAILURE", "ANDROID_PACKAGE_NAME not set.");
  return v_e2a85c;
}

function v_9330b8(v_546824): Uint8Array {
  const v_8a9589 = v_546824
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\\n/g, "\n")     
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

const v_40aece = new TextEncoder();

async function v_0da193(v_89cd1b): Promise<string> {
  const v_5c2f9f = Math.floor(Date.now() / 1000);
  const v_ad8d0d = { alg: "RS256", typ: "JWT" };
  const v_de0f68 = {
    iss: v_89cd1b.client_email,
    scope: "https://www.googleapis.com/oth-path",
    aud: v_89cd1b.token_uri,
    iat: v_5c2f9f,
    exp: v_5c2f9f + 3600, 
  };
  const v_7004a9 = v_c2e1c1(v_40aece.encode(JSON.stringify(v_ad8d0d)));
  const v_dcf7bd = v_c2e1c1(v_40aece.encode(JSON.stringify(v_de0f68)));
  const v_9390e8 = `${v_7004a9}.${v_dcf7bd}`;

  const v_b24339 = await crypto.subtle.importKey(
    "pkcs8",
    v_9330b8(v_89cd1b.private_key).buffer as ArrayBuffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const v_f2c979 = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", v_b24339, v_40aece.encode(v_9390e8));
  return `${v_9390e8}.${v_c2e1c1(new Uint8Array(v_f2c979))}`;
}

let v_ab9892 = null;

async function v_8d45bc(env: v_273a0c): Promise<string> {
  if (v_ab9892 && v_ab9892.expiresAt > Date.now() + 60_000) {
    return v_ab9892.token;
  }
  const v_89cd1b = v_cec848(v_c9c489);
  const v_e9df73 = await v_0da193(v_89cd1b);

  const v_8f00b9 = await fetch(v_89cd1b.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: v_e9df73,
    }).toString(),
  });
  if (!v_8f00b9.ok) {
    const v_4d33b2 = await v_8f00b9.text();
    throw new v_3ebe58(
      "UPSTREAM_FAILURE",
      `Google OAuth2 token exchange failed: ${v_8f00b9.status} ${v_4d33b2.slice(0, 300)}`,
    );
  }
  const v_9390e8 = (await v_8f00b9.json()) as { access_token: string; expires_in: number };
  v_ab9892 = {
    token: v_9390e8.access_token,
    expiresAt: Date.now() + (v_9390e8.expires_in - 60) * 1000,
  };
  return v_9390e8.access_token;
}

export async function v_33874d(
  env: v_273a0c,
  v_4317d1,
): Promise<GooglePlayTransactionInfo> {
  const v_21cc31 = await v_8d45bc(v_c9c489);
  const v_e42213 = v_548289(v_c9c489);

  const v_694b25 = "https://androidpublisher.googleapis.com/androidpublisher/v3/applications";
  const v_f71b56 =
    v_4317d1.kind === "subscription"
      ? `${v_694b25}/${encodeURIComponent(v_e42213)}/purchases/subscriptionsv2/tokens/${encodeURIComponent(v_4317d1.purchaseToken)}`
      : `${v_694b25}/${encodeURIComponent(v_e42213)}/purchases/products/${encodeURIComponent(v_4317d1.productId)}/tokens/${encodeURIComponent(v_4317d1.purchaseToken)}`;

  const v_8f00b9 = await fetch(v_f71b56, {
    headers: { Authorization: `Bearer ${v_21cc31}` },
  });
  if (v_8f00b9.status === 404) {
    throw new v_3ebe58("NOT_FOUND", `Google Play token not found (${v_4317d1.kind}).`);
  }
  if (!v_8f00b9.ok) {
    const v_4d33b2 = await v_8f00b9.text();
    throw new v_3ebe58(
      "UPSTREAM_FAILURE",
      `Google Play API ${v_8f00b9.status}: ${v_4d33b2.slice(0, 300)}`,
    );
  }
  const v_9390e8 = await v_8f00b9.json() as Record<string, unknown>;

  if (v_4317d1.kind === "subscription") {

    const v_c93cdb = (v_9390e8 as { startTime?: string }).startTime;
    const v_af856d = (v_9390e8 as { lineItems?: Array<{ productId?: string; expiryTime?: string }> }).lineItems ?? [];
    const v_ea719c = v_af856d[0];
    const v_9af408 = v_ea719c?.productId ?? v_4317d1.productId;
    const v_5a0a5f = v_ea719c?.expiryTime;
    return {
      productId: v_9af408,
      orderId: (v_9390e8 as { latestOrderId?: string }).latestOrderId ?? "",
      purchaseTime: v_c93cdb ? Date.parse(v_c93cdb) : Date.now(),
      expiryTime: v_5a0a5f ? Date.parse(v_5a0a5f) : undefined,
      kind: "subscription",
      autoRenewing:
        (v_9390e8 as { subscriptionState?: string }).subscriptionState === "SUBSCRIPTION_STATE_ACTIVE",
    };
  }

  return {
    productId: v_4317d1.productId,
    orderId: (v_9390e8 as { orderId?: string }).orderId ?? "",
    purchaseTime: Number((v_9390e8 as { purchaseTimeMillis?: string }).purchaseTimeMillis ?? Date.now()),
    kind: "consumable",
    purchaseState: (v_9390e8 as { purchaseState?: number }).purchaseState,
    acknowledgementState: (v_9390e8 as { acknowledgementState?: number }).acknowledgementState,
    regionCode: (v_9390e8 as { regionCode?: string }).regionCode,
  };
}

export async function v_bc5949(
  env: v_273a0c,
  v_4317d1,
): Promise<void> {
  const v_21cc31 = await v_8d45bc(v_c9c489);
  const v_e42213 = v_548289(v_c9c489);
  const v_f71b56 = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(v_e42213)}/purchases/products/${encodeURIComponent(v_4317d1.productId)}/tokens/${encodeURIComponent(v_4317d1.purchaseToken)}:consume`;

  const v_8f00b9 = await fetch(v_f71b56, {
    method: "POST",
    headers: { Authorization: `Bearer ${v_21cc31}`, "Content-Type": "application/json" },
    body: "{}",
  });
  if (!v_8f00b9.ok && v_8f00b9.status !== 204) {
    const v_4d33b2 = await v_8f00b9.text();

    console.warn(`[google-iap] consume failed ${v_8f00b9.status}: ${v_4d33b2.slice(0, 200)}`);
  }
}
