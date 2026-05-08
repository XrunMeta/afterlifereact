

import { Hono } from "hono";
import type { AppEnv } from "../lib/env";
import { APIError } from "../lib/errors";
import { requireAuth } from "../middleware/auth";

export const notifications = new Hono<AppEnv>();

interface NotificationRow {
  id: number;
  type: string;
  title: string | null;
  body: string | null;
  data_json: string | null;
  is_read: number;
  created_at: string;
}

notifications.get("/", requireAuth, async (c) => {
  const userId = c.get("userId")!;
  const limit = Math.min(50, Math.max(1, Number(c.req.query("limit") ?? "30")));
  const offset = Math.max(0, Number(c.req.query("offset") ?? "0"));

  const rows = await c.env.DB
    .prepare(
      `SELECT id, type, title, body, data_json, is_read, created_at
         FROM notifications
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT ? OFFSET ?`,
    )
    .bind(userId, limit, offset)
    .all<NotificationRow>();

  const items = (rows.results ?? []).map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    body: r.body,
    data: r.data_json ? safeParse(r.data_json) : null,
    isRead: r.is_read === 1,
    createdAt: r.created_at,
  }));
  return c.json({ items });
});

notifications.get("/unread-count", requireAuth, async (c) => {
  const userId = c.get("userId")!;
  const row = await c.env.DB
    .prepare(`SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND is_read = 0`)
    .bind(userId)
    .first<{ n: number }>();
  return c.json({ count: row?.n ?? 0 });
});

notifications.post("/:id/read", requireAuth, async (c) => {
  const userId = c.get("userId")!;
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) {
    throw new APIError("VALIDATION_FAILED", "Invalid notification id.");
  }
  const res = await c.env.DB
    .prepare(`UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`)
    .bind(id, userId)
    .run();
  if ((res.meta?.changes ?? 0) === 0) {
    throw new APIError("NOT_FOUND", "Notification not found.");
  }
  return c.json({ ok: true });
});

notifications.post("/read-all", requireAuth, async (c) => {
  const userId = c.get("userId")!;
  await c.env.DB
    .prepare(`UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0`)
    .bind(userId)
    .run();
  return c.json({ ok: true });
});

function safeParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
