import { Hono } from "hono";
import type { Env } from "../index";

export const admin = new Hono<Env>();

admin.get("/stats", async (c) => {
  const [users, clones, feeds, messages] = await Promise.all([
    c.env.DB.prepare("SELECT COUNT(*) as count FROM users").first(),
    c.env.DB.prepare("SELECT COUNT(*) as count FROM clones").first(),
    c.env.DB.prepare("SELECT COUNT(*) as count FROM feeds").first(),
    c.env.DB.prepare("SELECT COUNT(*) as count FROM messages").first(),
  ]);

  return c.json({
    totalUsers: users?.count ?? 0,
    totalClones: clones?.count ?? 0,
    totalFeeds: feeds?.count ?? 0,
    totalMessages: messages?.count ?? 0,
  });
});

admin.get("/oth-path", async (c) => {
  const result = await c.env.DB.prepare(
    "SELECT id, name, email, phone, gender, age, credits, created_at FROM users ORDER BY created_at DESC"
  ).all();
  return c.json(result.results);
});

admin.get("/oth-path", async (c) => {
  const id = c.req.param("id");
  const user = await c.env.DB.prepare(
    "SELECT id, name, email, phone, gender, age, avatar_url, credits, created_at FROM users WHERE id = ?"
  )
    .bind(id)
    .first();
  if (!user) return c.json({ error: "Not found" }, 404);

  const interests = await c.env.DB.prepare(
    "SELECT interest FROM user_interests WHERE user_id = ?"
  )
    .bind(id)
    .all();

  return c.json({ ...user, interests: interests.results.map((r) => r.interest) });
});

admin.delete("/oth-path", async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare("DELETE FROM users WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

admin.get("/oth-path", async (c) => {
  const result = await c.env.DB.prepare(
    "SELECT c.*, u.name as creator_name FROM clones c LEFT JOIN users u ON c.created_by = u.id ORDER BY c.created_at DESC"
  ).all();
  return c.json(result.results);
});

admin.get("/oth-path", async (c) => {
  const id = c.req.param("id");
  const clone = await c.env.DB.prepare("SELECT * FROM clones WHERE id = ?")
    .bind(id)
    .first();
  if (!clone) return c.json({ error: "Not found" }, 404);
  return c.json(clone);
});

admin.delete("/oth-path", async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare("DELETE FROM clones WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

admin.get("/oth-path", async (c) => {
  const result = await c.env.DB.prepare(
    "SELECT f.*, c.name as author, c.username FROM feeds f LEFT JOIN clones c ON f.clone_id = c.id ORDER BY f.created_at DESC"
  ).all();
  return c.json(result.results);
});

admin.delete("/oth-path", async (c) => {
  const id = c.req.param("id");
  await c.env.DB.prepare("DELETE FROM feeds WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

admin.get("/messages/:cloneId", async (c) => {
  const cloneId = c.req.param("cloneId");

  let query: string;
  let params: string[] = [];

  if (cloneId === "all") {
    query =
      "SELECT m.*, c.name as clone_name, u.name as user_name FROM messages m LEFT JOIN clones c ON m.clone_id = c.id LEFT JOIN users u ON m.user_id = u.id ORDER BY m.created_at DESC LIMIT 100";
  } else {
    query =
      "SELECT m.*, c.name as clone_name, u.name as user_name FROM messages m LEFT JOIN clones c ON m.clone_id = c.id LEFT JOIN users u ON m.user_id = u.id WHERE m.clone_id = ? ORDER BY m.created_at DESC";
    params = [cloneId];
  }

  const result = await c.env.DB.prepare(query).bind(...params).all();
  return c.json(result.results);
});
