

import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_c0a297 } from "../middleware/auth";
import { v_137694, v_a8614b } from "../lib/ale";
import { v_e44d97 } from "../lib/kekProvider";

export const v_133c2c = new v_b7c41b<v_de0a25>();

v_133c2c.use("*", v_c0a297);

v_133c2c.get("/oth-path", async (v_3f4e2e) => {
  const v_2b6257 = (
    await v_3f4e2e.env.DB.prepare(
      `SELECT u.id, u.name, u.email, u.gender, u.age, u.age_enc, u.credits,
              u.funnel_stage      AS funnelStage,
              u.marketing_consent AS marketingConsent,
              u.xrun_member_id    AS xrunMemberId,
              u.xrun_guid         AS xrunGuid,
              u.xrun_wallet       AS xrunWallet,
              u.xrun_linked_at    AS xrunLinkedAt,
              u.created_at        AS createdAt,
              (SELECT GROUP_CONCAT(interest, ', ')
                 FROM user_interests WHERE user_id = u.id) AS interests
         FROM users u
        ORDER BY (u.id < 100000) DESC, u.id DESC
        LIMIT 200`,
    ).all<{ id: number; age: number | null; age_enc: string | null; [k: string]: unknown }>()
  ).results;

  const v_d205b7 = v_a8614b(v_3f4e2e.env.ALE_KEK);
  let v3Provider: Awaited<ReturnType<typeof v_e44d97>> | undefined;
  try {
    v_67b8fb = await v_e44d97(v_3f4e2e);
  } catch {
    v_67b8fb = undefined;
  }

  const v_db9be1 = v_3f4e2e.get("adminUserId");
  const v_18b8bf = await Promise.all(
    v_2b6257.map(async (v_3ac7e7) => {
      let v_2694bd = v_3ac7e7.age;
      if (v_3ac7e7.age_enc) {
        try {
          const v_eef514 = await v_137694(v_3ac7e7.age_enc, {
            db: v_3f4e2e.env.DB,
            hkdfContext: "user.age",
            legacyProvider: v_d205b7,
            v3Provider: v_67b8fb,
            actor: { type: "admin", id: v_db9be1 ?? "unknown" },
            auditSecret: v_3f4e2e.env.AUDIT_SECRET,
            lazyMigrateEnabled: false,
            hint: { key: "users.age_enc", resourceId: v_3ac7e7.id },
          });
          const v_f4e98d = Number(v_eef514);
          v_2694bd = Number.isFinite(v_f4e98d) ? v_f4e98d : null;
        } catch {

        }
      }
      const { age_enc: v_b36aa2, ...v_83bbcd } = v_3ac7e7;
      void v_b36aa2;
      return { ...v_83bbcd, age: v_2694bd };
    }),
  );
  return v_3f4e2e.json(v_18b8bf);
});

v_133c2c.get("/oth-path", async (v_3f4e2e) => {
  const v_389afb = Number(v_3f4e2e.req.param("id"));
  const v_3ac7e7 = await v_3f4e2e.env.DB.prepare(
    `SELECT id, name, email, gender, age, credits,
            funnel_stage AS funnelStage, created_at AS createdAt
       FROM users WHERE id = ?`,
  )
    .bind(v_389afb)
    .first();
  if (!v_3ac7e7) return v_3f4e2e.json({ error: "not_found" }, 404);
  return v_3f4e2e.json(v_3ac7e7);
});

v_133c2c.get("/oth-path", async (v_3f4e2e) => {
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

v_133c2c.get("/oth-path", async (v_3f4e2e) => {
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

v_133c2c.get("/oth-path", async (v_3f4e2e) => {
  const v_389afb = Number(v_3f4e2e.req.param("id"));
  const v_eb25ce = await v_3f4e2e.env.DB.prepare(
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
    .bind(v_389afb)
    .first<Record<string, unknown>>();
  if (!v_eb25ce) return v_3f4e2e.json({ error: "not_found" }, 404);

  const v_b99095 = (
    await v_3f4e2e.env.DB.prepare(
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
      .bind(v_389afb)
      .all()
  ).results;

  const v_823f08 = await v_3f4e2e.env.DB.prepare(
    `SELECT COUNT(*) AS n FROM follows WHERE clone_id = ?`,
  )
    .bind(v_389afb)
    .first<{ n: number }>();

  const v_fa56e0 = await v_3f4e2e.env.DB.prepare(
    `SELECT COUNT(*) AS n FROM messages WHERE clone_id = ?`,
  )
    .bind(v_389afb)
    .first<{ n: number }>();

  function v_051fd1(v_81e2ef) {
    if (typeof v_81e2ef !== "string") return v_81e2ef ?? null;
    try {
      return JSON.parse(v_81e2ef);
    } catch {
      return v_81e2ef;
    }
  }
  const v_020b4b = v_051fd1(v_eb25ce.l1Profile);
  const v_1af19b = v_051fd1(v_eb25ce.l2Profile);

  return v_3f4e2e.json({
    clone: { ...v_eb25ce, l1Profile: v_020b4b, l2Profile: v_1af19b },
    shares: v_b99095,
    stats: {
      followers: v_823f08?.n ?? 0,
      messages: v_fa56e0?.n ?? 0,
    },
  });
});

v_133c2c.get("/oth-path", async (v_3f4e2e) => {
  const v_389afb = Number(v_3f4e2e.req.param("id"));
  const v_eb25ce = await v_3f4e2e.env.DB.prepare(
    `SELECT c.id, c.name, c.clone_type AS cloneType,
            c.owner_id AS ownerId, u.name AS ownerName
       FROM clones c
       LEFT JOIN users u ON u.id = c.owner_id
      WHERE c.id = ?`,
  )
    .bind(v_389afb)
    .first<Record<string, unknown>>();
  if (!v_eb25ce) return v_3f4e2e.json({ error: "not_found" }, 404);

  const v_8673d6 = (
    await v_3f4e2e.env.DB.prepare(
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
      .bind(v_389afb)
      .all()
  ).results;

  return v_3f4e2e.json({
    clone: v_eb25ce,
    root: {
      userId: v_eb25ce.ownerId,
      name: v_eb25ce.ownerName,
      relation: "self",
      role: "owner",
      status: "accepted",
    },
    members: v_8673d6,
  });
});

v_133c2c.get("/messages/:cloneId", async (v_3f4e2e) => {
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

v_133c2c.get("/oth-path", (v_3f4e2e) => v_3f4e2e.json([]));

v_133c2c.get("/stats", async (v_3f4e2e) => {
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
