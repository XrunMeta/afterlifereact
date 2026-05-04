

import { API_BASE } from "../config/apiBase";
import { AuthApiError, type ApiErrorBody } from "./auth";

export type CloneType = "memlow" | "friend" | "mentor" | "celeb";
export type Visibility = "public" | "private" | "followers";

export interface CreateClonePayload {
  clone_type: CloneType;
  name: string;
  username: string; 
  description?: string;
  category?: string;
  visibility?: Visibility;
  avatar_url?: string;
  cover_image_url?: string;
  voice_preset_id?: number;
  interests?: string[];
  l1_profile?: {
    attrs: Record<string, string>;
    notes: string;
  };
}

export interface CreateCloneResponse {
  id: number;
  name: string;
  username: string;
  clone_type: CloneType;
  visibility: Visibility;
  created_at: string;
}

export function deriveUsernameFromName(name: string): string {
  const ascii = name
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  const base = ascii && ascii.length >= 3 ? ascii : "user";

  const trimmed = base.slice(0, 20);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${trimmed}_${suffix}`;
}

export async function createClone(
  accessToken: string,
  payload: CreateClonePayload,
  idempotencyKey?: string,
): Promise<CreateCloneResponse> {
  const key =
    idempotencyKey ??
    (typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

  const res = await fetch(`${API_BASE}/oth-path`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "Idempotency-Key": key,
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
    const body = parsed as ApiErrorBody | null;
    throw new AuthApiError(
      res.status,
      body?.error?.code ?? "HTTP_ERROR",
      body?.error?.message ?? `HTTP ${res.status}`,
      body?.error?.details,
    );
  }
  return parsed as CreateCloneResponse;
}
