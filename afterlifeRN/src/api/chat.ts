

import { v_cc9198 } from "../config/apiBase";
import { v_04b58a } from "../lib/authFetch";

const v_27c3a5 = new Set<string>(["oth-test@example.invalid"]);

export function v_8a85e2(v_e0c7e8): boolean {
  if (!v_e0c7e8) return false;
  return v_27c3a5.has(v_e0c7e8.trim().toLowerCase());
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
}
export interface ConversationListResponse {
  items: ConversationListItem[];
}

export interface PostMessageResponse {
  sessionId: string;
  userMessage: { id: number; content: string; createdAt: string };
  cloneReply: { id: number; content: string; tokens: number; createdAt: string };
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
