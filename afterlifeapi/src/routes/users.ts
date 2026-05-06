import { Hono } from "hono";
import type { AppEnv } from "../lib/env";
import { requireAuth } from "../middleware/auth";
import { APIError } from "../lib/errors";
import { parseJson, z } from "../lib/validate";
import { openAny, seal, getKekProvider, extractDekId, shredV3 } from "../lib/ale";
import { requestKekProvider } from "../lib/kekProvider";
import { logActivity } from "../lib/logger";

export const users = new Hono<AppEnv>();

users.get("/health", (c) => c.json({ ok: true, module: "users" }));

interface UserRow {
  id: number;
  name: string | null;
  email: string;
  avatar_url: string | null;
  credits: number;
  funnel_stage: string;
  phone: string | null;
  gender: string | null;
  age: number | null;
  age_enc: string | null;
  created_at: string;
  xrun_member_id: number | null;
  xrun_guid: string | null;
  xrun_wallet: string | null;
  xrun_linked_at: string | null;
}

async function loadMe(c: Parameters<typeof requireAuth>[0]): Promise<never> {
  throw new Error("unused");
}
void loadMe;

users.get("/search", requireAuth, async (c) => {
  const me = c.get("userId")!;
  const q = (c.req.query("q") ?? "").trim();
  if (q.length < 2) {
    return c.json({ items: [] });
  }
  const like = `%${q}%`;
  const rows = await c.env.DB
    .prepare(
      `SELECT id, name, email, avatar_url AS avatarUrl
         FROM users
        WHERE deleted_at IS NULL
          AND id != ?
          AND (LOWER(email) LIKE LOWER(?) OR name LIKE ?)
        ORDER BY id DESC
        LIMIT 20`,
    )
    .bind(me, like, like)
    .all<{ id: number; name: string | null; email: string; avatarUrl: string | null }>();
  return c.json({ items: rows.results ?? [] });
});

users.get("/me", requireAuth, async (c) => {
  const userId = c.get("userId")!;
  const db = c.env.DB;
  const row = await db
    .prepare(
      `SELECT id, name, email, avatar_url, credits, funnel_stage, phone, gender, age, age_enc, created_at,
              xrun_member_id, xrun_guid, xrun_wallet, xrun_linked_at
         FROM users WHERE id = ? AND deleted_at IS NULL`,
    )
    .bind(userId)
    .first<UserRow>();
  if (!row) throw new APIError("NOT_FOUND", "User not found.");

  const interests = await db
    .prepare(`SELECT interest FROM user_interests WHERE user_id = ? ORDER BY id`)
    .bind(userId)
    .all<{ interest: string }>();

  const legacyProvider = getKekProvider(c.env.ALE_KEK);

  let v3Provider: Awaited<ReturnType<typeof requestKekProvider>> | undefined;
  try {
    v3Provider = await requestKekProvider(c);
  } catch (err) {
    console.error(
      `[KEK_V3_UNAVAILABLE] reqId=${c.get("requestId")} err=${(err as Error).message}`,
    );
    v3Provider = undefined;
  }

  let phone: string | null = null;
  if (row.phone) {
    try {
      phone = await openAny(row.phone, {
        db: c.env.DB,
        hkdfContext: "user.phone",
        legacyProvider,
        v3Provider,
        actor: { type: "user", id: userId },
        auditSecret: c.env.AUDIT_SECRET,
        lazyMigrateEnabled: c.env.LAZY_V2_MIGRATE_ENABLED === "1",
        hint: { key: "users.phone", resourceId: userId },
      });
    } catch (err) {
      phone = null;
      console.error(
        `[ALE_DECRYPT_FAIL] user_id=${userId} context=user.phone reqId=${c.get("requestId")} err=${(err as Error).message}`,
      );
    }
  }

  let age: number | null = row.age;
  if (row.age_enc) {
    try {
      const dec = await openAny(row.age_enc, {
        db: c.env.DB,
        hkdfContext: "user.age",
        legacyProvider,
        v3Provider,
        actor: { type: "user", id: userId },
        auditSecret: c.env.AUDIT_SECRET,
        lazyMigrateEnabled: c.env.LAZY_V2_MIGRATE_ENABLED === "1",
        hint: { key: "users.age_enc", resourceId: userId },
      });
      const n = Number(dec);
      age = Number.isFinite(n) ? n : null;
    } catch (err) {
      console.error(
        `[ALE_DECRYPT_FAIL] user_id=${userId} context=user.age reqId=${c.get("requestId")} err=${(err as Error).message}`,
      );
    }
  }

  return c.json({
    user: {
      id: row.id,
      name: row.name,
      email: row.email,
      avatarUrl: row.avatar_url,
      credits: row.credits,
      funnelStage: row.funnel_stage,
      phone,
      gender: row.gender,
      age,
      createdAt: row.created_at,
      xrunMemberId: row.xrun_member_id,
      xrunGuid: row.xrun_guid,
      xrunWallet: row.xrun_wallet,
      xrunLinkedAt: row.xrun_linked_at,
    },
    interests: (interests.results ?? []).map((r) => r.interest),
  });
});

const patchSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  avatarUrl: z.url().max(500).nullable().optional(),
  phone: z.string().min(4).max(40).nullable().optional(),
  gender: z.enum(["male", "female", "other"]).nullable().optional(),
  age: z.number().int().min(13).max(120).nullable().optional(),
});

users.patch("/me", requireAuth, async (c) => {
  const userId = c.get("userId")!;
  const body = await parseJson(c, patchSchema);

  const updates: string[] = [];
  const binds: unknown[] = [];
  const updatedFields: string[] = [];

  if (body.name !== undefined) {
    updates.push("name = ?");
    binds.push(body.name);
    updatedFields.push("name");
  }
  if (body.avatarUrl !== undefined) {
    updates.push("avatar_url = ?");
    binds.push(body.avatarUrl);
    updatedFields.push("avatarUrl");
  }
  if (body.phone !== undefined) {
    updates.push("phone = ?");
    binds.push(
      body.phone ? seal(body.phone, getKekProvider(c.env.ALE_KEK), "user.phone") : null,
    );
    updatedFields.push("phone");
  }
  if (body.gender !== undefined) {
    updates.push("gender = ?");
    binds.push(body.gender);
    updatedFields.push("gender");
  }
  if (body.age !== undefined) {
    updates.push("age_enc = ?, age = ?");
    binds.push(
      body.age !== null
        ? seal(String(body.age), getKekProvider(c.env.ALE_KEK), "user.age")
        : null,
      null, 
    );
    updatedFields.push("age");
  }

  if (updates.length === 0) return c.json({ ok: true, updatedFields: [] });

  updates.push("updated_at = CURRENT_TIMESTAMP");
  binds.push(userId);

  await c.env.DB
    .prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`)
    .bind(...binds)
    .run();

  await logActivity(c, { userId, action: "user.patch_me", details: { fields: updatedFields } });
  return c.json({ ok: true, updatedFields });
});

users.post("/me/interests", requireAuth, async (c) => {
  const userId = c.get("userId")!;
  const schema = z.object({
    add: z.array(z.string().min(1).max(40)).max(20).optional(),
    remove: z.array(z.string().min(1).max(40)).max(20).optional(),
  });
  const body = await parseJson(c, schema);
  const db = c.env.DB;

  const stmts: D1PreparedStatement[] = [];
  for (const it of body.add ?? []) {
    stmts.push(
      db.prepare(`INSERT OR IGNORE INTO user_interests (user_id, interest) VALUES (?, ?)`).bind(userId, it),
    );
  }
  for (const it of body.remove ?? []) {
    stmts.push(
      db.prepare(`DELETE FROM user_interests WHERE user_id = ? AND interest = ?`).bind(userId, it),
    );
  }
  if (stmts.length) await db.batch(stmts);
  return c.json({ ok: true });
});

users.get("/me/devices", requireAuth, async (c) => {
  const userId = c.get("userId")!;
  const rows = await c.env.DB
    .prepare(
      `SELECT id, device_id AS deviceId, platform, last_active_at AS lastActiveAt, is_active AS isActive
         FROM user_devices WHERE user_id = ? ORDER BY last_active_at DESC`,
    )
    .bind(userId)
    .all();
  return c.json({ devices: rows.results ?? [] });
});

users.get("/me/invites", requireAuth, async (c) => {
  const userId = c.get("userId")!;
  const rows = await c.env.DB
    .prepare(
      `SELECT
          i.id, i.invite_email AS inviteEmail, i.relation, i.grant_owner AS grantOwner,
          i.expires_at AS expiresAt, i.used_at AS usedAt, i.cancelled_at AS cancelledAt,
          i.created_at AS createdAt,
          c.id AS cloneId, c.name AS cloneName, c.username AS cloneUsername,
          c.avatar_url AS cloneAvatarUrl, c.clone_type AS cloneType
         FROM invite_tokens i
         JOIN clones c ON c.id = i.clone_id
        WHERE i.owner_id = ? AND c.deleted_at IS NULL
        ORDER BY i.id DESC
        LIMIT 200`,
    )
    .bind(userId)
    .all<{
      id: number;
      inviteEmail: string | null;
      relation: string | null;
      grantOwner: number;
      expiresAt: string;
      usedAt: string | null;
      cancelledAt: string | null;
      createdAt: string;
      cloneId: number;
      cloneName: string;
      cloneUsername: string;
      cloneAvatarUrl: string | null;
      cloneType: string;
    }>();

  const now = Date.now();
  const items = (rows.results ?? []).map((r) => {
    let status: "pending" | "accepted" | "cancelled" | "expired";
    if (r.usedAt) status = "accepted";
    else if (r.cancelledAt) status = "cancelled";
    else {
      const exp = new Date(r.expiresAt.replace(" ", "T") + "Z").getTime();
      status = exp < now ? "expired" : "pending";
    }
    return {
      id: r.id,
      inviteEmail: r.inviteEmail,
      relation: r.relation,
      grantOwner: r.grantOwner === 1,
      expiresAt: r.expiresAt,
      usedAt: r.usedAt,
      cancelledAt: r.cancelledAt,
      createdAt: r.createdAt,
      status,
      clone: {
        id: r.cloneId,
        name: r.cloneName,
        username: r.cloneUsername,
        avatarUrl: r.cloneAvatarUrl,
        cloneType: r.cloneType,
      },
    };
  });
  return c.json({ items });
});

users.post("/me/devices", requireAuth, async (c) => {
  const userId = c.get("userId")!;
  const body = await c.req.json().catch(() => ({})) as {
    deviceId?: string;
    pushToken?: string;
    platform?: "ios" | "android" | "web";
  };
  if (!body.deviceId || !body.pushToken || !body.platform) {
    throw new APIError("VALIDATION_FAILED", "deviceId, pushToken, platform required.");
  }
  await c.env.DB
    .prepare(
      `INSERT INTO user_devices (user_id, device_id, push_token, platform, is_active, last_active_at)
       VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id, device_id) DO UPDATE SET
         push_token = excluded.push_token,
         platform   = excluded.platform,
         is_active  = 1,
         last_active_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(userId, body.deviceId, body.pushToken, body.platform)
    .run();
  return c.json({ ok: true });
});

users.get("/me/clones", requireAuth, async (c) => {
  const userId = c.get("userId")!;
  const rows = await c.env.DB
    .prepare(
      `SELECT
          c.id,
          c.name,
          c.username,
          c.description,
          c.clone_type     AS cloneType,
          c.category,
          c.visibility,
          c.avatar_url     AS avatarUrl,
          c.cover_image_url AS coverImageUrl,
          c.training_status AS trainingStatus,
          c.owner_id       AS ownerId,
          c.created_at     AS createdAt,
          c.l1_profile     AS l1ProfileJson,
          (CASE WHEN c.owner_id = ? THEN 'owner' ELSE 'coowner' END) AS myRole,
          (SELECT COUNT(*) FROM clone_shares s
            WHERE s.clone_id = c.id AND s.status = 'accepted') AS coownerCount,
          (SELECT COALESCE(SUM(f.likes_count), 0) FROM feeds f
            WHERE f.clone_id = c.id) AS likesCount,
          (SELECT COUNT(*) FROM feed_comments fc
             JOIN feeds f2 ON f2.id = fc.feed_id
             WHERE f2.clone_id = c.id) AS commentsCount,
          COALESCE(cs.followers_count, 0) AS followersCount,
          COALESCE(cs.messages_count, 0) AS messagesCount
         FROM clones c
         LEFT JOIN clone_stats cs ON cs.clone_id = c.id
        WHERE c.deletion_state = 'active'
          AND c.deleted_at IS NULL
          AND (
            c.owner_id = ?
            OR c.id IN (
              SELECT s.clone_id FROM clone_shares s
              WHERE s.target_user_id = ? AND s.status = 'accepted'
            )
          )
        ORDER BY c.id DESC
        LIMIT 200`,
    )
    .bind(userId, userId, userId)
    .all();

  const cloneIds = (rows.results ?? []).map((r) => (r as { id: number }).id);
  const interestsByCloneId = new Map<number, string[]>();
  if (cloneIds.length > 0) {
    const placeholders = cloneIds.map(() => "?").join(",");
    const interestRows = (
      await c.env.DB
        .prepare(
          `SELECT clone_id, interest FROM clone_interests
            WHERE clone_id IN (${placeholders})`,
        )
        .bind(...cloneIds)
        .all<{ clone_id: number; interest: string }>()
    ).results ?? [];
    for (const ir of interestRows) {
      const arr = interestsByCloneId.get(ir.clone_id) ?? [];
      arr.push(ir.interest);
      interestsByCloneId.set(ir.clone_id, arr);
    }
  }

  const items = (rows.results ?? []).map((r) => {
    const row = r as Record<string, unknown> & { id: number; l1ProfileJson?: string | null };
    let l1Profile: { attrs: Record<string, string>; notes: string } | null = null;
    if (row.l1ProfileJson) {
      try {
        const parsed = JSON.parse(row.l1ProfileJson) as { attrs?: Record<string, string>; notes?: string };
        l1Profile = { attrs: parsed.attrs ?? {}, notes: parsed.notes ?? "" };
      } catch {

      }
    }
    const { l1ProfileJson: _drop, ...rest } = row;
    void _drop;
    return {
      ...rest,
      l1Profile,
      interests: interestsByCloneId.get(row.id) ?? [],
    };
  });
  return c.json({ items });
});

users.post("/me/delete", requireAuth, async (c) => {
  const userId = c.get("userId")!;
  const db = c.env.DB;
  const res = await db
    .prepare(
      `UPDATE users
          SET deletion_state = 'soft_deleted',
              soft_deleted_at = CURRENT_TIMESTAMP,
              deleted_at = CURRENT_TIMESTAMP
        WHERE id = ? AND deletion_state = 'active'`,
    )
    .bind(userId)
    .run();
  if ((res.meta?.changes ?? 0) === 0) {
    throw new APIError("CONFLICT", "Account is not in active state.");
  }
  await logActivity(c, { userId, action: "user.soft_delete" });
  return c.json({ ok: true, state: "soft_deleted", restorableUntil: "+90d" });
});

users.post("/me/restore", requireAuth, async (c) => {
  const userId = c.get("userId")!;
  const db = c.env.DB;
  const res = await db
    .prepare(
      `UPDATE users
          SET deletion_state = 'active',
              soft_deleted_at = NULL,
              deleted_at = NULL
        WHERE id = ? AND deletion_state = 'soft_deleted'
          AND soft_deleted_at > datetime('now', '-90 days')`,
    )
    .bind(userId)
    .run();
  if ((res.meta?.changes ?? 0) === 0) {
    throw new APIError("CONFLICT", "Restoration window expired or account not soft-deleted.");
  }
  await logActivity(c, { userId, action: "user.restore" });
  return c.json({ ok: true, state: "active" });
});

users.post("/me/delete/gdpr", requireAuth, async (c) => {
  const userId = c.get("userId")!;
  const db = c.env.DB;

  const body = (await c.req.json().catch(() => ({}))) as { withXrun?: boolean };
  const withXrun = body?.withXrun === true;

  let xrunClose: { attempted: boolean; closed: boolean; reason?: string } = {
    attempted: false,
    closed: false,
  };

  if (withXrun) {
    const linkRow = await db
      .prepare(`SELECT xrun_member_id FROM users WHERE id = ?`)
      .bind(userId)
      .first<{ xrun_member_id: number | null }>();
    const xrunMember = linkRow?.xrun_member_id ?? null;
    if (xrunMember) {
      const { closeXrunMember } = await import("../lib/xrun");
      const res = await closeXrunMember(c.env, xrunMember);
      xrunClose = { attempted: true, closed: res.closed, reason: res.reason };

    } else {
      xrunClose = { attempted: true, closed: false, reason: "no xrun member linked" };
    }
  }

  const dekIds: string[] = [];
  const userRow = await db
    .prepare(`SELECT phone, age_enc FROM users WHERE id = ?`)
    .bind(userId)
    .first<{ phone: string | null; age_enc: string | null }>();
  for (const blob of [userRow?.phone, userRow?.age_enc]) {
    if (blob) {
      const id = extractDekId(blob);
      if (id) dekIds.push(id);
    }
  }

  const msgRows = (
    await db
      .prepare(
        `SELECT id, content FROM messages
          WHERE content IS NOT NULL
            AND (user_id = ?
                 OR clone_id IN (SELECT id FROM clones WHERE owner_id = ?))`,
      )
      .bind(userId, userId)
      .all<{ id: number; content: string | null }>()
  ).results;
  for (const r of msgRows) {
    if (r.content) {
      const id = extractDekId(r.content);
      if (id) dekIds.push(id);
    }
  }

  for (const id of dekIds) {
    await shredV3(db, id);
  }

  await db
    .prepare(
      `UPDATE users
          SET phone = NULL,
              age_enc = NULL,
              age = NULL,
              name = '',
              email = 'deletedmember' || CAST(id AS TEXT),
              gender = NULL,
              avatar_url = NULL,
              funnel_stage = 'deleted',
              marketing_consent = 0
        WHERE id = ?`,
    )
    .bind(userId)
    .run();

  await db
    .prepare(`DELETE FROM user_interests WHERE user_id = ?`)
    .bind(userId)
    .run();

  const msgPurge = await db
    .prepare(
      `UPDATE messages
          SET content = NULL, status = 'purged', purged_at = CURRENT_TIMESTAMP
        WHERE content IS NOT NULL
          AND (user_id = ?
               OR clone_id IN (SELECT id FROM clones WHERE owner_id = ?))`,
    )
    .bind(userId, userId)
    .run();

  await db
    .prepare(
      `UPDATE users
          SET deletion_state = 'hard_deleted',
              deleted_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
    )
    .bind(userId)
    .run();

  await logActivity(c, {
    userId,
    action: "user.gdpr_delete",
    details: {
      shredded_deks: dekIds.length,
      purged_messages: msgPurge.meta.changes ?? 0,
    },
  });
  return c.json({
    ok: true,
    state: "hard_deleted",
    shreddedDekCount: dekIds.length,
    purgedMessages: msgPurge.meta.changes ?? 0,
    xrunClose,
  });
});

users.get("/:id/followed-clones", requireAuth, async (c) => {
  const pathId = Number(c.req.param("id"));
  if (!Number.isInteger(pathId) || pathId <= 0) {
    throw new APIError("VALIDATION_FAILED", "Invalid user id.");
  }
  const userId = c.get("userId")!;
  if (pathId !== userId) {
    throw new APIError("FORBIDDEN", "Can only view your own follow list.");
  }

  const rows = (
    await c.env.DB
      .prepare(
        `SELECT c.id, c.name, c.username, c.description, c.clone_type, c.category, c.avatar_url, c.created_at,
                COALESCE(s.followers_count, 0) AS followers_count,
                COALESCE(s.messages_count, 0)  AS messages_count,
                COALESCE(s.gifts_count, 0)     AS gifts_count
           FROM clone_follows f
           JOIN clones c ON c.id = f.clone_id
           LEFT JOIN clone_stats s ON s.clone_id = c.id
          WHERE f.user_id = ? AND c.deleted_at IS NULL
          ORDER BY f.created_at DESC, f.id DESC`,
      )
      .bind(userId)
      .all<{
        id: number;
        name: string;
        username: string;
        description: string | null;
        clone_type: string;
        category: string | null;
        avatar_url: string | null;
        created_at: string;
        followers_count: number;
        messages_count: number;
        gifts_count: number;
      }>()
  ).results;

  const cIds = rows.map((r) => r.id);
  const interestsByClone = new Map<number, string[]>();
  if (cIds.length > 0) {
    const placeholders = cIds.map(() => "?").join(",");
    const ir = (
      await c.env.DB
        .prepare(
          `SELECT clone_id, interest FROM clone_interests
            WHERE clone_id IN (${placeholders})`,
        )
        .bind(...cIds)
        .all<{ clone_id: number; interest: string }>()
    ).results ?? [];
    for (const row of ir) {
      const arr = interestsByClone.get(row.clone_id) ?? [];
      arr.push(row.interest);
      interestsByClone.set(row.clone_id, arr);
    }
  }

  return c.json({
    items: rows.map((r) => ({
      id: r.id,
      name: r.name,
      username: r.username,
      description: r.description,
      cloneType: r.clone_type,
      category: r.category,
      avatarUrl: r.avatar_url,
      interests: interestsByClone.get(r.id) ?? [],
      stats: {
        followers: r.followers_count,
        messages: r.messages_count,
        gifts: r.gifts_count,
      },
      createdAt: r.created_at,
    })),
  });
});

users.get("/me/blocks", requireAuth, async (c) => {
  const userId = c.get("userId")!;
  const rows = (
    await c.env.DB
      .prepare(
        `SELECT b.id           AS blockId,
                b.created_at   AS createdAt,
                c.id           AS cloneId,
                c.name         AS cloneName,
                c.username     AS cloneUsername,
                c.avatar_url   AS cloneAvatarUrl,
                c.clone_type   AS cloneType
           FROM clone_blocks b
           JOIN clones c ON c.id = b.clone_id
          WHERE b.user_id = ? AND c.deleted_at IS NULL
          ORDER BY b.id DESC`,
      )
      .bind(userId)
      .all<{
        blockId: number;
        createdAt: string;
        cloneId: number;
        cloneName: string;
        cloneUsername: string;
        cloneAvatarUrl: string | null;
        cloneType: string;
      }>()
  ).results;
  return c.json({
    items: rows.map((r) => ({
      blockId: r.blockId,
      createdAt: r.createdAt,
      clone: {
        id: r.cloneId,
        name: r.cloneName,
        username: r.cloneUsername,
        avatarUrl: r.cloneAvatarUrl,
        cloneType: r.cloneType,
      },
    })),
  });
});

users.delete("/me/devices/:id", requireAuth, async (c) => {
  const userId = c.get("userId")!;
  const deviceRowId = Number(c.req.param("id"));
  if (!Number.isInteger(deviceRowId) || deviceRowId <= 0) {
    throw new APIError("VALIDATION_FAILED", "device id invalid.");
  }
  const res = await c.env.DB
    .prepare(`UPDATE user_devices SET is_active = 0 WHERE id = ? AND user_id = ?`)
    .bind(deviceRowId, userId)
    .run();
  if ((res.meta?.changes ?? 0) === 0) throw new APIError("NOT_FOUND", "Device not found.");
  return c.json({ ok: true });
});
