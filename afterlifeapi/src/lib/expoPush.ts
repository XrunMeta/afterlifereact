

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
        WHERE user_id = ? AND push_token IS NOT NULL AND is_active = 1`,
    )
    .bind(userId)
    .all<{ push_token: string }>();

  const tokens = (rows.results ?? [])
    .map((r) => r.push_token)
    .filter((t) => t.startsWith("ExponentPushToken[") || t.startsWith("ExpoPushToken["));

  console.log(`[expoPush] userId=${userId} active tokens=${tokens.length}`);
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
      const errBody = await res.text().catch(() => "");
      console.warn(`[expoPush] HTTP ${res.status} userId=${userId} body=${errBody.slice(0, 300)}`);
      return { attempted: tokens.length, sent: 0 };
    }

    const body = (await res.json().catch(() => null)) as
      | { data?: Array<{ status?: string; message?: string; details?: { error?: string } }> }
      | null;
    if (!body || !Array.isArray(body.data)) {
      console.warn(`[expoPush] unexpected response body userId=${userId}`);
      return { attempted: tokens.length, sent: 0 };
    }
    let sent = 0;
    const deadTokens: string[] = [];
    body.data.forEach((ticket, i) => {
      const token = tokens[i];
      if (!token) return;
      if (ticket.status === "ok") {
        sent++;
      } else {
        const errCode = ticket.details?.error ?? ticket.status ?? "unknown";
        console.warn(`[expoPush] ticket failed userId=${userId} token=${token.slice(0, 25)}... err=${errCode} msg=${ticket.message ?? ""}`);

        if (errCode === "DeviceNotRegistered" || errCode === "InvalidCredentials") {
          deadTokens.push(token);
        }
      }
    });

    if (deadTokens.length > 0) {
      try {
        for (const t of deadTokens) {
          await env.DB
            .prepare(`UPDATE user_devices SET is_active = 0 WHERE user_id = ? AND push_token = ?`)
            .bind(userId, t)
            .run();
        }
        console.log(`[expoPush] deactivated ${deadTokens.length} dead token(s) for userId=${userId}`);
      } catch (deactErr) {
        console.warn(`[expoPush] deactivate dead tokens failed:`, (deactErr as Error).message);
      }
    }
    console.log(`[expoPush] userId=${userId} attempted=${tokens.length} sent=${sent}`);
    return { attempted: tokens.length, sent };
  } catch (err) {
    console.warn("[expoPush] fetch failed:", (err as Error).message);
    return { attempted: tokens.length, sent: 0 };
  }
}
