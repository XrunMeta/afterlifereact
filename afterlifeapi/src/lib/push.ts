

import type { v_273a0c } from "./env";

const v_00f594 = "https://exp.host/--/api/v2/push/send";

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

export async function v_51b1f7(
  env: v_273a0c,
  v_43e90c,
  v_badeaf,
): Promise<{ sent: number; tokens: number }> {
  const v_18b8bf = (
    await v_c9c489.DB.prepare(
      `SELECT push_token, platform FROM user_devices
        WHERE user_id = ? AND is_active = 1
          AND push_token LIKE 'ExponentPushToken%'`,
    )
      .bind(v_43e90c)
      .all<{ push_token: string; platform: string | null }>()
  ).results;
  const v_ef86b6 = v_18b8bf.map((v_cb35cb) => v_cb35cb.push_token);
  if (v_ef86b6.length === 0) return { sent: 0, tokens: 0 };

  const v_fa56e0 = v_ef86b6.map((v_257132) => ({
    to: v_257132,
    sound: "default" as const,
    title: v_badeaf.title,
    body: v_badeaf.body,
    data: v_badeaf.data ?? {},
  }));

  let v_f966e3 = 0;
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
      console.warn(`[push] HTTP ${v_8f00b9.status}: ${await v_8f00b9.text()}`);
      return { sent: 0, tokens: v_ef86b6.length };
    }
    const v_7ecfd1 = (await v_8f00b9.json()) as { data?: ExpoTicket[] };
    const v_30338f = v_7ecfd1.data ?? [];
    for (const v_8d41d7 of v_30338f) {
      if (v_8d41d7.status === "ok") v_f966e3 += 1;
      else console.warn(`[push] ticket error: ${v_8d41d7.message ?? v_8d41d7.details?.error ?? "unknown"}`);
    }
  } catch (v_49263d) {
    console.warn(`[push] send failed: ${(v_49263d as Error).message}`);
  }
  return { sent: v_f966e3, tokens: v_ef86b6.length };
}
