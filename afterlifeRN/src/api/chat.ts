

import { v_cc9198 } from "../config/apiBase";
import { v_04b58a } from "../lib/authFetch";

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
}
export interface TimelineCallItem {
  type: "call";
  callId: string;
  startedAt: number;  
  durationSec: number | null;
  turnCount: number;
}
export type TimelineItem = TimelineChatItem | TimelineCallItem;

export interface TimelineResponse {
  clone: ChatCloneSummary;
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
    | { type: "chat" | "call"; role: "user" | "clone" | null; text: string | null; at: number }
    | null;

  unreadCount: number;
}
export interface ConversationListResponse {
  items: ConversationListItem[];
}

export interface PostMessageResponse {
  sessionId: string;

  userMessage: { id: number; content: string; at?: number; createdAt: string };
  cloneReply: { id: number; content: string; tokens: number; at?: number; createdAt: string };
  billing: { credits: number; tokens: number };
}

export async function v_7c2cb7(
  v_2ca7e0,
): Promise<ConversationListResponse> {
  return v_04b58a<ConversationListResponse>("/oth-path", v_2ca7e0);
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
  const v_4d33b2 = { content: v_b43b74 };
  if (v_328259.sessionId) v_4d33b2.session_id = v_328259.sessionId;
  return v_04b58a<PostMessageResponse>(
    `/oth-path${v_6e0fd3}/messages`,
    v_2ca7e0,
    { method: "POST", body: JSON.stringify(v_4d33b2) },
    v_6f448e,
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

export async function v_9cb700(
  v_6e0fd3,
  v_2ca7e0,
): Promise<void> {
  try {
    await v_04b58a<{ ok: boolean }>(
      `/oth-path${v_6e0fd3}/mark-read`,
      v_2ca7e0,
      { method: "POST" },
    );
  } catch (v_49263d) {
    console.warn("[chat.markConversationRead] failed:", (v_49263d as Error)?.message ?? v_49263d);
  }
}
