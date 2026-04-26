import { Hono } from "hono";
import type { AppEnv } from "../lib/env";
import { APIError } from "../lib/errors";
import { parseJson, z } from "../lib/validate";
import { requireAuth } from "../middleware/auth";
import { requireIdempotencyKey } from "../middleware/idempotency";
import { logActivity } from "../lib/logger";
import {
  hasAcceptedShare,
  isFollower,
  loadCloneById,
  resolveOptionalUser,
  resolveResponseViewerRole,
} from "../lib/cloneAccess";
import { writeCtx, writeShared } from "../lib/memoryStore";

export const clones = new Hono<AppEnv>();

clones.get("/health", (c) => c.json({ ok: true, module: "clones" }));

const cloneType = z.enum(["memlow", "friend", "mentor", "celeb"]);
const visibility = z.enum(["public", "private", "followers"]);

const USERNAME_BLACKLIST = new Set([
  "admin", "administrator", "root", "staff", "system", "support",
  "help", "official", "afterlife", "api", "null", "undefined",
  "anonymous", "mod", "moderator", "owner",
]);
const MAX_MEMLOW_PROFILE_BYTES = 32 * 1024; 

const createSchema = z.object({
  clone_type: cloneType,
  name: z.string().min(1).max(80),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/, "username must be lowercase alphanumeric + underscore"),
  description: z.string().max(2000).optional(),
  category: z.string().max(40).optional(),
  visibility: visibility.default("private"),
  avatar_url: z.url().max(500).optional(),
  cover_image_url: z.url().max(500).optional(),
  voice_preset_id: z.number().int().positive().optional(),
  interests: z.array(z.string().min(1).max(40)).max(20).optional(),

  memlow_profile: z.record(z.string(), z.unknown()).optional(),
});

clones.post(
  "/",
  requireAuth,
  requireIdempotencyKey("clones.create"),
  async (c) => {
    const body = await parseJson(c, createSchema);
    const userId = c.get("userId")!;
    const db = c.env.DB;

    if (USERNAME_BLACKLIST.has(body.username)) {
      throw new APIError("VALIDATION_FAILED", "username is reserved.");
    }
    if (body.memlow_profile) {
      const size = new TextEncoder().encode(JSON.stringify(body.memlow_profile)).length;
      if (size > MAX_MEMLOW_PROFILE_BYTES) {
        throw new APIError(
          "VALIDATION_FAILED",
          `memlow_profile too large (${size}B > ${MAX_MEMLOW_PROFILE_BYTES}B).`,
        );
      }
    }

    const existing = await db
      .prepare(
        `SELECT COUNT(*) AS n FROM clones WHERE owner_id = ? AND clone_type = ?`,
      )
      .bind(userId, body.clone_type)
      .first<{ n: number }>();
    const usedCount = existing?.n ?? 0;
    if (usedCount >= 1) {

      throw new APIError(
        "QUOTA_EXCEEDED",
        "Free quota exhausted. Paid creation not yet available (beta).",
      );
    }

    const voiceType = body.voice_preset_id ? "preset" : "text_only";

    let inserted:
      | {
          id: number;
          name: string;
          username: string;
          clone_type: string;
          visibility: string;
          created_at: string;
        }
      | null;
    try {
      inserted = await db
        .prepare(
          `INSERT INTO clones
             (owner_id, name, username, description, clone_type, category, visibility,
              avatar_url, cover_image_url, voice_type, voice_preset_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           RETURNING id, name, username, clone_type, visibility, created_at`,
        )
        .bind(
          userId,
          body.name,
          body.username,
          body.description ?? null,
          body.clone_type,
          body.category ?? null,
          body.visibility,
          body.avatar_url ?? null,
          body.cover_image_url ?? null,
          voiceType,
          body.voice_preset_id ?? null,
        )
        .first();
    } catch (err) {
      const msg = (err as Error).message ?? "";
      if (/UNIQUE constraint failed: clones\.username/i.test(msg)) {
        throw new APIError("CONFLICT", "Username already taken.");
      }

      if (/UNIQUE constraint failed: clones\.owner_id, clones\.clone_type/i.test(msg)) {
        throw new APIError(
          "QUOTA_EXCEEDED",
          "Free quota exhausted. Paid creation not yet available (beta).",
        );
      }
      throw err;
    }
    if (!inserted) throw new APIError("INTERNAL_ERROR", "Failed to create clone.");

    const cloneId = inserted.id;

    try {
      const stmts: D1PreparedStatement[] = [];
      for (const it of body.interests ?? []) {
        stmts.push(
          db
            .prepare(
              `INSERT INTO clone_interests (clone_id, interest) VALUES (?, ?)`,
            )
            .bind(cloneId, it),
        );
      }

      stmts.push(
        db
          .prepare(
            `INSERT INTO clone_shares
               (clone_id, owner_id, target_user_id, role, status)
             VALUES (?, ?, ?, 'owner', 'accepted')`,
          )
          .bind(cloneId, userId, userId),
      );

      stmts.push(
        db
          .prepare(
            `INSERT INTO clone_stats (clone_id, followers_count, messages_count, gifts_count)
             VALUES (?, 0, 0, 0)
             ON CONFLICT(clone_id) DO NOTHING`,
          )
          .bind(cloneId),
      );
      await db.batch(stmts);
    } catch (err) {

      await db.prepare(`DELETE FROM clones WHERE id = ?`).bind(cloneId).run();
      throw err;
    }

    if (body.clone_type === "memlow") {
      const ctxSeed = JSON.stringify({
        persona: body.memlow_profile ?? {},
        family: [],
        _meta: { layer: "L1", rev: 1 },
      });
      try {
        await Promise.all([
          writeCtx(c.env, cloneId, ctxSeed),
          writeShared(c.env, cloneId, "[]", 0),
        ]);
      } catch (err) {
        console.error(`[MEMORY_INIT_FAIL] clone_id=${cloneId} err=${(err as Error).message}`);
      }
    }

    await logActivity(c, {
      userId,
      action: "clone.create",
      details: { cloneId, cloneType: body.clone_type },
    });

    return c.json(
      {
        clone: {
          id: inserted.id,
          name: inserted.name,
          username: inserted.username,
          cloneType: inserted.clone_type,
          visibility: inserted.visibility,
          createdAt: inserted.created_at,
        },
        initial_memory: body.clone_type === "memlow"
          ? { ctx_key: `ctx:${cloneId}`, shared_key: `shared:${cloneId}` }
          : null,
      },
      201,
    );
  },
);

const searchQuery = z.object({
  q: z.string().max(80).optional(),
  type: cloneType.optional(),
  category: z.string().max(40).optional(),
  sort: z.enum(["new", "popular"]).default("new"),
  cursor: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

function encodeCursor(sortKey: string | number, id: number): string {
  const raw = `${sortKey}|${id}`;
  return btoa(raw).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function decodeCursor(token: string): { sortKey: string; id: number } | null {
  try {
    const b64 = token.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const raw = atob(padded);
    const idx = raw.lastIndexOf("|");
    if (idx < 0) return null;
    const sortKey = raw.slice(0, idx);
    const id = Number(raw.slice(idx + 1));
    if (!Number.isInteger(id) || id <= 0) return null;
    return { sortKey, id };
  } catch {
    return null;
  }
}

clones.get("/search", async (c) => {
  const q = searchQuery.safeParse(
    Object.fromEntries(new URL(c.req.url).searchParams.entries()),
  );
  if (!q.success) {
    throw new APIError("VALIDATION_FAILED", "Query invalid.", q.error.issues);
  }
  const params = q.data;
  const db = c.env.DB;

  const where: string[] = [`c.deleted_at IS NULL`, `c.visibility = 'public'`];
  const binds: unknown[] = [];
  if (params.q) {
    where.push(`(c.name LIKE ? OR c.username LIKE ?)`);
    const like = `%${params.q}%`;
    binds.push(like, like);
  }
  if (params.type) {
    where.push(`c.clone_type = ?`);
    binds.push(params.type);
  }
  if (params.category) {
    where.push(`c.category = ?`);
    binds.push(params.category);
  }

  let orderBy: string;
  if (params.sort === "popular") {
    orderBy = `COALESCE(s.followers_count, 0) DESC, c.id DESC`;
    const cur = params.cursor ? decodeCursor(params.cursor) : null;
    if (cur) {
      where.push(
        `(COALESCE(s.followers_count, 0) < ? OR (COALESCE(s.followers_count, 0) = ? AND c.id < ?))`,
      );
      binds.push(Number(cur.sortKey), Number(cur.sortKey), cur.id);
    }
  } else {
    orderBy = `c.created_at DESC, c.id DESC`;
    const cur = params.cursor ? decodeCursor(params.cursor) : null;
    if (cur) {
      where.push(`(c.created_at < ? OR (c.created_at = ? AND c.id < ?))`);
      binds.push(cur.sortKey, cur.sortKey, cur.id);
    }
  }

  const sql = `
    SELECT c.id, c.name, c.username, c.clone_type, c.category, c.avatar_url,
           c.created_at,
           COALESCE(s.followers_count, 0) AS followers_count,
           COALESCE(s.messages_count, 0)  AS messages_count,
           COALESCE(s.gifts_count, 0)     AS gifts_count
      FROM clones c
      LEFT JOIN clone_stats s ON s.clone_id = c.id
     WHERE ${where.join(" AND ")}
     ORDER BY ${orderBy}
     LIMIT ?`;
  binds.push(params.limit + 1);

  const rows = (
    await db.prepare(sql).bind(...binds).all<{
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

  const hasMore = rows.length > params.limit;
  const page = hasMore ? rows.slice(0, params.limit) : rows;
  let nextCursor: string | null = null;
  if (hasMore && page.length > 0) {
    const last = page[page.length - 1]!;
    nextCursor =
      params.sort === "popular"
        ? encodeCursor(last.followers_count, last.id)
        : encodeCursor(last.created_at, last.id);
  }

  return c.json({
    items: page.map((r) => ({
      id: r.id,
      name: r.name,
      username: r.username,
      cloneType: r.clone_type,
      category: r.category,
      avatarUrl: r.avatar_url,
      stats: {
        followers: r.followers_count,
        messages: r.messages_count,
        gifts: r.gifts_count,
      },
      createdAt: r.created_at,
    })),
    nextCursor,
  });
});

clones.get("/:id", async (c) => {
  const cloneId = Number(c.req.param("id"));
  if (!Number.isInteger(cloneId) || cloneId <= 0) {
    throw new APIError("VALIDATION_FAILED", "Invalid clone id.");
  }
  const clone = await loadCloneById(c.env.DB, cloneId);
  if (!clone) throw new APIError("NOT_FOUND", "Clone not found.");

  const userId = await resolveOptionalUser(c);
  const viewerRole = await resolveResponseViewerRole(c.env.DB, clone, userId);

  if (clone.visibility === "private" && viewerRole !== "owner" && viewerRole !== "coowner") {
    throw new APIError("FORBIDDEN", "Private clone.");
  }
  if (clone.visibility === "followers" && viewerRole === null) {
    throw new APIError("FORBIDDEN", "Followers-only clone.");
  }

  const interests = (
    await c.env.DB
      .prepare(`SELECT interest FROM clone_interests WHERE clone_id = ?`)
      .bind(cloneId)
      .all<{ interest: string }>()
  ).results.map((r) => r.interest);

  return c.json({
    clone: {
      id: clone.id,
      ownerId: clone.owner_id,
      name: clone.name,
      username: clone.username,
      description: clone.description,
      cloneType: clone.clone_type,
      category: clone.category,
      visibility: clone.visibility,
      avatarUrl: clone.avatar_url,
      coverImageUrl: clone.cover_image_url,
      voiceType: clone.voice_type,
      voicePresetId: clone.voice_preset_id,
      trainingStatus: clone.training_status,
      interests,
      stats: {
        followers: clone.followers_count,
        messages: clone.messages_count,
        gifts: clone.gifts_count,
      },
      createdAt: clone.created_at,
      viewerRole,
    },
  });
});

const l1ProfileSchema = z.object({
  attrs: z.record(z.string(), z.string()),
  notes: z.string().max(4000).default(''),
});

const patchSchema = z
  .object({
    name: z.string().min(1).max(80).optional(),
    description: z.string().max(2000).optional(),
    avatar_url: z.url().max(500).optional(),
    cover_image_url: z.url().max(500).optional(),
    visibility: visibility.optional(),
    voice_preset_id: z.number().int().positive().nullable().optional(),
    l1_profile: l1ProfileSchema.optional(),
  })
  .strict()
  .refine((o) => Object.keys(o).length > 0, {
    message: "At least one field required.",
  });

clones.patch("/:id", requireAuth, async (c) => {
  const cloneId = Number(c.req.param("id"));
  if (!Number.isInteger(cloneId) || cloneId <= 0) {
    throw new APIError("VALIDATION_FAILED", "Invalid clone id.");
  }
  const body = await parseJson(c, patchSchema);
  const userId = c.get("userId")!;
  const db = c.env.DB;

  const clone = await loadCloneById(db, cloneId);
  if (!clone) throw new APIError("NOT_FOUND", "Clone not found.");
  const isOwner =
    clone.owner_id === userId ||
    (await hasAcceptedShare(db, cloneId, userId)) === "owner";
  if (!isOwner) throw new APIError("FORBIDDEN", "Owner role required.");

  if (body.l1_profile !== undefined) {
    const row = await db
      .prepare("SELECT primary_editor_user_id FROM clones WHERE id = ? AND deleted_at IS NULL")
      .bind(cloneId)
      .first<{ primary_editor_user_id: number | null }>();
    if (row?.primary_editor_user_id !== userId) {
      throw new APIError("FORBIDDEN", "Only the primary editor may edit L1.");
    }
  }

  const sets: string[] = [];
  const binds: unknown[] = [];
  const updatedFields: string[] = [];
  if (body.name !== undefined) {
    sets.push(`name = ?`);
    binds.push(body.name);
    updatedFields.push("name");
  }
  if (body.description !== undefined) {
    sets.push(`description = ?`);
    binds.push(body.description);
    updatedFields.push("description");
  }
  if (body.avatar_url !== undefined) {
    sets.push(`avatar_url = ?`);
    binds.push(body.avatar_url);
    updatedFields.push("avatar_url");
  }
  if (body.cover_image_url !== undefined) {
    sets.push(`cover_image_url = ?`);
    binds.push(body.cover_image_url);
    updatedFields.push("cover_image_url");
  }
  if (body.visibility !== undefined) {
    sets.push(`visibility = ?`);
    binds.push(body.visibility);
    updatedFields.push("visibility");
  }
  if (body.voice_preset_id !== undefined) {
    sets.push(`voice_preset_id = ?`, `voice_type = ?`);
    binds.push(body.voice_preset_id);
    binds.push(body.voice_preset_id === null ? "text_only" : "preset");
    updatedFields.push("voice_preset_id");
  }
  if (body.l1_profile !== undefined) {
    sets.push(`l1_profile = ?`);
    binds.push(JSON.stringify(body.l1_profile));
    updatedFields.push("l1_profile");
  }
  sets.push(`updated_at = CURRENT_TIMESTAMP`);
  binds.push(cloneId);

  const statements = [
    db
      .prepare(
        `UPDATE clones SET ${sets.join(", ")} WHERE id = ? AND deleted_at IS NULL`,
      )
      .bind(...binds),
  ];

  if (body.l1_profile !== undefined) {
    statements.push(
      db
        .prepare("DELETE FROM persona_attributes WHERE clone_id = ? AND level = 'l1'")
        .bind(cloneId),
    );
    for (const [k, v] of Object.entries(body.l1_profile.attrs)) {
      statements.push(
        db
          .prepare(
            "INSERT INTO persona_attributes (clone_id, level, key, value) VALUES (?, 'l1', ?, ?)",
          )
          .bind(cloneId, k, v),
      );
    }
  }

  await db.batch(statements);

  await logActivity(c, {
    userId,
    action: "clone.update",
    details: { cloneId, updatedFields },
  });
  return c.json({ ok: true, updatedFields });
});

clones.post("/:id/follow", requireAuth, async (c) => {
  const cloneId = Number(c.req.param("id"));
  if (!Number.isInteger(cloneId) || cloneId <= 0) {
    throw new APIError("VALIDATION_FAILED", "Invalid clone id.");
  }
  const userId = c.get("userId")!;
  const db = c.env.DB;

  const clone = await loadCloneById(db, cloneId);
  if (!clone) throw new APIError("NOT_FOUND", "Clone not found.");

  if (clone.visibility === "private") {
    const role =
      clone.owner_id === userId
        ? "owner"
        : await hasAcceptedShare(db, cloneId, userId);
    if (!role) throw new APIError("FORBIDDEN", "Cannot follow private clone.");
  }

  await db
    .prepare(
      `INSERT OR IGNORE INTO clone_follows (user_id, clone_id) VALUES (?, ?)`,
    )
    .bind(userId, cloneId)
    .run();
  return c.json({ ok: true });
});

clones.delete("/:id/follow", requireAuth, async (c) => {
  const cloneId = Number(c.req.param("id"));
  if (!Number.isInteger(cloneId) || cloneId <= 0) {
    throw new APIError("VALIDATION_FAILED", "Invalid clone id.");
  }
  const userId = c.get("userId")!;
  await c.env.DB
    .prepare(`DELETE FROM clone_follows WHERE user_id = ? AND clone_id = ?`)
    .bind(userId, cloneId)
    .run();
  return c.json({ ok: true });
});
