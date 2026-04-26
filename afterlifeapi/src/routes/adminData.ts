

import { Hono } from "hono";
import type { AppEnv } from "../lib/env";
import { requireAdmin } from "../middleware/auth";

export const adminData = new Hono<AppEnv>();

adminData.use("*", requireAdmin);

adminData.get("/oth-path", async (c) => {
  const rows = (
    await c.env.DB.prepare(
      `SELECT id, name, email, gender, age, credits,
              funnel_stage AS funnelStage, created_at AS createdAt
         FROM users
        ORDER BY (id < 100000) DESC, id DESC
        LIMIT 200`,
    ).all()
  ).results;
  return c.json(rows);
});

adminData.get("/oth-path", async (c) => {
  const id = Number(c.req.param("id"));
  const row = await c.env.DB.prepare(
    `SELECT id, name, email, gender, age, credits,
            funnel_stage AS funnelStage, created_at AS createdAt
       FROM users WHERE id = ?`,
  )
    .bind(id)
    .first();
  if (!row) return c.json({ error: "not_found" }, 404);
  return c.json(row);
});

adminData.get("/oth-path", async (c) => {
  const rows = (
    await c.env.DB.prepare(
      `SELECT c.id, c.name, c.username,
              c.clone_type AS cloneType, c.visibility,
              c.training_status AS trainingStatus,
              c.owner_id AS ownerId, u.name AS ownerName,
              c.created_at AS createdAt
         FROM clones c
         LEFT JOIN users u ON u.id = c.owner_id
        ORDER BY c.id DESC
        LIMIT 200`,
    ).all()
  ).results;
  return c.json(rows);
});

adminData.get("/oth-path", async (c) => {
  const id = Number(c.req.param("id"));
  const row = await c.env.DB.prepare(
    `SELECT c.id, c.name, c.username, c.description,
            c.clone_type AS cloneType, c.visibility,
            c.training_status AS trainingStatus,
            c.owner_id AS ownerId, u.name AS ownerName,
            c.created_at AS createdAt
       FROM clones c
       LEFT JOIN users u ON u.id = c.owner_id
      WHERE c.id = ?`,
  )
    .bind(id)
    .first();
  if (!row) return c.json({ error: "not_found" }, 404);
  return c.json(row);
});

adminData.get("/oth-path", async (c) => {
  const id = Number(c.req.param("id"));
  const clone = await c.env.DB.prepare(
    `SELECT c.id, c.name, c.username, c.description,
            c.clone_type AS cloneType, c.visibility,
            c.training_status AS trainingStatus,
            c.owner_id AS ownerId, u.name AS ownerName,
            c.l1_profile AS l1Profile, c.l2_profile AS l2Profile,
            c.created_at AS createdAt
       FROM clones c
       LEFT JOIN users u ON u.id = c.owner_id
      WHERE c.id = ?`,
  )
    .bind(id)
    .first<Record<string, unknown>>();
  if (!clone) return c.json({ error: "not_found" }, 404);

  const shares = (
    await c.env.DB.prepare(
      `SELECT s.id, s.clone_id AS cloneId, s.owner_id AS ownerId,
              s.target_user_id AS targetUserId, s.invite_email AS inviteEmail,
              s.relation, s.role, s.status,
              u.name AS targetUserName,
              s.created_at AS createdAt
         FROM clone_shares s
         LEFT JOIN users u ON u.id = s.target_user_id
        WHERE s.clone_id = ?
        ORDER BY s.id ASC`,
    )
      .bind(id)
      .all()
  ).results;

  const followers = await c.env.DB.prepare(
    `SELECT COUNT(*) AS n FROM follows WHERE clone_id = ?`,
  )
    .bind(id)
    .first<{ n: number }>();

  const messages = await c.env.DB.prepare(
    `SELECT COUNT(*) AS n FROM messages WHERE clone_id = ?`,
  )
    .bind(id)
    .first<{ n: number }>();

  function tryParse(v: unknown) {
    if (typeof v !== "string") return v ?? null;
    try {
      return JSON.parse(v);
    } catch {
      return v;
    }
  }
  const l1 = tryParse(clone.l1Profile);
  const l2 = tryParse(clone.l2Profile);

  return c.json({
    clone: { ...clone, l1Profile: l1, l2Profile: l2 },
    shares,
    stats: {
      followers: followers?.n ?? 0,
      messages: messages?.n ?? 0,
    },
  });
});

adminData.get("/oth-path", async (c) => {
  const id = Number(c.req.param("id"));
  const clone = await c.env.DB.prepare(
    `SELECT c.id, c.name, c.clone_type AS cloneType,
            c.owner_id AS ownerId, u.name AS ownerName
       FROM clones c
       LEFT JOIN users u ON u.id = c.owner_id
      WHERE c.id = ?`,
  )
    .bind(id)
    .first<Record<string, unknown>>();
  if (!clone) return c.json({ error: "not_found" }, 404);

  const members = (
    await c.env.DB.prepare(
      `SELECT s.id, s.relation, s.role, s.status,
              s.target_user_id AS targetUserId,
              s.invite_email AS inviteEmail,
              u.name AS targetUserName
         FROM clone_shares s
         LEFT JOIN users u ON u.id = s.target_user_id
        WHERE s.clone_id = ?
        ORDER BY
          CASE s.relation
            WHEN 'mother' THEN 1
            WHEN 'father' THEN 2
            WHEN 'spouse' THEN 3
            WHEN 'sibling' THEN 4
            WHEN 'child'   THEN 5
            ELSE 9
          END, s.id ASC`,
    )
      .bind(id)
      .all()
  ).results;

  return c.json({
    clone,
    root: {
      userId: clone.ownerId,
      name: clone.ownerName,
      relation: "self",
      role: "owner",
      status: "accepted",
    },
    members,
  });
});

adminData.get("/messages/:cloneId", async (c) => {
  const cloneId = Number(c.req.param("cloneId"));
  const rows = (
    await c.env.DB.prepare(
      `SELECT id, clone_id AS cloneId, user_id AS userId,
              session_id AS sessionId, role, content, status,
              created_at AS createdAt
         FROM messages
        WHERE clone_id = ?
        ORDER BY id DESC
        LIMIT 100`,
    )
      .bind(cloneId)
      .all()
  ).results;
  return c.json(rows);
});

adminData.get("/oth-path", (c) => c.json([]));

adminData.get("/stats", async (c) => {
  const u = await c.env.DB.prepare(`SELECT COUNT(*) AS n FROM users`).first<{ n: number }>();
  const cl = await c.env.DB.prepare(`SELECT COUNT(*) AS n FROM clones`).first<{ n: number }>();
  const m = await c.env.DB.prepare(`SELECT COUNT(*) AS n FROM messages`).first<{ n: number }>();
  const cred = await c.env.DB.prepare(`SELECT COALESCE(SUM(credits),0) AS sum FROM users`).first<{
    sum: number;
  }>();
  return c.json({
    users: u?.n ?? 0,
    clones: cl?.n ?? 0,
    messages: m?.n ?? 0,
    totalCredits: cred?.sum ?? 0,
  });
});
