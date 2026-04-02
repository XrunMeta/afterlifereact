import { Hono } from "hono";
import type { Env } from "../index";
import { logActivity, ensureCloneStats } from "../lib/logger";

export const clones = new Hono<Env>();

clones.get("/", async (c) => {
  const userId = c.req.header("X-User-Id");
  const type = c.req.query("type");

  let query = "SELECT * FROM clones WHERE visibility = 'public'";
  const params: string[] = [];

  if (userId) {
    query += " OR created_by = ?";
    params.push(userId);
  }
  if (type) {
    query += " AND type = ?";
    params.push(type);
  }

  query += " ORDER BY created_at DESC";

  const result = await c.env.DB.prepare(query).bind(...params).all();
  return c.json(result.results);
});

clones.get("/:id", async (c) => {
  const id = c.req.param("id");
  const clone = await c.env.DB.prepare("SELECT * FROM clones WHERE id = ?")
    .bind(id)
    .first();

  if (!clone) return c.json({ error: "Clone not found" }, 404);

  const interests = await c.env.DB.prepare(
    "SELECT interest FROM clone_interests WHERE clone_id = ?"
  )
    .bind(id)
    .all();

  return c.json({
    ...clone,
    interests: interests.results.map((r) => r.interest),
  });
});

clones.post("/", async (c) => {
  const userId = c.req.header("X-User-Id");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const body = await c.req.json();
  const id = crypto.randomUUID();

  await c.env.DB.prepare(
    "INSERT INTO clones (id, name, username, avatar_url, cover_image_url, type, category, description, visibility, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  )
    .bind(
      id, body.name, body.username, body.avatar_url, body.cover_image_url,
      body.type, body.category, body.description, body.visibility, userId
    )
    .run();

  if (body.interests?.length) {
    const stmt = c.env.DB.prepare(
      "INSERT INTO clone_interests (clone_id, interest) VALUES (?, ?)"
    );
    await c.env.DB.batch(body.interests.map((i: string) => stmt.bind(id, i)));
  }

  await ensureCloneStats(c.env.DB, id);
  await logActivity(c, { userId, cloneId: id, action: "clone_create" });

  return c.json({ id }, 201);
});

clones.put("/:id", async (c) => {
  const userId = c.req.header("X-User-Id");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const id = c.req.param("id");
  const body = await c.req.json();

  const clone = await c.env.DB.prepare(
    "SELECT created_by FROM clones WHERE id = ?"
  )
    .bind(id)
    .first();

  if (!clone) return c.json({ error: "Clone not found" }, 404);
  if (clone.created_by !== userId)
    return c.json({ error: "Forbidden" }, 403);

  await c.env.DB.prepare(
    "UPDATE clones SET name = ?, description = ?, category = ?, visibility = ?, avatar_url = ?, cover_image_url = ? WHERE id = ?"
  )
    .bind(
      body.name, body.description, body.category,
      body.visibility, body.avatar_url, body.cover_image_url, id
    )
    .run();

  return c.json({ success: true });
});

clones.delete("/:id", async (c) => {
  const userId = c.req.header("X-User-Id");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const id = c.req.param("id");
  const clone = await c.env.DB.prepare(
    "SELECT created_by FROM clones WHERE id = ?"
  )
    .bind(id)
    .first();

  if (!clone) return c.json({ error: "Clone not found" }, 404);
  if (clone.created_by !== userId)
    return c.json({ error: "Forbidden" }, 403);

  await c.env.DB.prepare("DELETE FROM clones WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});
