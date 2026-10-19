

import { v_04b58a } from "../lib/authFetch";

export type NotificationType =
  | "invite_received"
  | "invite_accepted"
  | "share_kicked"
  | "ownership_transferred"
  | string;

export interface NotificationItem {
  id: number;
  type: NotificationType;
  title: string | null;
  body: string | null;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

const v_593ce7 = v_04b58a;

export async function v_9cd139(
  v_2ca7e0,
  v_328259 = {},
): Promise<{ items: NotificationItem[] }> {
  const v_212049 = new URLSearchParams();
  if (v_328259.limit) v_212049.set("limit", String(v_328259.limit));
  if (v_328259.offset) v_212049.set("offset", String(v_328259.offset));
  const v_ab6401 = v_212049.toString();
  return v_593ce7(`/oth-path${v_ab6401 ? `?${v_ab6401}` : ""}`, v_2ca7e0);
}

export async function v_28c6ec(v_2ca7e0): Promise<{ count: number }> {
  return v_593ce7(`/oth-path`, v_2ca7e0);
}

export async function v_8c796a(
  v_2ca7e0,
  v_389afb,
): Promise<{ ok: true }> {
  return v_593ce7(`/oth-path${v_389afb}/read`, v_2ca7e0, { method: "POST" });
}

export async function v_b7d6d1(v_2ca7e0): Promise<{ ok: true }> {
  return v_593ce7(`/oth-path`, v_2ca7e0, { method: "POST" });
}

export interface TestPushTicket {
  platform: string;
  status: string; 
  errorCode: string | null;
  message: string | null;
}
export interface TestPushResult {
  attempted: number;
  tickets: TestPushTicket[];
  error?: string;
}
export async function v_7bc674(v_2ca7e0): Promise<TestPushResult> {
  return v_593ce7(`/oth-path`, v_2ca7e0, { method: "POST" });
}

export interface NotificationPrefs {
  newFollower: boolean;
  followingActivity: boolean;
  reactions: boolean;
  intimacy: boolean;
  moderation: boolean;
  promotions: boolean;
}

export async function v_67d473(v_2ca7e0): Promise<NotificationPrefs> {
  return v_04b58a<NotificationPrefs>("/oth-path", v_2ca7e0, { method: "GET" });
}

export async function v_ba1376(
  v_2ca7e0,
  v_17dc8a,
): Promise<NotificationPrefs> {
  return v_04b58a<NotificationPrefs>("/oth-path", v_2ca7e0, {
    method: "PUT",
    body: JSON.stringify(v_17dc8a),
  });
}
