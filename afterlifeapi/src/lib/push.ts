

import type { Bindings } from "./env";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

interface ExpoTicket {
  status?: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
}

export async function sendPushToUser(
  env: Bindings,
  userId: number,
  msg: PushMessage,
): Promise<{ sent: number; tokens: number }> {
  const rows = (
    await env.DB.prepare(
      `SELECT push_token, platform FROM user_devices
        WHERE user_id = ? AND is_active = 1
          AND push_token LIKE 'ExponentPushToken%'`,
    )
      .bind(userId)
      .all<{ push_token: string; platform: string | null }>()
  ).results;
  const tokens = rows.map((r) => r.push_token);
  if (tokens.length === 0) return { sent: 0, tokens: 0 };

  const messages = tokens.map((to) => ({
    to,
    sound: "default" as const,
    title: msg.title,
    body: msg.body,
    data: msg.data ?? {},
  }));

  let sent = 0;
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
      console.warn(`[push] HTTP ${res.status}: ${await res.text()}`);
      return { sent: 0, tokens: tokens.length };
    }
    const json = (await res.json()) as { data?: ExpoTicket[] };
    const tickets = json.data ?? [];
    for (const t of tickets) {
      if (t.status === "ok") sent += 1;
      else console.warn(`[push] ticket error: ${t.message ?? t.details?.error ?? "unknown"}`);
    }
  } catch (err) {
    console.warn(`[push] send failed: ${(err as Error).message}`);
  }
  return { sent, tokens: tokens.length };
}
