

import type { Bindings } from "./env";
import { APIError } from "./errors";

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

export async function verifyGoogleIdToken(
  env: Bindings,
  idToken: string,
): Promise<GoogleIdTokenPayload> {
  let res: Response;
  try {
    res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
  } catch (err) {
    throw new APIError("UPSTREAM_FAILURE", `Google tokeninfo network: ${(err as Error).message}`);
  }
  if (!res.ok) {
    throw new APIError("UNAUTHENTICATED", "Invalid Google ID Token.");
  }
  const payload = (await res.json()) as Partial<GoogleIdTokenPayload> & {
    aud?: string;
    iss?: string;
    exp?: string | number;
  };

  if (payload.aud !== env.GOOGLE_WEB_CLIENT_ID) {
    throw new APIError("UNAUTHENTICATED", "Token audience mismatch.");
  }

  if (payload.iss !== "https://accounts.google.com" && payload.iss !== "accounts.google.com") {
    throw new APIError("UNAUTHENTICATED", "Token issuer mismatch.");
  }

  const expSec = typeof payload.exp === "string" ? parseInt(payload.exp, 10) : payload.exp ?? 0;
  if (!expSec || expSec * 1000 < Date.now()) {
    throw new APIError("UNAUTHENTICATED", "Token expired.");
  }
  if (!payload.sub || !payload.email) {
    throw new APIError("UNAUTHENTICATED", "Token missing required claims.");
  }

  const verifiedRaw = (payload as { email_verified?: string | boolean }).email_verified;
  const emailVerified = verifiedRaw === true || verifiedRaw === "true";
  if (!emailVerified) {
    throw new APIError("UNAUTHENTICATED", "Email not verified by Google.");
  }
  return {
    sub: payload.sub,
    email: payload.email,
    email_verified: true,
    name: payload.name,
    given_name: payload.given_name,
    family_name: payload.family_name,
    picture: payload.picture,
    locale: payload.locale,
  };
}
