import { Hono } from "hono";
import type { Env } from "../index";
import { logActivity, updateCloneStat } from "../lib/logger";

export const messages = new Hono<Env>();

messages.get("/:cloneId", async (c) => {
  const userId = c.req.header("X-User-Id");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const cloneId = c.req.param("cloneId");
  const sessionId = c.req.query("session_id");

  let query =
    "SELECT * FROM messages WHERE clone_id = ? AND user_id = ?";
  const params: string[] = [cloneId, userId];

  if (sessionId) {
    query += " AND session_id = ?";
    params.push(sessionId);
  }

  query += " ORDER BY created_at ASC";

  const result = await c.env.DB.prepare(query).bind(...params).all();
  return c.json(result.results);
});

messages.post("/:cloneId", async (c) => {
  const userId = c.req.header("X-User-Id");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const cloneId = c.req.param("cloneId");
  const body = await c.req.json();
  const id = crypto.randomUUID();

  await c.env.DB.prepare(
    "INSERT INTO messages (id, session_id, clone_id, user_id, sender_type, text, input_type, audio_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  )
    .bind(
      id, body.session_id, cloneId, userId,
      body.sender_type, body.text,
      body.input_type || "text", body.audio_url || null
    )
    .run();

  await updateCloneStat(c.env.DB, cloneId, "total_messages");
  await logActivity(c, {
    userId,
    cloneId,
    action: "message_send",
    metadata: { session_id: body.session_id, sender_type: body.sender_type, input_type: body.input_type || "text" },
  });

  return c.json({ id }, 201);
});

messages.post("/:cloneId/session/start", async (c) => {
  const userId = c.req.header("X-User-Id");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const cloneId = c.req.param("cloneId");
  const sessionId = crypto.randomUUID();

  await updateCloneStat(c.env.DB, cloneId, "total_chats");
  await logActivity(c, {
    userId,
    cloneId,
    action: "chat_start",
    metadata: { session_id: sessionId },
  });

  return c.json({ session_id: sessionId });
});

messages.post("/:cloneId/session/end", async (c) => {
  const userId = c.req.header("X-User-Id");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const cloneId = c.req.param("cloneId");
  const { session_id, duration_sec } = await c.req.json();

  if (duration_sec > 0) {
    await updateCloneStat(c.env.DB, cloneId, "total_chat_duration", duration_sec);
  }

  await logActivity(c, {
    userId,
    cloneId,
    action: "chat_end",
    metadata: { session_id, duration_sec },
  });

  return c.json({ success: true });
});
