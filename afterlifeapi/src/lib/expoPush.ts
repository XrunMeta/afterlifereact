

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
        WHERE user_id = ? AND push_token IS NOT NULL AND is_active = 1`,
    )
    .bind(v_43e90c)
    .all<{ push_token: string }>();

  const v_ef86b6 = (v_18b8bf.results ?? [])
    .map((v_cb35cb) => v_cb35cb.push_token)
    .filter((v_8d41d7) => v_8d41d7.startsWith("ExponentPushToken[") || v_8d41d7.startsWith("ExpoPushToken["));

  console.log(`[expoPush] userId=${v_43e90c} active tokens=${v_ef86b6.length}`);
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
      const v_9be017 = await v_8f00b9.text().catch(() => "");
      console.warn(`[expoPush] HTTP ${v_8f00b9.status} userId=${v_43e90c} body=${v_9be017.slice(0, 300)}`);
      return { attempted: v_ef86b6.length, sent: 0 };
    }

    const v_4d33b2 = (await v_8f00b9.json().catch(() => null)) as
      | { data?: Array<{ status?: string; message?: string; details?: { error?: string } }> }
      | null;
    if (!v_4d33b2 || !Array.isArray(v_4d33b2.data)) {
      console.warn(`[expoPush] unexpected response body userId=${v_43e90c}`);
      return { attempted: v_ef86b6.length, sent: 0 };
    }
    let v_f966e3 = 0;
    const v_5bdee5 = [];
    v_4d33b2.data.forEach((v_c9c6be, v_ebec57) => {
      const v_21cc31 = v_ef86b6[v_ebec57];
      if (!v_21cc31) return;
      if (v_c9c6be.status === "ok") {
        v_f966e3++;
      } else {
        const v_b965ce = v_c9c6be.details?.error ?? v_c9c6be.status ?? "unknown";
        console.warn(`[expoPush] ticket failed userId=${v_43e90c} token=${v_21cc31.slice(0, 25)}... err=${v_b965ce} msg=${v_c9c6be.message ?? ""}`);

        if (v_b965ce === "DeviceNotRegistered" || v_b965ce === "InvalidCredentials") {
          v_5bdee5.push(v_21cc31);
        }
      }
    });

    if (v_5bdee5.length > 0) {
      try {
        for (const v_8d41d7 of v_5bdee5) {
          await v_c9c489.DB
            .prepare(`UPDATE user_devices SET is_active = 0 WHERE user_id = ? AND push_token = ?`)
            .bind(v_43e90c, v_8d41d7)
            .run();
        }
        console.log(`[expoPush] deactivated ${v_5bdee5.length} dead token(s) for userId=${v_43e90c}`);
      } catch (v_d6f915) {
        console.warn(`[expoPush] deactivate dead tokens failed:`, (v_d6f915 as Error).message);
      }
    }
    console.log(`[expoPush] userId=${v_43e90c} attempted=${v_ef86b6.length} sent=${v_f966e3}`);
    return { attempted: v_ef86b6.length, sent: v_f966e3 };
  } catch (v_49263d) {
    console.warn("[expoPush] fetch failed:", (v_49263d as Error).message);
    return { attempted: v_ef86b6.length, sent: 0 };
  }
}
