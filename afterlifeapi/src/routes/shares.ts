import { Hono } from "hono";
import type { Env } from "../index";

export const shares = new Hono<Env>();

shares.get("/:cloneId", async (c) => {
  const userId = c.req.header("X-User-Id");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const cloneId = c.req.param("cloneId");

  const clone = await c.env.DB.prepare(
    "SELECT created_by FROM clones WHERE id = ?"
  )
    .bind(cloneId)
    .first();

  if (!clone) return c.json({ error: "Clone not found" }, 404);
  if (clone.created_by !== userId)
    return c.json({ error: "Forbidden" }, 403);

  const result = await c.env.DB.prepare(
    "SELECT cs.*, u.name, u.email FROM clone_shares cs JOIN users u ON cs.shared_to = u.id WHERE cs.clone_id = ?"
  )
    .bind(cloneId)
    .all();

  return c.json(result.results);
});

shares.post("/:cloneId", async (c) => {
  const userId = c.req.header("X-User-Id");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const cloneId = c.req.param("cloneId");
  const { shared_to } = await c.req.json();

  const clone = await c.env.DB.prepare(
    "SELECT created_by FROM clones WHERE id = ?"
  )
    .bind(cloneId)
    .first();

  if (!clone) return c.json({ error: "Clone not found" }, 404);
  if (clone.created_by !== userId)
    return c.json({ error: "Forbidden" }, 403);

  await c.env.DB.prepare(
    "INSERT OR IGNORE INTO clone_shares (clone_id, owner_id, shared_to) VALUES (?, ?, ?)"
  )
    .bind(cloneId, userId, shared_to)
    .run();

  return c.json({ success: true });
});

shares.delete("/:cloneId/:targetUserId", async (c) => {
  const userId = c.req.header("X-User-Id");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const cloneId = c.req.param("cloneId");
  const targetUserId = c.req.param("targetUserId");

  const clone = await c.env.DB.prepare(
    "SELECT created_by FROM clones WHERE id = ?"
  )
    .bind(cloneId)
    .first();

  if (!clone) return c.json({ error: "Clone not found" }, 404);
  if (clone.created_by !== userId)
    return c.json({ error: "Forbidden" }, 403);

  await c.env.DB.prepare(
    "DELETE FROM clone_shares WHERE clone_id = ? AND shared_to = ?"
  )
    .bind(cloneId, targetUserId)
    .run();

  return c.json({ success: true });
});
