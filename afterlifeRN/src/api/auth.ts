

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

export interface SignupResponse {
  accessToken: string;
  accessExpiresIn: number;
  user: {
    id: number;
    name: string;
    email: string;
    funnelStage: string;
  };
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

export async function requestEmailCode(email: string): Promise<{ ok: true; expiresInSec: number }> {
  return postJson("/oth-path", { email });
}

export async function signup(payload: SignupPayload): Promise<SignupResponse> {
  return postJson("/oth-path", payload);
}
