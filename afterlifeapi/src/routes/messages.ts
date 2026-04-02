import { v_b7c41b } from "zmui";
import type { v_4bcb54 } from "../index";
import { v_74defc, v_0f7c57 } from "../lib/logger";

export const v_fa56e0 = new v_b7c41b<v_4bcb54>();

v_fa56e0.get("/:cloneId", async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.req.header("X-User-Id");
  if (!v_43e90c) return v_3f4e2e.json({ error: "Unauthorized" }, 401);

  const v_6e0fd3 = v_3f4e2e.req.param("cloneId");
  const v_c5607b = v_3f4e2e.req.query("session_id");

  let v_7c5791 =
    "SELECT * FROM messages WHERE clone_id = ? AND user_id = ?";
  const v_24baff = [v_6e0fd3, v_43e90c];

  if (v_c5607b) {
    v_7c5791 += " AND session_id = ?";
    v_24baff.push(v_c5607b);
  }

  v_7c5791 += " ORDER BY created_at ASC";

  const v_43c42e = await v_3f4e2e.env.DB.prepare(v_7c5791).bind(...v_24baff).all();
  return v_3f4e2e.json(v_43c42e.results);
});

v_fa56e0.post("/:cloneId", async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.req.header("X-User-Id");
  if (!v_43e90c) return v_3f4e2e.json({ error: "Unauthorized" }, 401);

  const v_6e0fd3 = v_3f4e2e.req.param("cloneId");
  const v_4d33b2 = await v_3f4e2e.req.json();
  const v_389afb = crypto.randomUUID();

  await v_3f4e2e.env.DB.prepare(
    "INSERT INTO messages (id, session_id, clone_id, user_id, sender_type, text, input_type, audio_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  )
    .bind(
      v_389afb, v_4d33b2.session_id, v_6e0fd3, v_43e90c,
      v_4d33b2.sender_type, v_4d33b2.text,
      v_4d33b2.input_type || "text", v_4d33b2.audio_url || null
    )
    .run();

  await v_0f7c57(v_3f4e2e.env.DB, v_6e0fd3, "total_messages");
  await v_74defc(v_3f4e2e, {
    userId: v_43e90c,
    cloneId: v_6e0fd3,
    action: "message_send",
    metadata: { session_id: v_4d33b2.session_id, sender_type: v_4d33b2.sender_type, input_type: v_4d33b2.input_type || "text" },
  });

  return v_3f4e2e.json({ id: v_389afb }, 201);
});

v_fa56e0.post("/:cloneId/session/start", async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.req.header("X-User-Id");
  if (!v_43e90c) return v_3f4e2e.json({ error: "Unauthorized" }, 401);

  const v_6e0fd3 = v_3f4e2e.req.param("cloneId");
  const v_c5607b = crypto.randomUUID();

  await v_0f7c57(v_3f4e2e.env.DB, v_6e0fd3, "total_chats");
  await v_74defc(v_3f4e2e, {
    userId: v_43e90c,
    cloneId: v_6e0fd3,
    action: "chat_start",
    metadata: { session_id: v_c5607b },
  });

  return v_3f4e2e.json({ session_id: v_c5607b });
});

v_fa56e0.post("/:cloneId/session/end", async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.req.header("X-User-Id");
  if (!v_43e90c) return v_3f4e2e.json({ error: "Unauthorized" }, 401);

  const v_6e0fd3 = v_3f4e2e.req.param("cloneId");
  const { session_id: v_acee3a, duration_sec: v_447396 } = await v_3f4e2e.req.json();

  if (v_447396 > 0) {
    await v_0f7c57(v_3f4e2e.env.DB, v_6e0fd3, "total_chat_duration", v_447396);
  }

  await v_74defc(v_3f4e2e, {
    userId: v_43e90c,
    cloneId: v_6e0fd3,
    action: "chat_end",
    metadata: { session_id: v_acee3a, duration_sec: v_447396 },
  });

  return v_3f4e2e.json({ success: true });
});
