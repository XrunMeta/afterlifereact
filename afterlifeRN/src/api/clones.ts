

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

export interface PendingInvite {
  id: number;
  inviteEmail: string | null;
  relation: string | null;
  grantOwner: boolean;
  expiresAt: string;
  createdAt: string;
  status: "pending";
}

export interface ShareMember {
  id: number;
  cloneId: number;
  ownerId: number;
  targetUserId: number | null;
  inviteEmail: string | null;
  relation: string | null;
  role: "owner" | "editor" | "viewer";
  status: "pending" | "accepted" | "rejected";
  createdAt: string;

  targetUser?: {
    id: number;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
}

async function authFetch<T>(
  path: string,
  accessToken: string,
  init: RequestInit = {},
  idempotencyKey?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
    ...((init.headers as Record<string, string>) ?? {}),
  };
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
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
  return parsed as T;
}

function makeIdempotencyKey(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function listPendingInvites(
  accessToken: string,
  cloneId: number,
): Promise<{ items: PendingInvite[] }> {
  return authFetch(`/oth-path${cloneId}/oth-path`, accessToken, { method: "GET" });
}

export async function cancelInvite(
  accessToken: string,
  cloneId: number,
  inviteId: number,
): Promise<{ ok: true }> {
  return authFetch(
    `/oth-path${cloneId}/oth-path${inviteId}`,
    accessToken,
    { method: "DELETE" },
    makeIdempotencyKey(),
  );
}

export async function listShares(
  accessToken: string,
  cloneId: number,
): Promise<{ items: ShareMember[] }> {
  return authFetch(`/oth-path${cloneId}/shares`, accessToken, { method: "GET" });
}

export async function deleteShare(
  accessToken: string,
  cloneId: number,
  shareId: number,
): Promise<{ ok: true; action: "kick" | "leave" }> {
  return authFetch(
    `/oth-path${cloneId}/shares/${shareId}`,
    accessToken,
    { method: "DELETE" },
    makeIdempotencyKey(),
  );
}

export interface InvitePreview {
  clone: {
    id: number;
    name: string;
    username: string;
    avatarUrl: string | null;
    cloneType: CloneType;
  };
  inviteEmail: string | null;
  relation: string | null;
  grantOwner: boolean;
  expiresAt: string;
}

export async function getInvitePreview(token: string): Promise<InvitePreview> {
  const res = await fetch(`${API_BASE}/oth-path${encodeURIComponent(token)}`);
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
  return parsed as InvitePreview;
}

export async function acceptInvite(
  accessToken: string,
  token: string,
): Promise<{ ok: true; cloneId: number }> {
  return authFetch(
    `/oth-path${encodeURIComponent(token)}/accept`,
    accessToken,
    { method: "POST" },
    makeIdempotencyKey(),
  );
}
