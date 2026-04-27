

import { v_cc9198 } from "../config/apiBase";

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
    throw new v_84a859(v_8f00b9.status, v_c99bd2, v_a8cd21, v_9be017?.error?.details);
  }
  return v_8decf8 as T;
}

async function v_fb3621<T>(v_9fe22d, v_2ca7e0): Promise<T> {
  const v_3f4675 = { "Content-Type": "application/json" };
  if (v_2ca7e0) v_3f4675.Authorization = `Bearer ${v_2ca7e0}`;

  const v_8f00b9 = await fetch(`${v_cc9198}${v_9fe22d}`, { method: "GET", headers: v_3f4675 });
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
    throw new v_84a859(v_8f00b9.status, v_c99bd2, v_a8cd21, v_9be017?.error?.details);
  }
  return v_8decf8 as T;
}

export async function v_97ea8d(v_e0c7e8): Promise<{ ok: true; expiresInSec: number }> {
  return v_c34e2f("/oth-path", { email: v_e0c7e8 });
}

export async function v_35200c(v_931bf0): Promise<SignupResponse> {
  return v_c34e2f("/oth-path", v_931bf0);
}

export async function v_182fdb(v_931bf0): Promise<LoginResponse> {
  return v_c34e2f("/oth-path", v_931bf0);
}

export async function v_7ef860(v_2ca7e0): Promise<{ user: AuthUser; interests: string[] }> {
  return v_fb3621("/oth-path", v_2ca7e0);
}

export interface PatchMePayload {
  name?: string;
  avatarUrl?: string | null;
  phone?: string | null;
  gender?: "male" | "female" | "other" | null;
  age?: number | null;
}

export async function v_976b89(
  v_2ca7e0,
  v_931bf0,
): Promise<{ ok: true; updatedFields: string[] }> {
  const v_8f00b9 = await fetch(`${v_cc9198}/oth-path`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${v_2ca7e0}`,
    },
    body: JSON.stringify(v_931bf0),
  });
  const v_9b6134 = await v_8f00b9.text();
  let v_8decf8 = null;
  try {
    v_8decf8 = v_9b6134 ? JSON.parse(v_9b6134) : null;
  } catch {

  }
  if (!v_8f00b9.ok) {
    const v_9be017 = v_8decf8 as ApiErrorBody | null;
    throw new v_84a859(
      v_8f00b9.status,
      v_9be017?.error?.code ?? "HTTP_ERROR",
      v_9be017?.error?.message ?? `HTTP ${v_8f00b9.status}`,
      v_9be017?.error?.details,
    );
  }
  return v_8decf8 as { ok: true; updatedFields: string[] };
}
