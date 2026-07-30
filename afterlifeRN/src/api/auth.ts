

import { API_BASE } from "../config/apiBase";
import { authFetch as _authFetch } from "../lib/authFetch";
import { translateApiError } from "../lib/errorI18n";

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
}

export interface LoginResponse {
  accessToken: string;
  accessExpiresIn: number;
}

export interface LoginPayload {
  email: string;
  password: string;
  deviceId?: string;
  pushToken?: string;
  platform?: "ios" | "android" | "web";
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}

export class AuthApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

async function postJson<T>(path: string, body: unknown): Promise<T> {

  const isOtpTrigger =
    path === "/oth-path" ||
    path === "/oth-path" ||
    path === "/oth-path" ||
    path === "/oth-path";
  const emailHint =
    typeof body === "object" && body !== null && "email" in body
      ? String((body as { email?: unknown }).email ?? "")
      : "";
  if (isOtpTrigger) {
    console.log(`[OTP-API] → POST ${path}${emailHint ? ` email=${emailHint}` : ""}`);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {

  }

  if (!res.ok) {
    const errBody = parsed as ApiErrorBody | null;
    const code = errBody?.error?.code ?? "HTTP_ERROR";
    const message = errBody?.error?.message ?? `HTTP ${res.status}`;
    if (isOtpTrigger) {
      console.warn(
        `[OTP-API] ✗ ${path} ← ${res.status} code=${code} msg=${message}`,
      );
    }
    throw new AuthApiError(res.status, code, translateApiError(code, message), errBody?.error?.details);
  }
  if (isOtpTrigger) {
    console.log(`[OTP-API] ✓ ${path} ← ${res.status} (OTP 메일 발송됨, 어드민 /otp 에서 코드 확인)`);
  }
  return parsed as T;
}

export async function requestEmailCode(email: string): Promise<{ ok: true; expiresInSec: number }> {
  return postJson("/oth-path", { email });
}

export async function requestPasswordReset(email: string): Promise<{ ok: true; expiresInSec: number }> {
  return postJson("/oth-path", { email });
}

export async function resetPassword(payload: {
  email: string;
  verificationCode: string;
  newPassword: string;
}): Promise<{ ok: true }> {
  return postJson("/oth-path", payload);
}

export async function signup(payload: SignupPayload): Promise<SignupResponse> {
  return postJson("/oth-path", payload);
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  return postJson("/oth-path", payload);
}

export async function requestEmailLoginCode(email: string): Promise<{ ok: true; expiresInSec: number }> {
  return postJson("/oth-path", { email });
}

export async function emailLogin(payload: {
  email: string;
  verificationCode: string;
  deviceId?: string;
  pushToken?: string;
  platform?: "ios" | "android" | "web";
}): Promise<LoginResponse> {
  return postJson("/oth-path", payload);
}

export interface GoogleSignInPayload {
  idToken: string;
  deviceId?: string;
  pushToken?: string;
  platform?: "ios" | "android" | "web";
}
export async function googleSignIn(payload: GoogleSignInPayload): Promise<LoginResponse> {
  return postJson("/oth-path", payload);
}

export interface GoogleCheckResponse {
  afterlifeExists: boolean;
  xrunExists: boolean;
  email: string;
  name: string | null;
  picture: string | null;
}
export async function googleCheck(idToken: string): Promise<GoogleCheckResponse> {
  return postJson("/oth-path", { idToken });
}

export interface AppleSignInPayload {
  identityToken: string;
  fullName?: { givenName?: string | null; familyName?: string | null } | null;
  deviceId?: string;
  pushToken?: string;
  platform?: "ios" | "android" | "web";
}
export async function appleSignIn(payload: AppleSignInPayload): Promise<LoginResponse> {
  return postJson("/oth-path", payload);
}

export async function getMe(accessToken: string): Promise<{ user: AuthUser; interests: string[] }> {
  return _authFetch("/oth-path", accessToken);
}

export interface UserSearchItem {
  id: number;
  name: string | null;
  email: string;
  avatarUrl: string | null;
}

export async function searchUsers(
  accessToken: string,
  q: string,
): Promise<{ items: UserSearchItem[] }> {
  return _authFetch(`/oth-path?q=${encodeURIComponent(q)}`, accessToken);
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
export async function deleteMe(accessToken: string): Promise<DeleteMeResult> {
  return _authFetch<DeleteMeResult>("/oth-path", accessToken, { method: "DELETE" });
}

export interface DeleteMeGdprResult {
  ok: true;
  state: "hard_deleted";
  shreddedDekCount: number;
  purgedMessages: number;
  xrunClose?: { attempted: boolean; closed: boolean; reason?: string };
}
export async function deleteMeGdpr(
  accessToken: string,
): Promise<DeleteMeGdprResult> {
  return _authFetch<DeleteMeGdprResult>(
    "/oth-path",
    accessToken,
    { method: "POST", body: JSON.stringify({}) },
  );
}

export async function patchInterests(
  accessToken: string,
  payload: { add?: string[]; remove?: string[] },
): Promise<{ ok: true }> {
  return _authFetch<{ ok: true }>(
    "/oth-path",
    accessToken,
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export async function patchMe(
  accessToken: string,
  payload: PatchMePayload,
): Promise<{ ok: true; updatedFields: string[] }> {
  return _authFetch<{ ok: true; updatedFields: string[] }>(
    "/oth-path",
    accessToken,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
}
