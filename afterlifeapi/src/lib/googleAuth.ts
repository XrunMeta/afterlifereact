

import type { v_273a0c } from "./env";
import { v_3ebe58 } from "./errors";

export interface GoogleIdTokenPayload {
  sub: string;          
  email: string;
  email_verified: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
}

export async function v_a32f1d(
  env: v_273a0c,
  v_b50834,
): Promise<GoogleIdTokenPayload> {
  let v_8f00b9;
  try {
    v_8f00b9 = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(v_b50834)}`);
  } catch (v_49263d) {
    throw new v_3ebe58("UPSTREAM_FAILURE", `Google tokeninfo network: ${(v_49263d as Error).message}`);
  }
  if (!v_8f00b9.ok) {
    throw new v_3ebe58("UNAUTHENTICATED", "Invalid Google ID Token.");
  }
  const v_931bf0 = (await v_8f00b9.json()) as Partial<GoogleIdTokenPayload> & {
    aud?: string;
    iss?: string;
    exp?: string | number;
  };

  if (v_931bf0.aud !== v_c9c489.GOOGLE_WEB_CLIENT_ID) {
    throw new v_3ebe58("UNAUTHENTICATED", "Token audience mismatch.");
  }

  if (v_931bf0.iss !== "https://accounts.google.com" && v_931bf0.iss !== "accounts.google.com") {
    throw new v_3ebe58("UNAUTHENTICATED", "Token issuer mismatch.");
  }

  const v_725405 = typeof v_931bf0.exp === "string" ? parseInt(v_931bf0.exp, 10) : v_931bf0.exp ?? 0;
  if (!v_725405 || v_725405 * 1000 < Date.now()) {
    throw new v_3ebe58("UNAUTHENTICATED", "Token expired.");
  }
  if (!v_931bf0.sub || !v_931bf0.email) {
    throw new v_3ebe58("UNAUTHENTICATED", "Token missing required claims.");
  }

  const v_c675bb = (v_931bf0 as { email_verified?: string | boolean }).email_verified;
  const v_ec12e8 = v_c675bb === true || v_c675bb === "true";
  if (!v_ec12e8) {
    throw new v_3ebe58("UNAUTHENTICATED", "Email not verified by Google.");
  }
  return {
    sub: v_931bf0.sub,
    email: v_931bf0.email,
    email_verified: true,
    name: v_931bf0.name,
    given_name: v_931bf0.given_name,
    family_name: v_931bf0.family_name,
    picture: v_931bf0.picture,
    locale: v_931bf0.locale,
  };
}
