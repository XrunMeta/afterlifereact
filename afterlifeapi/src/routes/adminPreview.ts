import { Hono } from "hono";
import type { AppEnv } from "../lib/env";
import { getKekProvider, open } from "../lib/ale";

export const adminPreview = new Hono<AppEnv>();

adminPreview.use("*", async (c, next) => {
  if (c.env.ENVIRONMENT !== "development") {
    return c.json({ error: "not_found" }, 404);
  }
  await next();
});

type RawUserRow = {
  id: number;
  name: string | null;
  email: string;
  gender: string | null;
  age: number | null;
  age_enc: string | null;
  credits: number;
  funnelStage: string;
  createdAt: string;
};

function decryptAge(env: { ALE_KEK: string }, ageEnc: string | null): number | null {
  if (!ageEnc) return null;
  try {
    const plain = open(ageEnc, getKekProvider(env.ALE_KEK), "user.age");
    const n = Number(plain);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function projectUser(env: { ALE_KEK: string }, row: RawUserRow) {
  const { age_enc, ...rest } = row;
  return {
    ...rest,
    age: row.age ?? decryptAge(env, age_enc),
  };
}

adminPreview.get("/oth-path", async (c) => {
  const rows = (
    await c.env.DB.prepare(
      `SELECT id, name, email, gender, age, age_enc, credits,
              funnel_stage AS funnelStage, created_at AS createdAt
         FROM users
        ORDER BY id DESC
        LIMIT 200`,
    ).all<RawUserRow>()
  ).results;
  return c.json(rows.map((r) => projectUser(c.env, r)));
});

adminPreview.get("/oth-path", async (c) => {
  const id = Number(c.req.param("id"));
  const row = await c.env.DB.prepare(
    `SELECT id, name, email, gender, age, age_enc, credits,
            funnel_stage AS funnelStage, created_at AS createdAt
       FROM users WHERE id = ?`,
  )
    .bind(id)
    .first<RawUserRow>();
  if (!row) return c.json({ error: "not_found" }, 404);
  return c.json(projectUser(c.env, row));
});

adminPreview.get("/oth-path", async (c) => {
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

adminPreview.get("/oth-path", async (c) => {
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

adminPreview.get("/messages/:cloneId", async (c) => {
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

adminPreview.get("/oth-path", (c) => c.json([]));

adminPreview.get("/stats", async (c) => {
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
