

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

export interface CreatedClone {
  id: number;
  name: string;
  username: string;
  cloneType: CloneType;
  visibility: Visibility;
  createdAt: string;
}
export interface CreateCloneResponse {
  clone: CreatedClone;
  initial_memory: { ctx_key: string; shared_key: string } | null;
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
      "X-Idempotency-Key": key,
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
  if (idempotencyKey) headers["X-Idempotency-Key"] = idempotencyKey;

  const url = `${API_BASE}${path}`;
  const method = init.method ?? "GET";
  const res = await fetch(url, { ...init, headers });
  const text = await res.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {

  }
  if (!res.ok) {
    const body = parsed as ApiErrorBody | null;

    console.warn(
      "[authFetch] failed:",
      method,
      url,
      "status=",
      res.status,
      "code=",
      body?.error?.code,
      "msg=",
      body?.error?.message,
      "raw=",
      text.slice(0, 300),
    );
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

export interface CreateInvitePayload {
  invite_email?: string;
  relation?: string;
  grant_owner?: boolean;
  ttl_hours?: number;
}
export interface CreateInviteResponse {
  token: string;
  expiresAt: string;
  inviteEmail: string | null;
  grantOwner: boolean;
  notify?: {
    inserted: boolean;
    pushAttempted: number;
    pushSent: number;
    emailSent: boolean;
  } | null;
}
export async function createInvite(
  accessToken: string,
  cloneId: number,
  payload: CreateInvitePayload,
): Promise<CreateInviteResponse> {
  return authFetch<CreateInviteResponse>(
    `/oth-path${cloneId}/oth-path`,
    accessToken,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    makeIdempotencyKey(),
  );
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

export interface DeleteCloneResult {
  ok: true;
  state: "soft_deleted" | "transferred";
  transferred: { newOwnerId: number } | null;
}
export async function deleteClone(
  accessToken: string,
  cloneId: number,
): Promise<DeleteCloneResult> {
  return authFetch<DeleteCloneResult>(
    `/oth-path${cloneId}`,
    accessToken,
    { method: "DELETE" },
    makeIdempotencyKey(),
  );
}

export type SentInviteStatus = "pending" | "accepted" | "cancelled" | "expired";
export interface SentInvite {
  id: number;
  inviteEmail: string | null;
  relation: string | null;
  grantOwner: boolean;
  expiresAt: string;
  usedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  status: SentInviteStatus;
  clone: {
    id: number;
    name: string;
    username: string;
    avatarUrl: string | null;
    cloneType: CloneType;
  };
}
export async function listMyInvites(
  accessToken: string,
): Promise<{ items: SentInvite[] }> {
  return authFetch(`/oth-path`, accessToken, { method: "GET" });
}

export interface MyClone {
  id: number;
  name: string;
  username: string;
  description: string | null;
  cloneType: CloneType;
  category: string | null;
  visibility: Visibility;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  trainingStatus: string | null;
  ownerId: number;
  createdAt: string;
  myRole: "owner" | "coowner";

  coownerCount: number;

  interests?: string[];

  l1Profile?: { attrs: Record<string, string>; notes: string } | null;

  likesCount?: number;
  commentsCount?: number;
  followersCount?: number;
  messagesCount?: number;
}

export async function listMyClones(accessToken: string): Promise<{ items: MyClone[] }> {
  return authFetch(`/oth-path`, accessToken, { method: "GET" });
}

export interface CloneFollower {
  followId: number;
  userId: number;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
}
export async function listCloneFollowers(
  cloneId: number,
  opts?: { limit?: number },
): Promise<{ items: CloneFollower[] }> {
  const url = new URL(`${API_BASE}/oth-path${cloneId}/followers`);
  if (opts?.limit) url.searchParams.set("limit", String(opts.limit));
  const res = await fetch(url.toString());
  const text = await res.text();
  const parsed = text ? (JSON.parse(text) as unknown) : null;
  if (!res.ok) {
    const body = parsed as ApiErrorBody | null;
    throw new AuthApiError(
      res.status,
      body?.error?.code ?? "HTTP_ERROR",
      body?.error?.message ?? `HTTP ${res.status}`,
      body?.error?.details,
    );
  }
  return parsed as { items: CloneFollower[] };
}

export interface BlockedClone {
  blockId: number;
  createdAt: string;
  clone: {
    id: number;
    name: string;
    username: string;
    avatarUrl: string | null;
    cloneType: CloneType;
  };
}

export async function blockClone(accessToken: string, cloneId: number): Promise<{ ok: true; blocked: true }> {
  return authFetch(`/oth-path${cloneId}/block`, accessToken, { method: "POST" });
}
export async function unblockClone(accessToken: string, cloneId: number): Promise<{ ok: true; blocked: false }> {
  return authFetch(`/oth-path${cloneId}/block`, accessToken, { method: "DELETE" });
}
export async function listMyBlocks(accessToken: string): Promise<{ items: BlockedClone[] }> {
  return authFetch(`/oth-path`, accessToken, { method: "GET" });
}

export interface FollowedClone {
  id: number;
  name: string;
  username: string;
  cloneType: CloneType;
  category: string | null;
  avatarUrl: string | null;
  stats: { followers: number; messages: number; gifts: number };
  createdAt: string;
}
export async function listMyFollowedClones(
  accessToken: string,
  userId: number,
): Promise<{ items: FollowedClone[] }> {
  return authFetch(`/oth-path${userId}/followed-clones`, accessToken, { method: "GET" });
}

export interface DiscoverFeedItem {
  id: number;
  cloneId: number;
  content: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
  likesCount: number;
  likedByMe?: boolean;
  commentsCount?: number;
  createdAt: string;
  clone: {
    id: number;
    name: string;
    username: string;
    avatarUrl: string | null;
    cloneType: CloneType;
  };
  interests: string[];
}

export async function listDiscoverFeeds(opts?: {
  cursor?: number | null;
  limit?: number;
  accessToken?: string | null;
}): Promise<{ items: DiscoverFeedItem[]; nextCursor: number | null }> {
  const url = new URL(`${API_BASE}/oth-path`);
  if (opts?.cursor) url.searchParams.set("cursor", String(opts.cursor));
  if (opts?.limit) url.searchParams.set("limit", String(opts.limit));
  const headers: Record<string, string> = {};
  if (opts?.accessToken) headers.Authorization = `Bearer ${opts.accessToken}`;
  const res = await fetch(url.toString(), { headers });
  const text = await res.text();
  const parsed = text ? (JSON.parse(text) as unknown) : null;
  if (!res.ok) {
    const body = parsed as ApiErrorBody | null;
    throw new AuthApiError(
      res.status,
      body?.error?.code ?? "HTTP_ERROR",
      body?.error?.message ?? `HTTP ${res.status}`,
      body?.error?.details,
    );
  }
  return parsed as { items: DiscoverFeedItem[]; nextCursor: number | null };
}

export interface FeedLikeUser {
  likeId: number;
  userId: number;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
}

export async function likeFeed(
  accessToken: string,
  feedId: number,
): Promise<{ ok: true; liked: true; likesCount: number }> {
  return authFetch(`/oth-path${feedId}/like`, accessToken, { method: "POST" });
}

export async function unlikeFeed(
  accessToken: string,
  feedId: number,
): Promise<{ ok: true; liked: false; likesCount: number }> {
  return authFetch(`/oth-path${feedId}/like`, accessToken, { method: "DELETE" });
}

export interface FeedComment {
  id: number;
  feedId?: number;
  userId: number;
  content: string;
  createdAt: string;
  user: {
    id: number;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
}

export async function listCloneComments(
  cloneId: number,
  opts?: { limit?: number },
): Promise<{ items: FeedComment[]; nextCursor: number | null }> {
  const url = new URL(`${API_BASE}/oth-path${cloneId}/comments`);
  if (opts?.limit) url.searchParams.set("limit", String(opts.limit));
  const res = await fetch(url.toString());
  const text = await res.text();
  const parsed = text ? (JSON.parse(text) as unknown) : null;
  if (!res.ok) {
    const body = parsed as ApiErrorBody | null;
    throw new AuthApiError(
      res.status,
      body?.error?.code ?? "HTTP_ERROR",
      body?.error?.message ?? `HTTP ${res.status}`,
      body?.error?.details,
    );
  }
  return parsed as { items: FeedComment[]; nextCursor: number | null };
}

export async function listFeedComments(
  feedId: number,
  opts?: { cursor?: number | null; limit?: number },
): Promise<{ items: FeedComment[]; nextCursor: number | null }> {
  const url = new URL(`${API_BASE}/oth-path${feedId}/comments`);
  if (opts?.cursor) url.searchParams.set("cursor", String(opts.cursor));
  if (opts?.limit) url.searchParams.set("limit", String(opts.limit));
  const res = await fetch(url.toString());
  const text = await res.text();
  const parsed = text ? (JSON.parse(text) as unknown) : null;
  if (!res.ok) {
    const body = parsed as ApiErrorBody | null;
    throw new AuthApiError(
      res.status,
      body?.error?.code ?? "HTTP_ERROR",
      body?.error?.message ?? `HTTP ${res.status}`,
      body?.error?.details,
    );
  }
  return parsed as { items: FeedComment[]; nextCursor: number | null };
}

export async function postFeedComment(
  accessToken: string,
  feedId: number,
  content: string,
): Promise<{ ok: true; comment: { id: number; feedId: number; userId: number; content: string } }> {
  return authFetch(`/oth-path${feedId}/comments`, accessToken, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export async function postCloneComment(
  accessToken: string,
  cloneId: number,
  content: string,
): Promise<{ ok: true; comment: { id: number; feedId: number; userId: number; content: string }; promoted?: boolean }> {
  return authFetch(`/oth-path${cloneId}/comments`, accessToken, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export async function deleteFeedComment(
  accessToken: string,
  feedId: number,
  commentId: number,
): Promise<{ ok: true }> {
  return authFetch(`/oth-path${feedId}/comments/${commentId}`, accessToken, {
    method: "DELETE",
  });
}

export async function likeClone(
  accessToken: string,
  cloneId: number,
): Promise<{ ok: true; liked: boolean; feedId: number; promoted?: boolean; likesCount: number }> {
  return authFetch(`/oth-path${cloneId}/like`, accessToken, { method: "POST" });
}
export async function unlikeClone(
  accessToken: string,
  cloneId: number,
): Promise<{ ok: true; liked: false; feedId?: number; likesCount: number }> {
  return authFetch(`/oth-path${cloneId}/like`, accessToken, { method: "DELETE" });
}

export async function listCloneLikes(
  cloneId: number,
  opts?: { limit?: number },
): Promise<{ items: FeedLikeUser[]; nextCursor: number | null }> {
  const url = new URL(`${API_BASE}/oth-path${cloneId}/likes`);
  if (opts?.limit) url.searchParams.set("limit", String(opts.limit));
  const res = await fetch(url.toString());
  const text = await res.text();
  const parsed = text ? (JSON.parse(text) as unknown) : null;
  if (!res.ok) {
    const body = parsed as ApiErrorBody | null;
    throw new AuthApiError(
      res.status,
      body?.error?.code ?? "HTTP_ERROR",
      body?.error?.message ?? `HTTP ${res.status}`,
      body?.error?.details,
    );
  }
  return parsed as { items: FeedLikeUser[]; nextCursor: number | null };
}

export async function listFeedLikes(
  feedId: number,
  opts?: { cursor?: number | null; limit?: number },
): Promise<{ items: FeedLikeUser[]; nextCursor: number | null }> {
  const url = new URL(`${API_BASE}/oth-path${feedId}/likes`);
  if (opts?.cursor) url.searchParams.set("cursor", String(opts.cursor));
  if (opts?.limit) url.searchParams.set("limit", String(opts.limit));
  const res = await fetch(url.toString());
  const text = await res.text();
  const parsed = text ? (JSON.parse(text) as unknown) : null;
  if (!res.ok) {
    const body = parsed as ApiErrorBody | null;
    throw new AuthApiError(
      res.status,
      body?.error?.code ?? "HTTP_ERROR",
      body?.error?.message ?? `HTTP ${res.status}`,
      body?.error?.details,
    );
  }
  return parsed as { items: FeedLikeUser[]; nextCursor: number | null };
}

export interface PatchClonePayload {
  name?: string;
  description?: string;
  visibility?: Visibility;
  avatar_url?: string;
  cover_image_url?: string;
  voice_preset_id?: number | null;
  l1_profile?: { attrs: Record<string, string>; notes: string };
  interests?: string[];
}

export async function patchClone(
  accessToken: string,
  cloneId: number,
  payload: PatchClonePayload,
): Promise<{ ok: true; updatedFields: string[] }> {
  return authFetch(
    `/oth-path${cloneId}`,
    accessToken,
    { method: "PATCH", body: JSON.stringify(payload) },
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

export async function declineInvite(
  accessToken: string,
  token: string,
): Promise<{ ok: true; cloneId?: number; removedShare?: boolean; alreadyCancelled?: boolean }> {
  return authFetch(
    `/oth-path${encodeURIComponent(token)}/decline`,
    accessToken,
    { method: "POST" },
    makeIdempotencyKey(),
  );
}
