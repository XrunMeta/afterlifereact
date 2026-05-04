

import { v_cc9198 } from "../config/apiBase";
import { v_84a859, type v_669377 } from "./auth";

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

export function v_b55477(v_1833e7): string {
  const v_8f0374 = v_1833e7
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  const v_694b25 = v_8f0374 && v_8f0374.length >= 3 ? v_8f0374 : "user";

  const v_2f361a = v_694b25.slice(0, 20);
  const v_ae8e76 = Math.random().toString(36).slice(2, 8);
  return `${v_2f361a}_${v_ae8e76}`;
}

export async function v_39eaf5(
  v_2ca7e0,
  v_931bf0,
  v_6f448e,
): Promise<CreateCloneResponse> {
  const v_b24339 =
    v_6f448e ??
    (typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

  const v_8f00b9 = await fetch(`${v_cc9198}/oth-path`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${v_2ca7e0}`,
      "Idempotency-Key": v_b24339,
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
    const v_4d33b2 = v_8decf8 as v_669377 | null;
    throw new v_84a859(
      v_8f00b9.status,
      v_4d33b2?.error?.code ?? "HTTP_ERROR",
      v_4d33b2?.error?.message ?? `HTTP ${v_8f00b9.status}`,
      v_4d33b2?.error?.details,
    );
  }
  return v_8decf8 as CreateCloneResponse;
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

async function v_04b58a<T>(
  v_9fe22d,
  v_2ca7e0,
  v_00cfc6 = {},
  v_6f448e,
): Promise<T> {
  const v_3f4675 = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${v_2ca7e0}`,
    ...((v_00cfc6.headers as Record<string, string>) ?? {}),
  };
  if (v_6f448e) v_3f4675["Idempotency-Key"] = v_6f448e;

  const v_8f00b9 = await fetch(`${v_cc9198}${v_9fe22d}`, { ...v_00cfc6, headers: v_3f4675 });
  const v_9b6134 = await v_8f00b9.text();
  let v_8decf8 = null;
  try {
    v_8decf8 = v_9b6134 ? JSON.parse(v_9b6134) : null;
  } catch {

  }
  if (!v_8f00b9.ok) {
    const v_4d33b2 = v_8decf8 as v_669377 | null;
    throw new v_84a859(
      v_8f00b9.status,
      v_4d33b2?.error?.code ?? "HTTP_ERROR",
      v_4d33b2?.error?.message ?? `HTTP ${v_8f00b9.status}`,
      v_4d33b2?.error?.details,
    );
  }
  return v_8decf8 as T;
}

function v_7f4dc3(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function v_7f4050(
  v_2ca7e0,
  v_6e0fd3,
): Promise<{ items: PendingInvite[] }> {
  return v_04b58a(`/oth-path${v_6e0fd3}/oth-path`, v_2ca7e0, { method: "GET" });
}

export async function v_735203(
  v_2ca7e0,
  v_6e0fd3,
  v_2e18e1,
): Promise<{ ok: true }> {
  return v_04b58a(
    `/oth-path${v_6e0fd3}/oth-path${v_2e18e1}`,
    v_2ca7e0,
    { method: "DELETE" },
    v_7f4dc3(),
  );
}

export async function v_7e484f(
  v_2ca7e0,
  v_6e0fd3,
): Promise<{ items: ShareMember[] }> {
  return v_04b58a(`/oth-path${v_6e0fd3}/shares`, v_2ca7e0, { method: "GET" });
}

export async function v_81dd51(
  v_2ca7e0,
  v_6e0fd3,
  v_b7bfe9,
): Promise<{ ok: true; action: "kick" | "leave" }> {
  return v_04b58a(
    `/oth-path${v_6e0fd3}/shares/${v_b7bfe9}`,
    v_2ca7e0,
    { method: "DELETE" },
    v_7f4dc3(),
  );
}
