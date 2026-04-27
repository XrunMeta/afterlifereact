

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

export class v_84a859 extends Error {
  readonly code: string;
  readonly status: number;
  constructor(v_d308b5, v_c99bd2, v_a8cd21) {
    super(v_a8cd21);
    this.code = v_c99bd2;
    this.status = v_d308b5;
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
    throw new v_84a859(v_8f00b9.status, v_c99bd2, v_a8cd21);
  }
  return v_8decf8 as T;
}

export async function v_97ea8d(v_e0c7e8): Promise<{ ok: true; expiresInSec: number }> {
  return v_c34e2f("/oth-path", { email: v_e0c7e8 });
}

export async function v_35200c(v_931bf0): Promise<SignupResponse> {
  return v_c34e2f("/oth-path", v_931bf0);
}
