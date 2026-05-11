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
  v_d875d1,
} from "../lib/cloneAccess";
import { v_9c8187, v_55eb2a } from "../lib/memoryStore";
import { v_7a6fc0 } from "../lib/xrun";
import { v_80a022 } from "../lib/notify";

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

const v_3ea364 = v_1f4ea7.object({
  attrs: v_1f4ea7.record(v_1f4ea7.string(), v_1f4ea7.string()),
  notes: v_1f4ea7.string().max(4000).default(''),
});

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

  l1_profile: v_3ea364.optional(),

  pin: v_1f4ea7.string().regex(/^\d{6}$/).optional(),
});

const v_c02c4c = 100;

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
        `SELECT COUNT(*) AS n FROM clones
          WHERE owner_id = ?
            AND deletion_state = 'active'
            AND deleted_at IS NULL`,
      )
      .bind(v_43e90c)
      .first<{ n: number }>();
    const v_faa47d = v_3c8572?.n ?? 0;
    if (v_faa47d >= 1) {

      const v_c54e53 = await v_a1651b
        .prepare(
          `SELECT COUNT(*) AS n FROM clones
            WHERE owner_id = ?
              AND clone_type = ?
              AND deletion_state = 'active'
              AND deleted_at IS NULL`,
        )
        .bind(v_43e90c, v_4d33b2.clone_type)
        .first<{ n: number }>();
      if ((v_c54e53?.n ?? 0) >= 1) {
        throw new v_3ebe58(
          "CONFLICT",
          "이미 같은 타입의 페르소나가 있습니다. 다른 타입을 선택해주세요.",
        );
      }

      if (!v_4d33b2.pin) {
        throw new v_3ebe58("PAYMENT_REQUIRED", "Persona creation requires payment.", {
          priceXrun: v_c02c4c,
          message: `2번째 페르소나부터 ${v_c02c4c} XRUN 이 부과됩니다.`,
        });
      }

      const v_72b02d = v_3f4e2e.env.COMPANY_CHARGE_WALLET;
      if (!v_72b02d) {
        throw new v_3ebe58("INTERNAL_ERROR", "Server missing COMPANY_CHARGE_WALLET configuration.");
      }
      const v_3645f3 = await v_a1651b
        .prepare(`SELECT xrun_member_id FROM users WHERE id = ?`)
        .bind(v_43e90c)
        .first<{ xrun_member_id: number | null }>();
      if (!v_3645f3?.xrun_member_id) {
        throw new v_3ebe58("CONFLICT", "xrun account not linked.");
      }
      const v_a832b3 = Number(v_3f4e2e.env.PAYMENT_CURRENCY ?? "18") || 18;
      const { externalTransferSplit: v_7a6fc0 } = await import("../lib/xrun");
      const v_e69235 = await v_7a6fc0(v_3f4e2e.env, {
        fromMember: v_3645f3.xrun_member_id,
        recipients: [{ toAddress: v_72b02d, amount: String(v_c02c4c) }],
        currency: v_a832b3,
        pin: v_4d33b2.pin,
        source: "afterlife.persona-create",
      });
      if (!v_e69235.ok) {
        if (v_e69235.code === 401 || v_e69235.code === 403) {
          throw new v_3ebe58("UNAUTHENTICATED", "PIN verification failed.");
        }
        if (v_e69235.code === 402) {
          throw new v_3ebe58("INSUFFICIENT_FUNDS", "Insufficient XRUN balance.");
        }
        throw new v_3ebe58("UPSTREAM_FAILURE", v_e69235.reason ?? "xrun transfer error");
      }
    }

    const v_8e49c9 = v_4d33b2.voice_preset_id ? "preset" : "text_only";

    let v_81161e;
    try {

      v_81161e = await v_a1651b
        .prepare(
          `INSERT INTO clones
             (owner_id, name, username, description, clone_type, category, visibility,
              avatar_url, cover_image_url, voice_type, voice_preset_id,
              l1_profile, primary_editor_user_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          v_4d33b2.l1_profile ? JSON.stringify(v_4d33b2.l1_profile) : null,
          v_43e90c,
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

      if (v_4d33b2.l1_profile?.attrs) {
        for (const [v_b24339, v_3b402b] of Object.entries(v_4d33b2.l1_profile.attrs)) {
          if (!v_3b402b) continue;
          v_3e6264.push(
            v_a1651b
              .prepare(
                `INSERT INTO persona_attributes (clone_id, level, key, value)
                 VALUES (?, 'l1', ?, ?)`,
              )
              .bind(v_6e0fd3, v_b24339, v_3b402b),
          );
        }
      }
      await v_a1651b.batch(v_3e6264);
    } catch (v_49263d) {

      await v_a1651b.prepare(`DELETE FROM clones WHERE id = ?`).bind(v_6e0fd3).run();
      throw v_49263d;
    }

    if (v_4d33b2.clone_type === "memlow") {
      const v_911033 = JSON.stringify({
        persona: v_4d33b2.memlow_profile ?? {},
        family: [],
        _meta: { layer: "L1", rev: 1 },
      });
      try {
        await Promise.all([
          v_9c8187(v_3f4e2e.env, v_6e0fd3, v_911033),
          v_55eb2a(v_3f4e2e.env, v_6e0fd3, "[]", 0),
        ]);
      } catch (v_49263d) {
        console.error(`[MEMORY_INIT_FAIL] clone_id=${v_6e0fd3} err=${(v_49263d as Error).message}`);
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
        initial_memory: v_4d33b2.clone_type === "memlow"
          ? { ctx_key: `ctx:${v_6e0fd3}`, shared_key: `shared:${v_6e0fd3}` }
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
           c.created_at,
           COALESCE(s.followers_count, 0) AS followers_count,
           COALESCE(s.messages_count, 0)  AS messages_count,
           COALESCE(s.gifts_count, 0)     AS gifts_count
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
      messages_count: number;
      gifts_count: number;
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
      stats: {
        followers: v_cb35cb.followers_count,
        messages: v_cb35cb.messages_count,
        gifts: v_cb35cb.gifts_count,
      },
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
  const v_00efe2 = await v_d875d1(v_3f4e2e.env.DB, v_eb25ce, v_43e90c);

  if (v_eb25ce.visibility === "private" && v_00efe2 !== "owner" && v_00efe2 !== "coowner") {
    throw new v_3ebe58("FORBIDDEN", "Private clone.");
  }
  if (v_eb25ce.visibility === "followers" && v_00efe2 === null) {
    throw new v_3ebe58("FORBIDDEN", "Followers-only clone.");
  }

  const v_774c91 = (
    await v_3f4e2e.env.DB
      .prepare(`SELECT interest FROM clone_interests WHERE clone_id = ?`)
      .bind(v_6e0fd3)
      .all<{ interest: string }>()
  ).results.map((v_cb35cb) => v_cb35cb.interest);

  const v_218436 = await v_3f4e2e.env.DB
    .prepare(
      `SELECT
         (SELECT COALESCE(SUM(f.likes_count), 0) FROM feeds f
            WHERE f.clone_id = ?) AS likesCount,
         (SELECT COUNT(*) FROM feed_comments fc
            JOIN feeds f2 ON f2.id = fc.feed_id
            WHERE f2.clone_id = ?) AS commentsCount`,
    )
    .bind(v_6e0fd3, v_6e0fd3)
    .first<{ likesCount: number; commentsCount: number }>();

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
        likes: v_218436?.likesCount ?? 0,
        comments: v_218436?.commentsCount ?? 0,
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
    l1_profile: v_3ea364.optional(),
    interests: v_1f4ea7.array(v_1f4ea7.string().min(1).max(40)).max(20).optional(),
  })
  .strict()
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

  if (v_4d33b2.l1_profile !== undefined) {
    const v_3ac7e7 = await v_a1651b
      .prepare("SELECT primary_editor_user_id FROM clones WHERE id = ? AND deleted_at IS NULL")
      .bind(v_6e0fd3)
      .first<{ primary_editor_user_id: number | null }>();
    if (v_3ac7e7?.primary_editor_user_id !== v_43e90c) {
      throw new v_3ebe58("FORBIDDEN", "Only the primary editor may edit L1.");
    }
  }

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
  if (v_4d33b2.l1_profile !== undefined) {
    v_75ae3e.push(`l1_profile = ?`);
    v_925171.push(JSON.stringify(v_4d33b2.l1_profile));
    v_f73a2d.push("l1_profile");
  }
  v_75ae3e.push(`updated_at = CURRENT_TIMESTAMP`);
  v_925171.push(v_6e0fd3);

  const v_be9ad5 = [
    v_a1651b
      .prepare(
        `UPDATE clones SET ${v_75ae3e.join(", ")} WHERE id = ? AND deleted_at IS NULL`,
      )
      .bind(...v_925171),
  ];

  if (v_4d33b2.l1_profile !== undefined) {
    v_be9ad5.push(
      v_a1651b
        .prepare("DELETE FROM persona_attributes WHERE clone_id = ? AND level = 'l1'")
        .bind(v_6e0fd3),
    );
    for (const [v_0eb677, v_81e2ef] of Object.entries(v_4d33b2.l1_profile.attrs)) {
      v_be9ad5.push(
        v_a1651b
          .prepare(
            "INSERT INTO persona_attributes (clone_id, level, key, value) VALUES (?, 'l1', ?, ?)",
          )
          .bind(v_6e0fd3, v_0eb677, v_81e2ef),
      );
    }
  }

  if (v_4d33b2.interests !== undefined) {
    v_be9ad5.push(
      v_a1651b.prepare(`DELETE FROM clone_interests WHERE clone_id = ?`).bind(v_6e0fd3),
    );

    const v_110a8b = new Set<string>();
    for (const v_479f05 of v_4d33b2.interests) {
      const v_81e2ef = v_479f05.trim();
      if (!v_81e2ef || v_110a8b.has(v_81e2ef)) continue;
      v_110a8b.add(v_81e2ef);
      v_be9ad5.push(
        v_a1651b
          .prepare(`INSERT INTO clone_interests (clone_id, interest) VALUES (?, ?)`)
          .bind(v_6e0fd3, v_81e2ef),
      );
    }
    v_f73a2d.push("interests");
  }

  await v_a1651b.batch(v_be9ad5);

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

  const v_43c42e = await v_a1651b
    .prepare(
      `INSERT OR IGNORE INTO clone_follows (user_id, clone_id) VALUES (?, ?)`,
    )
    .bind(v_43e90c, v_6e0fd3)
    .run();

  if ((v_43c42e.meta?.changes ?? 0) > 0) {
    await v_80a022(v_3f4e2e.env, "clone_follow", { actorId: v_43e90c, cloneId: v_6e0fd3 });
  }
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

v_f891e6.get("/:id/followers", async (v_3f4e2e) => {
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid clone id.");
  }
  const v_f71b56 = new URL(v_3f4e2e.req.url);
  const v_cf2260 = Number(v_f71b56.searchParams.get("limit") ?? 50);
  const v_02be30 = Math.max(1, Math.min(200, Number.isFinite(v_cf2260) ? v_cf2260 : 50));
  const v_18b8bf = (
    await v_3f4e2e.env.DB
      .prepare(
        `SELECT cf.id        AS followId,
                cf.user_id   AS userId,
                cf.created_at AS createdAt,
                u.name       AS userName,
                u.email      AS userEmail,
                u.avatar_url AS userAvatarUrl
           FROM clone_follows cf
           JOIN users u ON u.id = cf.user_id
          WHERE cf.clone_id = ? AND u.deleted_at IS NULL
          ORDER BY cf.id DESC
          LIMIT ?`,
      )
      .bind(v_6e0fd3, v_02be30)
      .all<{
        followId: number;
        userId: number;
        createdAt: string;
        userName: string | null;
        userEmail: string;
        userAvatarUrl: string | null;
      }>()
  ).results;
  return v_3f4e2e.json({
    items: v_18b8bf.map((v_cb35cb) => ({
      followId: v_cb35cb.followId,
      userId: v_cb35cb.userId,
      name: v_cb35cb.userName,
      email: v_cb35cb.userEmail,
      avatarUrl: v_cb35cb.userAvatarUrl,
      createdAt: v_cb35cb.createdAt,
    })),
  });
});

v_f891e6.get("/:id/like-status", v_6690d9, async (v_3f4e2e) => {
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid clone id.");
  }
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_3ac7e7 = await v_3f4e2e.env.DB
    .prepare(
      `SELECT 1 AS hit FROM feed_likes fl
         JOIN feeds f ON f.id = fl.feed_id
        WHERE fl.user_id = ? AND f.clone_id = ?
        LIMIT 1`,
    )
    .bind(v_43e90c, v_6e0fd3)
    .first<{ hit: number }>();
  return v_3f4e2e.json({ liked: v_3ac7e7 != null });
});

const v_df219a = v_1f4ea7.object({
  giftId: v_1f4ea7.string().min(1).max(80),
  giftName: v_1f4ea7.string().min(1).max(120),
  amount: v_1f4ea7.number().positive().max(10_000_000), 
  pin: v_1f4ea7.string().regex(/^\d{6}$/, "6-digit PIN required"),
});

v_f891e6.post("/:id/gift", v_6690d9, async (v_3f4e2e) => {
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid clone id.");
  }
  const v_f7e120 = v_3f4e2e.get("userId")!;
  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_df219a);

  const v_72b02d = v_3f4e2e.env.COMPANY_GIFT_WALLET;
  if (!v_72b02d) {
    throw new v_3ebe58(
      "INTERNAL_ERROR",
      "Server missing COMPANY_GIFT_WALLET configuration.",
    );
  }
  const v_a832b3 = Number(v_3f4e2e.env.PAYMENT_CURRENCY ?? "18") || 18;

  const v_eddf67 = await v_3f4e2e.env.DB
    .prepare(`SELECT id, xrun_member_id FROM users WHERE id = ? AND deleted_at IS NULL`)
    .bind(v_f7e120)
    .first<{ id: number; xrun_member_id: number | null }>();
  if (!v_eddf67) throw new v_3ebe58("UNAUTHENTICATED", "User not found.");
  if (!v_eddf67.xrun_member_id) {
    throw new v_3ebe58("CONFLICT", "xrun account not linked to your afterlife user.");
  }

  const v_eb25ce = await v_3f4e2e.env.DB
    .prepare(`SELECT id, owner_id FROM clones WHERE id = ? AND deleted_at IS NULL`)
    .bind(v_6e0fd3)
    .first<{ id: number; owner_id: number }>();
  if (!v_eb25ce) throw new v_3ebe58("NOT_FOUND", "Clone not found.");

  if (v_eb25ce.owner_id === v_f7e120) {
    throw new v_3ebe58("VALIDATION_FAILED", "Cannot send a gift to your own persona.");
  }

  const v_257b90 = await v_3f4e2e.env.DB
    .prepare(
      `SELECT id, xrun_wallet, xrun_member_id FROM users WHERE id = ? AND deleted_at IS NULL`,
    )
    .bind(v_eb25ce.owner_id)
    .first<{ id: number; xrun_wallet: string | null; xrun_member_id: number | null }>();

  if (!v_257b90?.xrun_member_id) {
    throw new v_3ebe58(
      "CONFLICT",
      "Persona owner has no xrun account — cannot route 40% share.",
    );
  }

  const v_c83285 = v_4d33b2.amount;
  const v_22c1da = Math.round(v_c83285 * 0.6 * 1_000_000) / 1_000_000;
  const v_1d6a30 = Math.round(v_c83285 * 0.4 * 1_000_000) / 1_000_000;

  const v_f5353f = await v_3f4e2e.env.DB
    .prepare(
      `INSERT INTO gift_logs
         (sender_user_id, clone_id, owner_user_id, gift_id, gift_name,
          total_amount, company_amount, owner_amount,
          company_address, owner_address, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    )
    .bind(
      v_f7e120,
      v_6e0fd3,
      v_eb25ce.owner_id,
      v_4d33b2.giftId,
      v_4d33b2.giftName,
      v_c83285,
      v_22c1da,
      v_1d6a30,
      v_72b02d,
      v_257b90.xrun_wallet, 
    )
    .run();
  const v_7a7843 = Number(v_f5353f.meta.last_row_id);

  const v_38fb16 = await v_7a6fc0(v_3f4e2e.env, {
    fromMember: v_eddf67.xrun_member_id,
    recipients: [
      { toAddress: v_72b02d, amount: String(v_22c1da) },
      { toMember: v_257b90.xrun_member_id, amount: String(v_1d6a30) },
    ],
    currency: v_a832b3,
    pin: v_4d33b2.pin,
    source: "afterlife.gift",
  });

  if (!v_38fb16.ok) {

    await v_3f4e2e.env.DB
      .prepare(
        `UPDATE gift_logs SET status = 'failed', failure_reason = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?`,
      )
      .bind(v_38fb16.reason ?? "unknown", v_7a7843)
      .run();

    if (v_38fb16.code === 401 || v_38fb16.code === 403) {
      throw new v_3ebe58("UNAUTHENTICATED", "PIN verification failed.", {
        reason: v_38fb16.reason,
      });
    }
    if (v_38fb16.code === 402) {
      throw new v_3ebe58("INSUFFICIENT_FUNDS", "Insufficient XRUN balance.", {
        reason: v_38fb16.reason,
      });
    }
    if (v_38fb16.code === 501 || v_38fb16.code === 404) {
      throw new v_3ebe58(
        "UPSTREAM_NOT_IMPLEMENTED",
        "xrun transfer endpoint not yet available.",
        { reason: v_38fb16.reason },
      );
    }
    throw new v_3ebe58("UPSTREAM_FAILURE", v_38fb16.reason ?? "xrun transfer error");
  }

  const v_e58fdc = v_72b02d.toLowerCase();
  const v_2cc4d6 = v_38fb16.txs.find((v_8d41d7) => v_8d41d7.toAddress.toLowerCase() === v_e58fdc);
  const v_ed8237 = v_38fb16.txs.find((v_8d41d7) => v_8d41d7.toAddress.toLowerCase() !== v_e58fdc);
  console.log(
    `[gift] xrun txs:`,
    v_38fb16.txs.map((v_8d41d7) => `${v_8d41d7.toAddress}=${(v_8d41d7.txHash ?? "").slice(0, 12)}`).join(" | "),
    `companyMatch=${!!v_2cc4d6} ownerMatch=${!!v_ed8237} newBalance=${v_38fb16.newBalance}`,
  );
  await v_3f4e2e.env.DB
    .prepare(
      `UPDATE gift_logs
          SET status = 'sent',
              tx_company = ?,
              tx_owner = ?,
              owner_address = COALESCE(?, owner_address),
              completed_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
    )
    .bind(
      v_2cc4d6?.txHash ?? null,
      v_ed8237?.txHash ?? null,
      v_ed8237?.toAddress ?? null, 
      v_7a7843,
    )
    .run();

  await v_74defc(v_3f4e2e, {
    userId: v_f7e120,
    action: "clone.gift.sent",
    details: {
      cloneId: v_6e0fd3,
      ownerId: v_eb25ce.owner_id,
      giftId: v_4d33b2.giftId,
      amount: v_c83285,
    },
  });

  await v_80a022(v_3f4e2e.env, "clone_gift", {
    actorId: v_f7e120,
    cloneId: v_6e0fd3,
    extraBody: `${v_4d33b2.giftName} 선물 (+${v_1d6a30} XRUN)`,
  });

  return v_3f4e2e.json({
    ok: true,
    gift: {
      id: v_7a7843,
      giftId: v_4d33b2.giftId,
      giftName: v_4d33b2.giftName,
      total: v_c83285,
      companyAmount: v_22c1da,
      ownerAmount: v_1d6a30,
      txCompany: v_2cc4d6?.txHash ?? null,
      txOwner: v_ed8237?.txHash ?? null,
      newBalance: v_38fb16.newBalance,
    },
  });
});

v_f891e6.post("/:id/block", v_6690d9, async (v_3f4e2e) => {
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid clone id.");
  }
  const v_43e90c = v_3f4e2e.get("userId")!;

  await v_3f4e2e.env.DB.batch([
    v_3f4e2e.env.DB.prepare(
      `INSERT OR IGNORE INTO clone_blocks (user_id, clone_id) VALUES (?, ?)`,
    ).bind(v_43e90c, v_6e0fd3),
    v_3f4e2e.env.DB.prepare(
      `DELETE FROM clone_follows WHERE user_id = ? AND clone_id = ?`,
    ).bind(v_43e90c, v_6e0fd3),
  ]);
  return v_3f4e2e.json({ ok: true, blocked: true });
});

v_f891e6.delete("/:id/block", v_6690d9, async (v_3f4e2e) => {
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid clone id.");
  }
  const v_43e90c = v_3f4e2e.get("userId")!;
  await v_3f4e2e.env.DB
    .prepare(`DELETE FROM clone_blocks WHERE user_id = ? AND clone_id = ?`)
    .bind(v_43e90c, v_6e0fd3)
    .run();
  return v_3f4e2e.json({ ok: true, blocked: false });
});
