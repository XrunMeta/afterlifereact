

import { v_cc9198 } from "../config/apiBase";
import { v_04b58a } from "../lib/authFetch";
import v_9c213b from "../i18n";

export function v_8a85e2(v_e0c7e8): boolean {
  return !!v_e0c7e8 && v_e0c7e8.trim().length > 0;
}

export interface ChatCloneSummary {
  id: number;
  name: string;
  avatarUrl: string | null;
}

export interface TimelineChatItem {
  type: "chat";
  id: number;
  role: "user" | "clone";
  content: string;
  at: number;         
  sessionId: string;

  kind?: "image" | "text";

  caption?: string | null;

  lang?: string;

  replyTo?: ChatReplyTo;

  reaction?: string;
}

export interface ChatReplyTo {
  id: number;
  content: string | null;
}

export const v_5bba7d = ["❤️", "😂", "😮", "😢", "👍", "🙏"] as const;
export interface TimelineCallItem {
  type: "call";
  callId: string;
  startedAt: number;  
  durationSec: number | null;
  turnCount: number;
}

export interface TimelineSystemItem {
  type: "system";
  id: number;
  kind: string;       
  text: string;
  at: number;         
  data: Record<string, unknown>;
}
export type TimelineItem = TimelineChatItem | TimelineCallItem | TimelineSystemItem;

export interface TimelineResponse {
  clone: ChatCloneSummary;

  intimacy?: number;
  items: TimelineItem[];
  nextCursor: string | null;
}

export interface CallTurn {
  seq: number;
  role: "user" | "clone";
  text: string;
  at: number;
}
export interface CallTurnsResponse {
  callId: string;
  startedAt: number;
  turns: CallTurn[];
  nextCursor: string | null;
}

export interface ConversationListItem {
  clone: ChatCloneSummary;
  isMine: boolean;
  last:
    | {
        type: "chat" | "call" | "system";
        role: "user" | "clone" | null;
        text: string | null;
        at: number;

        kind?: string;
        data?: Record<string, unknown>;
      }
    | null;

  unreadCount: number;

  intimacy?: number;
}
export interface ConversationListResponse {
  items: ConversationListItem[];
}

export interface PostMessageResponse {
  sessionId: string;

  userMessage: {
    id: number;
    content: string;
    at?: number;
    createdAt: string;
    kind?: "image" | "text";
    caption?: string | null;
    replyTo?: ChatReplyTo;
  };

  cloneReply: { id: number; content: string; tokens: number; at?: number; createdAt: string; lang?: string };
  billing: { credits: number; tokens: number };
}

export async function v_7c2cb7(
  v_2ca7e0,
): Promise<ConversationListResponse> {
  return v_04b58a<ConversationListResponse>("/oth-path", v_2ca7e0);
}

export type LeaveKind = "subscribed" | "called" | "owned";
export async function v_8be472(
  v_6e0fd3,
  v_2ca7e0,
): Promise<{ ok: boolean; kind: LeaveKind; unsubscribed: boolean }> {
  return v_04b58a(`/oth-path${v_6e0fd3}/leave`, v_2ca7e0, { method: "POST" });
}

export function v_9d1db1(
  v_8d41d7,
  v_893b61,
): string {
  return v_893b61
    ? v_8d41d7("chat.leaveConfirmSubscribed", {
        defaultValue: "해당 클론과의 대화가 사라지고 구독취소됩니다. 계속하시겠습니까?",
      })
    : v_8d41d7("chat.leaveConfirm", { defaultValue: "해당 클론과의 대화가 사라집니다. 계속하시겠습니까?" });
}

export async function v_17fd6f(
  v_6e0fd3,
  v_2ca7e0,
  v_328259 = {},
): Promise<TimelineResponse> {
  const v_ab6401 = new URLSearchParams();
  if (v_328259.limit !== undefined) v_ab6401.set("limit", String(v_328259.limit));
  if (v_328259.cursor) v_ab6401.set("cursor", v_328259.cursor);
  const v_212049 = v_ab6401.toString();
  const v_9fe22d = `/oth-path${v_6e0fd3}/timeline${v_212049 ? `?${v_212049}` : ""}`;
  return v_04b58a<TimelineResponse>(v_9fe22d, v_2ca7e0);
}

export async function v_7cc1d8(
  v_6e0fd3,
  v_be62d3,
  v_2ca7e0,
  v_328259 = {},
): Promise<CallTurnsResponse> {
  const v_ab6401 = new URLSearchParams();
  if (v_328259.limit !== undefined) v_ab6401.set("limit", String(v_328259.limit));
  if (v_328259.cursor) v_ab6401.set("cursor", v_328259.cursor);
  const v_212049 = v_ab6401.toString();
  const v_9fe22d = `/oth-path${v_6e0fd3}/oth-path${encodeURIComponent(v_be62d3)}/turns${v_212049 ? `?${v_212049}` : ""}`;
  return v_04b58a<CallTurnsResponse>(v_9fe22d, v_2ca7e0);
}

export async function v_dd96e7(
  v_6e0fd3,
  v_b43b74,
  v_2ca7e0,
  v_328259 = {},
): Promise<PostMessageResponse> {

  const v_6f448e = `chat-${v_6e0fd3}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const v_4d33b2 = {
    content: v_b43b74,
    locale: v_9c213b.language,
  };
  if (v_328259.sessionId) v_4d33b2.session_id = v_328259.sessionId;
  if (v_328259.replyToMessageId) v_4d33b2.reply_to_message_id = v_328259.replyToMessageId;
  return v_04b58a<PostMessageResponse>(
    `/oth-path${v_6e0fd3}/messages`,
    v_2ca7e0,
    { method: "POST", body: JSON.stringify(v_4d33b2) },
    v_6f448e,
  );
}

export async function v_15b915(
  v_6e0fd3,
  v_ee89db,
  v_2ca7e0,
  v_328259 = {},
): Promise<PostMessageResponse> {
  const v_6f448e = `chat-img-${v_6e0fd3}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const v_ebd523 = new FormData();
  v_ebd523.append(
    "image",
    {
      uri: v_ee89db,
      name: v_328259.fileName ?? "chat.jpg",
      type: v_328259.mimeType ?? "image/jpeg",
    } as unknown as Blob,
  );
  if (v_328259.sessionId) v_ebd523.append("session_id", v_328259.sessionId);
  if (v_9c213b.language) v_ebd523.append("locale", v_9c213b.language);
  return v_04b58a<PostMessageResponse>(
    `/oth-path${v_6e0fd3}/messages/image`,
    v_2ca7e0,
    { method: "POST", body: v_ebd523 },
    v_6f448e,
    { multipart: true },
  );
}

export async function v_22ca9b(
  v_6e0fd3,
  v_2ca7e0,
  v_328259 = {},
): Promise<TimelineResponse | null> {
  try {
    return await v_17fd6f(v_6e0fd3, v_2ca7e0, v_328259);
  } catch (v_49263d) {
    console.warn("[chat.getTimeline] failed:", (v_49263d as Error)?.message ?? v_49263d);
    return null;
  }
}
export async function v_e36429(
  v_2ca7e0,
): Promise<ConversationListResponse | null> {
  try {
    return await v_7c2cb7(v_2ca7e0);
  } catch (v_49263d) {
    console.warn("[chat.getConversationList] failed:", (v_49263d as Error)?.message ?? v_49263d);
    return null;
  }
}
export async function v_40068b(
  v_6e0fd3,
  v_be62d3,
  v_2ca7e0,
  v_328259 = {},
): Promise<CallTurnsResponse | null> {
  try {
    return await v_7cc1d8(v_6e0fd3, v_be62d3, v_2ca7e0, v_328259);
  } catch (v_49263d) {
    console.warn("[chat.getCallTurns] failed:", (v_49263d as Error)?.message ?? v_49263d);
    return null;
  }
}

export async function v_5b6522(
  v_6e0fd3,
  v_2ca7e0,
): Promise<{ muted: boolean }> {
  return v_04b58a<{ muted: boolean }>(`/oth-path${v_6e0fd3}/mute`, v_2ca7e0);
}
export async function v_9adabd(
  v_6e0fd3,
  v_2ca7e0,
  v_9c58a3,
): Promise<{ muted: boolean }> {
  return v_04b58a<{ muted: boolean }>(`/oth-path${v_6e0fd3}/mute`, v_2ca7e0, {
    method: v_9c58a3 ? "POST" : "DELETE",
  });
}
export async function v_3ce9ef(
  v_6e0fd3,
  v_2ca7e0,
): Promise<boolean> {
  try {
    const v_8f00b9 = await v_5b6522(v_6e0fd3, v_2ca7e0);
    return !!v_8f00b9.muted;
  } catch (v_49263d) {
    console.warn("[chat.getCloneMute] failed:", (v_49263d as Error)?.message ?? v_49263d);
    return false;
  }
}

export async function v_1c758d(
  v_7f4466,
  v_2ca7e0,
): Promise<void> {
  await v_04b58a<{ ok: boolean }>(`/oth-path${v_7f4466}`, v_2ca7e0, {
    method: "DELETE",
  });
}

export async function v_e37b6d(
  v_7f4466,
  v_03a50c,
  v_2ca7e0,
): Promise<void> {
  await v_04b58a<{ ok: boolean }>(`/oth-path${v_7f4466}/reaction`, v_2ca7e0, {
    method: "PUT",
    body: JSON.stringify({ emoji: v_03a50c }),
  });
}

export async function v_9cb700(
  v_6e0fd3,
  v_2ca7e0,
  v_83d291 = Date.now(),
): Promise<void> {
  try {
    await v_04b58a<{ ok: boolean }>(
      `/oth-path${v_6e0fd3}/mark-read`,
      v_2ca7e0,
      { method: "POST", body: JSON.stringify({ at: v_83d291 }) },
    );
  } catch (v_49263d) {
    console.warn("[chat.markConversationRead] failed:", (v_49263d as Error)?.message ?? v_49263d);
  }
}
