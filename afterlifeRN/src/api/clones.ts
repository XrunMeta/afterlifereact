

import { v_cc9198 } from "../config/apiBase";
import { v_84a859, type v_669377 } from "./auth";
import { v_04b58a as v_3fc86a } from "../lib/authFetch";

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
  };
}
export async function v_003cf2(
  v_6e0fd3,
  v_2ca7e0,
): Promise<CloneDetailResponse> {
  const v_f71b56 = `${v_cc9198}/oth-path${v_6e0fd3}`;
  const v_8f00b9 = await fetch(v_f71b56, {
    headers: v_2ca7e0 ? { Authorization: `Bearer ${v_2ca7e0}` } : {},
  });
  if (!v_8f00b9.ok) {
    throw new Error(`getCloneDetail HTTP ${v_8f00b9.status}`);
  }
  return (await v_8f00b9.json()) as CloneDetailResponse;
}

export async function v_6c3f29(
  v_556427,
): Promise<{ available: boolean; reason?: "taken" | "reserved" | "invalid" }> {
  const v_ceb55a = encodeURIComponent(v_556427);
  const v_8f00b9 = await fetch(`${v_cc9198}/oth-path?u=${v_ceb55a}`);
  if (!v_8f00b9.ok) {

    return { available: true };
  }
  return (await v_8f00b9.json()) as {
    available: boolean;
    reason?: "taken" | "reserved" | "invalid";
  };
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

export async function v_61a853(
  v_2ca7e0,
): Promise<import('../types/clone').PersonaQuestion[]> {
  const v_8f00b9 = await fetch(`${v_cc9198}/oth-path`, {
    headers: { Authorization: `Bearer ${v_2ca7e0}` },
  });
  if (!v_8f00b9.ok) throw new Error(`persona-questions ${v_8f00b9.status}`);
  const v_4d33b2 = (await v_8f00b9.json()) as { questions: import('../types/clone').PersonaQuestion[] };
  return v_4d33b2.questions ?? [];
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
export async function v_d7e0ab(
  v_2ca7e0,
): Promise<KnowledgeQuestion[]> {
  const v_8f00b9 = await fetch(`${v_cc9198}/oth-path`, {
    headers: { Authorization: `Bearer ${v_2ca7e0}` },
  });
  if (!v_8f00b9.ok) throw new Error(`knowledge-questions ${v_8f00b9.status}`);
  const v_4d33b2 = (await v_8f00b9.json()) as { questions: KnowledgeQuestion[] };
  return v_4d33b2.questions ?? [];
}

export async function v_7b4be8(
  v_2ca7e0,
  v_6e0fd3,
): Promise<KnowledgeItem[]> {
  const v_8f00b9 = await fetch(`${v_cc9198}/oth-path${v_6e0fd3}/knowledge`, {
    headers: { Authorization: `Bearer ${v_2ca7e0}` },
  });
  if (!v_8f00b9.ok) throw new Error(`knowledge ${v_8f00b9.status}`);
  const v_4d33b2 = (await v_8f00b9.json()) as { items: KnowledgeItem[] };
  return v_4d33b2.items ?? [];
}

function v_c4728e<T extends { error?: unknown; message?: string }>(v_9390e8): T {
  const v_9e86fd = v_9390e8.error;
  if (v_9e86fd && typeof v_9e86fd === "object" && "code" in (v_9e86fd as Record<string, unknown>)) {
    const v_8839e3 = v_9e86fd as { code: string; message?: string };
    return { ...v_9390e8, error: v_8839e3.code, message: v_9390e8.message ?? v_8839e3.message };
  }
  return v_9390e8;
}

export interface PutKnowledgeResult {
  ok?: boolean;
  items?: KnowledgeItem[];
  error?: string;
  message?: string;
  matched?: string;
  key?: string;
}
export async function v_085a16(
  v_2ca7e0,
  v_6e0fd3,
  v_4622b9,
): Promise<PutKnowledgeResult> {
  const v_8f00b9 = await fetch(`${v_cc9198}/oth-path${v_6e0fd3}/knowledge`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${v_2ca7e0}`,
    },
    body: JSON.stringify({ items: v_4622b9 }),
  });
  return v_c4728e((await v_8f00b9.json()) as PutKnowledgeResult);
}

export interface InterpretKnowledgeResult {
  slots?: KnowledgeItem[];
  reply?: string;
  error?: string;
  message?: string;
  matched?: string;
}
export async function v_c2fd24(
  v_2ca7e0,
  v_6e0fd3,
  v_3960ea,
  v_343c90,
): Promise<InterpretKnowledgeResult> {
  const v_8f00b9 = await fetch(
    `${v_cc9198}/oth-path${v_6e0fd3}/knowledge/interpret`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${v_2ca7e0}`,
      },
      body: JSON.stringify({ questionKey: v_3960ea, answer: v_343c90 }),
    },
  );
  return v_c4728e((await v_8f00b9.json()) as InterpretKnowledgeResult);
}

export async function v_4bf019(
  v_2ca7e0,
  v_727031,
): Promise<Record<string, string[]>> {
  try {
    const v_8f00b9 = await fetch(`${v_cc9198}/oth-path`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${v_2ca7e0}` },
      body: JSON.stringify(v_727031),
    });
    if (!v_8f00b9.ok) return {};
    const v_4d33b2 = (await v_8f00b9.json()) as { suggestions: Record<string, string[]> };
    return v_4d33b2.suggestions ?? {};
  } catch {
    return {};
  }
}

export interface CatalogVoice {
  id: number;
  name: string;
  gender: string | null;
  ageRange: string | null;
  description: string | null;
  sortOrder: number;
  sampleUrl: string;
  srcFileId: number | null;   
}

export async function v_3ee8c0(v_2ca7e0): Promise<CatalogVoice[]> {
  const v_8f00b9 = await fetch(`${v_cc9198}/oth-path`, {
    headers: { Authorization: `Bearer ${v_2ca7e0}` },
  });
  if (!v_8f00b9.ok) throw new Error(`getVoices ${v_8f00b9.status}`);
  const v_4d33b2 = (await v_8f00b9.json()) as { voices: CatalogVoice[] };
  return v_4d33b2.voices;
}

export async function v_be66ca(
  v_2ca7e0,
  v_727031,
): Promise<string> {
  try {
    const v_8f00b9 = await fetch(`${v_cc9198}/oth-path`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${v_2ca7e0}` },
      body: JSON.stringify(v_727031),
    });
    if (!v_8f00b9.ok) return "";
    const v_4d33b2 = (await v_8f00b9.json()) as { intro?: string };
    return typeof v_4d33b2.intro === "string" ? v_4d33b2.intro : "";
  } catch {
    return "";
  }
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

  return v_3fc86a<CreateCloneResponse>(
    `/oth-path`,
    v_2ca7e0,
    { method: "POST", body: JSON.stringify(v_931bf0) },
    v_b24339,
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

export async function v_ab4719(
  v_2ca7e0,
  v_931bf0,
): Promise<{ job_id: string }> {
  return v_04b58a<{ job_id: string }>(
    '/oth-path',
    v_2ca7e0,
    { method: 'POST', body: JSON.stringify(v_931bf0) },
    v_7f4dc3(),
  );
}

export async function v_b20cba(
  v_2ca7e0,
  v_04211c,
): Promise<AssetJob> {
  return v_04b58a<AssetJob>(
    `/oth-path${encodeURIComponent(v_04211c)}`,
    v_2ca7e0,
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

const v_04b58a = v_3fc86a;

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
export async function v_e4a407(
  v_2ca7e0,
  v_6e0fd3,
  v_931bf0,
): Promise<CreateInviteResponse> {
  return v_04b58a<CreateInviteResponse>(
    `/oth-path${v_6e0fd3}/oth-path`,
    v_2ca7e0,
    {
      method: "POST",
      body: JSON.stringify(v_931bf0),
    },
    v_7f4dc3(),
  );
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

export interface DeleteCloneResult {
  ok: true;
  state: "soft_deleted" | "transferred";
  transferred: { newOwnerId: number } | null;
}
export async function v_f373d8(
  v_2ca7e0,
  v_6e0fd3,
): Promise<DeleteCloneResult> {
  return v_04b58a<DeleteCloneResult>(
    `/oth-path${v_6e0fd3}`,
    v_2ca7e0,
    { method: "DELETE" },
    v_7f4dc3(),
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
export async function v_b4f9f6(
  v_2ca7e0,
  v_6e0fd3,
  v_931bf0,
): Promise<{ ok: true; updatedFields: string[] }> {
  return v_04b58a(
    `/oth-path${v_6e0fd3}`,
    v_2ca7e0,
    { method: "PATCH", body: JSON.stringify(v_931bf0) },
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
export async function v_674023(
  v_2ca7e0,
): Promise<{ items: SentInvite[] }> {
  return v_04b58a(`/oth-path`, v_2ca7e0, { method: "GET" });
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

export async function v_d60cdf(v_2ca7e0): Promise<{ items: MyClone[] }> {
  return v_04b58a(`/oth-path`, v_2ca7e0, { method: "GET" });
}

export interface SystemClone {
  id: number;
  username: string;
  name: string;
}

export async function v_81d12f(v_2ca7e0): Promise<{ items: SystemClone[] }> {
  return v_04b58a(`/oth-path`, v_2ca7e0, { method: "GET" });
}

export interface GiftReceiptItem {
  giftId: string;
  giftName: string;
  count: number;
  sender: string;
}

export async function v_d24912(
  v_2ca7e0,
  v_6e0fd3,
): Promise<{ items: GiftReceiptItem[] }> {
  return v_04b58a(
    `/oth-path${v_6e0fd3}/gifts/summary`,
    v_2ca7e0,
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

export async function v_8ce643(
  v_2ca7e0,
  v_6e0fd3,
  v_328259,
): Promise<IntimacyEventsResponse> {
  const v_212049 = new URLSearchParams();
  if (v_328259?.limit) v_212049.set("limit", String(v_328259.limit));
  if (v_328259?.cursor) v_212049.set("cursor", String(v_328259.cursor));
  const v_25c4f7 = v_212049.toString();
  return v_04b58a(
    `/oth-path${v_6e0fd3}/intimacy-events${v_25c4f7 ? `?${v_25c4f7}` : ""}`,
    v_2ca7e0,
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
export async function v_914311(
  v_6e0fd3,
  v_328259,
): Promise<{ items: CloneFollower[] }> {
  const v_f71b56 = new URL(`${v_cc9198}/oth-path${v_6e0fd3}/followers`);
  if (v_328259?.limit) v_f71b56.searchParams.set("limit", String(v_328259.limit));
  const v_8f00b9 = await fetch(v_f71b56.toString());
  const v_9b6134 = await v_8f00b9.text();
  const v_8decf8 = v_9b6134 ? (JSON.parse(v_9b6134) as unknown) : null;
  if (!v_8f00b9.ok) {
    const v_4d33b2 = v_8decf8 as v_669377 | null;
    throw new v_84a859(
      v_8f00b9.status,
      v_4d33b2?.error?.code ?? "HTTP_ERROR",
      v_4d33b2?.error?.message ?? `HTTP ${v_8f00b9.status}`,
      v_4d33b2?.error?.details,
    );
  }
  return v_8decf8 as { items: CloneFollower[] };
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

export async function v_9deb40(
  v_2ca7e0,
  v_6e0fd3,
  v_58ca36,
): Promise<{ ok: true; reported: true; blocked: true }> {
  return v_04b58a(
    `/oth-path${v_6e0fd3}/report`,
    v_2ca7e0,
    {
      method: "POST",
      body: JSON.stringify(v_58ca36 ? { reason: v_58ca36 } : {}),
    },
    v_7f4dc3(),
  );
}

export async function v_fca2f4(
  v_2ca7e0,
  v_c09aa8,
  v_d91518,
  v_58ca36,
): Promise<{ ok: true; reported: true }> {
  return v_04b58a(
    `/oth-path${v_c09aa8}/comments/${v_d91518}/report`,
    v_2ca7e0,
    {
      method: "POST",
      body: JSON.stringify(v_58ca36 ? { reason: v_58ca36 } : {}),
    },
    v_7f4dc3(),
  );
}

export async function v_c0681d(
  v_2ca7e0,
  v_6e0fd3,
  v_b36f96,
): Promise<{ ok: true }> {
  return v_04b58a(`/oth-path${v_6e0fd3}/call-event`, v_2ca7e0, {
    method: "POST",
    body: JSON.stringify(v_b36f96?.durationSeconds ? { durationSeconds: v_b36f96.durationSeconds } : {}),
  });
}

export async function v_ba8b3a(
  v_2ca7e0,
  v_6e0fd3,
): Promise<{ ok: true; bumped: boolean; scoreApplied?: number }> {
  return v_04b58a(`/oth-path${v_6e0fd3}/learn-event`, v_2ca7e0, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function v_7b4c9e(
  v_2ca7e0,
  v_6e0fd3,
): Promise<{ ok: true; scoreApplied?: number }> {
  return v_04b58a(`/oth-path${v_6e0fd3}/chat-event`, v_2ca7e0, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function v_97c75d(v_2ca7e0, v_6e0fd3): Promise<{ ok: true; blocked: true }> {
  console.log(`[BLOCK-API] → POST /oth-path${v_6e0fd3}/block`);
  const v_8f00b9 = await v_04b58a<{ ok: true; blocked: true }>(
    `/oth-path${v_6e0fd3}/block`,
    v_2ca7e0,
    { method: "POST" },
  );
  console.log(`[BLOCK-API] ← ok cloneId=${v_6e0fd3}`, v_8f00b9);
  return v_8f00b9;
}
export async function v_c0dd8d(v_2ca7e0, v_6e0fd3): Promise<{ ok: true; blocked: false }> {
  console.log(`[BLOCK-API] → DELETE /oth-path${v_6e0fd3}/block`);
  const v_8f00b9 = await v_04b58a<{ ok: true; blocked: false }>(
    `/oth-path${v_6e0fd3}/block`,
    v_2ca7e0,
    { method: "DELETE" },
  );
  console.log(`[BLOCK-API] ← unblock ok cloneId=${v_6e0fd3}`, v_8f00b9);
  return v_8f00b9;
}
export async function v_dbedc9(v_2ca7e0): Promise<{ items: BlockedItem[] }> {
  const v_8f00b9 = await v_04b58a<{ items: BlockedItem[] }>(
    `/oth-path`,
    v_2ca7e0,
    { method: "GET" },
  );
  console.log(`[BLOCK-API] listMyBlocks ← ${v_8f00b9.items.length} items`);
  return v_8f00b9;
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
export async function v_7281a5(
  v_2ca7e0,
  v_43e90c,
): Promise<{ items: FollowedClone[] }> {
  return v_04b58a(`/oth-path${v_43e90c}/followed-clones`, v_2ca7e0, { method: "GET" });
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
  };
  interests: string[];
}

export async function v_f5cc38(v_328259): Promise<{ items: DiscoverFeedItem[]; nextCursor: number | null }> {
  const v_f71b56 = new URL(`${v_cc9198}/oth-path`);
  if (v_328259?.cursor) v_f71b56.searchParams.set("cursor", String(v_328259.cursor));
  if (v_328259?.limit) v_f71b56.searchParams.set("limit", String(v_328259.limit));
  const v_3f4675 = {};
  if (v_328259?.accessToken) v_3f4675.Authorization = `Bearer ${v_328259.accessToken}`;
  const v_8f00b9 = await fetch(v_f71b56.toString(), { headers: v_3f4675 });
  const v_9b6134 = await v_8f00b9.text();
  const v_8decf8 = v_9b6134 ? (JSON.parse(v_9b6134) as unknown) : null;
  if (!v_8f00b9.ok) {
    const v_4d33b2 = v_8decf8 as v_669377 | null;
    throw new v_84a859(
      v_8f00b9.status,
      v_4d33b2?.error?.code ?? "HTTP_ERROR",
      v_4d33b2?.error?.message ?? `HTTP ${v_8f00b9.status}`,
      v_4d33b2?.error?.details,
    );
  }
  return v_8decf8 as { items: DiscoverFeedItem[]; nextCursor: number | null };
}

export async function v_5e388b(
  v_2ca7e0,
  v_6e0fd3,
  v_931bf0,
): Promise<{ feed: { id: number; cloneId: number; content: string | null; mediaUrl: string | null } }> {
  const v_8f00b9 = await fetch(`${v_cc9198}/oth-path${v_6e0fd3}/oth-path`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${v_2ca7e0}`,
    },
    body: JSON.stringify(v_931bf0),
  });
  const v_9b6134 = await v_8f00b9.text();
  const v_8decf8 = v_9b6134 ? (JSON.parse(v_9b6134) as unknown) : null;
  if (!v_8f00b9.ok) {
    const v_4d33b2 = v_8decf8 as v_669377 | null;
    throw new v_84a859(
      v_8f00b9.status,
      v_4d33b2?.error?.code ?? "HTTP_ERROR",
      v_4d33b2?.error?.message ?? `HTTP ${v_8f00b9.status}`,
      v_4d33b2?.error?.details,
    );
  }
  return v_8decf8 as { feed: { id: number; cloneId: number; content: string | null; mediaUrl: string | null } };
}

export interface FeedLikeUser {
  likeId: number;
  userId: number;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
}

export async function v_de2a30(
  v_2ca7e0,
  v_c09aa8,
): Promise<{ ok: true; liked: true; likesCount: number }> {
  return v_04b58a(`/oth-path${v_c09aa8}/like`, v_2ca7e0, { method: "POST" });
}

export async function v_11c954(
  v_2ca7e0,
  v_c09aa8,
): Promise<{ ok: true; liked: false; likesCount: number }> {
  return v_04b58a(`/oth-path${v_c09aa8}/like`, v_2ca7e0, { method: "DELETE" });
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

export async function v_776874(
  v_6e0fd3,
  v_328259,
): Promise<{ items: FeedComment[]; nextCursor: number | null }> {
  const v_f71b56 = new URL(`${v_cc9198}/oth-path${v_6e0fd3}/comments`);
  if (v_328259?.limit) v_f71b56.searchParams.set("limit", String(v_328259.limit));
  const v_3f4675 = {};
  if (v_328259?.accessToken) v_3f4675.Authorization = `Bearer ${v_328259.accessToken}`;
  const v_8f00b9 = await fetch(v_f71b56.toString(), { headers: v_3f4675 });
  const v_9b6134 = await v_8f00b9.text();
  const v_8decf8 = v_9b6134 ? (JSON.parse(v_9b6134) as unknown) : null;
  if (!v_8f00b9.ok) {
    const v_4d33b2 = v_8decf8 as v_669377 | null;
    throw new v_84a859(
      v_8f00b9.status,
      v_4d33b2?.error?.code ?? "HTTP_ERROR",
      v_4d33b2?.error?.message ?? `HTTP ${v_8f00b9.status}`,
      v_4d33b2?.error?.details,
    );
  }
  return v_8decf8 as { items: FeedComment[]; nextCursor: number | null };
}

export async function v_4208e7(
  v_c09aa8,
  v_328259,
): Promise<{ items: FeedComment[]; nextCursor: number | null }> {
  const v_f71b56 = new URL(`${v_cc9198}/oth-path${v_c09aa8}/comments`);
  if (v_328259?.cursor) v_f71b56.searchParams.set("cursor", String(v_328259.cursor));
  if (v_328259?.limit) v_f71b56.searchParams.set("limit", String(v_328259.limit));
  const v_3f4675 = {};
  if (v_328259?.accessToken) v_3f4675.Authorization = `Bearer ${v_328259.accessToken}`;
  const v_8f00b9 = await fetch(v_f71b56.toString(), { headers: v_3f4675 });
  const v_9b6134 = await v_8f00b9.text();
  const v_8decf8 = v_9b6134 ? (JSON.parse(v_9b6134) as unknown) : null;
  if (!v_8f00b9.ok) {
    const v_4d33b2 = v_8decf8 as v_669377 | null;
    throw new v_84a859(
      v_8f00b9.status,
      v_4d33b2?.error?.code ?? "HTTP_ERROR",
      v_4d33b2?.error?.message ?? `HTTP ${v_8f00b9.status}`,
      v_4d33b2?.error?.details,
    );
  }
  return v_8decf8 as { items: FeedComment[]; nextCursor: number | null };
}

export async function v_3f8bc7(
  v_2ca7e0,
  v_c09aa8,
  v_b43b74,
  v_b36f96,
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
  return v_04b58a(`/oth-path${v_c09aa8}/comments`, v_2ca7e0, {
    method: "POST",
    body: JSON.stringify(
      v_b36f96?.parentCommentId
        ? { content: v_b43b74, parentCommentId: v_b36f96.parentCommentId }
        : { content: v_b43b74 },
    ),
  });
}

export async function v_f5a9ea(
  v_c09aa8,
  v_d91518,
  v_328259,
): Promise<{ items: FeedComment[] }> {
  const v_f71b56 = new URL(
    `${v_cc9198}/oth-path${v_c09aa8}/comments/${v_d91518}/replies`,
  );
  if (v_328259?.limit) v_f71b56.searchParams.set("limit", String(v_328259.limit));
  const v_3f4675 = {};
  if (v_328259?.accessToken) v_3f4675.Authorization = `Bearer ${v_328259.accessToken}`;
  const v_8f00b9 = await fetch(v_f71b56.toString(), { headers: v_3f4675 });
  const v_9b6134 = await v_8f00b9.text();
  const v_8decf8 = v_9b6134 ? (JSON.parse(v_9b6134) as unknown) : null;
  if (!v_8f00b9.ok) {
    const v_4d33b2 = v_8decf8 as v_669377 | null;
    throw new v_84a859(
      v_8f00b9.status,
      v_4d33b2?.error?.code ?? "HTTP_ERROR",
      v_4d33b2?.error?.message ?? `HTTP ${v_8f00b9.status}`,
      v_4d33b2?.error?.details,
    );
  }
  return v_8decf8 as { items: FeedComment[] };
}

export async function v_f1ff2a(
  v_2ca7e0,
  v_c09aa8,
  v_d91518,
): Promise<{ ok: true; liked: true; likesCount: number }> {
  return v_04b58a(`/oth-path${v_c09aa8}/comments/${v_d91518}/like`, v_2ca7e0, {
    method: "POST",
  });
}

export async function v_99e260(
  v_2ca7e0,
  v_c09aa8,
  v_d91518,
): Promise<{ ok: true; liked: false; likesCount: number }> {
  return v_04b58a(`/oth-path${v_c09aa8}/comments/${v_d91518}/like`, v_2ca7e0, {
    method: "DELETE",
  });
}

export async function v_6f689a(
  v_2ca7e0,
  v_6e0fd3,
  v_b43b74,
): Promise<{ ok: true; comment: { id: number; feedId: number; userId: number; content: string }; promoted?: boolean }> {
  return v_04b58a(`/oth-path${v_6e0fd3}/comments`, v_2ca7e0, {
    method: "POST",
    body: JSON.stringify({ content: v_b43b74 }),
  });
}

export async function v_0df337(
  v_2ca7e0,
  v_c09aa8,
  v_d91518,
): Promise<{ ok: true }> {
  return v_04b58a(`/oth-path${v_c09aa8}/comments/${v_d91518}`, v_2ca7e0, {
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
export async function v_28dc16(
  v_2ca7e0,
  v_6e0fd3,
  v_931bf0,
): Promise<GiftSendResult> {
  return v_04b58a(`/oth-path${v_6e0fd3}/gift`, v_2ca7e0, {
    method: "POST",
    body: JSON.stringify(v_931bf0),
  });
}

export async function v_6d41b9(
  v_2ca7e0,
  v_6e0fd3,
): Promise<{ liked: boolean }> {
  return v_04b58a(`/oth-path${v_6e0fd3}/like-status`, v_2ca7e0, { method: "GET" });
}

export async function v_b14fce(
  v_2ca7e0,
  v_6e0fd3,
): Promise<{ ok: true; liked: boolean; feedId: number; promoted?: boolean; likesCount: number }> {
  return v_04b58a(`/oth-path${v_6e0fd3}/like`, v_2ca7e0, { method: "POST" });
}
export async function v_0ff331(
  v_2ca7e0,
  v_6e0fd3,
): Promise<{ ok: true; liked: false; feedId?: number; likesCount: number }> {
  return v_04b58a(`/oth-path${v_6e0fd3}/like`, v_2ca7e0, { method: "DELETE" });
}

export async function v_20d793(
  v_6e0fd3,
  v_328259,
): Promise<{ items: FeedLikeUser[]; nextCursor: number | null }> {
  const v_f71b56 = new URL(`${v_cc9198}/oth-path${v_6e0fd3}/likes`);
  if (v_328259?.limit) v_f71b56.searchParams.set("limit", String(v_328259.limit));
  const v_8f00b9 = await fetch(v_f71b56.toString());
  const v_9b6134 = await v_8f00b9.text();
  const v_8decf8 = v_9b6134 ? (JSON.parse(v_9b6134) as unknown) : null;
  if (!v_8f00b9.ok) {
    const v_4d33b2 = v_8decf8 as v_669377 | null;
    throw new v_84a859(
      v_8f00b9.status,
      v_4d33b2?.error?.code ?? "HTTP_ERROR",
      v_4d33b2?.error?.message ?? `HTTP ${v_8f00b9.status}`,
      v_4d33b2?.error?.details,
    );
  }
  return v_8decf8 as { items: FeedLikeUser[]; nextCursor: number | null };
}

export async function v_7f4804(
  v_c09aa8,
  v_328259,
): Promise<{ items: FeedLikeUser[]; nextCursor: number | null }> {
  const v_f71b56 = new URL(`${v_cc9198}/oth-path${v_c09aa8}/likes`);
  if (v_328259?.cursor) v_f71b56.searchParams.set("cursor", String(v_328259.cursor));
  if (v_328259?.limit) v_f71b56.searchParams.set("limit", String(v_328259.limit));
  const v_8f00b9 = await fetch(v_f71b56.toString());
  const v_9b6134 = await v_8f00b9.text();
  const v_8decf8 = v_9b6134 ? (JSON.parse(v_9b6134) as unknown) : null;
  if (!v_8f00b9.ok) {
    const v_4d33b2 = v_8decf8 as v_669377 | null;
    throw new v_84a859(
      v_8f00b9.status,
      v_4d33b2?.error?.code ?? "HTTP_ERROR",
      v_4d33b2?.error?.message ?? `HTTP ${v_8f00b9.status}`,
      v_4d33b2?.error?.details,
    );
  }
  return v_8decf8 as { items: FeedLikeUser[]; nextCursor: number | null };
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

export async function v_bb226e(
  v_2ca7e0,
  v_6e0fd3,
  v_931bf0,
): Promise<{ ok: true; updatedFields: string[] }> {
  return v_04b58a(
    `/oth-path${v_6e0fd3}`,
    v_2ca7e0,
    { method: "PATCH", body: JSON.stringify(v_931bf0) },
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

export async function v_a56a6a(v_21cc31): Promise<InvitePreview> {
  const v_8f00b9 = await fetch(`${v_cc9198}/oth-path${encodeURIComponent(v_21cc31)}`);
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
  return v_8decf8 as InvitePreview;
}

export async function v_a51300(
  v_2ca7e0,
  v_21cc31,
): Promise<{ ok: true; cloneId: number }> {
  return v_04b58a(
    `/oth-path${encodeURIComponent(v_21cc31)}/accept`,
    v_2ca7e0,
    { method: "POST" },
    v_7f4dc3(),
  );
}

export async function v_e155c8(
  v_2ca7e0,
  v_21cc31,
): Promise<{ ok: true; cloneId?: number; removedShare?: boolean; alreadyCancelled?: boolean }> {
  return v_04b58a(
    `/oth-path${encodeURIComponent(v_21cc31)}/decline`,
    v_2ca7e0,
    { method: "POST" },
    v_7f4dc3(),
  );
}
