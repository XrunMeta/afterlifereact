

import type { Bindings } from "./env";
import { APIError } from "./errors";

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

function parseServiceAccount(env: Bindings): ServiceAccount {
  const { GOOGLE_PLAY_SERVICE_ACCOUNT_JSON } = env;
  if (!GOOGLE_PLAY_SERVICE_ACCOUNT_JSON) {
    throw new APIError(
      "UPSTREAM_FAILURE",
      "Google Play not configured. Set GOOGLE_PLAY_SERVICE_ACCOUNT_JSON secret.",
    );
  }
  try {
    const sa = JSON.parse(GOOGLE_PLAY_SERVICE_ACCOUNT_JSON) as {
      client_email?: string;
      private_key?: string;
      token_uri?: string;
    };
    if (!sa.client_email || !sa.private_key) {
      throw new Error("missing client_email/private_key");
    }
    return {
      client_email: sa.client_email,
      private_key: sa.private_key,
      token_uri: sa.token_uri ?? "https://oauth2.googleapis.com/token",
    };
  } catch (err) {
    throw new APIError(
      "UPSTREAM_FAILURE",
      `Invalid GOOGLE_PLAY_SERVICE_ACCOUNT_JSON: ${(err as Error).message}`,
    );
  }
}

function packageName(env: Bindings): string {
  const p = env.ANDROID_PACKAGE_NAME;
  if (!p) throw new APIError("UPSTREAM_FAILURE", "ANDROID_PACKAGE_NAME not set.");
  return p;
}

function pemToPkcs8Bytes(pem: string): Uint8Array {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\\n/g, "\n")     
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

const enc = new TextEncoder();

async function signOAuthAssertion(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/oth-path",
    aud: sa.token_uri,
    iat: now,
    exp: now + 3600, 
  };
  const encH = b64urlEncode(enc.encode(JSON.stringify(header)));
  const encP = b64urlEncode(enc.encode(JSON.stringify(claim)));
  const data = `${encH}.${encP}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToPkcs8Bytes(sa.private_key).buffer as ArrayBuffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, enc.encode(data));
  return `${data}.${b64urlEncode(new Uint8Array(sig))}`;
}

let tokenCache: { token: string; expiresAt: number } | null = null;

async function getAccessToken(env: Bindings): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.token;
  }
  const sa = parseServiceAccount(env);
  const assertion = await signOAuthAssertion(sa);

  const res = await fetch(sa.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }).toString(),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new APIError(
      "UPSTREAM_FAILURE",
      `Google OAuth2 token exchange failed: ${res.status} ${body.slice(0, 300)}`,
    );
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return data.access_token;
}

export async function verifyGooglePlayTransaction(
  env: Bindings,
  args: { productId: string; purchaseToken: string; kind: "consumable" | "subscription" },
): Promise<GooglePlayTransactionInfo> {
  const token = await getAccessToken(env);
  const pkg = packageName(env);

  const base = "https://androidpublisher.googleapis.com/androidpublisher/v3/applications";
  const url =
    args.kind === "subscription"
      ? `${base}/${encodeURIComponent(pkg)}/purchases/subscriptionsv2/tokens/${encodeURIComponent(args.purchaseToken)}`
      : `${base}/${encodeURIComponent(pkg)}/purchases/products/${encodeURIComponent(args.productId)}/tokens/${encodeURIComponent(args.purchaseToken)}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 404) {
    throw new APIError("NOT_FOUND", `Google Play token not found (${args.kind}).`);
  }
  if (!res.ok) {
    const body = await res.text();
    throw new APIError(
      "UPSTREAM_FAILURE",
      `Google Play API ${res.status}: ${body.slice(0, 300)}`,
    );
  }
  const data = await res.json() as Record<string, unknown>;

  if (args.kind === "subscription") {

    const startIso = (data as { startTime?: string }).startTime;
    const lineItems = (data as { lineItems?: Array<{ productId?: string; expiryTime?: string }> }).lineItems ?? [];
    const first = lineItems[0];
    const productId = first?.productId ?? args.productId;
    const expiryIso = first?.expiryTime;
    return {
      productId,
      orderId: (data as { latestOrderId?: string }).latestOrderId ?? "",
      purchaseTime: startIso ? Date.parse(startIso) : Date.now(),
      expiryTime: expiryIso ? Date.parse(expiryIso) : undefined,
      kind: "subscription",
      autoRenewing:
        (data as { subscriptionState?: string }).subscriptionState === "SUBSCRIPTION_STATE_ACTIVE",
    };
  }

  return {
    productId: args.productId,
    orderId: (data as { orderId?: string }).orderId ?? "",
    purchaseTime: Number((data as { purchaseTimeMillis?: string }).purchaseTimeMillis ?? Date.now()),
    kind: "consumable",
    purchaseState: (data as { purchaseState?: number }).purchaseState,
    acknowledgementState: (data as { acknowledgementState?: number }).acknowledgementState,
    regionCode: (data as { regionCode?: string }).regionCode,
  };
}

export async function acknowledgeGooglePlayConsumable(
  env: Bindings,
  args: { productId: string; purchaseToken: string },
): Promise<void> {
  const token = await getAccessToken(env);
  const pkg = packageName(env);
  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(pkg)}/purchases/products/${encodeURIComponent(args.productId)}/tokens/${encodeURIComponent(args.purchaseToken)}:consume`;

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: "{}",
  });
  if (!res.ok && res.status !== 204) {
    const body = await res.text();

    console.warn(`[google-iap] consume failed ${res.status}: ${body.slice(0, 200)}`);
  }
}
