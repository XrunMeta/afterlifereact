import { Hono } from "hono";
import type { Env } from "../index";
import { logActivity, updateCloneStat } from "../lib/logger";

export const feeds = new Hono<Env>();

feeds.get("/", async (c) => {
  const category = c.req.query("category");

  let query =
    "SELECT f.*, c.name as author, c.username, c.avatar_url as author_avatar, c.type FROM feeds f JOIN clones c ON f.clone_id = c.id";
  const params: string[] = [];

  if (category) {
    query += " WHERE f.main_category = ?";
    params.push(category);
  }

  query += " ORDER BY f.created_at DESC";

  const result = await c.env.DB.prepare(query).bind(...params).all();
  return c.json(result.results);
});

feeds.post("/:id/view", async (c) => {
  const userId = c.req.header("X-User-Id");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const id = c.req.param("id");
  const feed = await c.env.DB.prepare("SELECT clone_id FROM feeds WHERE id = ?").bind(id).first();

  if (feed) {
    await logActivity(c, {
      userId,
      cloneId: feed.clone_id as string,
      action: "feed_view",
      metadata: { feed_id: id },
    });
  }

  return c.json({ success: true });
});

feeds.post("/:id/like", async (c) => {
  const userId = c.req.header("X-User-Id");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const id = c.req.param("id");
  await c.env.DB.prepare(
    "UPDATE feeds SET likes_count = likes_count + 1 WHERE id = ?"
  )
    .bind(id)
    .run();

  const feed = await c.env.DB.prepare("SELECT clone_id FROM feeds WHERE id = ?").bind(id).first();
  if (feed) {
    await updateCloneStat(c.env.DB, feed.clone_id as string, "total_likes");
    await logActivity(c, {
      userId,
      cloneId: feed.clone_id as string,
      action: "feed_like",
      metadata: { feed_id: id },
    });
  }

  return c.json({ success: true });
});
