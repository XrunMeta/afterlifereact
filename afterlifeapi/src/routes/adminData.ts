

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
              u.deletion_state    AS deletionState,
              u.soft_deleted_at   AS softDeletedAt,
              u.deleted_at        AS deletedAt,
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

  const v_f71b56 = new URL(v_3f4e2e.req.url);
  const v_818579 = v_f71b56.searchParams.get("visibility") ?? "";
  const v_9d030b = v_f71b56.searchParams.get("deletionState") ?? "";
  const v_e42ef7 = Number(v_f71b56.searchParams.get("minReports") ?? 0);
  const v_ab6401 = (v_f71b56.searchParams.get("q") ?? "").trim();
  const v_3bbadf = Math.max(0, Number(v_f71b56.searchParams.get("offset") ?? 0));
  const v_02be30 = Math.max(1, Math.min(200, Number(v_f71b56.searchParams.get("limit") ?? 20)));

  const v_abcc8d = ["1=1"];
  const v_925171 = [];

  if (v_818579) {
    v_abcc8d.push("c.visibility = ?");
    v_925171.push(v_818579);
  }
  if (v_9d030b) {
    v_abcc8d.push("c.deletion_state = ?");
    v_925171.push(v_9d030b);
  } else {

    v_abcc8d.push("c.deletion_state IN ('active', 'soft_deleted')");
  }
  if (v_ab6401) {
    v_abcc8d.push(`(
      c.name LIKE ? OR c.username LIKE ? OR
      COALESCE(u.name,'') LIKE ? OR COALESCE(u.email,'') LIKE ?
    )`);
    const v_07022a = `%${v_ab6401}%`;
    v_925171.push(v_07022a, v_07022a, v_07022a, v_07022a);
  }

  if (v_e42ef7 > 0) {
    v_abcc8d.push(`
      (SELECT COUNT(*) FROM clone_reports cr WHERE cr.clone_id = c.id AND cr.status = 'open') >= ?
    `);
    v_925171.push(v_e42ef7);
  }
  const v_8b4d7e = v_abcc8d.join(" AND ");

  const v_0dab8e = await v_3f4e2e.env.DB
    .prepare(
      `SELECT COUNT(*) AS cnt
         FROM clones c
         LEFT JOIN users u ON u.id = c.owner_id
        WHERE ${v_8b4d7e}`,
    )
    .bind(...v_925171)
    .first<{ cnt: number }>();

  const v_18b8bf = (
    await v_3f4e2e.env.DB.prepare(
      `SELECT c.id, c.name, c.username, c.avatar_url AS avatarUrl,
              c.clone_type AS cloneType, c.visibility,
              c.training_status AS trainingStatus,
              c.owner_id AS ownerId,
              u.name AS ownerName,
              u.xrun_member_id AS ownerXrunMemberId,
              c.created_at AS createdAt,
              c.deletion_state AS deletionState,
              c.soft_deleted_at AS softDeletedAt,
              c.deleted_at AS deletedAt,
              (SELECT COUNT(*) FROM clone_reports cr
                WHERE cr.clone_id = c.id AND cr.status = 'open') AS reportCount,
              (SELECT COUNT(*) FROM feed_comments fcc
                 JOIN feeds f ON f.id = fcc.feed_id
                WHERE f.clone_id = c.id) AS commentCount,
              (SELECT COUNT(*) FROM feed_likes fl
                 JOIN feeds f ON f.id = fl.feed_id
                WHERE f.clone_id = c.id) AS likeCount,
              (SELECT COUNT(*) FROM clone_follows cf
                WHERE cf.clone_id = c.id) AS followerCount,
              (SELECT COUNT(*) FROM user_clone_interactions uci
                WHERE uci.clone_id = c.id) AS interactionCount
         FROM clones c
         LEFT JOIN users u ON u.id = c.owner_id
        WHERE ${v_8b4d7e}
        ORDER BY c.id DESC
        LIMIT ? OFFSET ?`,
    )
      .bind(...v_925171, v_02be30, v_3bbadf)
      .all()
  ).results;

  return v_3f4e2e.json({ items: v_18b8bf, total: v_0dab8e?.cnt ?? 0, offset: v_3bbadf, limit: v_02be30 });
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

v_133c2c.get("/otp-logs", async (v_3f4e2e) => {
  const v_f71b56 = new URL(v_3f4e2e.req.url);
  const v_e0c7e8 = (v_f71b56.searchParams.get("email") ?? "").trim().toLowerCase();
  const v_cf2260 = Number(v_f71b56.searchParams.get("limit") ?? 50);
  const v_02be30 = Math.max(1, Math.min(200, Number.isFinite(v_cf2260) ? v_cf2260 : 50));

  const v_18b8bf = v_e0c7e8
    ? (
        await v_3f4e2e.env.DB
          .prepare(
            `SELECT id, email, code, sent_at AS sentAt, expires_at AS expiresAt,
                    status, attempts, verified_at AS verifiedAt
               FROM otp_send_logs
              WHERE email = ?
              ORDER BY sent_at DESC
              LIMIT ?`,
          )
          .bind(v_e0c7e8, v_02be30)
          .all<{
            id: number;
            email: string;
            code: string;
            sentAt: string;
            expiresAt: string;
            status: string;
            attempts: number;
            verifiedAt: string | null;
          }>()
      ).results
    : (
        await v_3f4e2e.env.DB
          .prepare(
            `SELECT id, email, code, sent_at AS sentAt, expires_at AS expiresAt,
                    status, attempts, verified_at AS verifiedAt
               FROM otp_send_logs
              ORDER BY sent_at DESC
              LIMIT ?`,
          )
          .bind(v_02be30)
          .all<{
            id: number;
            email: string;
            code: string;
            sentAt: string;
            expiresAt: string;
            status: string;
            attempts: number;
            verifiedAt: string | null;
          }>()
      ).results;

  return v_3f4e2e.json({ items: v_18b8bf });
});

v_133c2c.get("/oth-path", async (v_3f4e2e) => {
  const v_f71b56 = new URL(v_3f4e2e.req.url);
  const v_cf2260 = Number(v_f71b56.searchParams.get("limit") ?? 100);
  const v_02be30 = Math.max(1, Math.min(500, Number.isFinite(v_cf2260) ? v_cf2260 : 100));
  const v_d308b5 = v_f71b56.searchParams.get("status");

  const v_abcc8d = ["1=1"];
  const v_925171 = [];
  if (v_d308b5 && ["open", "reviewed", "dismissed"].includes(v_d308b5)) {
    v_abcc8d.push("r.status = ?");
    v_925171.push(v_d308b5);
  }

  const v_18b8bf = (
    await v_3f4e2e.env.DB
      .prepare(
        `SELECT r.id AS id,
                r.user_id AS userId,
                u.name AS userName,
                u.email AS userEmail,
                r.clone_id AS cloneId,
                c.name AS cloneName,
                c.username AS cloneUsername,
                c.owner_id AS cloneOwnerId,
                co.name AS cloneOwnerName,
                co.email AS cloneOwnerEmail,
                r.reason AS reason,
                r.status AS status,
                r.created_at AS createdAt,
                r.reviewed_at AS reviewedAt
           FROM clone_reports r
           JOIN users u ON u.id = r.user_id
           JOIN clones c ON c.id = r.clone_id
           LEFT JOIN users co ON co.id = c.owner_id
          WHERE ${v_abcc8d.join(" AND ")}
          ORDER BY r.created_at DESC
          LIMIT ?`,
      )
      .bind(...v_925171, v_02be30)
      .all<{
        id: number;
        userId: number;
        userName: string | null;
        userEmail: string;
        cloneId: number;
        cloneName: string;
        cloneUsername: string;
        cloneOwnerId: number;
        cloneOwnerName: string | null;
        cloneOwnerEmail: string | null;
        reason: string | null;
        status: string;
        createdAt: string;
        reviewedAt: string | null;
      }>()
  ).results;
  return v_3f4e2e.json({ items: v_18b8bf });
});

v_133c2c.get("/oth-path", async (v_3f4e2e) => {
  const v_f71b56 = new URL(v_3f4e2e.req.url);
  const v_cf2260 = Number(v_f71b56.searchParams.get("limit") ?? 100);
  const v_02be30 = Math.max(1, Math.min(500, Number.isFinite(v_cf2260) ? v_cf2260 : 100));
  const v_d308b5 = v_f71b56.searchParams.get("status");

  const v_abcc8d = ["1=1"];
  const v_925171 = [];
  if (v_d308b5 && ["open", "reviewed", "dismissed", "actioned"].includes(v_d308b5)) {
    v_abcc8d.push("r.status = ?");
    v_925171.push(v_d308b5);
  }

  const v_18b8bf = (
    await v_3f4e2e.env.DB
      .prepare(
        `SELECT r.id AS id,
                r.reporter_id AS reporterId,
                ru.name AS reporterName,
                ru.email AS reporterEmail,
                r.target_id AS targetId,
                tu.name AS targetName,
                tu.email AS targetEmail,
                r.reason AS reason,
                r.status AS status,
                r.created_at AS createdAt,
                r.reviewed_at AS reviewedAt
           FROM user_reports r
           JOIN users ru ON ru.id = r.reporter_id
           JOIN users tu ON tu.id = r.target_id
          WHERE ${v_abcc8d.join(" AND ")}
          ORDER BY r.created_at DESC
          LIMIT ?`,
      )
      .bind(...v_925171, v_02be30)
      .all<{
        id: number;
        reporterId: number;
        reporterName: string | null;
        reporterEmail: string;
        targetId: number;
        targetName: string | null;
        targetEmail: string;
        reason: string | null;
        status: string;
        createdAt: string;
        reviewedAt: string | null;
      }>()
  ).results;
  return v_3f4e2e.json({ items: v_18b8bf });
});

v_133c2c.get("/oth-path", async (v_3f4e2e) => {
  const v_389afb = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_389afb) || v_389afb <= 0) return v_3f4e2e.json({ error: "invalid_id" }, 400);

  const v_625c74 = await v_3f4e2e.env.DB
    .prepare(
      `SELECT id, name, email,
              deletion_state AS deletionState,
              suspended_until AS suspendedUntil,
              created_at AS createdAt
         FROM users WHERE id = ?`,
    )
    .bind(v_389afb)
    .first();
  if (!v_625c74) return v_3f4e2e.json({ error: "not_found" }, 404);

  const v_8718c0 = await v_3f4e2e.env.DB
    .prepare(`SELECT COUNT(*) AS n FROM user_warnings WHERE user_id = ?`)
    .bind(v_389afb)
    .first<{ n: number }>();
  const v_d01889 = (
    await v_3f4e2e.env.DB
      .prepare(
        `SELECT id, reason, created_at AS createdAt
           FROM user_warnings WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`,
      )
      .bind(v_389afb)
      .all()
  ).results;
  const v_7baad1 = (
    await v_3f4e2e.env.DB
      .prepare(
        `SELECT r.id AS id, r.reason AS reason, r.status AS status,
                r.created_at AS createdAt, ru.email AS reporterEmail
           FROM user_reports r JOIN users ru ON ru.id = r.reporter_id
          WHERE r.target_id = ? ORDER BY r.created_at DESC LIMIT 50`,
      )
      .bind(v_389afb)
      .all()
  ).results;
  const v_f891e6 = (
    await v_3f4e2e.env.DB
      .prepare(
        `SELECT id, name, username, clone_type AS cloneType,
                deletion_state AS deletionState
           FROM clones WHERE owner_id = ? ORDER BY id DESC LIMIT 100`,
      )
      .bind(v_389afb)
      .all()
  ).results;

  return v_3f4e2e.json({
    user: { ...v_625c74, warningCount: v_8718c0?.n ?? 0 },
    warnings: v_d01889,
    reports: v_7baad1,
    clones: v_f891e6,
  });
});

v_133c2c.post("/oth-path", async (v_3f4e2e) => {
  const v_389afb = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_389afb) || v_389afb <= 0) return v_3f4e2e.json({ error: "invalid_id" }, 400);
  const v_db9be1 = v_3f4e2e.get("adminUserId") ?? 0;

  let v_4d33b2 = {};
  try {
    v_4d33b2 = (await v_3f4e2e.req.json()) as { reportId?: number; reason?: string };
  } catch {

  }

  const v_ceb55a = await v_3f4e2e.env.DB.prepare(`SELECT id FROM users WHERE id = ?`).bind(v_389afb).first();
  if (!v_ceb55a) return v_3f4e2e.json({ error: "not_found" }, 404);

  await v_3f4e2e.env.DB
    .prepare(
      `INSERT INTO user_warnings (user_id, admin_id, report_id, reason)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(v_389afb, v_db9be1, v_4d33b2.reportId ?? null, v_4d33b2.reason ?? null)
    .run();

  const v_7b3f91 = await v_3f4e2e.env.DB
    .prepare(`SELECT COUNT(*) AS n FROM user_warnings WHERE user_id = ?`)
    .bind(v_389afb)
    .first<{ n: number }>();
  const v_e87618 = v_7b3f91?.n ?? 0;

  let v_3e0055 = null;
  const v_7f572b = v_e87618 >= 3;
  if (v_7f572b) {

    await v_3f4e2e.env.DB
      .prepare(`UPDATE users SET suspended_until = datetime('now', '+30 days') WHERE id = ?`)
      .bind(v_389afb)
      .run();
    const v_3ac7e7 = await v_3f4e2e.env.DB
      .prepare(`SELECT suspended_until AS s FROM users WHERE id = ?`)
      .bind(v_389afb)
      .first<{ s: string | null }>();
    v_3e0055 = v_3ac7e7?.s ?? null;
  }

  if (v_4d33b2.reportId) {
    await v_3f4e2e.env.DB
      .prepare(
        `UPDATE user_reports SET status = 'actioned', reviewed_at = CURRENT_TIMESTAMP
          WHERE id = ?`,
      )
      .bind(v_4d33b2.reportId)
      .run();
  }

  return v_3f4e2e.json({ ok: true, warningCount: v_e87618, suspended: v_7f572b, suspendedUntil: v_3e0055 });
});

v_133c2c.post("/oth-path", async (v_3f4e2e) => {
  const v_99000e = Number(v_3f4e2e.req.param("reportId"));
  if (!Number.isInteger(v_99000e) || v_99000e <= 0) return v_3f4e2e.json({ error: "invalid_id" }, 400);
  const v_8f00b9 = await v_3f4e2e.env.DB
    .prepare(
      `UPDATE user_reports SET status = 'dismissed', reviewed_at = CURRENT_TIMESTAMP
        WHERE id = ? AND status IN ('open', 'reviewed')`,
    )
    .bind(v_99000e)
    .run();
  return v_3f4e2e.json({ ok: true, updated: v_8f00b9.meta?.changes ?? 0 });
});
