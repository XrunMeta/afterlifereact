

import type { v_273a0c } from "./env";

interface ExpoPushMessage {
  to: string | string[];
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  badge?: number;
}

const v_00f594 = "https://exp.host/--/api/v2/push/send";

export interface SendPushResult {
  attempted: number;
  sent: number;
}

export async function v_51b1f7(
  env: v_273a0c,
  v_43e90c,
  v_badeaf,
): Promise<SendPushResult> {

  const v_18b8bf = await v_c9c489.DB
    .prepare(
      `SELECT push_token FROM user_devices
        WHERE user_id = ? AND push_token IS NOT NULL`,
    )
    .bind(v_43e90c)
    .all<{ push_token: string }>();

  const v_ef86b6 = (v_18b8bf.results ?? [])
    .map((v_cb35cb) => v_cb35cb.push_token)
    .filter((v_8d41d7) => v_8d41d7.startsWith("ExponentPushToken[") || v_8d41d7.startsWith("ExpoPushToken["));

  if (v_ef86b6.length === 0) {
    return { attempted: 0, sent: 0 };
  }

  const v_fa56e0 = v_ef86b6.map((v_257132) => ({
    to: v_257132,
    title: v_badeaf.title,
    body: v_badeaf.body,
    data: v_badeaf.data,
    sound: "default",
  }));

  try {
    const v_8f00b9 = await fetch(v_00f594, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(v_fa56e0),
    });
    if (!v_8f00b9.ok) {
      console.warn(`[expoPush] HTTP ${v_8f00b9.status} userId=${v_43e90c}`);
      return { attempted: v_ef86b6.length, sent: 0 };
    }
    return { attempted: v_ef86b6.length, sent: v_ef86b6.length };
  } catch (v_49263d) {
    console.warn("[expoPush] fetch failed:", (v_49263d as Error).message);
    return { attempted: v_ef86b6.length, sent: 0 };
  }
}
