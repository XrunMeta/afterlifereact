

import { authFetch } from "../lib/authFetch";

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

const authJson = authFetch;

export async function listNotifications(
  accessToken: string,
  opts: { limit?: number; offset?: number } = {},
): Promise<{ items: NotificationItem[] }> {
  const qs = new URLSearchParams();
  if (opts.limit) qs.set("limit", String(opts.limit));
  if (opts.offset) qs.set("offset", String(opts.offset));
  const q = qs.toString();
  return authJson(`/oth-path${q ? `?${q}` : ""}`, accessToken);
}

export async function getUnreadCount(accessToken: string): Promise<{ count: number }> {
  return authJson(`/oth-path`, accessToken);
}

export async function markRead(
  accessToken: string,
  id: number,
): Promise<{ ok: true }> {
  return authJson(`/oth-path${id}/read`, accessToken, { method: "POST" });
}

export async function markAllRead(accessToken: string): Promise<{ ok: true }> {
  return authJson(`/oth-path`, accessToken, { method: "POST" });
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
export async function sendTestPush(accessToken: string): Promise<TestPushResult> {
  return authJson(`/oth-path`, accessToken, { method: "POST" });
}
