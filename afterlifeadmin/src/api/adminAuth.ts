import {
  setPending,
  setSession,
  setTokens,
  getPendingToken,
  getRefreshToken,
  clearSession,
} from "../lib/auth";

function readApiOverride(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem("afterlife.admin.apiOverride");
    return v && v.length > 0 ? v : null;
  } catch {
    return null;
  }
}
function getAuthBase(): string {
  const override = readApiOverride();
  const origin = (override ?? import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
  return `${origin}/oth-path`;
}

async function postJson<T>(path: string, body: unknown, bearer?: string): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (bearer) headers["Authorization"] = `Bearer ${bearer}`;
  const res = await fetch(`${getAuthBase()}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let parsed: unknown = text;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {

  }
  if (!res.ok) {
    const msg =
      typeof parsed === "object" && parsed && "error" in parsed
        ? String((parsed as { error: unknown }).error)
        : res.statusText;
    throw new Error(msg);
  }
  return parsed as T;
}

export interface LoginResult {
  pendingToken: string;
  expiresIn: number;
  totpEnrolled: boolean;
}

interface LoginResponse {
  pendingToken: string;
  expiresIn: number;
  totpEnrolled?: boolean;
  totp_enrolled?: boolean;
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const r = await postJson<LoginResponse>("/login", { email, password });
  setPending(r.pendingToken);

  const totpEnrolled = Boolean(r.totpEnrolled ?? r.totp_enrolled);
  return { pendingToken: r.pendingToken, expiresIn: r.expiresIn, totpEnrolled };
}

export interface TotpEnrollResult {
  otpauthUrl: string;
  secret: string;
  recoveryCodes: string[];
}

export async function enrollTotp(): Promise<TotpEnrollResult> {
  const pending = getPendingToken();
  if (!pending) throw new Error("로그인 세션이 만료되었습니다");
  return await postJson<TotpEnrollResult>("/totp/enroll", {}, pending);
}

export interface VerifyResult {
  accessToken: string;
  refreshToken: string;
  accessExpiresIn: number;
  admin: { id: number; email: string; role: string };
}

export async function verifyTotp(code: string): Promise<VerifyResult> {
  const pending = getPendingToken();
  if (!pending) throw new Error("로그인 세션이 만료되었습니다");
  const r = await postJson<VerifyResult>("/totp/verify", { code }, pending);
  setSession({
    accessToken: r.accessToken,
    refreshToken: r.refreshToken,
    profile: r.admin,
  });
  return r;
}

export function logout() {
  clearSession();
}

export async function refreshSession(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("no refresh token");
  const r = await postJson<{
    accessToken: string;
    refreshToken: string;
    accessExpiresIn: number;
  }>("/refresh", { refreshToken });
  setTokens({ accessToken: r.accessToken, refreshToken: r.refreshToken });
  return r.accessToken;
}
