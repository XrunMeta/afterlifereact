

import type { v_273a0c } from "./env";

const v_00f594 = "https://exp.host/--/api/v2/push/send";
const v_e1099b = 100;
const v_175c8a = "(광고)";

export function v_fd26b4(v_5c2f9f = new Date()): boolean {
  const v_0b250c = (v_5c2f9f.getUTCHours() + 9) % 24;
  return v_0b250c >= 21 || v_0b250c < 8;
}

export function v_c1f9bb(v_9f1622, v_6bd78e): string {
  const v_8d41d7 = v_9f1622.trim();
  if (!v_6bd78e) return v_8d41d7;
  return v_8d41d7.startsWith(v_175c8a) ? v_8d41d7 : `${v_175c8a} ${v_8d41d7}`;
}

export function v_c43f8d(v_4d33b2, v_6bd78e): string {
  const v_148ff6 = v_4d33b2.trim();
  if (!v_6bd78e) return v_148ff6;
  const v_b496f5 = "수신거부: 앱 > 마이 > 설정 > 알림 > 혜택정보 수신";
  return v_148ff6 ? `${v_148ff6}\n${v_b496f5}` : v_b496f5;
}

export interface BroadcastResult {
  targetUsers: number;
  skippedNoConsent: number;
  devices: number;
  sent: number;
  failed: number;
}

export async function v_342698(
  env: v_273a0c,
  v_328259,
): Promise<BroadcastResult> {

  const v_27ecba = v_328259.xrunMemberIds;
  const v_de7ba7 = [];
  if (v_27ecba === null) {
    const v_315151 = await v_c9c489.DB
      .prepare(`SELECT id, marketing_consent FROM users WHERE deletion_state = 'active' AND deleted_at IS NULL`)
      .all<{ id: number; marketing_consent: number }>();
    v_de7ba7.push(...(v_315151.results ?? []));
  } else {

    for (let v_ebec57 = 0; v_ebec57 < v_27ecba.length; v_ebec57 += 90) {
      const v_334f63 = v_27ecba.slice(v_ebec57, v_ebec57 + 90);
      const v_315151 = await v_c9c489.DB
        .prepare(
          `SELECT id, marketing_consent FROM users
            WHERE deletion_state = 'active' AND deleted_at IS NULL
              AND xrun_member_id IN (${v_334f63.map(() => "?").join(",")})`,
        )
        .bind(...v_334f63)
        .all<{ id: number; marketing_consent: number }>();
      v_de7ba7.push(...(v_315151.results ?? []));
    }
  }
  const v_ffd251 = v_328259.isAd ? v_de7ba7.filter((v_ceb55a) => v_ceb55a.marketing_consent === 1) : v_de7ba7;
  const v_4cb1ed = v_de7ba7.length - v_ffd251.length;

  const v_ef86b6 = [];
  const v_52e08b = v_ffd251.map((v_ceb55a) => v_ceb55a.id);
  for (let v_ebec57 = 0; v_ebec57 < v_52e08b.length; v_ebec57 += 90) {
    const v_334f63 = v_52e08b.slice(v_ebec57, v_ebec57 + 90);
    const v_315151 = await v_c9c489.DB
      .prepare(
        `SELECT user_id, push_token FROM user_devices
          WHERE is_active = 1 AND push_token IS NOT NULL
            AND user_id IN (${v_334f63.map(() => "?").join(",")})`,
      )
      .bind(...v_334f63)
      .all<{ user_id: number; push_token: string }>();
    for (const v_cb35cb of v_315151.results ?? []) {
      if (v_cb35cb.push_token.startsWith("ExponentPushToken[") || v_cb35cb.push_token.startsWith("ExpoPushToken[")) {
        v_ef86b6.push({ userId: v_cb35cb.user_id, token: v_cb35cb.push_token });
      }
    }
  }

  let v_f966e3 = 0;
  let v_0bc646 = 0;
  const v_f3e03f = [];
  for (let v_ebec57 = 0; v_ebec57 < v_ef86b6.length; v_ebec57 += v_e1099b) {
    const v_36e01f = v_ef86b6.slice(v_ebec57, v_ebec57 + v_e1099b);
    try {
      const v_8f00b9 = await fetch(v_00f594, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(
          v_36e01f.map((v_148ff6) => ({
            to: v_148ff6.token,
            title: v_328259.title,
            body: v_328259.body,
            sound: "default",
            data: { type: "admin_push", ad: v_328259.isAd },
          })),
        ),
      });
      const v_7ecfd1 = (await v_8f00b9.json().catch(() => null)) as
        | { data?: Array<{ status?: string; details?: { error?: string } }> }
        | null;
      if (!v_8f00b9.ok || !v_7ecfd1?.data) {
        v_0bc646 += v_36e01f.length;
        continue;
      }
      v_7ecfd1.data.forEach((v_8d41d7, v_e86ad8) => {
        const v_8c0b26 = v_36e01f[v_e86ad8];
        if (!v_8c0b26) return;
        if (v_8d41d7.status === "ok") v_f966e3++;
        else {
          v_0bc646++;
          const v_c99bd2 = v_8d41d7.details?.error;
          if (v_c99bd2 === "DeviceNotRegistered" || v_c99bd2 === "InvalidCredentials") v_f3e03f.push(v_8c0b26);
        }
      });
    } catch (v_49263d) {
      console.warn("[adminBroadcast] batch failed:", (v_49263d as Error).message);
      v_0bc646 += v_36e01f.length;
    }
  }
  for (const v_d5dda0 of v_f3e03f) {
    await v_c9c489.DB
      .prepare(`UPDATE user_devices SET is_active = 0 WHERE user_id = ? AND push_token = ?`)
      .bind(v_d5dda0.userId, v_d5dda0.token)
      .run()
      .catch(() => {});
  }

  return { targetUsers: v_ffd251.length, skippedNoConsent: v_4cb1ed, devices: v_ef86b6.length, sent: v_f966e3, failed: v_0bc646 };
}
