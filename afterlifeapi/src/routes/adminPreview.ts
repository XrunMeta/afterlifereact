import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_a8614b, v_207c31 } from "../lib/ale";

export const v_d8985c = new v_b7c41b<v_de0a25>();

v_d8985c.use("*", async (v_3f4e2e, v_a448ad) => {
  if (v_3f4e2e.env.ENVIRONMENT !== "development") {
    return v_3f4e2e.json({ error: "not_found" }, 404);
  }
  await v_a448ad();
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

function v_8b9026(v_c9c489, v_1f5d19): number | null {
  if (!v_1f5d19) return null;
  try {
    const v_946ca6 = v_207c31(v_1f5d19, v_a8614b(v_c9c489.ALE_KEK), "user.age");
    const v_f4e98d = Number(v_946ca6);
    return Number.isFinite(v_f4e98d) ? v_f4e98d : null;
  } catch {
    return null;
  }
}

function v_f2d1a3(v_c9c489, v_3ac7e7) {
  const { age_enc: v_663cbb, ...v_83bbcd } = v_3ac7e7;
  return {
    ...v_83bbcd,
    age: v_3ac7e7.age ?? v_8b9026(v_c9c489, v_663cbb),
  };
}

v_d8985c.get("/oth-path", async (v_3f4e2e) => {
  const v_18b8bf = (
    await v_3f4e2e.env.DB.prepare(
      `SELECT id, name, email, gender, age, age_enc, credits,
              funnel_stage AS funnelStage, created_at AS createdAt
         FROM users
        ORDER BY id DESC
        LIMIT 200`,
    ).all<RawUserRow>()
  ).results;
  return v_3f4e2e.json(v_18b8bf.map((v_cb35cb) => v_f2d1a3(v_3f4e2e.env, v_cb35cb)));
});

v_d8985c.get("/oth-path", async (v_3f4e2e) => {
  const v_389afb = Number(v_3f4e2e.req.param("id"));
  const v_3ac7e7 = await v_3f4e2e.env.DB.prepare(
    `SELECT id, name, email, gender, age, age_enc, credits,
            funnel_stage AS funnelStage, created_at AS createdAt
       FROM users WHERE id = ?`,
  )
    .bind(v_389afb)
    .first<RawUserRow>();
  if (!v_3ac7e7) return v_3f4e2e.json({ error: "not_found" }, 404);
  return v_3f4e2e.json(v_f2d1a3(v_3f4e2e.env, v_3ac7e7));
});

v_d8985c.get("/oth-path", async (v_3f4e2e) => {
  const v_18b8bf = (
    await v_3f4e2e.env.DB.prepare(
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
  return v_3f4e2e.json(v_18b8bf);
});

v_d8985c.get("/oth-path", async (v_3f4e2e) => {
  const v_389afb = Number(v_3f4e2e.req.param("id"));
  const v_3ac7e7 = await v_3f4e2e.env.DB.prepare(
    `SELECT c.id, c.name, c.username, c.description,
            c.clone_type AS cloneType, c.visibility,
            c.training_status AS trainingStatus,
            c.owner_id AS ownerId, u.name AS ownerName,
            c.created_at AS createdAt
       FROM clones c
       LEFT JOIN users u ON u.id = c.owner_id
      WHERE c.id = ?`,
  )
    .bind(v_389afb)
    .first();
  if (!v_3ac7e7) return v_3f4e2e.json({ error: "not_found" }, 404);
  return v_3f4e2e.json(v_3ac7e7);
});

v_d8985c.get("/messages/:cloneId", async (v_3f4e2e) => {
  const v_6e0fd3 = Number(v_3f4e2e.req.param("cloneId"));
  const v_18b8bf = (
    await v_3f4e2e.env.DB.prepare(
      `SELECT id, clone_id AS cloneId, user_id AS userId,
              session_id AS sessionId, role, content, status,
              created_at AS createdAt
         FROM messages
        WHERE clone_id = ?
        ORDER BY id DESC
        LIMIT 100`,
    )
      .bind(v_6e0fd3)
      .all()
  ).results;
  return v_3f4e2e.json(v_18b8bf);
});

v_d8985c.get("/oth-path", (v_3f4e2e) => v_3f4e2e.json([]));

v_d8985c.get("/stats", async (v_3f4e2e) => {
  const v_ceb55a = await v_3f4e2e.env.DB.prepare(`SELECT COUNT(*) AS n FROM users`).first<{ n: number }>();
  const v_966588 = await v_3f4e2e.env.DB.prepare(`SELECT COUNT(*) AS n FROM clones`).first<{ n: number }>();
  const v_35f85c = await v_3f4e2e.env.DB.prepare(`SELECT COUNT(*) AS n FROM messages`).first<{ n: number }>();
  const v_e6f3e7 = await v_3f4e2e.env.DB.prepare(`SELECT COALESCE(SUM(credits),0) AS sum FROM users`).first<{
    sum: number;
  }>();
  return v_3f4e2e.json({
    users: v_ceb55a?.n ?? 0,
    clones: v_966588?.n ?? 0,
    messages: v_35f85c?.n ?? 0,
    totalCredits: v_e6f3e7?.sum ?? 0,
  });
});
