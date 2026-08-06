

import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_3ebe58 } from "../lib/errors";
import { v_6690d9 } from "../middleware/auth";

export const v_b9c00c = new v_b7c41b<v_de0a25>();

interface NotificationRow {
  id: number;
  type: string;
  title: string | null;
  body: string | null;
  data_json: string | null;
  is_read: number;
  created_at: string;
}

v_b9c00c.get("/", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_02be30 = Math.min(50, Math.max(1, Number(v_3f4e2e.req.query("limit") ?? "30")));
  const v_3bbadf = Math.max(0, Number(v_3f4e2e.req.query("offset") ?? "0"));

  const v_18b8bf = await v_3f4e2e.env.DB
    .prepare(
      `SELECT id, type, title, body, data_json, is_read, created_at
         FROM notifications
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT ? OFFSET ?`,
    )
    .bind(v_43e90c, v_02be30, v_3bbadf)
    .all<NotificationRow>();

  const v_4622b9 = (v_18b8bf.results ?? []).map((v_cb35cb) => ({
    id: v_cb35cb.id,
    type: v_cb35cb.type,
    title: v_cb35cb.title,
    body: v_cb35cb.body,
    data: v_cb35cb.data_json ? v_063096(v_cb35cb.data_json) : null,
    isRead: v_cb35cb.is_read === 1,
    createdAt: v_cb35cb.created_at,
  }));
  return v_3f4e2e.json({ items: v_4622b9 });
});

v_b9c00c.get("/unread-count", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_3ac7e7 = await v_3f4e2e.env.DB
    .prepare(`SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND is_read = 0`)
    .bind(v_43e90c)
    .first<{ n: number }>();
  return v_3f4e2e.json({ count: v_3ac7e7?.n ?? 0 });
});

v_b9c00c.post("/:id/read", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_389afb = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_389afb) || v_389afb <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid notification id.");
  }
  const v_8f00b9 = await v_3f4e2e.env.DB
    .prepare(`UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`)
    .bind(v_389afb, v_43e90c)
    .run();
  if ((v_8f00b9.meta?.changes ?? 0) === 0) {
    throw new v_3ebe58("NOT_FOUND", "Notification not found.");
  }
  return v_3f4e2e.json({ ok: true });
});

v_b9c00c.post("/read-all", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  await v_3f4e2e.env.DB
    .prepare(`UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0`)
    .bind(v_43e90c)
    .run();
  return v_3f4e2e.json({ ok: true });
});

v_b9c00c.post("/test-push", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_18b8bf = await v_3f4e2e.env.DB
    .prepare(
      `SELECT push_token, platform FROM user_devices
        WHERE user_id = ? AND push_token IS NOT NULL AND is_active = 1`,
    )
    .bind(v_43e90c)
    .all<{ push_token: string; platform: string }>();
  const v_1ba7e1 = (v_18b8bf.results ?? []).filter(
    (v_cb35cb) => v_cb35cb.push_token.startsWith("ExponentPushToken[") || v_cb35cb.push_token.startsWith("ExpoPushToken["),
  );
  if (v_1ba7e1.length === 0) {
    return v_3f4e2e.json({ attempted: 0, tickets: [], error: "활성 토큰이 없습니다. 알림 권한을 다시 켜주세요." });
  }
  const v_fa56e0 = v_1ba7e1.map((v_d5dda0) => ({
    to: v_d5dda0.push_token,
    title: "🧪 테스트 알림",
    body: "알림이 정상적으로 도착했습니다.",
    sound: "default" as const,
  }));

  const v_8f00b9 = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(v_fa56e0),
  });
  const v_0b04f0 = (await v_8f00b9.json().catch(() => null)) as
    | { data?: Array<{ status?: string; message?: string; details?: { error?: string } }> }
    | null;
  const v_30338f = v_1ba7e1.map((v_d5dda0, v_ebec57) => {
    const v_8d41d7 = v_0b04f0?.data?.[v_ebec57];
    return {
      platform: v_d5dda0.platform,
      status: v_8d41d7?.status ?? "no-response",
      errorCode: v_8d41d7?.details?.error ?? null,
      message: v_8d41d7?.message ?? null,
    };
  });
  return v_3f4e2e.json({ attempted: v_1ba7e1.length, tickets: v_30338f });
});

function v_063096(v_fd5f43): unknown {
  try {
    return JSON.parse(v_fd5f43);
  } catch {
    return null;
  }
}
