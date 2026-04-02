import { Hono } from "hono";
import type { Env } from "../index";

export const users = new Hono<Env>();

users.get("/me", async (c) => {
  const userId = c.req.header("X-User-Id");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const user = await c.env.DB.prepare(
    "SELECT id, name, email, phone, gender, age, avatar_url, credits, created_at FROM users WHERE id = ?"
  )
    .bind(userId)
    .first();

  if (!user) return c.json({ error: "User not found" }, 404);

  const interests = await c.env.DB.prepare(
    "SELECT interest FROM user_interests WHERE user_id = ?"
  )
    .bind(userId)
    .all();

  return c.json({
    ...user,
    interests: interests.results.map((r) => r.interest),
  });
});

users.put("/me", async (c) => {
  const userId = c.req.header("X-User-Id");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const body = await c.req.json();
  const { name, phone, gender, age, avatar_url } = body;

  await c.env.DB.prepare(
    "UPDATE users SET name = ?, phone = ?, gender = ?, age = ?, avatar_url = ? WHERE id = ?"
  )
    .bind(name, phone, gender, age, avatar_url, userId)
    .run();

  return c.json({ success: true });
});
