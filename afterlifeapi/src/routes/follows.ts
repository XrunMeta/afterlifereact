import { Hono } from "hono";
import type { Env } from "../index";
import { logActivity, updateCloneStat } from "../lib/logger";

export const follows = new Hono<Env>();

follows.get("/", async (c) => {
  const userId = c.req.header("X-User-Id");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const result = await c.env.DB.prepare(
    "SELECT c.* FROM follows f JOIN clones c ON f.clone_id = c.id WHERE f.user_id = ? ORDER BY f.created_at DESC"
  )
    .bind(userId)
    .all();

  return c.json(result.results);
});

follows.post("/", async (c) => {
  const userId = c.req.header("X-User-Id");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const { clone_id } = await c.req.json();

  await c.env.DB.prepare(
    "INSERT OR IGNORE INTO follows (user_id, clone_id) VALUES (?, ?)"
  )
    .bind(userId, clone_id)
    .run();

  await updateCloneStat(c.env.DB, clone_id, "total_followers");
  await logActivity(c, { userId, cloneId: clone_id, action: "follow" });

  return c.json({ success: true });
});

follows.delete("/:cloneId", async (c) => {
  const userId = c.req.header("X-User-Id");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const cloneId = c.req.param("cloneId");

  await c.env.DB.prepare(
    "DELETE FROM follows WHERE user_id = ? AND clone_id = ?"
  )
    .bind(userId, cloneId)
    .run();

  await updateCloneStat(c.env.DB, cloneId, "total_followers", -1);
  await logActivity(c, { userId, cloneId, action: "unfollow" });

  return c.json({ success: true });
});
