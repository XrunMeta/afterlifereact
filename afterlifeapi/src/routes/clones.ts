import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_3ebe58 } from "../lib/errors";
import { v_4c95c2, v_1f4ea7 } from "../lib/validate";
import { v_6690d9 } from "../middleware/auth";
import { v_a04a51 } from "../middleware/idempotency";
import { v_74defc } from "../lib/logger";
import {
  v_7adf64,
  v_ab84f6,
  v_5d4a51,
  v_efcb2d,
} from "../lib/cloneAccess";

export const v_f891e6 = new v_b7c41b<v_de0a25>();

v_f891e6.get("/health", (v_3f4e2e) => v_3f4e2e.json({ ok: true, module: "clones" }));

const v_3a8949 = v_1f4ea7.enum(["memlow", "friend", "mentor", "celeb"]);
const v_818579 = v_1f4ea7.enum(["public", "private", "followers"]);

const v_d2663f = new Set([
  "admin", "administrator", "root", "staff", "system", "support",
  "help", "official", "afterlife", "api", "null", "undefined",
  "anonymous", "mod", "moderator", "owner",
]);
const v_496c2d = 32 * 1024; 

const v_722b6d = v_1f4ea7.object({
  clone_type: v_3a8949,
  name: v_1f4ea7.string().min(1).max(80),
  username: v_1f4ea7
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/, "username must be lowercase alphanumeric + underscore"),
  description: v_1f4ea7.string().max(2000).optional(),
  category: v_1f4ea7.string().max(40).optional(),
  visibility: v_818579.default("private"),
  avatar_url: v_1f4ea7.url().max(500).optional(),
  cover_image_url: v_1f4ea7.url().max(500).optional(),
  voice_preset_id: v_1f4ea7.number().int().positive().optional(),
  interests: v_1f4ea7.array(v_1f4ea7.string().min(1).max(40)).max(20).optional(),

  memlow_profile: v_1f4ea7.record(v_1f4ea7.string(), v_1f4ea7.unknown()).optional(),
});

v_f891e6.post(
  "/",
  v_6690d9,
  v_a04a51("clones.create"),
  async (v_3f4e2e) => {
    const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_722b6d);
    const v_43e90c = v_3f4e2e.get("userId")!;
    const v_a1651b = v_3f4e2e.env.DB;

    if (v_d2663f.has(v_4d33b2.username)) {
      throw new v_3ebe58("VALIDATION_FAILED", "username is reserved.");
    }
    if (v_4d33b2.memlow_profile) {
      const v_05b441 = new TextEncoder().encode(JSON.stringify(v_4d33b2.memlow_profile)).length;
      if (v_05b441 > v_496c2d) {
        throw new v_3ebe58(
          "VALIDATION_FAILED",
          `memlow_profile too large (${v_05b441}B > ${v_496c2d}B).`,
        );
      }
    }

    const v_3c8572 = await v_a1651b
      .prepare(
        `SELECT COUNT(*) AS n FROM clones WHERE owner_id = ? AND clone_type = ?`,
      )
      .bind(v_43e90c, v_4d33b2.clone_type)
      .first<{ n: number }>();
    const v_faa47d = v_3c8572?.n ?? 0;
    if (v_faa47d >= 1) {

      throw new v_3ebe58(
        "QUOTA_EXCEEDED",
        "Free quota exhausted. Paid creation not yet available (beta).",
      );
    }

    const v_8e49c9 = v_4d33b2.voice_preset_id ? "preset" : "text_only";

    let v_81161e;
    try {
      v_81161e = await v_a1651b
        .prepare(
          `INSERT INTO clones
             (owner_id, name, username, description, clone_type, category, visibility,
              avatar_url, cover_image_url, voice_type, voice_preset_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           RETURNING id, name, username, clone_type, visibility, created_at`,
        )
        .bind(
          v_43e90c,
          v_4d33b2.name,
          v_4d33b2.username,
          v_4d33b2.description ?? null,
          v_4d33b2.clone_type,
          v_4d33b2.category ?? null,
          v_4d33b2.visibility,
          v_4d33b2.avatar_url ?? null,
          v_4d33b2.cover_image_url ?? null,
          v_8e49c9,
          v_4d33b2.voice_preset_id ?? null,
        )
        .first();
    } catch (v_49263d) {
      const v_badeaf = (v_49263d as Error).message ?? "";
      if (/UNIQUE constraint failed: clones\.username/i.test(v_badeaf)) {
        throw new v_3ebe58("CONFLICT", "Username already taken.");
      }

      if (/UNIQUE constraint failed: clones\.owner_id, clones\.clone_type/i.test(v_badeaf)) {
        throw new v_3ebe58(
          "QUOTA_EXCEEDED",
          "Free quota exhausted. Paid creation not yet available (beta).",
        );
      }
      throw v_49263d;
    }
    if (!v_81161e) throw new v_3ebe58("INTERNAL_ERROR", "Failed to create clone.");

    const v_6e0fd3 = v_81161e.id;

    try {
      const v_3e6264 = [];
      for (const v_23805a of v_4d33b2.interests ?? []) {
        v_3e6264.push(
          v_a1651b
            .prepare(
              `INSERT INTO clone_interests (clone_id, interest) VALUES (?, ?)`,
            )
            .bind(v_6e0fd3, v_23805a),
        );
      }

      v_3e6264.push(
        v_a1651b
          .prepare(
            `INSERT INTO clone_shares
               (clone_id, owner_id, target_user_id, role, status)
             VALUES (?, ?, ?, 'owner', 'accepted')`,
          )
          .bind(v_6e0fd3, v_43e90c, v_43e90c),
      );

      v_3e6264.push(
        v_a1651b
          .prepare(
            `INSERT INTO clone_stats (clone_id, followers_count, messages_count, gifts_count)
             VALUES (?, 0, 0, 0)
             ON CONFLICT(clone_id) DO NOTHING`,
          )
          .bind(v_6e0fd3),
      );
      await v_a1651b.batch(v_3e6264);
    } catch (v_49263d) {

      await v_a1651b.prepare(`DELETE FROM clones WHERE id = ?`).bind(v_6e0fd3).run();
      throw v_49263d;
    }

    let v_f5acdb = null;
    let v_26ed1a = null;
    if (v_4d33b2.clone_type === "memlow") {
      v_f5acdb = `ctx:${v_6e0fd3}`;
      v_26ed1a = `shared:${v_6e0fd3}`;
      const v_f393d3 = `shared_versions:${v_6e0fd3}`;
      const v_911033 = JSON.stringify({
        persona: v_4d33b2.memlow_profile ?? {},
        family: [],
        _meta: { layer: "L1", rev: 1 },
      });
      try {
        await Promise.all([
          v_3f4e2e.env.KV_CTX.put(v_f5acdb, v_911033),
          v_3f4e2e.env.KV_SHARED.put(v_26ed1a, "[]"),
          v_3f4e2e.env.KV_SHARED_VER.put(v_f393d3, "0"),
        ]);
      } catch (v_49263d) {
        console.error(`[KV_INIT_FAIL] clone_id=${v_6e0fd3} err=${(v_49263d as Error).message}`);
      }
    }

    await v_74defc(v_3f4e2e, {
      userId: v_43e90c,
      action: "clone.create",
      details: { cloneId: v_6e0fd3, cloneType: v_4d33b2.clone_type },
    });

    return v_3f4e2e.json(
      {
        clone: {
          id: v_81161e.id,
          name: v_81161e.name,
          username: v_81161e.username,
          cloneType: v_81161e.clone_type,
          visibility: v_81161e.visibility,
          createdAt: v_81161e.created_at,
        },
        initial_kv: v_f5acdb
          ? { ctx_key: v_f5acdb, shared_key: v_26ed1a }
          : null,
      },
      201,
    );
  },
);

const v_5d756f = v_1f4ea7.object({
  q: v_1f4ea7.string().max(80).optional(),
  type: v_3a8949.optional(),
  category: v_1f4ea7.string().max(40).optional(),
  sort: v_1f4ea7.enum(["new", "popular"]).default("new"),
  cursor: v_1f4ea7.string().max(200).optional(),
  limit: v_1f4ea7.coerce.number().int().min(1).max(50).default(20),
});

function v_c9de8c(v_45efe3, v_389afb): string {
  const v_479f05 = `${v_45efe3}|${v_389afb}`;
  return btoa(v_479f05).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function v_e9da89(v_21cc31): { sortKey: string; id: number } | null {
  try {
    const v_8a9589 = v_21cc31.replace(/-/g, "+").replace(/_/g, "/");
    const v_8b8b16 = v_8a9589 + "=".repeat((4 - (v_8a9589.length % 4)) % 4);
    const v_479f05 = atob(v_8b8b16);
    const v_e86ad8 = v_479f05.lastIndexOf("|");
    if (v_e86ad8 < 0) return null;
    const v_45efe3 = v_479f05.slice(0, v_e86ad8);
    const v_389afb = Number(v_479f05.slice(v_e86ad8 + 1));
    if (!Number.isInteger(v_389afb) || v_389afb <= 0) return null;
    return { sortKey: v_45efe3, id: v_389afb };
  } catch {
    return null;
  }
}

v_f891e6.get("/search", async (v_3f4e2e) => {
  const v_ab6401 = v_5d756f.safeParse(
    Object.fromEntries(new URL(v_3f4e2e.req.url).searchParams.entries()),
  );
  if (!v_ab6401.success) {
    throw new v_3ebe58("VALIDATION_FAILED", "Query invalid.", v_ab6401.error.issues);
  }
  const v_24baff = v_ab6401.data;
  const v_a1651b = v_3f4e2e.env.DB;

  const v_abcc8d = [`c.deleted_at IS NULL`, `c.visibility = 'public'`];
  const v_925171 = [];
  if (v_24baff.q) {
    v_abcc8d.push(`(c.name LIKE ? OR c.username LIKE ?)`);
    const v_2a1d60 = `%${v_24baff.q}%`;
    v_925171.push(v_2a1d60, v_2a1d60);
  }
  if (v_24baff.type) {
    v_abcc8d.push(`c.clone_type = ?`);
    v_925171.push(v_24baff.type);
  }
  if (v_24baff.category) {
    v_abcc8d.push(`c.category = ?`);
    v_925171.push(v_24baff.category);
  }

  let v_5922ec;
  if (v_24baff.sort === "popular") {
    v_5922ec = `COALESCE(s.followers_count, 0) DESC, c.id DESC`;
    const v_c3bc75 = v_24baff.cursor ? v_e9da89(v_24baff.cursor) : null;
    if (v_c3bc75) {
      v_abcc8d.push(
        `(COALESCE(s.followers_count, 0) < ? OR (COALESCE(s.followers_count, 0) = ? AND c.id < ?))`,
      );
      v_925171.push(Number(v_c3bc75.sortKey), Number(v_c3bc75.sortKey), v_c3bc75.id);
    }
  } else {
    v_5922ec = `c.created_at DESC, c.id DESC`;
    const v_c3bc75 = v_24baff.cursor ? v_e9da89(v_24baff.cursor) : null;
    if (v_c3bc75) {
      v_abcc8d.push(`(c.created_at < ? OR (c.created_at = ? AND c.id < ?))`);
      v_925171.push(v_c3bc75.sortKey, v_c3bc75.sortKey, v_c3bc75.id);
    }
  }

  const v_f8df46 = `
    SELECT c.id, c.name, c.username, c.clone_type, c.category, c.avatar_url,
           c.created_at, COALESCE(s.followers_count, 0) AS followers_count
      FROM clones c
      LEFT JOIN clone_stats s ON s.clone_id = c.id
     WHERE ${v_abcc8d.join(" AND ")}
     ORDER BY ${v_5922ec}
     LIMIT ?`;
  v_925171.push(v_24baff.limit + 1);

  const v_18b8bf = (
    await v_a1651b.prepare(v_f8df46).bind(...v_925171).all<{
      id: number;
      name: string;
      username: string;
      clone_type: string;
      category: string | null;
      avatar_url: string | null;
      created_at: string;
      followers_count: number;
    }>()
  ).results;

  const v_6bbe19 = v_18b8bf.length > v_24baff.limit;
  const v_2365e9 = v_6bbe19 ? v_18b8bf.slice(0, v_24baff.limit) : v_18b8bf;
  let v_64f859 = null;
  if (v_6bbe19 && v_2365e9.length > 0) {
    const v_506e86 = v_2365e9[v_2365e9.length - 1]!;
    v_64f859 =
      v_24baff.sort === "popular"
        ? v_c9de8c(v_506e86.followers_count, v_506e86.id)
        : v_c9de8c(v_506e86.created_at, v_506e86.id);
  }

  return v_3f4e2e.json({
    items: v_2365e9.map((v_cb35cb) => ({
      id: v_cb35cb.id,
      name: v_cb35cb.name,
      username: v_cb35cb.username,
      cloneType: v_cb35cb.clone_type,
      category: v_cb35cb.category,
      avatarUrl: v_cb35cb.avatar_url,
      followersCount: v_cb35cb.followers_count,
      createdAt: v_cb35cb.created_at,
    })),
    nextCursor: v_64f859,
  });
});

v_f891e6.get("/:id", async (v_3f4e2e) => {
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid clone id.");
  }
  const v_eb25ce = await v_5d4a51(v_3f4e2e.env.DB, v_6e0fd3);
  if (!v_eb25ce) throw new v_3ebe58("NOT_FOUND", "Clone not found.");

  const v_43e90c = await v_efcb2d(v_3f4e2e);

  let v_00efe2 = null;
  if (v_43e90c === v_eb25ce.owner_id) v_00efe2 = "owner";
  else if (v_43e90c) v_00efe2 = await v_7adf64(v_3f4e2e.env.DB, v_6e0fd3, v_43e90c);

  if (v_eb25ce.visibility === "private" && !v_00efe2) {
    throw new v_3ebe58("FORBIDDEN", "Private clone.");
  }
  if (v_eb25ce.visibility === "followers" && !v_00efe2) {
    if (!v_43e90c || !(await v_ab84f6(v_3f4e2e.env.DB, v_6e0fd3, v_43e90c))) {
      throw new v_3ebe58("FORBIDDEN", "Followers-only clone.");
    }
  }

  const v_774c91 = (
    await v_3f4e2e.env.DB
      .prepare(`SELECT interest FROM clone_interests WHERE clone_id = ?`)
      .bind(v_6e0fd3)
      .all<{ interest: string }>()
  ).results.map((v_cb35cb) => v_cb35cb.interest);

  return v_3f4e2e.json({
    clone: {
      id: v_eb25ce.id,
      ownerId: v_eb25ce.owner_id,
      name: v_eb25ce.name,
      username: v_eb25ce.username,
      description: v_eb25ce.description,
      cloneType: v_eb25ce.clone_type,
      category: v_eb25ce.category,
      visibility: v_eb25ce.visibility,
      avatarUrl: v_eb25ce.avatar_url,
      coverImageUrl: v_eb25ce.cover_image_url,
      voiceType: v_eb25ce.voice_type,
      voicePresetId: v_eb25ce.voice_preset_id,
      trainingStatus: v_eb25ce.training_status,
      interests: v_774c91,
      stats: {
        followers: v_eb25ce.followers_count,
        messages: v_eb25ce.messages_count,
        gifts: v_eb25ce.gifts_count,
      },
      createdAt: v_eb25ce.created_at,
      viewerRole: v_00efe2,
    },
  });
});

const v_90be18 = v_1f4ea7
  .object({
    name: v_1f4ea7.string().min(1).max(80).optional(),
    description: v_1f4ea7.string().max(2000).optional(),
    avatar_url: v_1f4ea7.url().max(500).optional(),
    cover_image_url: v_1f4ea7.url().max(500).optional(),
    visibility: v_818579.optional(),
    voice_preset_id: v_1f4ea7.number().int().positive().nullable().optional(),
  })
  .refine((v_b6c474) => Object.keys(v_b6c474).length > 0, {
    message: "At least one field required.",
  });

v_f891e6.patch("/:id", v_6690d9, async (v_3f4e2e) => {
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid clone id.");
  }
  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_90be18);
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_a1651b = v_3f4e2e.env.DB;

  const v_eb25ce = await v_5d4a51(v_a1651b, v_6e0fd3);
  if (!v_eb25ce) throw new v_3ebe58("NOT_FOUND", "Clone not found.");
  const v_2aec08 =
    v_eb25ce.owner_id === v_43e90c ||
    (await v_7adf64(v_a1651b, v_6e0fd3, v_43e90c)) === "owner";
  if (!v_2aec08) throw new v_3ebe58("FORBIDDEN", "Owner role required.");

  const v_75ae3e = [];
  const v_925171 = [];
  const v_f73a2d = [];
  if (v_4d33b2.name !== undefined) {
    v_75ae3e.push(`name = ?`);
    v_925171.push(v_4d33b2.name);
    v_f73a2d.push("name");
  }
  if (v_4d33b2.description !== undefined) {
    v_75ae3e.push(`description = ?`);
    v_925171.push(v_4d33b2.description);
    v_f73a2d.push("description");
  }
  if (v_4d33b2.avatar_url !== undefined) {
    v_75ae3e.push(`avatar_url = ?`);
    v_925171.push(v_4d33b2.avatar_url);
    v_f73a2d.push("avatar_url");
  }
  if (v_4d33b2.cover_image_url !== undefined) {
    v_75ae3e.push(`cover_image_url = ?`);
    v_925171.push(v_4d33b2.cover_image_url);
    v_f73a2d.push("cover_image_url");
  }
  if (v_4d33b2.visibility !== undefined) {
    v_75ae3e.push(`visibility = ?`);
    v_925171.push(v_4d33b2.visibility);
    v_f73a2d.push("visibility");
  }
  if (v_4d33b2.voice_preset_id !== undefined) {
    v_75ae3e.push(`voice_preset_id = ?`, `voice_type = ?`);
    v_925171.push(v_4d33b2.voice_preset_id);
    v_925171.push(v_4d33b2.voice_preset_id === null ? "text_only" : "preset");
    v_f73a2d.push("voice_preset_id");
  }
  v_75ae3e.push(`updated_at = CURRENT_TIMESTAMP`);
  v_925171.push(v_6e0fd3);

  await v_a1651b
    .prepare(`UPDATE clones SET ${v_75ae3e.join(", ")} WHERE id = ? AND deleted_at IS NULL`)
    .bind(...v_925171)
    .run();

  await v_74defc(v_3f4e2e, {
    userId: v_43e90c,
    action: "clone.update",
    details: { cloneId: v_6e0fd3, updatedFields: v_f73a2d },
  });
  return v_3f4e2e.json({ ok: true, updatedFields: v_f73a2d });
});

v_f891e6.post("/:id/follow", v_6690d9, async (v_3f4e2e) => {
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid clone id.");
  }
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_a1651b = v_3f4e2e.env.DB;

  const v_eb25ce = await v_5d4a51(v_a1651b, v_6e0fd3);
  if (!v_eb25ce) throw new v_3ebe58("NOT_FOUND", "Clone not found.");

  if (v_eb25ce.visibility === "private") {
    const v_22da99 =
      v_eb25ce.owner_id === v_43e90c
        ? "owner"
        : await v_7adf64(v_a1651b, v_6e0fd3, v_43e90c);
    if (!v_22da99) throw new v_3ebe58("FORBIDDEN", "Cannot follow private clone.");
  }

  await v_a1651b
    .prepare(
      `INSERT OR IGNORE INTO clone_follows (user_id, clone_id) VALUES (?, ?)`,
    )
    .bind(v_43e90c, v_6e0fd3)
    .run();
  return v_3f4e2e.json({ ok: true });
});

v_f891e6.delete("/:id/follow", v_6690d9, async (v_3f4e2e) => {
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid clone id.");
  }
  const v_43e90c = v_3f4e2e.get("userId")!;
  await v_3f4e2e.env.DB
    .prepare(`DELETE FROM clone_follows WHERE user_id = ? AND clone_id = ?`)
    .bind(v_43e90c, v_6e0fd3)
    .run();
  return v_3f4e2e.json({ ok: true });
});
