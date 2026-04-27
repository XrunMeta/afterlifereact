

import { API_BASE } from "../config/apiBase";

export interface SignupPayload {
  email: string;
  password: string;
  name: string;
  verificationCode: string;
  phone?: string;
  gender?: "male" | "female" | "other";
  age?: number;
  interests?: string[];
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
    throw new AuthApiError(res.status, code, message, errBody?.error?.details);
  }
  return parsed as T;
}

async function getJson<T>(path: string, accessToken?: string): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const res = await fetch(`${API_BASE}${path}`, { method: "GET", headers });
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
    throw new AuthApiError(res.status, code, message, errBody?.error?.details);
  }
  return parsed as T;
}

export async function requestEmailCode(email: string): Promise<{ ok: true; expiresInSec: number }> {
  return postJson("/oth-path", { email });
}

export async function signup(payload: SignupPayload): Promise<SignupResponse> {
  return postJson("/oth-path", payload);
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  return postJson("/oth-path", payload);
}

export async function getMe(accessToken: string): Promise<{ user: AuthUser; interests: string[] }> {
  return getJson("/oth-path", accessToken);
}

export interface PatchMePayload {
  name?: string;
  avatarUrl?: string | null;
  phone?: string | null;
  gender?: "male" | "female" | "other" | null;
  age?: number | null;
}

export async function patchMe(
  accessToken: string,
  payload: PatchMePayload,
): Promise<{ ok: true; updatedFields: string[] }> {
  const res = await fetch(`${API_BASE}/oth-path`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {

  }
  if (!res.ok) {
    const errBody = parsed as ApiErrorBody | null;
    throw new AuthApiError(
      res.status,
      errBody?.error?.code ?? "HTTP_ERROR",
      errBody?.error?.message ?? `HTTP ${res.status}`,
      errBody?.error?.details,
    );
  }
  return parsed as { ok: true; updatedFields: string[] };
}
