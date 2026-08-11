

import { API_BASE } from "../config/apiBase";
import { AuthApiError, type ApiErrorBody } from "./auth";
import { authFetch as _libAuthFetch } from "../lib/authFetch";

export type CloneType = "memlow" | "friend" | "mentor" | "celeb";

export type Visibility = "public" | "private" | "followers" | "selected";

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
    personality_core?: string;
    tone?: string;
  };

  personaAnswers?: Record<string, string>;

  relation?: string;

  idle_video_job_id?: string;
  voice_clone_job_id?: string;

  pin?: string;

  pipeline?: "musetalk" | "echomimic_v3";
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

export interface CloneDetailResponse {
  clone: {
    id: number;
    ownerId: number;
    name: string;
    username: string;
    description: string | null;
    avatarUrl: string | null;
    cloneType: string;
    visibility: string;
    stats: {
      followers: number;
      messages: number;
      gifts: number;
      likes: number;
      comments: number;
    };
    likedByMe: boolean;
    createdAt: string;

    pipeline?: string | null;
  };
}
export async function getCloneDetail(
  cloneId: number,
  accessToken?: string,
): Promise<CloneDetailResponse> {
  const url = `${API_BASE}/oth-path${cloneId}`;
  const res = await fetch(url, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
  if (!res.ok) {
    throw new Error(`getCloneDetail HTTP ${res.status}`);
  }
  return (await res.json()) as CloneDetailResponse;
}

export async function checkCloneUsername(
  username: string,
): Promise<{ available: boolean; reason?: "taken" | "reserved" | "invalid" }> {
  const u = encodeURIComponent(username);
  const res = await fetch(`${API_BASE}/oth-path?u=${u}`);
  if (!res.ok) {

    return { available: true };
  }
  return (await res.json()) as {
    available: boolean;
    reason?: "taken" | "reserved" | "invalid";
  };
}

export const CLONE_USERNAME_RE = /^[a-z0-9_]+$/;

export function validateCloneUsername(raw: string): string | null {
  const u = raw.trim();
  if (u.length === 0) return "아이디를 입력해주세요.";
  if (u.length < 3) return "아이디는 3자 이상이어야 해요.";
  if (u.length > 30) return "아이디는 30자 이하여야 해요.";
  if (!CLONE_USERNAME_RE.test(u)) {
    return "아이디는 영문 소문자·숫자·밑줄(_) 만 사용할 수 있어요. (대문자·한글·공백 불가)";
  }
  return null;
}

export function deriveUsernameFromName(name: string): string {
  const ascii = name
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  const base = ascii && ascii.length >= 3 ? ascii : "user";

  const trimmed = base.slice(0, 19);
  const rand = () => Math.random().toString(36).slice(2);
  const suffix = (rand() + rand()).slice(0, 10);
  return `${trimmed}_${suffix}`;
}

export async function getPersonaQuestions(
  accessToken: string,
): Promise<import('../types/clone').PersonaQuestion[]> {
  const res = await fetch(`${API_BASE}/oth-path`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`persona-questions ${res.status}`);
  const body = (await res.json()) as { questions: import('../types/clone').PersonaQuestion[] };
  return body.questions ?? [];
}

export interface KnowledgeQuestionSlot {
  key: string;
  label: string;
}
export interface KnowledgeQuestion {
  key: string;
  label: string;
  hint?: string;
  optional?: boolean;
  slots?: KnowledgeQuestionSlot[];
}
export interface KnowledgeItem {
  key: string;
  q: string | null;
  a: string;
  updated_at?: number;
}
export async function getKnowledgeQuestions(
  accessToken: string,
): Promise<KnowledgeQuestion[]> {
  const res = await fetch(`${API_BASE}/oth-path`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`knowledge-questions ${res.status}`);
  const body = (await res.json()) as { questions: KnowledgeQuestion[] };
  return body.questions ?? [];
}

export async function getCloneKnowledge(
  accessToken: string,
  cloneId: number,
): Promise<KnowledgeItem[]> {
  const res = await fetch(`${API_BASE}/oth-path${cloneId}/knowledge`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`knowledge ${res.status}`);
  const body = (await res.json()) as { items: KnowledgeItem[] };
  return body.items ?? [];
}

function unwrapApiError<T extends { error?: unknown; message?: string }>(data: T): T {
  const e = data.error;
  if (e && typeof e === "object" && "code" in (e as Record<string, unknown>)) {
    const obj = e as { code: string; message?: string };
    return { ...data, error: obj.code, message: data.message ?? obj.message };
  }
  return data;
}

export interface PutKnowledgeResult {
  ok?: boolean;
  items?: KnowledgeItem[];
  error?: string;
  message?: string;
  matched?: string;
  key?: string;
}
export async function putCloneKnowledge(
  accessToken: string,
  cloneId: number,
  items: Array<{ key?: string; q?: string | null; a: string }>,
): Promise<PutKnowledgeResult> {
  const res = await fetch(`${API_BASE}/oth-path${cloneId}/knowledge`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ items }),
  });
  return unwrapApiError((await res.json()) as PutKnowledgeResult);
}

export interface InterpretKnowledgeResult {
  slots?: KnowledgeItem[];
  reply?: string;
  error?: string;
  message?: string;
  matched?: string;
}
export async function interpretCloneKnowledge(
  accessToken: string,
  cloneId: number,
  questionKey: string,
  answer: string,
): Promise<InterpretKnowledgeResult> {
  const res = await fetch(
    `${API_BASE}/oth-path${cloneId}/knowledge/interpret`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ questionKey, answer }),
    },
  );
  return unwrapApiError((await res.json()) as InterpretKnowledgeResult);
}

export async function followupCloneKnowledge(
  accessToken: string,
  cloneId: number,
  questionLabel: string,
  answer: string,
): Promise<{ followup: string }> {
  try {
    const res = await fetch(
      `${API_BASE}/oth-path${cloneId}/knowledge/followup`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ questionLabel, answer }),
      },
    );
    if (!res.ok) return { followup: "" };
    const body = (await res.json()) as { followup?: string };
    return { followup: typeof body.followup === "string" ? body.followup : "" };
  } catch {
    return { followup: "" };
  }
}

export async function personaSuggest(
  accessToken: string,
  profile: Record<string, unknown>,
): Promise<Record<string, string[]>> {
  try {
    const res = await fetch(`${API_BASE}/oth-path`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(profile),
    });
    if (!res.ok) return {};
    const body = (await res.json()) as { suggestions: Record<string, string[]> };
    return body.suggestions ?? {};
  } catch {
    return {};
  }
}

export interface CatalogVoice {
  id: number;
  name: string;
  nameEn: string | null;
  nameJa: string | null;
  nameZhCn: string | null;
  nameId: string | null;
  gender: string | null;
  ageRange: string | null;
  description: string | null;
  sortOrder: number;
  sampleUrl: string;
  srcFileId: number | null;   
}

export async function getVoices(accessToken: string): Promise<CatalogVoice[]> {
  const res = await fetch(`${API_BASE}/oth-path`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`getVoices ${res.status}`);
  const body = (await res.json()) as { voices: CatalogVoice[] };
  return body.voices;
}

export async function introSuggest(
  accessToken: string,
  profile: { name?: string; relation?: string; personaAnswers?: Record<string, string> },
): Promise<string> {
  try {
    const res = await fetch(`${API_BASE}/oth-path`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(profile),
    });
    if (!res.ok) return "";
    const body = (await res.json()) as { intro?: string };
    return typeof body.intro === "string" ? body.intro : "";
  } catch {
    return "";
  }
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

  return _libAuthFetch<CreateCloneResponse>(
    `/oth-path`,
    accessToken,
    { method: "POST", body: JSON.stringify(payload) },
    key,
  );
}

export type AssetJobKind = 'idle_video' | 'voice_clone';
export type AssetJobStatus = 'pending' | 'running' | 'done' | 'failed';

export interface AssetJob {
  job_id: string;
  kind: AssetJobKind;
  status: AssetJobStatus;
  out_url?: string | null;
  error?: string | null;
}

export async function createAssetJob(
  accessToken: string,
  payload: { kind: AssetJobKind; src_file_id: number },
): Promise<{ job_id: string }> {
  return authFetch<{ job_id: string }>(
    '/oth-path',
    accessToken,
    { method: 'POST', body: JSON.stringify(payload) },
    makeIdempotencyKey(),
  );
}

export async function getAssetJob(
  accessToken: string,
  jobId: string,
): Promise<AssetJob> {
  return authFetch<AssetJob>(
    `/oth-path${encodeURIComponent(jobId)}`,
    accessToken,
    { method: 'GET' },
  );
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

const authFetch = _libAuthFetch;

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

export interface UpdateClonePayload {
  name?: string;
  description?: string;
  avatar_url?: string;
  cover_image_url?: string;
  visibility?: string;
  interests?: string[];
}
export async function updateClone(
  accessToken: string,
  cloneId: number,
  payload: UpdateClonePayload,
): Promise<{ ok: true; updatedFields: string[] }> {
  return authFetch(
    `/oth-path${cloneId}`,
    accessToken,
    { method: "PATCH", body: JSON.stringify(payload) },
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

export interface SystemClone {
  id: number;
  username: string;
  name: string;
}

export async function listSystemClones(accessToken: string): Promise<{ items: SystemClone[] }> {
  return authFetch(`/oth-path`, accessToken, { method: "GET" });
}

export interface GiftReceiptItem {
  giftId: string;
  giftName: string;
  count: number;
  sender: string;
}

export async function listCloneGiftReceipts(
  accessToken: string,
  cloneId: number,
): Promise<{ items: GiftReceiptItem[] }> {
  return authFetch(
    `/oth-path${cloneId}/gifts/summary`,
    accessToken,
    { method: "GET" },
  );
}

export interface IntimacyEvent {
  id: number;
  action: "chat" | "call" | "learn" | "feed";
  score: number;
  feedId: number | null;
  createdAt: string;
}

export interface IntimacyEventsResponse {
  summary: {
    totalScore: number;
    chat: number;
    call: number;
    learn: number;
    feed: number;
    eventCount: number;
  };
  items: IntimacyEvent[];
  nextCursor: number | null;
}

export async function listCloneIntimacyEvents(
  accessToken: string,
  cloneId: number,
  opts?: { limit?: number; cursor?: number | null },
): Promise<IntimacyEventsResponse> {
  const qs = new URLSearchParams();
  if (opts?.limit) qs.set("limit", String(opts.limit));
  if (opts?.cursor) qs.set("cursor", String(opts.cursor));
  const tail = qs.toString();
  return authFetch(
    `/oth-path${cloneId}/intimacy-events${tail ? `?${tail}` : ""}`,
    accessToken,
    { method: "GET" },
  );
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

export interface BlockedItemClone {
  blockId: number;
  createdAt: string;
  type: "clone";
  clone: {
    id: number;
    name: string;
    username: string;
    avatarUrl: string | null;
    cloneType: CloneType;
    ownerId: number;
    visibility: Visibility;
  };
}
export interface BlockedItemUser {
  blockId: number;
  createdAt: string;
  type: "user";
  user: {
    id: number;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
}
export type BlockedItem = BlockedItemClone | BlockedItemUser;

export async function reportClone(
  accessToken: string,
  cloneId: number,
  reason?: string,
): Promise<{ ok: true; reported: true; blocked: true }> {
  return authFetch(
    `/oth-path${cloneId}/report`,
    accessToken,
    {
      method: "POST",
      body: JSON.stringify(reason ? { reason } : {}),
    },
    makeIdempotencyKey(),
  );
}

export async function reportFeedComment(
  accessToken: string,
  feedId: number,
  commentId: number,
  reason?: string,
): Promise<{ ok: true; reported: true }> {
  return authFetch(
    `/oth-path${feedId}/comments/${commentId}/report`,
    accessToken,
    {
      method: "POST",
      body: JSON.stringify(reason ? { reason } : {}),
    },
    makeIdempotencyKey(),
  );
}

export async function postCloneCallEvent(
  accessToken: string,
  cloneId: number,
  options?: { durationSeconds?: number },
): Promise<{ ok: true }> {
  return authFetch(`/oth-path${cloneId}/call-event`, accessToken, {
    method: "POST",
    body: JSON.stringify(options?.durationSeconds ? { durationSeconds: options.durationSeconds } : {}),
  });
}

export async function postCloneLearnEvent(
  accessToken: string,
  cloneId: number,
): Promise<{ ok: true; bumped: boolean; scoreApplied?: number }> {
  return authFetch(`/oth-path${cloneId}/learn-event`, accessToken, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function postCloneChatEvent(
  accessToken: string,
  cloneId: number,
): Promise<{ ok: true; scoreApplied?: number }> {
  return authFetch(`/oth-path${cloneId}/chat-event`, accessToken, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function blockClone(accessToken: string, cloneId: number): Promise<{ ok: true; blocked: true }> {
  console.log(`[BLOCK-API] → POST /oth-path${cloneId}/block`);
  const res = await authFetch<{ ok: true; blocked: true }>(
    `/oth-path${cloneId}/block`,
    accessToken,
    { method: "POST" },
  );
  console.log(`[BLOCK-API] ← ok cloneId=${cloneId}`, res);
  return res;
}
export async function unblockClone(accessToken: string, cloneId: number): Promise<{ ok: true; blocked: false }> {
  console.log(`[BLOCK-API] → DELETE /oth-path${cloneId}/block`);
  const res = await authFetch<{ ok: true; blocked: false }>(
    `/oth-path${cloneId}/block`,
    accessToken,
    { method: "DELETE" },
  );
  console.log(`[BLOCK-API] ← unblock ok cloneId=${cloneId}`, res);
  return res;
}
export async function listMyBlocks(accessToken: string): Promise<{ items: BlockedItem[] }> {
  const res = await authFetch<{ items: BlockedItem[] }>(
    `/oth-path`,
    accessToken,
    { method: "GET" },
  );
  console.log(`[BLOCK-API] listMyBlocks ← ${res.items.length} items`);
  return res;
}

export interface FollowedClone {
  id: number;
  name: string;
  username: string;
  description?: string | null;
  cloneType: CloneType;
  category: string | null;
  avatarUrl: string | null;
  interests?: string[];

  stats: {
    followers: number;
    messages: number;
    gifts: number;
    likes?: number;
    comments?: number;
  };
  latestFeed?: {
    feedId: number | null;
    likedByMe: boolean;
  };

  myInteractions?: {
    chat: number;
    call: number;
    learn: number;
    feed: number;
    total: number;
    intimacy: number; 
  };

  isOwn?: boolean;
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

    ownerId?: number;
    name: string;
    username: string;
    avatarUrl: string | null;
    cloneType: CloneType;
    visibility?: string;

    ownerName?: string | null;
    ownerAvatarUrl?: string | null;
  };
  interests: string[];

  myIntimacy?: number;

  giftsReceived?: number;
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

export async function createCloneFeed(
  accessToken: string,
  cloneId: number,
  payload: { content?: string; mediaUrl?: string; mediaType?: string },
): Promise<{ feed: { id: number; cloneId: number; content: string | null; mediaUrl: string | null } }> {
  return _libAuthFetch<{ feed: { id: number; cloneId: number; content: string | null; mediaUrl: string | null } }>(
    `/oth-path${cloneId}/oth-path`,
    accessToken,
    { method: "POST", body: JSON.stringify(payload) },
  );
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

  repliesCount?: number;

  parentCommentId?: number;

  likesCount?: number;

  likedByMe?: boolean;
  user: {
    id: number;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
}

export async function listCloneComments(
  cloneId: number,
  opts?: { limit?: number; accessToken?: string | null },
): Promise<{ items: FeedComment[]; nextCursor: number | null }> {
  const url = new URL(`${API_BASE}/oth-path${cloneId}/comments`);
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
  return parsed as { items: FeedComment[]; nextCursor: number | null };
}

export async function listFeedComments(
  feedId: number,
  opts?: { cursor?: number | null; limit?: number; accessToken?: string | null },
): Promise<{ items: FeedComment[]; nextCursor: number | null }> {
  const url = new URL(`${API_BASE}/oth-path${feedId}/comments`);
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
  return parsed as { items: FeedComment[]; nextCursor: number | null };
}

export async function postFeedComment(
  accessToken: string,
  feedId: number,
  content: string,
  options?: { parentCommentId?: number },
): Promise<{
  ok: true;
  comment: {
    id: number;
    feedId: number;
    userId: number;
    content: string;
    parentCommentId: number | null;
  };
}> {
  return authFetch(`/oth-path${feedId}/comments`, accessToken, {
    method: "POST",
    body: JSON.stringify(
      options?.parentCommentId
        ? { content, parentCommentId: options.parentCommentId }
        : { content },
    ),
  });
}

export async function listFeedCommentReplies(
  feedId: number,
  commentId: number,
  opts?: { limit?: number; accessToken?: string | null },
): Promise<{ items: FeedComment[] }> {
  const url = new URL(
    `${API_BASE}/oth-path${feedId}/comments/${commentId}/replies`,
  );
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
  return parsed as { items: FeedComment[] };
}

export async function likeFeedComment(
  accessToken: string,
  feedId: number,
  commentId: number,
): Promise<{ ok: true; liked: true; likesCount: number }> {
  return authFetch(`/oth-path${feedId}/comments/${commentId}/like`, accessToken, {
    method: "POST",
  });
}

export async function unlikeFeedComment(
  accessToken: string,
  feedId: number,
  commentId: number,
): Promise<{ ok: true; liked: false; likesCount: number }> {
  return authFetch(`/oth-path${feedId}/comments/${commentId}/like`, accessToken, {
    method: "DELETE",
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

export interface GiftSendResult {
  ok: true;
  gift: {
    id: number;
    giftId: string;
    giftName: string;
    total: number;
    companyAmount: number;
    ownerAmount: number;
    txCompany: string | null;
    txOwner: string | null;
    newBalance: string | null;
  };
}
export async function sendGiftToClone(
  accessToken: string,
  cloneId: number,
  payload: { giftId: string; giftName: string; amount: number; pin: string },
): Promise<GiftSendResult> {
  return authFetch(`/oth-path${cloneId}/gift`, accessToken, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getCloneLikeStatus(
  accessToken: string,
  cloneId: number,
): Promise<{ liked: boolean }> {
  return authFetch(`/oth-path${cloneId}/like-status`, accessToken, { method: "GET" });
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

  allowed_viewers?: number[];
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

export interface CloneL2Fields {
  memory_summary?: string;
  relationship?: string;
  context?: string;
  recent_topics?: string;
  relation_category?: string;
  relation_subtype?: string;
  relation_episode?: string;
  address_form?: string;
  speech_form?: string;
  job_category?: string;
  job_detail?: string;
}

export async function getCloneL2(
  accessToken: string,
  cloneId: number,
): Promise<{ l2_profile: CloneL2Fields }> {
  return authFetch(`/oth-path${cloneId}/l2`, accessToken, { method: "GET" });
}

export async function patchCloneL2(
  accessToken: string,
  cloneId: number,
  fields: CloneL2Fields,
): Promise<{ l2_profile: CloneL2Fields }> {
  return authFetch(
    `/oth-path${cloneId}/l2`,
    accessToken,
    { method: "PATCH", body: JSON.stringify(fields) },
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
