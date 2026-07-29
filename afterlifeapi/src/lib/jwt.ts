import { v_3ebe58 } from "./errors";

type Payload = Record<string, unknown> & {
  sub: number | string;
  exp?: number;
  iat?: number;
  jti?: string;
  iss?: string;
  aud?: string;
};

const v_870d56 = 15 * 60;
const v_a94128 = 365 * 24 * 60 * 60;

export const v_25f673 = "afterlife-api";
export const v_99b057 = "session";

function v_c2e1c1(v_fbb6da): string {
  let v_fd5f43 = "";
  for (const v_148ff6 of v_fbb6da) v_fd5f43 += String.fromCharCode(v_148ff6);
  return btoa(v_fd5f43).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
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

async function v_939519(v_43fd42): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    v_40aece.encode(v_43fd42),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function v_6f55b2(v_9390e8, v_43fd42): Promise<string> {
  const v_b24339 = await v_939519(v_43fd42);
  const v_f2c979 = await crypto.subtle.sign("HMAC", v_b24339, v_40aece.encode(v_9390e8));
  return v_c2e1c1(new Uint8Array(v_f2c979));
}

async function v_988792(v_9390e8, v_514f3c, v_43fd42): Promise<boolean> {
  const v_b24339 = await v_939519(v_43fd42);
  return crypto.subtle.verify("HMAC", v_b24339, v_fb5305(v_514f3c), v_40aece.encode(v_9390e8));
}

export async function v_b2eae5(
  v_931bf0,
  v_43fd42,
  v_fa87f5,
): Promise<string> {
  const v_5c2f9f = Math.floor(Date.now() / 1000);
  const v_e13cd0 = {
    iat: v_5c2f9f,
    exp: v_5c2f9f + v_fa87f5,
    jti: crypto.randomUUID(),
    iss: v_25f673,
    aud: v_99b057,
    ...v_931bf0,
  };
  const v_ad8d0d = v_c2e1c1(v_40aece.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const v_4d33b2 = v_c2e1c1(v_40aece.encode(JSON.stringify(v_e13cd0)));
  const v_9390e8 = `${v_ad8d0d}.${v_4d33b2}`;
  const v_f2c979 = await v_6f55b2(v_9390e8, v_43fd42);
  return `${v_9390e8}.${v_f2c979}`;
}

export async function v_2703c5<T extends Payload = Payload>(
  v_21cc31,
  v_43fd42,
): Promise<T> {
  const v_468545 = v_21cc31.split(".");
  if (v_468545.length !== 3) throw new v_3ebe58("UNAUTHENTICATED", "Malformed token.");
  const [v_65a2cd, v_148ff6, v_fd5f43] = v_468545 as [string, string, string];
  const v_9390e8 = `${v_65a2cd}.${v_148ff6}`;
  const v_3ed4c3 = await v_988792(v_9390e8, v_fd5f43, v_43fd42);
  if (!v_3ed4c3) throw new v_3ebe58("UNAUTHENTICATED", "Invalid signature.");
  let v_931bf0;
  try {
    v_931bf0 = JSON.parse(new TextDecoder().decode(v_fb5305(v_148ff6))) as Payload;
  } catch {
    throw new v_3ebe58("UNAUTHENTICATED", "Malformed payload.");
  }
  if (typeof v_931bf0.exp !== "number" || v_931bf0.exp < Math.floor(Date.now() / 1000)) {
    throw new v_3ebe58("UNAUTHENTICATED", "Token expired.");
  }
  if (v_931bf0.iss !== v_25f673) throw new v_3ebe58("UNAUTHENTICATED", "Issuer mismatch.");
  if (v_931bf0.aud !== v_99b057) throw new v_3ebe58("UNAUTHENTICATED", "Audience mismatch.");
  return v_931bf0 as T;
}

export function v_b64d29(v_931bf0, v_43fd42) {
  return v_b2eae5(v_931bf0, v_43fd42, v_870d56);
}

export function v_72ca53(v_931bf0, v_43fd42) {
  return v_b2eae5(v_931bf0, v_43fd42, v_a94128);
}

export const v_806b99 = { access: v_870d56, refresh: v_a94128 };
