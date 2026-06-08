

import { Hono } from "hono";
import type { AppEnv } from "../lib/env";
import { requireAdmin } from "../middleware/auth";
import { openAny, getKekProvider } from "../lib/ale";
import { requestKekProvider } from "../lib/kekProvider";

export const adminData = new Hono<AppEnv>();

adminData.use("*", requireAdmin);

adminData.get("/oth-path", async (c) => {
  const rawRows = (
    await c.env.DB.prepare(
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

  const legacyProvider = getKekProvider(c.env.ALE_KEK);
  let v3Provider: Awaited<ReturnType<typeof requestKekProvider>> | undefined;
  try {
    v3Provider = await requestKekProvider(c);
  } catch {
    v3Provider = undefined;
  }

  const adminId = c.get("adminUserId");
  const rows = await Promise.all(
    rawRows.map(async (row) => {
      let age: number | null = row.age;
      if (row.age_enc) {
        try {
          const dec = await openAny(row.age_enc, {
            db: c.env.DB,
            hkdfContext: "user.age",
            legacyProvider,
            v3Provider,
            actor: { type: "admin", id: adminId ?? "unknown" },
            auditSecret: c.env.AUDIT_SECRET,
            lazyMigrateEnabled: false,
            hint: { key: "users.age_enc", resourceId: row.id },
          });
          const n = Number(dec);
          age = Number.isFinite(n) ? n : null;
        } catch {

        }
      }
      const { age_enc: _ignored, ...rest } = row;
      void _ignored;
      return { ...rest, age };
    }),
  );
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

  const url = new URL(c.req.url);
  const visibility = url.searchParams.get("visibility") ?? "";
  const deletionState = url.searchParams.get("deletionState") ?? "";
  const minReports = Number(url.searchParams.get("minReports") ?? 0);
  const q = (url.searchParams.get("q") ?? "").trim();
  const offset = Math.max(0, Number(url.searchParams.get("offset") ?? 0));
  const limit = Math.max(1, Math.min(200, Number(url.searchParams.get("limit") ?? 20)));

  const where: string[] = ["1=1"];
  const binds: unknown[] = [];

  if (visibility) {
    where.push("c.visibility = ?");
    binds.push(visibility);
  }
  if (deletionState) {
    where.push("c.deletion_state = ?");
    binds.push(deletionState);
  } else {

    where.push("c.deletion_state IN ('active', 'soft_deleted')");
  }
  if (q) {
    where.push(`(
      c.name LIKE ? OR c.username LIKE ? OR
      COALESCE(u.name,'') LIKE ? OR COALESCE(u.email,'') LIKE ?
    )`);
    const pat = `%${q}%`;
    binds.push(pat, pat, pat, pat);
  }

  if (minReports > 0) {
    where.push(`
      (SELECT COUNT(*) FROM clone_reports cr WHERE cr.clone_id = c.id AND cr.status = 'open') >= ?
    `);
    binds.push(minReports);
  }
  const whereSql = where.join(" AND ");

  const totalRow = await c.env.DB
    .prepare(
      `SELECT COUNT(*) AS cnt
         FROM clones c
         LEFT JOIN users u ON u.id = c.owner_id
        WHERE ${whereSql}`,
    )
    .bind(...binds)
    .first<{ cnt: number }>();

  const rows = (
    await c.env.DB.prepare(
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
                WHERE cr.clone_id = c.id AND cr.status = 'reviewed') AS reportCount,
              (SELECT COUNT(*) FROM feed_comments fcc
                 JOIN feeds f ON f.id = fcc.feed_id
                WHERE f.clone_id = c.id
                  AND fcc.id NOT IN (SELECT comment_id FROM comment_reports WHERE status IN ('reviewed','actioned'))
                  AND (fcc.parent_comment_id IS NULL OR fcc.parent_comment_id NOT IN (SELECT comment_id FROM comment_reports WHERE status IN ('reviewed','actioned')))) AS commentCount,
              (SELECT COUNT(*) FROM feed_likes fl
                 JOIN feeds f ON f.id = fl.feed_id
                WHERE f.clone_id = c.id) AS likeCount,
              (SELECT COUNT(*) FROM clone_follows cf
                WHERE cf.clone_id = c.id) AS followerCount,
              (SELECT COUNT(*) FROM user_clone_interactions uci
                WHERE uci.clone_id = c.id) AS interactionCount
         FROM clones c
         LEFT JOIN users u ON u.id = c.owner_id
        WHERE ${whereSql}
        ORDER BY c.id DESC
        LIMIT ? OFFSET ?`,
    )
      .bind(...binds, limit, offset)
      .all()
  ).results;

  return c.json({ items: rows, total: totalRow?.cnt ?? 0, offset, limit });
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

adminData.get("/otp-logs", async (c) => {
  const url = new URL(c.req.url);
  const email = (url.searchParams.get("email") ?? "").trim().toLowerCase();
  const limitRaw = Number(url.searchParams.get("limit") ?? 50);
  const limit = Math.max(1, Math.min(200, Number.isFinite(limitRaw) ? limitRaw : 50));

  const rows = email
    ? (
        await c.env.DB
          .prepare(
            `SELECT id, email, code, sent_at AS sentAt, expires_at AS expiresAt,
                    status, attempts, verified_at AS verifiedAt
               FROM otp_send_logs
              WHERE email = ?
              ORDER BY sent_at DESC
              LIMIT ?`,
          )
          .bind(email, limit)
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
        await c.env.DB
          .prepare(
            `SELECT id, email, code, sent_at AS sentAt, expires_at AS expiresAt,
                    status, attempts, verified_at AS verifiedAt
               FROM otp_send_logs
              ORDER BY sent_at DESC
              LIMIT ?`,
          )
          .bind(limit)
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

  return c.json({ items: rows });
});

adminData.get("/oth-path", async (c) => {
  const url = new URL(c.req.url);
  const limitRaw = Number(url.searchParams.get("limit") ?? 100);
  const limit = Math.max(1, Math.min(500, Number.isFinite(limitRaw) ? limitRaw : 100));
  const status = url.searchParams.get("status");

  const where: string[] = ["1=1"];
  const binds: unknown[] = [];
  if (status && ["open", "reviewed", "dismissed"].includes(status)) {
    where.push("r.status = ?");
    binds.push(status);
  }

  const rows = (
    await c.env.DB
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
          WHERE ${where.join(" AND ")}
          ORDER BY r.created_at DESC
          LIMIT ?`,
      )
      .bind(...binds, limit)
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
  return c.json({ items: rows });
});

adminData.get("/oth-path", async (c) => {
  const url = new URL(c.req.url);
  const limitRaw = Number(url.searchParams.get("limit") ?? 100);
  const limit = Math.max(1, Math.min(500, Number.isFinite(limitRaw) ? limitRaw : 100));
  const status = url.searchParams.get("status");

  const where: string[] = ["1=1"];
  const binds: unknown[] = [];
  if (status && ["open", "reviewed", "dismissed", "actioned"].includes(status)) {
    where.push("r.status = ?");
    binds.push(status);
  }

  const rows = (
    await c.env.DB
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
                r.admin_message AS adminMessage,
                r.created_at AS createdAt,
                r.reviewed_at AS reviewedAt
           FROM user_reports r
           JOIN users ru ON ru.id = r.reporter_id
           JOIN users tu ON tu.id = r.target_id
          WHERE ${where.join(" AND ")}
          ORDER BY r.created_at DESC
          LIMIT ?`,
      )
      .bind(...binds, limit)
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
        adminMessage: string | null;
        createdAt: string;
        reviewedAt: string | null;
      }>()
  ).results;
  return c.json({ items: rows });
});

adminData.get("/oth-path", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) return c.json({ error: "invalid_id" }, 400);

  const user = await c.env.DB
    .prepare(
      `SELECT id, name, email,
              deletion_state AS deletionState,
              suspended_until AS suspendedUntil,
              created_at AS createdAt
         FROM users WHERE id = ?`,
    )
    .bind(id)
    .first();
  if (!user) return c.json({ error: "not_found" }, 404);

  const wc = await c.env.DB
    .prepare(`SELECT COUNT(*) AS n FROM user_warnings WHERE user_id = ?`)
    .bind(id)
    .first<{ n: number }>();
  const warnings = (
    await c.env.DB
      .prepare(
        `SELECT id, reason, created_at AS createdAt
           FROM user_warnings WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`,
      )
      .bind(id)
      .all()
  ).results;
  const reports = (
    await c.env.DB
      .prepare(
        `SELECT r.id AS id, r.reason AS reason, r.status AS status,
                r.created_at AS createdAt, ru.email AS reporterEmail
           FROM user_reports r JOIN users ru ON ru.id = r.reporter_id
          WHERE r.target_id = ? ORDER BY r.created_at DESC LIMIT 50`,
      )
      .bind(id)
      .all()
  ).results;
  const clones = (
    await c.env.DB
      .prepare(
        `SELECT id, name, username, clone_type AS cloneType,
                deletion_state AS deletionState
           FROM clones WHERE owner_id = ? ORDER BY id DESC LIMIT 100`,
      )
      .bind(id)
      .all()
  ).results;

  return c.json({
    user: { ...user, warningCount: wc?.n ?? 0 },
    warnings,
    reports,
    clones,
  });
});

adminData.post("/oth-path", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) return c.json({ error: "invalid_id" }, 400);
  const adminId = c.get("adminUserId") ?? 0;

  let body: { reportId?: number; reason?: string } = {};
  try {
    body = (await c.req.json()) as { reportId?: number; reason?: string };
  } catch {

  }

  const u = await c.env.DB.prepare(`SELECT id FROM users WHERE id = ?`).bind(id).first();
  if (!u) return c.json({ error: "not_found" }, 404);

  await c.env.DB
    .prepare(
      `INSERT INTO user_warnings (user_id, admin_id, report_id, reason)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(id, adminId, body.reportId ?? null, body.reason ?? null)
    .run();

  const cnt = await c.env.DB
    .prepare(`SELECT COUNT(*) AS n FROM user_warnings WHERE user_id = ?`)
    .bind(id)
    .first<{ n: number }>();
  const warningCount = cnt?.n ?? 0;

  const rule = await c.env.DB
    .prepare(
      `SELECT action, suspend_days AS suspendDays FROM report_penalty_rules
        WHERE threshold <= ? ORDER BY threshold DESC LIMIT 1`,
    )
    .bind(warningCount)
    .first<{ action: string; suspendDays: number | null }>();

  let suspendedUntil: string | null = null;
  let suspended = false;
  if (rule?.action === "suspend" && rule.suspendDays && rule.suspendDays > 0) {
    suspended = true;
    await c.env.DB
      .prepare(`UPDATE users SET suspended_until = datetime('now', ?) WHERE id = ?`)
      .bind(`+${rule.suspendDays} days`, id)
      .run();
    const row = await c.env.DB
      .prepare(`SELECT suspended_until AS s FROM users WHERE id = ?`)
      .bind(id)
      .first<{ s: string | null }>();
    suspendedUntil = row?.s ?? null;
  }

  if (body.reportId) {

    await c.env.DB
      .prepare(
        `UPDATE user_reports SET status = 'actioned', reviewed_at = CURRENT_TIMESTAMP, admin_message = ?
          WHERE id = ?`,
      )
      .bind(body.reason ?? null, body.reportId)
      .run();
  }

  return c.json({
    ok: true,
    warningCount,
    suspended,
    suspendedUntil,
    appliedAction: rule?.action ?? "none",
    appliedSuspendDays: rule?.suspendDays ?? null,
  });
});

adminData.get("/report-penalty-rules", async (c) => {
  const rows = (
    await c.env.DB
      .prepare(
        `SELECT threshold, action, suspend_days AS suspendDays, updated_at AS updatedAt
           FROM report_penalty_rules ORDER BY threshold ASC`,
      )
      .all()
  ).results;
  return c.json({ items: rows });
});

adminData.put("/report-penalty-rules/:threshold", async (c) => {
  const threshold = Number(c.req.param("threshold"));
  if (!Number.isInteger(threshold) || threshold < 1 || threshold > 99) {
    return c.json({ error: "invalid_threshold" }, 400);
  }
  let body: { action?: string; suspendDays?: number | null } = {};
  try {
    body = (await c.req.json()) as { action?: string; suspendDays?: number | null };
  } catch {

  }
  const action = body.action === "suspend" ? "suspend" : "warn";
  const suspendDays =
    action === "suspend" && Number.isInteger(body.suspendDays) && (body.suspendDays as number) > 0
      ? (body.suspendDays as number)
      : null;
  if (action === "suspend" && !suspendDays) {
    return c.json({ error: "suspend_days_required" }, 400);
  }
  await c.env.DB
    .prepare(
      `INSERT INTO report_penalty_rules (threshold, action, suspend_days, updated_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(threshold) DO UPDATE SET
         action = excluded.action,
         suspend_days = excluded.suspend_days,
         updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(threshold, action, suspendDays)
    .run();
  return c.json({ ok: true, threshold, action, suspendDays });
});

adminData.delete("/report-penalty-rules/:threshold", async (c) => {
  const threshold = Number(c.req.param("threshold"));
  if (!Number.isInteger(threshold) || threshold < 1) {
    return c.json({ error: "invalid_threshold" }, 400);
  }
  const res = await c.env.DB
    .prepare(`DELETE FROM report_penalty_rules WHERE threshold = ?`)
    .bind(threshold)
    .run();
  return c.json({ ok: true, deleted: res.meta?.changes ?? 0 });
});

adminData.post("/oth-path", async (c) => {
  const reportId = Number(c.req.param("reportId"));
  if (!Number.isInteger(reportId) || reportId <= 0) return c.json({ error: "invalid_id" }, 400);
  let body: { message?: string } = {};
  try {
    body = (await c.req.json()) as { message?: string };
  } catch {

  }
  const res = await c.env.DB
    .prepare(
      `UPDATE user_reports SET status = 'dismissed', reviewed_at = CURRENT_TIMESTAMP, admin_message = ?
        WHERE id = ? AND status IN ('open', 'reviewed')`,
    )
    .bind(body.message ?? null, reportId)
    .run();
  return c.json({ ok: true, updated: res.meta?.changes ?? 0 });
});
