

import type { Bindings } from "./env";

interface ExpoPushMessage {
  to: string | string[];
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  badge?: number;
}

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export interface SendPushResult {
  attempted: number;
  sent: number;
}

export async function sendPushToUser(
  env: Bindings,
  userId: number,
  msg: { title: string; body: string; data?: Record<string, unknown> },
): Promise<SendPushResult> {

  const rows = await env.DB
    .prepare(
      `SELECT push_token FROM user_devices
        WHERE user_id = ? AND push_token IS NOT NULL`,
    )
    .bind(userId)
    .all<{ push_token: string }>();

  const tokens = (rows.results ?? [])
    .map((r) => r.push_token)
    .filter((t) => t.startsWith("ExponentPushToken[") || t.startsWith("ExpoPushToken["));

  if (tokens.length === 0) {
    return { attempted: 0, sent: 0 };
  }

  const messages: ExpoPushMessage[] = tokens.map((to) => ({
    to,
    title: msg.title,
    body: msg.body,
    data: msg.data,
    sound: "default",
  }));

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(messages),
    });
    if (!res.ok) {
      console.warn(`[expoPush] HTTP ${res.status} userId=${userId}`);
      return { attempted: tokens.length, sent: 0 };
    }
    return { attempted: tokens.length, sent: tokens.length };
  } catch (err) {
    console.warn("[expoPush] fetch failed:", (err as Error).message);
    return { attempted: tokens.length, sent: 0 };
  }
}
