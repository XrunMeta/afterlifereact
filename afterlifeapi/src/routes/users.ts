import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_6690d9 } from "../middleware/auth";
import { v_3ebe58 } from "../lib/errors";
import { v_4c95c2, v_1f4ea7 } from "../lib/validate";
import { v_137694, v_85de88, v_a8614b, v_8ea38c, v_b31343 } from "../lib/ale";
import { v_e44d97 } from "../lib/kekProvider";
import { v_74defc } from "../lib/logger";

export const v_de7ba7 = new v_b7c41b<v_de0a25>();

v_de7ba7.get("/health", (v_3f4e2e) => v_3f4e2e.json({ ok: true, module: "users" }));

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

async function v_3fb498(c: Parameters<typeof v_6690d9>[0]): Promise<never> {
  throw new Error("unused");
}
void v_3fb498;

v_de7ba7.get("/search", v_6690d9, async (v_3f4e2e) => {
  const v_b32680 = v_3f4e2e.get("userId")!;
  const v_ab6401 = (v_3f4e2e.req.query("q") ?? "").trim();
  if (v_ab6401.length < 2) {
    return v_3f4e2e.json({ items: [] });
  }
  const v_2a1d60 = `%${v_ab6401}%`;
  const v_18b8bf = await v_3f4e2e.env.DB
    .prepare(
      `SELECT id, name, email, avatar_url AS avatarUrl
         FROM users
        WHERE deleted_at IS NULL
          AND id != ?
          AND (LOWER(email) LIKE LOWER(?) OR name LIKE ?)
        ORDER BY id DESC
        LIMIT 20`,
    )
    .bind(v_b32680, v_2a1d60, v_2a1d60)
    .all<{ id: number; name: string | null; email: string; avatarUrl: string | null }>();
  return v_3f4e2e.json({ items: v_18b8bf.results ?? [] });
});

v_de7ba7.get("/me", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_a1651b = v_3f4e2e.env.DB;
  const v_3ac7e7 = await v_a1651b
    .prepare(
      `SELECT id, name, email, avatar_url, credits, funnel_stage, phone, gender, age, age_enc, created_at,
              xrun_member_id, xrun_guid, xrun_wallet, xrun_linked_at
         FROM users WHERE id = ? AND deleted_at IS NULL`,
    )
    .bind(v_43e90c)
    .first<UserRow>();
  if (!v_3ac7e7) throw new v_3ebe58("NOT_FOUND", "User not found.");

  const v_774c91 = await v_a1651b
    .prepare(`SELECT interest FROM user_interests WHERE user_id = ? ORDER BY id`)
    .bind(v_43e90c)
    .all<{ interest: string }>();

  const v_d205b7 = v_a8614b(v_3f4e2e.env.ALE_KEK);

  let v3Provider: Awaited<ReturnType<typeof v_e44d97>> | undefined;
  try {
    v_67b8fb = await v_e44d97(v_3f4e2e);
  } catch (v_49263d) {
    console.error(
      `[KEK_V3_UNAVAILABLE] reqId=${v_3f4e2e.get("requestId")} err=${(v_49263d as Error).message}`,
    );
    v_67b8fb = undefined;
  }

  let v_d74a81 = null;
  if (v_3ac7e7.phone) {
    try {
      v_d74a81 = await v_137694(v_3ac7e7.phone, {
        db: v_3f4e2e.env.DB,
        hkdfContext: "user.phone",
        legacyProvider: v_d205b7,
        v3Provider: v_67b8fb,
        actor: { type: "user", id: v_43e90c },
        auditSecret: v_3f4e2e.env.AUDIT_SECRET,
        lazyMigrateEnabled: v_3f4e2e.env.LAZY_V2_MIGRATE_ENABLED === "1",
        hint: { key: "users.phone", resourceId: v_43e90c },
      });
    } catch (v_49263d) {
      v_d74a81 = null;
      console.error(
        `[ALE_DECRYPT_FAIL] user_id=${v_43e90c} context=user.phone reqId=${v_3f4e2e.get("requestId")} err=${(v_49263d as Error).message}`,
      );
    }
  }

  let v_2694bd = v_3ac7e7.age;
  if (v_3ac7e7.age_enc) {
    try {
      const v_eef514 = await v_137694(v_3ac7e7.age_enc, {
        db: v_3f4e2e.env.DB,
        hkdfContext: "user.age",
        legacyProvider: v_d205b7,
        v3Provider: v_67b8fb,
        actor: { type: "user", id: v_43e90c },
        auditSecret: v_3f4e2e.env.AUDIT_SECRET,
        lazyMigrateEnabled: v_3f4e2e.env.LAZY_V2_MIGRATE_ENABLED === "1",
        hint: { key: "users.age_enc", resourceId: v_43e90c },
      });
      const v_f4e98d = Number(v_eef514);
      v_2694bd = Number.isFinite(v_f4e98d) ? v_f4e98d : null;
    } catch (v_49263d) {
      console.error(
        `[ALE_DECRYPT_FAIL] user_id=${v_43e90c} context=user.age reqId=${v_3f4e2e.get("requestId")} err=${(v_49263d as Error).message}`,
      );
    }
  }

  return v_3f4e2e.json({
    user: {
      id: v_3ac7e7.id,
      name: v_3ac7e7.name,
      email: v_3ac7e7.email,
      avatarUrl: v_3ac7e7.avatar_url,
      credits: v_3ac7e7.credits,
      funnelStage: v_3ac7e7.funnel_stage,
      phone: v_d74a81,
      gender: v_3ac7e7.gender,
      age: v_2694bd,
      createdAt: v_3ac7e7.created_at,
      xrunMemberId: v_3ac7e7.xrun_member_id,
      xrunGuid: v_3ac7e7.xrun_guid,
      xrunWallet: v_3ac7e7.xrun_wallet,
      xrunLinkedAt: v_3ac7e7.xrun_linked_at,
    },
    interests: (v_774c91.results ?? []).map((v_cb35cb) => v_cb35cb.interest),
  });
});

const v_90be18 = v_1f4ea7.object({
  name: v_1f4ea7.string().min(1).max(80).optional(),
  avatarUrl: v_1f4ea7.url().max(500).nullable().optional(),
  phone: v_1f4ea7.string().min(4).max(40).nullable().optional(),
  gender: v_1f4ea7.enum(["male", "female", "other"]).nullable().optional(),
  age: v_1f4ea7.number().int().min(13).max(120).nullable().optional(),
});

v_de7ba7.patch("/me", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_90be18);

  const v_97eacf = [];
  const v_925171 = [];
  const v_f73a2d = [];

  if (v_4d33b2.name !== undefined) {
    v_97eacf.push("name = ?");
    v_925171.push(v_4d33b2.name);
    v_f73a2d.push("name");
  }
  if (v_4d33b2.avatarUrl !== undefined) {
    v_97eacf.push("avatar_url = ?");
    v_925171.push(v_4d33b2.avatarUrl);
    v_f73a2d.push("avatarUrl");
  }
  if (v_4d33b2.phone !== undefined) {
    v_97eacf.push("phone = ?");
    v_925171.push(
      v_4d33b2.phone ? v_85de88(v_4d33b2.phone, v_a8614b(v_3f4e2e.env.ALE_KEK), "user.phone") : null,
    );
    v_f73a2d.push("phone");
  }
  if (v_4d33b2.gender !== undefined) {
    v_97eacf.push("gender = ?");
    v_925171.push(v_4d33b2.gender);
    v_f73a2d.push("gender");
  }
  if (v_4d33b2.age !== undefined) {
    v_97eacf.push("age_enc = ?, age = ?");
    v_925171.push(
      v_4d33b2.age !== null
        ? v_85de88(String(v_4d33b2.age), v_a8614b(v_3f4e2e.env.ALE_KEK), "user.age")
        : null,
      null, 
    );
    v_f73a2d.push("age");
  }

  if (v_97eacf.length === 0) return v_3f4e2e.json({ ok: true, updatedFields: [] });

  v_97eacf.push("updated_at = CURRENT_TIMESTAMP");
  v_925171.push(v_43e90c);

  await v_3f4e2e.env.DB
    .prepare(`UPDATE users SET ${v_97eacf.join(", ")} WHERE id = ?`)
    .bind(...v_925171)
    .run();

  await v_74defc(v_3f4e2e, { userId: v_43e90c, action: "user.patch_me", details: { fields: v_f73a2d } });
  return v_3f4e2e.json({ ok: true, updatedFields: v_f73a2d });
});

v_de7ba7.post("/me/interests", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_aa4de6 = v_1f4ea7.object({
    add: v_1f4ea7.array(v_1f4ea7.string().min(1).max(40)).max(20).optional(),
    remove: v_1f4ea7.array(v_1f4ea7.string().min(1).max(40)).max(20).optional(),
  });
  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_aa4de6);
  const v_a1651b = v_3f4e2e.env.DB;

  const v_3e6264 = [];
  for (const v_23805a of v_4d33b2.add ?? []) {
    v_3e6264.push(
      v_a1651b.prepare(`INSERT OR IGNORE INTO user_interests (user_id, interest) VALUES (?, ?)`).bind(v_43e90c, v_23805a),
    );
  }
  for (const v_23805a of v_4d33b2.remove ?? []) {
    v_3e6264.push(
      v_a1651b.prepare(`DELETE FROM user_interests WHERE user_id = ? AND interest = ?`).bind(v_43e90c, v_23805a),
    );
  }
  if (v_3e6264.length) await v_a1651b.batch(v_3e6264);
  return v_3f4e2e.json({ ok: true });
});

v_de7ba7.get("/me/devices", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_18b8bf = await v_3f4e2e.env.DB
    .prepare(
      `SELECT id, device_id AS deviceId, platform, last_active_at AS lastActiveAt, is_active AS isActive
         FROM user_devices WHERE user_id = ? ORDER BY last_active_at DESC`,
    )
    .bind(v_43e90c)
    .all();
  return v_3f4e2e.json({ devices: v_18b8bf.results ?? [] });
});

v_de7ba7.get("/me/invites", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_18b8bf = await v_3f4e2e.env.DB
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
    .bind(v_43e90c)
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

  const v_5c2f9f = Date.now();
  const v_4622b9 = (v_18b8bf.results ?? []).map((v_cb35cb) => {
    let v_d308b5;
    if (v_cb35cb.usedAt) v_d308b5 = "accepted";
    else if (v_cb35cb.cancelledAt) v_d308b5 = "cancelled";
    else {
      const v_f900a6 = new Date(v_cb35cb.expiresAt.replace(" ", "T") + "Z").getTime();
      v_d308b5 = v_f900a6 < v_5c2f9f ? "expired" : "pending";
    }
    return {
      id: v_cb35cb.id,
      inviteEmail: v_cb35cb.inviteEmail,
      relation: v_cb35cb.relation,
      grantOwner: v_cb35cb.grantOwner === 1,
      expiresAt: v_cb35cb.expiresAt,
      usedAt: v_cb35cb.usedAt,
      cancelledAt: v_cb35cb.cancelledAt,
      createdAt: v_cb35cb.createdAt,
      status: v_d308b5,
      clone: {
        id: v_cb35cb.cloneId,
        name: v_cb35cb.cloneName,
        username: v_cb35cb.cloneUsername,
        avatarUrl: v_cb35cb.cloneAvatarUrl,
        cloneType: v_cb35cb.cloneType,
      },
    };
  });
  return v_3f4e2e.json({ items: v_4622b9 });
});

v_de7ba7.post("/me/devices", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_4d33b2 = await v_3f4e2e.req.json().catch(() => ({})) as {
    deviceId?: string;
    pushToken?: string;
    platform?: "ios" | "android" | "web";
  };
  if (!v_4d33b2.deviceId || !v_4d33b2.pushToken || !v_4d33b2.platform) {
    throw new v_3ebe58("VALIDATION_FAILED", "deviceId, pushToken, platform required.");
  }
  await v_3f4e2e.env.DB
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
    .bind(v_43e90c, v_4d33b2.deviceId, v_4d33b2.pushToken, v_4d33b2.platform)
    .run();
  return v_3f4e2e.json({ ok: true });
});

v_de7ba7.get("/me/clones", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_18b8bf = await v_3f4e2e.env.DB
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
    .bind(v_43e90c, v_43e90c, v_43e90c)
    .all();

  const v_8b86f5 = (v_18b8bf.results ?? []).map((v_cb35cb) => (v_cb35cb as { id: number }).id);
  const v_65d2c1 = new Map<number, string[]>();
  if (v_8b86f5.length > 0) {
    const v_1cdc07 = v_8b86f5.map(() => "?").join(",");
    const v_b52787 = (
      await v_3f4e2e.env.DB
        .prepare(
          `SELECT clone_id, interest FROM clone_interests
            WHERE clone_id IN (${v_1cdc07})`,
        )
        .bind(...v_8b86f5)
        .all<{ clone_id: number; interest: string }>()
    ).results ?? [];
    for (const v_b07d8e of v_b52787) {
      const v_d0c056 = v_65d2c1.get(v_b07d8e.clone_id) ?? [];
      v_d0c056.push(v_b07d8e.interest);
      v_65d2c1.set(v_b07d8e.clone_id, v_d0c056);
    }
  }

  const v_4622b9 = (v_18b8bf.results ?? []).map((v_cb35cb) => {
    const v_3ac7e7 = v_cb35cb as Record<string, unknown> & { id: number; l1ProfileJson?: string | null };
    let v_564b6a = null;
    if (v_3ac7e7.l1ProfileJson) {
      try {
        const v_8decf8 = JSON.parse(v_3ac7e7.l1ProfileJson) as { attrs?: Record<string, string>; notes?: string };
        v_564b6a = { attrs: v_8decf8.attrs ?? {}, notes: v_8decf8.notes ?? "" };
      } catch {

      }
    }
    const { l1ProfileJson: v_9bd854, ...v_83bbcd } = v_3ac7e7;
    void v_9bd854;
    return {
      ...v_83bbcd,
      l1Profile: v_564b6a,
      interests: v_65d2c1.get(v_3ac7e7.id) ?? [],
    };
  });
  return v_3f4e2e.json({ items: v_4622b9 });
});

v_de7ba7.post("/me/delete", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_a1651b = v_3f4e2e.env.DB;
  const v_8f00b9 = await v_a1651b
    .prepare(
      `UPDATE users
          SET deletion_state = 'soft_deleted',
              soft_deleted_at = CURRENT_TIMESTAMP,
              deleted_at = CURRENT_TIMESTAMP
        WHERE id = ? AND deletion_state = 'active'`,
    )
    .bind(v_43e90c)
    .run();
  if ((v_8f00b9.meta?.changes ?? 0) === 0) {
    throw new v_3ebe58("CONFLICT", "Account is not in active state.");
  }

  const v_90e6ec = await v_a1651b
    .prepare(
      `UPDATE clones
          SET deletion_state = 'soft_deleted',
              soft_deleted_at = CURRENT_TIMESTAMP
        WHERE owner_id = ? AND deletion_state = 'active'`,
    )
    .bind(v_43e90c)
    .run();
  await v_74defc(v_3f4e2e, {
    userId: v_43e90c,
    action: "user.soft_delete",
    details: { cascaded_clones: v_90e6ec.meta?.changes ?? 0 },
  });
  return v_3f4e2e.json({
    ok: true,
    state: "soft_deleted",
    restorableUntil: "+90d",
    cascadedClones: v_90e6ec.meta?.changes ?? 0,
  });
});

v_de7ba7.post("/me/restore", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_a1651b = v_3f4e2e.env.DB;
  const v_8f00b9 = await v_a1651b
    .prepare(
      `UPDATE users
          SET deletion_state = 'active',
              soft_deleted_at = NULL,
              deleted_at = NULL
        WHERE id = ? AND deletion_state = 'soft_deleted'
          AND soft_deleted_at > datetime('now', '-90 days')`,
    )
    .bind(v_43e90c)
    .run();
  if ((v_8f00b9.meta?.changes ?? 0) === 0) {
    throw new v_3ebe58("CONFLICT", "Restoration window expired or account not soft-deleted.");
  }

  const v_90e6ec = await v_a1651b
    .prepare(
      `UPDATE clones
          SET deletion_state = 'active',
              soft_deleted_at = NULL
        WHERE owner_id = ? AND deletion_state = 'soft_deleted'`,
    )
    .bind(v_43e90c)
    .run();
  await v_74defc(v_3f4e2e, {
    userId: v_43e90c,
    action: "user.restore",
    details: { restored_clones: v_90e6ec.meta?.changes ?? 0 },
  });
  return v_3f4e2e.json({
    ok: true,
    state: "active",
    restoredClones: v_90e6ec.meta?.changes ?? 0,
  });
});

v_de7ba7.post("/me/delete/gdpr", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_a1651b = v_3f4e2e.env.DB;

  const v_4d33b2 = (await v_3f4e2e.req.json().catch(() => ({}))) as { withXrun?: boolean };
  const v_837dd2 = v_4d33b2?.withXrun === true;

  let v_9550e4 = {
    attempted: false,
    closed: false,
  };

  if (v_837dd2) {
    const v_213c33 = await v_a1651b
      .prepare(`SELECT xrun_member_id FROM users WHERE id = ?`)
      .bind(v_43e90c)
      .first<{ xrun_member_id: number | null }>();
    const v_88fe80 = v_213c33?.xrun_member_id ?? null;
    if (v_88fe80) {
      const { closeXrunMember: v_a33f6b } = await import("../lib/xrun");
      const v_8f00b9 = await v_a33f6b(v_3f4e2e.env, v_88fe80);
      v_9550e4 = { attempted: true, closed: v_8f00b9.closed, reason: v_8f00b9.reason };

    } else {
      v_9550e4 = { attempted: true, closed: false, reason: "no xrun member linked" };
    }
  }

  const v_e2026a = [];
  const v_d1b635 = await v_a1651b
    .prepare(`SELECT phone, age_enc FROM users WHERE id = ?`)
    .bind(v_43e90c)
    .first<{ phone: string | null; age_enc: string | null }>();
  for (const v_3263c7 of [v_d1b635?.phone, v_d1b635?.age_enc]) {
    if (v_3263c7) {
      const v_389afb = v_8ea38c(v_3263c7);
      if (v_389afb) v_e2026a.push(v_389afb);
    }
  }

  const v_14089c = (
    await v_a1651b
      .prepare(
        `SELECT id, content FROM messages
          WHERE content IS NOT NULL
            AND (user_id = ?
                 OR clone_id IN (SELECT id FROM clones WHERE owner_id = ?))`,
      )
      .bind(v_43e90c, v_43e90c)
      .all<{ id: number; content: string | null }>()
  ).results;
  for (const v_cb35cb of v_14089c) {
    if (v_cb35cb.content) {
      const v_389afb = v_8ea38c(v_cb35cb.content);
      if (v_389afb) v_e2026a.push(v_389afb);
    }
  }

  for (const v_389afb of v_e2026a) {
    await v_b31343(v_a1651b, v_389afb);
  }

  await v_a1651b
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
    .bind(v_43e90c)
    .run();

  await v_a1651b
    .prepare(`DELETE FROM user_interests WHERE user_id = ?`)
    .bind(v_43e90c)
    .run();

  const v_2c4648 = await v_a1651b
    .prepare(
      `UPDATE messages
          SET content = NULL, status = 'purged', purged_at = CURRENT_TIMESTAMP
        WHERE content IS NOT NULL
          AND (user_id = ?
               OR clone_id IN (SELECT id FROM clones WHERE owner_id = ?))`,
    )
    .bind(v_43e90c, v_43e90c)
    .run();

  await v_a1651b
    .prepare(
      `UPDATE users
          SET deletion_state = 'hard_deleted',
              deleted_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
    )
    .bind(v_43e90c)
    .run();

  const v_ad5d03 = await v_a1651b
    .prepare(
      `UPDATE clones
          SET deletion_state = 'hard_deleted',
              deleted_at = CURRENT_TIMESTAMP,
              name = 'deletedclone' || CAST(id AS TEXT),
              description = NULL,
              avatar_url = NULL,
              cover_image_url = NULL
        WHERE owner_id = ?`,
    )
    .bind(v_43e90c)
    .run();

  await v_74defc(v_3f4e2e, {
    userId: v_43e90c,
    action: "user.gdpr_delete",
    details: {
      shredded_deks: v_e2026a.length,
      purged_messages: v_2c4648.meta.changes ?? 0,
      purged_clones: v_ad5d03.meta?.changes ?? 0,
    },
  });
  return v_3f4e2e.json({
    ok: true,
    state: "hard_deleted",
    shreddedDekCount: v_e2026a.length,
    purgedMessages: v_2c4648.meta.changes ?? 0,
    purgedClones: v_ad5d03.meta?.changes ?? 0,
    xrunClose: v_9550e4,
  });
});

v_de7ba7.get("/:id/followed-clones", v_6690d9, async (v_3f4e2e) => {
  const v_66c633 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_66c633) || v_66c633 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid user id.");
  }
  const v_43e90c = v_3f4e2e.get("userId")!;
  if (v_66c633 !== v_43e90c) {
    throw new v_3ebe58("FORBIDDEN", "Can only view your own follow list.");
  }

  const v_18b8bf = (
    await v_3f4e2e.env.DB
      .prepare(
        `SELECT c.id, c.name, c.username, c.description, c.clone_type, c.category, c.avatar_url, c.created_at,
                COALESCE(s.followers_count, 0) AS followers_count,
                COALESCE(s.messages_count, 0)  AS messages_count,
                COALESCE(s.gifts_count, 0)     AS gifts_count,
                (SELECT id FROM feeds WHERE clone_id = c.id ORDER BY id DESC LIMIT 1) AS latest_feed_id,
                (SELECT COALESCE(SUM(f.likes_count), 0) FROM feeds f
                  WHERE f.clone_id = c.id) AS total_likes,
                (SELECT COUNT(*) FROM feed_comments fc
                   JOIN feeds f2 ON f2.id = fc.feed_id
                   WHERE f2.clone_id = c.id) AS total_comments,
                -- per-(user, clone) 상호작용 카운터 (기획서 정의)
                COALESCE(uci.chat_count, 0)  AS my_chat,
                COALESCE(uci.call_count, 0)  AS my_call,
                COALESCE(uci.learn_count, 0) AS my_learn,
                COALESCE(uci.feed_count, 0)  AS my_feed
           FROM clone_follows f
           JOIN clones c ON c.id = f.clone_id
           LEFT JOIN clone_stats s ON s.clone_id = c.id
           LEFT JOIN user_clone_interactions uci
                  ON uci.user_id = ? AND uci.clone_id = c.id
          WHERE f.user_id = ? AND c.deleted_at IS NULL
            AND c.id NOT IN (SELECT clone_id FROM clone_blocks WHERE user_id = ?)
          ORDER BY f.created_at DESC, f.id DESC`,
      )
      .bind(v_43e90c, v_43e90c, v_43e90c)
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
        latest_feed_id: number | null;
        total_likes: number;
        total_comments: number;
        my_chat: number;
        my_call: number;
        my_learn: number;
        my_feed: number;
      }>()
  ).results;

  const v_a3c713 = v_18b8bf.map((v_cb35cb) => v_cb35cb.id);
  const v_9afb14 = new Map<number, string[]>();
  if (v_a3c713.length > 0) {
    const v_1cdc07 = v_a3c713.map(() => "?").join(",");
    const v_b07d8e = (
      await v_3f4e2e.env.DB
        .prepare(
          `SELECT clone_id, interest FROM clone_interests
            WHERE clone_id IN (${v_1cdc07})`,
        )
        .bind(...v_a3c713)
        .all<{ clone_id: number; interest: string }>()
    ).results ?? [];
    for (const v_3ac7e7 of v_b07d8e) {
      const v_d0c056 = v_9afb14.get(v_3ac7e7.clone_id) ?? [];
      v_d0c056.push(v_3ac7e7.interest);
      v_9afb14.set(v_3ac7e7.clone_id, v_d0c056);
    }
  }

  const v_1e80bb = v_18b8bf.map((v_cb35cb) => v_cb35cb.id);
  const v_ff3805 = new Set<number>();
  if (v_1e80bb.length > 0) {
    const v_1cdc07 = v_1e80bb.map(() => "?").join(",");
    const v_59d4e3 = (
      await v_3f4e2e.env.DB
        .prepare(
          `SELECT DISTINCT f.clone_id AS clone_id FROM feed_likes fl
             JOIN feeds f ON f.id = fl.feed_id
            WHERE fl.user_id = ? AND f.clone_id IN (${v_1cdc07})`,
        )
        .bind(v_43e90c, ...v_1e80bb)
        .all<{ clone_id: number }>()
    ).results ?? [];
    for (const v_3ac7e7 of v_59d4e3) v_ff3805.add(v_3ac7e7.clone_id);
  }

  return v_3f4e2e.json({
    items: v_18b8bf.map((v_cb35cb) => ({
      id: v_cb35cb.id,
      name: v_cb35cb.name,
      username: v_cb35cb.username,
      description: v_cb35cb.description,
      cloneType: v_cb35cb.clone_type,
      category: v_cb35cb.category,
      avatarUrl: v_cb35cb.avatar_url,
      interests: v_9afb14.get(v_cb35cb.id) ?? [],
      stats: {
        followers: v_cb35cb.followers_count,
        messages: v_cb35cb.messages_count,
        gifts: v_cb35cb.gifts_count,

        likes: v_cb35cb.total_likes,
        comments: v_cb35cb.total_comments,
      },

      latestFeed: {
        feedId: v_cb35cb.latest_feed_id,
        likedByMe: v_ff3805.has(v_cb35cb.id),
      },

      myInteractions: {
        chat: v_cb35cb.my_chat,
        call: v_cb35cb.my_call,
        learn: v_cb35cb.my_learn,
        feed: v_cb35cb.my_feed,
        total: v_cb35cb.my_chat + v_cb35cb.my_call + v_cb35cb.my_learn + v_cb35cb.my_feed,
        intimacy: Math.min(100, (v_cb35cb.my_chat + v_cb35cb.my_call + v_cb35cb.my_learn + v_cb35cb.my_feed) * 2),
      },
      createdAt: v_cb35cb.created_at,
    })),
  });
});

v_de7ba7.get("/me/blocks", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_18b8bf = (
    await v_3f4e2e.env.DB
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
      .bind(v_43e90c)
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
  return v_3f4e2e.json({
    items: v_18b8bf.map((v_cb35cb) => ({
      blockId: v_cb35cb.blockId,
      createdAt: v_cb35cb.createdAt,
      clone: {
        id: v_cb35cb.cloneId,
        name: v_cb35cb.cloneName,
        username: v_cb35cb.cloneUsername,
        avatarUrl: v_cb35cb.cloneAvatarUrl,
        cloneType: v_cb35cb.cloneType,
      },
    })),
  });
});

v_de7ba7.delete("/me/devices/:id", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_eb3eac = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_eb3eac) || v_eb3eac <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "device id invalid.");
  }
  const v_8f00b9 = await v_3f4e2e.env.DB
    .prepare(`UPDATE user_devices SET is_active = 0 WHERE id = ? AND user_id = ?`)
    .bind(v_eb3eac, v_43e90c)
    .run();
  if ((v_8f00b9.meta?.changes ?? 0) === 0) throw new v_3ebe58("NOT_FOUND", "Device not found.");
  return v_3f4e2e.json({ ok: true });
});

v_de7ba7.get("/me/transactions", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_f71b56 = new URL(v_3f4e2e.req.url);
  const v_cf2260 = Number(v_f71b56.searchParams.get("limit") ?? 20);
  const v_02be30 = Math.max(1, Math.min(100, Number.isFinite(v_cf2260) ? v_cf2260 : 20));

  const v_18b8bf = (
    await v_3f4e2e.env.DB
      .prepare(
        `SELECT g.id, g.sender_user_id AS senderId, g.owner_user_id AS ownerId,
                g.clone_id AS cloneId, g.gift_id AS giftId, g.gift_name AS giftName,
                g.total_amount AS totalAmount, g.company_amount AS companyAmount,
                g.owner_amount AS ownerAmount,
                g.status, g.tx_company AS txCompany, g.tx_owner AS txOwner,
                g.created_at AS createdAt, g.completed_at AS completedAt,
                c.name AS cloneName, c.avatar_url AS cloneAvatarUrl
           FROM gift_logs g
           LEFT JOIN clones c ON c.id = g.clone_id
          WHERE (g.sender_user_id = ? OR g.owner_user_id = ?)
            AND g.status = 'sent'
          ORDER BY g.created_at DESC
          LIMIT ?`,
      )
      .bind(v_43e90c, v_43e90c, v_02be30)
      .all<{
        id: number;
        senderId: number;
        ownerId: number;
        cloneId: number;
        giftId: string;
        giftName: string;
        totalAmount: number;
        companyAmount: number;
        ownerAmount: number;
        status: string;
        txCompany: string | null;
        txOwner: string | null;
        createdAt: string;
        completedAt: string | null;
        cloneName: string | null;
        cloneAvatarUrl: string | null;
      }>()
  ).results;

  return v_3f4e2e.json({
    items: v_18b8bf.map((v_cb35cb) => {
      const v_f966e3 = v_cb35cb.senderId === v_43e90c;
      return {
        id: v_cb35cb.id,
        type: v_f966e3 ? "gift_sent" : "gift_received",

        amount: v_f966e3 ? -v_cb35cb.totalAmount : v_cb35cb.ownerAmount,
        sign: v_f966e3 ? "-" : "+",
        giftId: v_cb35cb.giftId,
        giftName: v_cb35cb.giftName,
        cloneId: v_cb35cb.cloneId,
        cloneName: v_cb35cb.cloneName,
        cloneAvatarUrl: v_cb35cb.cloneAvatarUrl,
        txHash: v_f966e3 ? v_cb35cb.txCompany : v_cb35cb.txOwner,
        createdAt: v_cb35cb.createdAt,
      };
    }),
  });
});
