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
}

async function loadMe(c: Parameters<typeof requireAuth>[0]): Promise<never> {
  throw new Error("unused");
}
void loadMe;

users.get("/me", requireAuth, async (c) => {
  const userId = c.get("userId")!;
  const db = c.env.DB;
  const row = await db
    .prepare(
      `SELECT id, name, email, avatar_url, credits, funnel_stage, phone, gender, age, age_enc, created_at
         FROM users WHERE id = ? AND deleted_at IS NULL`,
    )
    .bind(userId)
    .first<UserRow>();
  if (!row) throw new APIError("NOT_FOUND", "User not found.");

  const interests = await db
    .prepare(`SELECT interest FROM user_interests WHERE user_id = ? ORDER BY id`)
    .bind(userId)
    .all<{ interest: string }>();

  let phone: string | null = null;
  if (row.phone) {
    try {
      const legacyProvider = getKekProvider(c.env.ALE_KEK);
      const v3Provider = await requestKekProvider(c);
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
      const legacyProvider = getKekProvider(c.env.ALE_KEK);
      const v3Provider = await requestKekProvider(c);
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
          SET phone = NULL, age_enc = NULL, age = NULL
        WHERE id = ?`,
    )
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
