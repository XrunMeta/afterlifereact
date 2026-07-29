

import type { v_273a0c } from "./env";
import { v_3ebe58 } from "./errors";

export interface AppleIdTokenPayload {

  sub: string;

  email: string;

  email_verified: boolean;

  is_private_email: boolean;
}

const v_73afa0 = "https://appleid.apple.com";
const v_92b270 = "https://appleid.apple.com/oth-path";
const v_f48658 = "run.xrun.afterlifeRN"; 

type Jwk = {
  kty: string;
  kid: string;
  use: string;
  alg: string;
  n: string;
  e: string;
};
type CachedKeys = { fetchedAt: number; keys: Jwk[] };
const v_3f028e = 60 * 60 * 1000; 
const v_a23604 = { current: null };

async function v_26e52c(): Promise<Jwk[]> {
  const v_5c2f9f = Date.now();
  if (v_a23604.current && v_5c2f9f - v_a23604.current.fetchedAt < v_3f028e) {
    return v_a23604.current.keys;
  }
  let v_8f00b9;
  try {
    v_8f00b9 = await fetch(v_92b270);
  } catch (v_49263d) {
    throw new v_3ebe58("UPSTREAM_FAILURE", `Apple keys network: ${(v_49263d as Error).message}`);
  }
  if (!v_8f00b9.ok) throw new v_3ebe58("UPSTREAM_FAILURE", `Apple keys HTTP ${v_8f00b9.status}`);
  const v_4d33b2 = (await v_8f00b9.json()) as { keys: Jwk[] };
  if (!v_4d33b2?.keys?.length) throw new v_3ebe58("UPSTREAM_FAILURE", "Apple keys empty");
  v_a23604.current = { fetchedAt: v_5c2f9f, keys: v_4d33b2.keys };
  return v_4d33b2.keys;
}

function v_fb5305(v_fd5f43): Uint8Array {

  const v_3ee5fb = "=".repeat((4 - (v_fd5f43.length % 4)) % 4);
  const v_8a9589 = (v_fd5f43 + v_3ee5fb).replace(/-/g, "+").replace(/_/g, "/");
  const v_d8cac9 = atob(v_8a9589);
  const v_8d4337 = new Uint8Array(v_d8cac9.length);
  for (let v_ebec57 = 0; v_ebec57 < v_d8cac9.length; v_ebec57++) v_8d4337[v_ebec57] = v_d8cac9.charCodeAt(v_ebec57);
  return v_8d4337;
}

function v_d46e6b<T>(v_fd5f43): T {
  const v_fbb6da = v_fb5305(v_fd5f43);
  const v_9b6134 = new TextDecoder().decode(v_fbb6da);
  return JSON.parse(v_9b6134) as T;
}

async function v_8380e8(v_b50834, v_1e9000): Promise<boolean> {
  const [v_65a2cd, v_e2a85c, v_f2c979] = v_b50834.split(".");

  if (!v_65a2cd || !v_e2a85c || !v_f2c979) {
    throw new v_3ebe58("UNAUTHENTICATED", "Malformed Apple identity token.");
  }
  const v_a567ea = new TextEncoder().encode(`${v_65a2cd}.${v_e2a85c}`);
  const v_47ee1b = v_fb5305(v_f2c979);
  const v_b24339 = await crypto.subtle.importKey(
    "jwk",
    { kty: v_1e9000.kty, n: v_1e9000.n, e: v_1e9000.e, alg: "RS256", ext: true },
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  return crypto.subtle.verify("RSASSA-PKCS1-v1_5", v_b24339, v_47ee1b, v_a567ea);
}

export async function v_bb3c56(
  _env: v_273a0c,
  v_b50834,
): Promise<AppleIdTokenPayload> {
  const v_468545 = v_b50834.split(".");
  const [v_f8308a, v_aa57be] = v_468545;

  if (v_468545.length !== 3 || !v_f8308a || !v_aa57be) {
    throw new v_3ebe58("UNAUTHENTICATED", "Malformed Apple identity token.");
  }
  const v_ad8d0d = v_d46e6b<{ alg: string; kid: string }>(v_f8308a);
  if (v_ad8d0d.alg !== "RS256") {
    throw new v_3ebe58("UNAUTHENTICATED", `Unsupported alg: ${v_ad8d0d.alg}`);
  }

  let v_fa53ec = await v_26e52c();
  let v_3f251e = v_fa53ec.find((v_0eb677) => v_0eb677.kid === v_ad8d0d.kid);
  if (!v_3f251e) {

    v_a23604.current = null;
    v_fa53ec = await v_26e52c();
    v_3f251e = v_fa53ec.find((v_0eb677) => v_0eb677.kid === v_ad8d0d.kid);
    if (!v_3f251e) {
      throw new v_3ebe58("UNAUTHENTICATED", `Apple key kid=${v_ad8d0d.kid} not found.`);
    }
  }

  const v_93be92 = await v_8380e8(v_b50834, v_3f251e);
  if (!v_93be92) throw new v_3ebe58("UNAUTHENTICATED", "Apple token signature invalid.");

  const v_931bf0 = v_d46e6b<{
    iss: string;
    aud: string;
    exp: number;
    iat: number;
    sub: string;
    email?: string;
    email_verified?: string | boolean;
    is_private_email?: string | boolean;
  }>(v_aa57be);

  if (v_931bf0.iss !== v_73afa0) {
    throw new v_3ebe58("UNAUTHENTICATED", `Token issuer mismatch: ${v_931bf0.iss}`);
  }
  if (v_931bf0.aud !== v_f48658) {
    throw new v_3ebe58("UNAUTHENTICATED", `Token audience mismatch: ${v_931bf0.aud}`);
  }
  if (!v_931bf0.exp || v_931bf0.exp * 1000 < Date.now()) {
    throw new v_3ebe58("UNAUTHENTICATED", "Apple token expired.");
  }
  if (!v_931bf0.sub) {
    throw new v_3ebe58("UNAUTHENTICATED", "Apple token missing sub.");
  }
  if (!v_931bf0.email) {

    throw new v_3ebe58("UNAUTHENTICATED", "Apple token missing email (첫 로그인 이후엔 email 재발급 안 됨 — Apple 설정에서 앱 revoke 후 재시도).");
  }
  const v_c675bb = v_931bf0.email_verified;
  const v_ec12e8 = v_c675bb === true || v_c675bb === "true";
  if (!v_ec12e8) {
    throw new v_3ebe58("UNAUTHENTICATED", "Email not verified by Apple.");
  }
  const v_12e423 = v_931bf0.is_private_email;
  const v_cb8915 = v_12e423 === true || v_12e423 === "true";
  return {
    sub: v_931bf0.sub,
    email: v_931bf0.email,
    email_verified: true,
    is_private_email: v_cb8915,
  };
}
