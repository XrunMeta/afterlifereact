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
  xrun_linked_at: string | null;
}

async function v_3fb498(c: Parameters<typeof v_6690d9>[0]): Promise<never> {
  throw new Error("unused");
}
void v_3fb498;

v_de7ba7.get("/me", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_a1651b = v_3f4e2e.env.DB;
  const v_3ac7e7 = await v_a1651b
    .prepare(
      `SELECT id, name, email, avatar_url, credits, funnel_stage, phone, gender, age, age_enc, created_at,
              xrun_member_id, xrun_guid, xrun_linked_at
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
  await v_74defc(v_3f4e2e, { userId: v_43e90c, action: "user.soft_delete" });
  return v_3f4e2e.json({ ok: true, state: "soft_deleted", restorableUntil: "+90d" });
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
  await v_74defc(v_3f4e2e, { userId: v_43e90c, action: "user.restore" });
  return v_3f4e2e.json({ ok: true, state: "active" });
});

v_de7ba7.post("/me/delete/gdpr", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_a1651b = v_3f4e2e.env.DB;

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
          SET phone = NULL, age_enc = NULL, age = NULL
        WHERE id = ?`,
    )
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

  await v_74defc(v_3f4e2e, {
    userId: v_43e90c,
    action: "user.gdpr_delete",
    details: {
      shredded_deks: v_e2026a.length,
      purged_messages: v_2c4648.meta.changes ?? 0,
    },
  });
  return v_3f4e2e.json({
    ok: true,
    state: "hard_deleted",
    shreddedDekCount: v_e2026a.length,
    purgedMessages: v_2c4648.meta.changes ?? 0,
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
        `SELECT c.id, c.name, c.username, c.clone_type, c.category, c.avatar_url, c.created_at,
                COALESCE(s.followers_count, 0) AS followers_count,
                COALESCE(s.messages_count, 0)  AS messages_count,
                COALESCE(s.gifts_count, 0)     AS gifts_count
           FROM clone_follows f
           JOIN clones c ON c.id = f.clone_id
           LEFT JOIN clone_stats s ON s.clone_id = c.id
          WHERE f.user_id = ? AND c.deleted_at IS NULL
          ORDER BY f.created_at DESC, f.id DESC`,
      )
      .bind(v_43e90c)
      .all<{
        id: number;
        name: string;
        username: string;
        clone_type: string;
        category: string | null;
        avatar_url: string | null;
        created_at: string;
        followers_count: number;
        messages_count: number;
        gifts_count: number;
      }>()
  ).results;

  return v_3f4e2e.json({
    items: v_18b8bf.map((v_cb35cb) => ({
      id: v_cb35cb.id,
      name: v_cb35cb.name,
      username: v_cb35cb.username,
      cloneType: v_cb35cb.clone_type,
      category: v_cb35cb.category,
      avatarUrl: v_cb35cb.avatar_url,
      stats: {
        followers: v_cb35cb.followers_count,
        messages: v_cb35cb.messages_count,
        gifts: v_cb35cb.gifts_count,
      },
      createdAt: v_cb35cb.created_at,
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
