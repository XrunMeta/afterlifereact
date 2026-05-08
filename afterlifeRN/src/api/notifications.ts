

import { API_BASE } from "../config/apiBase";
import { AuthApiError, type ApiErrorBody } from "./auth";

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

async function authJson<T>(
  path: string,
  accessToken: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...((init.headers as Record<string, string>) ?? {}),
    },
  });
  const text = await res.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {

  }
  if (!res.ok) {
    const errBody = parsed as ApiErrorBody | null;
    throw new AuthApiError(
      res.status,
      errBody?.error?.code ?? "HTTP_ERROR",
      errBody?.error?.message ?? `HTTP ${res.status}`,
      errBody?.error?.details,
    );
  }
  return parsed as T;
}

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
