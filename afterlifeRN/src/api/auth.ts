

import { v_cc9198 } from "../config/apiBase";
import { v_04b58a as v_9b97b4 } from "../lib/authFetch";
import { v_3be591 } from "../lib/errorI18n";

export interface SignupPayload {
  email: string;
  password: string;
  name: string;
  verificationCode?: string;
  googleIdToken?: string;
  phone?: string;
  gender?: "male" | "female" | "other";
  age?: number;
  interests?: string[];

  country?: string;
  mobileCode?: number;
  region?: string;
  marketingConsent?: boolean;
  deviceId?: string;
  pushToken?: string;
  platform?: "ios" | "android" | "web";
}

export interface AuthUserBrief {
  id: number;
  name: string;
  email: string;
  funnelStage: string;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  avatarUrl: string | null;
  credits: number;
  funnelStage: string;
  phone: string | null;
  gender: "male" | "female" | "other" | null;
  age: number | null;
  createdAt: string;

  country: string | null;
  mobileCode: number | null;
  region: string | null;
  xrunMemberId: number | null;
  xrunGuid: string | null;
  xrunWallet: string | null;
  xrunLinkedAt: string | null;

  followersCount: number;
  followingCount: number;
}

export interface SignupResponse {
  accessToken: string;
  accessExpiresIn: number;
  user: AuthUserBrief;

  refreshToken?: string;
}

export interface LoginSuccessResponse {
  accessToken: string;
  accessExpiresIn: number;

  refreshToken?: string;
  requiresEmailVerification?: never;
}

export interface LoginRequiresVerificationResponse {
  requiresEmailVerification: true;
  email: string;
  expiresInSec: number;
  accessToken?: never;
}

export type LoginResponse = LoginSuccessResponse | LoginRequiresVerificationResponse;

export interface LoginPayload {
  email: string;
  password: string;
  deviceId?: string;
  pushToken?: string;
  platform?: "ios" | "android" | "web";

  verificationCode?: string;
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}

export class v_84a859 extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;
  constructor(v_d308b5, v_c99bd2, v_a8cd21, v_5ab5bd) {
    super(v_a8cd21);
    this.code = v_c99bd2;
    this.status = v_d308b5;
    this.details = v_5ab5bd;
  }
}

async function v_c34e2f<T>(v_9fe22d, v_4d33b2): Promise<T> {

  const v_7611fb =
    v_9fe22d === "/oth-path" ||
    v_9fe22d === "/oth-path" ||
    v_9fe22d === "/oth-path" ||
    v_9fe22d === "/oth-path";
  const v_1936ee =
    typeof v_4d33b2 === "object" && v_4d33b2 !== null && "email" in v_4d33b2
      ? String((v_4d33b2 as { email?: unknown }).email ?? "")
      : "";
  if (v_7611fb) {
    console.log(`[OTP-API] → POST ${v_9fe22d}${v_1936ee ? ` email=${v_1936ee}` : ""}`);
  }

  const v_8f00b9 = await fetch(`${v_cc9198}${v_9fe22d}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(v_4d33b2),
  });

  const v_9b6134 = await v_8f00b9.text();
  let v_8decf8 = null;
  try {
    v_8decf8 = v_9b6134 ? JSON.parse(v_9b6134) : null;
  } catch {

  }

  if (!v_8f00b9.ok) {
    const v_9be017 = v_8decf8 as ApiErrorBody | null;
    const v_c99bd2 = v_9be017?.error?.code ?? "HTTP_ERROR";
    const v_a8cd21 = v_9be017?.error?.message ?? `HTTP ${v_8f00b9.status}`;
    if (v_7611fb) {
      console.warn(
        `[OTP-API] ✗ ${v_9fe22d} ← ${v_8f00b9.status} code=${v_c99bd2} msg=${v_a8cd21}`,
      );
    }
    throw new v_84a859(v_8f00b9.status, v_c99bd2, v_3be591(v_c99bd2, v_a8cd21), v_9be017?.error?.details);
  }
  if (v_7611fb) {
    console.log(`[OTP-API] ✓ ${v_9fe22d} ← ${v_8f00b9.status} (OTP 메일 발송됨, 어드민 /otp 에서 코드 확인)`);
  }
  return v_8decf8 as T;
}

export async function v_97ea8d(v_e0c7e8): Promise<{ ok: true; expiresInSec: number }> {
  return v_c34e2f("/oth-path", { email: v_e0c7e8 });
}

export interface EmailCheckXrunResponse {
  afterlifeExists: boolean;
  xrunExists: boolean;
  email: string;
}
export async function v_2efafe(v_e0c7e8): Promise<EmailCheckXrunResponse> {
  return v_c34e2f("/oth-path", { email: v_e0c7e8 });
}

export async function v_63aa82(v_e0c7e8): Promise<{ ok: true; expiresInSec: number }> {
  return v_c34e2f("/oth-path", { email: v_e0c7e8 });
}

export async function v_7e714c(v_931bf0): Promise<{ ok: true }> {
  return v_c34e2f("/oth-path", v_931bf0);
}

export async function v_35200c(v_931bf0): Promise<SignupResponse> {
  return v_c34e2f("/oth-path", v_931bf0);
}

export async function v_182fdb(v_931bf0): Promise<LoginResponse> {
  return v_c34e2f("/oth-path", v_931bf0);
}

export async function v_1d5b64(v_e0c7e8): Promise<{ ok: true; expiresInSec: number }> {
  return v_c34e2f("/oth-path", { email: v_e0c7e8 });
}

export async function v_c0c425(v_931bf0): Promise<LoginSuccessResponse> {
  return v_c34e2f("/oth-path", v_931bf0);
}

export interface GoogleSignInPayload {
  idToken: string;
  deviceId?: string;
  pushToken?: string;
  platform?: "ios" | "android" | "web";
}

export async function v_dd2158(v_931bf0): Promise<LoginSuccessResponse> {
  return v_c34e2f("/oth-path", v_931bf0);
}

export interface GoogleCheckResponse {
  afterlifeExists: boolean;
  xrunExists: boolean;
  email: string;
  name: string | null;
  picture: string | null;
}
export async function v_5c746e(v_b50834): Promise<GoogleCheckResponse> {
  return v_c34e2f("/oth-path", { idToken: v_b50834 });
}

export interface AppleSignInPayload {
  identityToken: string;
  fullName?: { givenName?: string | null; familyName?: string | null } | null;
  deviceId?: string;
  pushToken?: string;
  platform?: "ios" | "android" | "web";
}
export async function v_c93bd8(v_931bf0): Promise<LoginSuccessResponse> {
  return v_c34e2f("/oth-path", v_931bf0);
}

export async function v_7ef860(v_2ca7e0): Promise<{ user: AuthUser; interests: string[] }> {
  return v_9b97b4("/oth-path", v_2ca7e0);
}

export interface UserSearchItem {
  id: number;
  name: string | null;
  email: string;
  avatarUrl: string | null;
}

export async function v_a41961(
  v_2ca7e0,
  v_ab6401,
): Promise<{ items: UserSearchItem[] }> {
  return v_9b97b4(`/oth-path?q=${encodeURIComponent(v_ab6401)}`, v_2ca7e0);
}

export interface PatchMePayload {
  name?: string;
  avatarUrl?: string | null;
  phone?: string | null;
  gender?: "male" | "female" | null;
  age?: number | null;

  country?: string | null;
  mobileCode?: number | null;
  region?: string | null;
}

export interface DeleteMeResult {
  ok: true;
  state: "soft_deleted";
}
export async function v_55fc7c(v_2ca7e0): Promise<DeleteMeResult> {
  return v_9b97b4<DeleteMeResult>("/oth-path", v_2ca7e0, { method: "DELETE" });
}

export interface DeleteMeGdprResult {
  ok: true;
  state: "hard_deleted";
  shreddedDekCount: number;
  purgedMessages: number;
  xrunClose?: { attempted: boolean; closed: boolean; reason?: string };
}
export async function v_d2b29a(
  v_2ca7e0,
): Promise<DeleteMeGdprResult> {
  return v_9b97b4<DeleteMeGdprResult>(
    "/oth-path",
    v_2ca7e0,
    { method: "POST", body: JSON.stringify({}) },
  );
}

export async function v_b21d35(
  v_2ca7e0,
  v_931bf0,
): Promise<{ ok: true }> {
  return v_9b97b4<{ ok: true }>(
    "/oth-path",
    v_2ca7e0,
    { method: "POST", body: JSON.stringify(v_931bf0) },
  );
}

export async function v_976b89(
  v_2ca7e0,
  v_931bf0,
): Promise<{ ok: true; updatedFields: string[] }> {
  return v_9b97b4<{ ok: true; updatedFields: string[] }>(
    "/oth-path",
    v_2ca7e0,
    { method: "PATCH", body: JSON.stringify(v_931bf0) },
  );
}
