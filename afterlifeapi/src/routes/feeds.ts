

import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_3ebe58 } from "../lib/errors";
import { v_4c95c2, v_1f4ea7 } from "../lib/validate";
import { v_6690d9 } from "../middleware/auth";
import {
  v_7adf64,
  v_ab84f6,
  v_5d4a51,
  v_efcb2d,
} from "../lib/cloneAccess";

export const v_96e8d7 = new v_b7c41b<v_de0a25>();

export const v_f1d06f = new v_b7c41b<v_de0a25>();

function v_31113b(v_3f4e2e): number {
  const v_389afb = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_389afb) || v_389afb <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid clone id.");
  }
  return v_389afb;
}
function v_102fa8(v_3f4e2e): number {
  const v_8e2335 = Number(v_3f4e2e.req.param("feedId"));
  if (!Number.isInteger(v_8e2335) || v_8e2335 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid feed id.");
  }
  return v_8e2335;
}

async function v_f1298d(
  v_a1651b,
  v_6e0fd3,
  v_43e90c,
  v_eb25ce,
): Promise<void> {
  if (v_eb25ce.owner_id === v_43e90c) return;
  const v_22da99 = await v_7adf64(v_a1651b, v_6e0fd3, v_43e90c);
  if (v_22da99 !== "owner") {
    throw new v_3ebe58("FORBIDDEN", "Owner/coowner only.");
  }
}

const v_722b6d = v_1f4ea7
  .object({
    content: v_1f4ea7.string().max(5000).optional(),
    mediaUrl: v_1f4ea7.url().max(500).optional(),
    mediaType: v_1f4ea7.enum(["image", "video", "short"]).optional(),
  })
  .refine((v_b6c474) => Boolean(v_b6c474.content || v_b6c474.mediaUrl), {
    message: "content 또는 mediaUrl 중 하나는 필수.",
  });

v_96e8d7.get("/:id/feeds", async (v_3f4e2e) => {
  const v_6e0fd3 = v_31113b(v_3f4e2e);
  const v_eb25ce = await v_5d4a51(v_3f4e2e.env.DB, v_6e0fd3);
  if (!v_eb25ce) throw new v_3ebe58("NOT_FOUND", "Clone not found.");

  const v_43e90c = await v_efcb2d(v_3f4e2e);
  let v_22da99 = null;
  if (v_43e90c) {
    if (v_43e90c === v_eb25ce.owner_id) v_22da99 = "owner";
    else if ((await v_7adf64(v_3f4e2e.env.DB, v_6e0fd3, v_43e90c)) !== null) {
      v_22da99 = "coowner";
    } else if (await v_ab84f6(v_3f4e2e.env.DB, v_6e0fd3, v_43e90c)) {
      v_22da99 = "follower";
    }
  }

  if (v_eb25ce.visibility === "private" && v_22da99 !== "owner" && v_22da99 !== "coowner") {
    throw new v_3ebe58("FORBIDDEN", "Private clone.");
  }
  if (v_eb25ce.visibility === "followers" && !v_22da99) {
    throw new v_3ebe58("FORBIDDEN", "Followers-only clone.");
  }

  const v_f71b56 = new URL(v_3f4e2e.req.url);
  const v_15c8c5 = v_f71b56.searchParams.get("cursor");
  const v_75cbf4 = v_15c8c5 ? Number(v_15c8c5) : null;
  const v_cf2260 = Number(v_f71b56.searchParams.get("limit") ?? 20);
  const v_02be30 = Math.max(1, Math.min(50, Number.isFinite(v_cf2260) ? v_cf2260 : 20));

  const v_abcc8d = ["clone_id = ?"];
  const v_925171 = [v_6e0fd3];
  if (v_75cbf4 && Number.isInteger(v_75cbf4) && v_75cbf4 > 0) {
    v_abcc8d.push("id < ?");
    v_925171.push(v_75cbf4);
  }

  const v_18b8bf = (
    await v_3f4e2e.env.DB
      .prepare(
        `SELECT id, clone_id, content, media_url, media_type, likes_count, created_at
           FROM feeds
          WHERE ${v_abcc8d.join(" AND ")}
          ORDER BY id DESC
          LIMIT ?`,
      )
      .bind(...v_925171, v_02be30 + 1)
      .all<{
        id: number;
        clone_id: number;
        content: string | null;
        media_url: string | null;
        media_type: string | null;
        likes_count: number;
        created_at: string;
      }>()
  ).results;

  const v_6bbe19 = v_18b8bf.length > v_02be30;
  const v_2365e9 = v_6bbe19 ? v_18b8bf.slice(0, v_02be30) : v_18b8bf;
  const v_64f859 =
    v_6bbe19 && v_2365e9.length > 0 ? v_2365e9[v_2365e9.length - 1]!.id : null;

  return v_3f4e2e.json({
    items: v_2365e9.map((v_cb35cb) => ({
      id: v_cb35cb.id,
      cloneId: v_cb35cb.clone_id,
      content: v_cb35cb.content,
      mediaUrl: v_cb35cb.media_url,
      mediaType: v_cb35cb.media_type,
      likesCount: v_cb35cb.likes_count,
      visibility: v_eb25ce.visibility,
      createdAt: v_cb35cb.created_at,
    })),
    nextCursor: v_64f859,
  });
});

v_f1d06f.get("/discover", async (v_3f4e2e) => {
  const v_f71b56 = new URL(v_3f4e2e.req.url);
  const v_15c8c5 = v_f71b56.searchParams.get("cursor");
  const v_75cbf4 = v_15c8c5 ? Number(v_15c8c5) : null;
  const v_cf2260 = Number(v_f71b56.searchParams.get("limit") ?? 20);
  const v_02be30 = Math.max(1, Math.min(50, Number.isFinite(v_cf2260) ? v_cf2260 : 20));

  const v_abcc8d = [
    "c.deletion_state = 'active'",
    "c.deleted_at IS NULL",
    "c.clone_type != 'memlow'",
    "c.visibility = 'public'",

  ];
  const v_925171 = [];
  if (v_75cbf4 && Number.isInteger(v_75cbf4) && v_75cbf4 > 0) {
    v_abcc8d.push("c.id < ?");
    v_925171.push(v_75cbf4);
  }

  const v_18b8bf = (
    await v_3f4e2e.env.DB
      .prepare(
        `SELECT c.id              AS cloneId,
                c.name             AS cloneName,
                c.username         AS cloneUsername,
                c.description      AS cloneDescription,
                c.avatar_url       AS cloneAvatarUrl,
                c.clone_type       AS cloneType,
                c.created_at       AS cloneCreatedAt,
                f.id               AS feedId,
                f.content          AS feedContent,
                f.media_url        AS feedMediaUrl,
                f.media_type       AS feedMediaType,
                f.likes_count      AS feedLikesCount,
                f.created_at       AS feedCreatedAt
           FROM clones c
           LEFT JOIN feeds f ON f.id = (
             SELECT id FROM feeds WHERE clone_id = c.id
             ORDER BY id DESC LIMIT 1
           )
          WHERE ${v_abcc8d.join(" AND ")}
          ORDER BY c.id DESC
          LIMIT ?`,
      )
      .bind(...v_925171, v_02be30 + 1)
      .all<{
        cloneId: number;
        cloneName: string;
        cloneUsername: string;
        cloneDescription: string | null;
        cloneAvatarUrl: string | null;
        cloneType: string;
        cloneCreatedAt: string;
        feedId: number | null;
        feedContent: string | null;
        feedMediaUrl: string | null;
        feedMediaType: string | null;
        feedLikesCount: number | null;
        feedCreatedAt: string | null;
      }>()
  ).results;

  const v_6bbe19 = v_18b8bf.length > v_02be30;
  const v_2365e9 = v_6bbe19 ? v_18b8bf.slice(0, v_02be30) : v_18b8bf;
  const v_64f859 =
    v_6bbe19 && v_2365e9.length > 0 ? v_2365e9[v_2365e9.length - 1]!.cloneId : null;

  const v_8b86f5 = Array.from(new Set(v_2365e9.map((v_cb35cb) => v_cb35cb.cloneId)));
  const v_9afb14 = new Map<number, string[]>();
  if (v_8b86f5.length > 0) {
    const v_1cdc07 = v_8b86f5.map(() => "?").join(",");
    const v_b07d8e = (
      await v_3f4e2e.env.DB
        .prepare(
          `SELECT clone_id, interest FROM clone_interests
            WHERE clone_id IN (${v_1cdc07})`,
        )
        .bind(...v_8b86f5)
        .all<{ clone_id: number; interest: string }>()
    ).results ?? [];
    for (const v_3ac7e7 of v_b07d8e) {
      const v_d0c056 = v_9afb14.get(v_3ac7e7.clone_id) ?? [];
      v_d0c056.push(v_3ac7e7.interest);
      v_9afb14.set(v_3ac7e7.clone_id, v_d0c056);
    }
  }

  return v_3f4e2e.json({
    items: v_2365e9.map((v_cb35cb) => ({

      id: v_cb35cb.feedId ?? -v_cb35cb.cloneId,
      cloneId: v_cb35cb.cloneId,

      content: v_cb35cb.feedContent ?? v_cb35cb.cloneDescription ?? "",
      mediaUrl: v_cb35cb.feedMediaUrl ?? v_cb35cb.cloneAvatarUrl ?? null,
      mediaType: v_cb35cb.feedMediaType,
      likesCount: v_cb35cb.feedLikesCount ?? 0,
      createdAt: v_cb35cb.feedCreatedAt ?? v_cb35cb.cloneCreatedAt,
      clone: {
        id: v_cb35cb.cloneId,
        name: v_cb35cb.cloneName,
        username: v_cb35cb.cloneUsername,
        avatarUrl: v_cb35cb.cloneAvatarUrl,
        cloneType: v_cb35cb.cloneType,
      },
      interests: v_9afb14.get(v_cb35cb.cloneId) ?? [],
    })),
    nextCursor: v_64f859,
  });
});

v_96e8d7.post("/:id/feeds", v_6690d9, async (v_3f4e2e) => {
  const v_6e0fd3 = v_31113b(v_3f4e2e);
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_eb25ce = await v_5d4a51(v_3f4e2e.env.DB, v_6e0fd3);
  if (!v_eb25ce) throw new v_3ebe58("NOT_FOUND", "Clone not found.");
  await v_f1298d(v_3f4e2e.env.DB, v_6e0fd3, v_43e90c, v_eb25ce);

  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_722b6d);
  const v_cb35cb = await v_3f4e2e.env.DB
    .prepare(
      `INSERT INTO feeds (clone_id, content, media_url, media_type, created_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    )
    .bind(
      v_6e0fd3,
      v_4d33b2.content ?? null,
      v_4d33b2.mediaUrl ?? null,
      v_4d33b2.mediaType ?? null,
    )
    .run();
  const v_c09aa8 = Number(v_cb35cb.meta.last_row_id);

  return v_3f4e2e.json(
    {
      feed: {
        id: v_c09aa8,
        cloneId: v_6e0fd3,
        content: v_4d33b2.content ?? null,
        mediaUrl: v_4d33b2.mediaUrl ?? null,
        mediaType: v_4d33b2.mediaType ?? null,
        likesCount: 0,
        visibility: v_eb25ce.visibility,
        createdAt: new Date().toISOString(),
      },
    },
    201,
  );
});

async function v_c39991(
  v_a1651b,
  v_c09aa8,
): Promise<{ id: number; cloneId: number; visibility: string; ownerId: number } | null> {
  const v_3ac7e7 = await v_a1651b
    .prepare(
      `SELECT f.id AS id, f.clone_id AS cloneId, c.visibility AS visibility, c.owner_id AS ownerId
         FROM feeds f
         JOIN clones c ON c.id = f.clone_id
        WHERE f.id = ? AND c.deleted_at IS NULL`,
    )
    .bind(v_c09aa8)
    .first<{ id: number; cloneId: number; visibility: string; ownerId: number }>();
  return v_3ac7e7 ?? null;
}

v_f1d06f.post("/:id/like", v_6690d9, async (v_3f4e2e) => {
  const v_c09aa8 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_c09aa8) || v_c09aa8 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid feed id.");
  }
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_2db2a5 = await v_c39991(v_3f4e2e.env.DB, v_c09aa8);
  if (!v_2db2a5) throw new v_3ebe58("NOT_FOUND", "Feed not found.");

  if (v_2db2a5.visibility === "private") {
    if (v_2db2a5.ownerId !== v_43e90c) {
      const v_22da99 = await v_7adf64(v_3f4e2e.env.DB, v_2db2a5.cloneId, v_43e90c);
      if (v_22da99 === null) throw new v_3ebe58("FORBIDDEN", "Private clone.");
    }
  }

  await v_3f4e2e.env.DB
    .prepare(
      `INSERT OR IGNORE INTO feed_likes (feed_id, user_id) VALUES (?, ?)`,
    )
    .bind(v_c09aa8, v_43e90c)
    .run();

  const v_3ac7e7 = await v_3f4e2e.env.DB
    .prepare(`SELECT likes_count FROM feeds WHERE id = ?`)
    .bind(v_c09aa8)
    .first<{ likes_count: number }>();
  return v_3f4e2e.json({ ok: true, liked: true, likesCount: v_3ac7e7?.likes_count ?? 0 });
});

v_f1d06f.delete("/:id/like", v_6690d9, async (v_3f4e2e) => {
  const v_c09aa8 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_c09aa8) || v_c09aa8 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid feed id.");
  }
  const v_43e90c = v_3f4e2e.get("userId")!;
  await v_3f4e2e.env.DB
    .prepare(`DELETE FROM feed_likes WHERE feed_id = ? AND user_id = ?`)
    .bind(v_c09aa8, v_43e90c)
    .run();

  const v_3ac7e7 = await v_3f4e2e.env.DB
    .prepare(`SELECT likes_count FROM feeds WHERE id = ?`)
    .bind(v_c09aa8)
    .first<{ likes_count: number }>();
  return v_3f4e2e.json({ ok: true, liked: false, likesCount: v_3ac7e7?.likes_count ?? 0 });
});

v_f1d06f.get("/:id/likes", async (v_3f4e2e) => {
  const v_c09aa8 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_c09aa8) || v_c09aa8 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid feed id.");
  }
  const v_f71b56 = new URL(v_3f4e2e.req.url);
  const v_15c8c5 = v_f71b56.searchParams.get("cursor");
  const v_75cbf4 = v_15c8c5 ? Number(v_15c8c5) : null;
  const v_cf2260 = Number(v_f71b56.searchParams.get("limit") ?? 30);
  const v_02be30 = Math.max(1, Math.min(100, Number.isFinite(v_cf2260) ? v_cf2260 : 30));

  const v_abcc8d = ["fl.feed_id = ?"];
  const v_925171 = [v_c09aa8];
  if (v_75cbf4 && Number.isInteger(v_75cbf4) && v_75cbf4 > 0) {
    v_abcc8d.push("fl.id < ?");
    v_925171.push(v_75cbf4);
  }
  const v_18b8bf = (
    await v_3f4e2e.env.DB
      .prepare(
        `SELECT fl.id        AS likeId,
                fl.user_id   AS userId,
                fl.created_at AS createdAt,
                u.name       AS userName,
                u.email      AS userEmail,
                u.avatar_url AS userAvatarUrl
           FROM feed_likes fl
           JOIN users u ON u.id = fl.user_id
          WHERE ${v_abcc8d.join(" AND ")} AND u.deleted_at IS NULL
          ORDER BY fl.id DESC
          LIMIT ?`,
      )
      .bind(...v_925171, v_02be30 + 1)
      .all<{
        likeId: number;
        userId: number;
        createdAt: string;
        userName: string | null;
        userEmail: string;
        userAvatarUrl: string | null;
      }>()
  ).results;

  const v_6bbe19 = v_18b8bf.length > v_02be30;
  const v_2365e9 = v_6bbe19 ? v_18b8bf.slice(0, v_02be30) : v_18b8bf;
  const v_64f859 =
    v_6bbe19 && v_2365e9.length > 0 ? v_2365e9[v_2365e9.length - 1]!.likeId : null;

  return v_3f4e2e.json({
    items: v_2365e9.map((v_cb35cb) => ({
      likeId: v_cb35cb.likeId,
      userId: v_cb35cb.userId,
      name: v_cb35cb.userName,
      email: v_cb35cb.userEmail,
      avatarUrl: v_cb35cb.userAvatarUrl,
      createdAt: v_cb35cb.createdAt,
    })),
    nextCursor: v_64f859,
  });
});

v_96e8d7.post("/:id/like", v_6690d9, async (v_3f4e2e) => {
  const v_6e0fd3 = v_31113b(v_3f4e2e);
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_eb25ce = await v_5d4a51(v_3f4e2e.env.DB, v_6e0fd3);
  if (!v_eb25ce) throw new v_3ebe58("NOT_FOUND", "Clone not found.");
  if (v_eb25ce.visibility === "private") {
    if (v_eb25ce.owner_id !== v_43e90c) {
      const v_22da99 = await v_7adf64(v_3f4e2e.env.DB, v_6e0fd3, v_43e90c);
      if (v_22da99 === null) throw new v_3ebe58("FORBIDDEN", "Private clone.");
    }
  }

  let v_c09aa8;
  let v_3459a5 = false;
  const v_3c8572 = await v_3f4e2e.env.DB
    .prepare(`SELECT id FROM feeds WHERE clone_id = ? ORDER BY id DESC LIMIT 1`)
    .bind(v_6e0fd3)
    .first<{ id: number }>();
  if (v_3c8572) {
    v_c09aa8 = v_3c8572.id;
  } else {
    const v_1de203 = await v_3f4e2e.env.DB
      .prepare(`SELECT description, avatar_url FROM clones WHERE id = ?`)
      .bind(v_6e0fd3)
      .first<{ description: string | null; avatar_url: string | null }>();
    const v_cb35cb = await v_3f4e2e.env.DB
      .prepare(
        `INSERT INTO feeds (clone_id, content, media_url, media_type, created_at)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      )
      .bind(
        v_6e0fd3,
        v_1de203?.description ?? "",
        v_1de203?.avatar_url ?? null,
        null,
      )
      .run();
    v_c09aa8 = Number(v_cb35cb.meta.last_row_id);
    v_3459a5 = true;
  }

  await v_3f4e2e.env.DB
    .prepare(`INSERT OR IGNORE INTO feed_likes (feed_id, user_id) VALUES (?, ?)`)
    .bind(v_c09aa8, v_43e90c)
    .run();

  const v_7b3f91 = await v_3f4e2e.env.DB
    .prepare(`SELECT likes_count FROM feeds WHERE id = ?`)
    .bind(v_c09aa8)
    .first<{ likes_count: number }>();
  return v_3f4e2e.json({
    ok: true,
    liked: true,
    feedId: v_c09aa8,
    promoted: v_3459a5,
    likesCount: v_7b3f91?.likes_count ?? 0,
  });
});

v_96e8d7.delete("/:id/like", v_6690d9, async (v_3f4e2e) => {
  const v_6e0fd3 = v_31113b(v_3f4e2e);
  const v_43e90c = v_3f4e2e.get("userId")!;

  const v_8b5cd8 = await v_3f4e2e.env.DB
    .prepare(`SELECT id FROM feeds WHERE clone_id = ? ORDER BY id DESC LIMIT 1`)
    .bind(v_6e0fd3)
    .first<{ id: number }>();
  if (!v_8b5cd8) return v_3f4e2e.json({ ok: true, liked: false, likesCount: 0 });
  await v_3f4e2e.env.DB
    .prepare(`DELETE FROM feed_likes WHERE feed_id = ? AND user_id = ?`)
    .bind(v_8b5cd8.id, v_43e90c)
    .run();
  const v_7b3f91 = await v_3f4e2e.env.DB
    .prepare(`SELECT likes_count FROM feeds WHERE id = ?`)
    .bind(v_8b5cd8.id)
    .first<{ likes_count: number }>();
  return v_3f4e2e.json({ ok: true, liked: false, feedId: v_8b5cd8.id, likesCount: v_7b3f91?.likes_count ?? 0 });
});

v_96e8d7.get("/:id/likes", async (v_3f4e2e) => {
  const v_6e0fd3 = v_31113b(v_3f4e2e);
  const v_f71b56 = new URL(v_3f4e2e.req.url);
  const v_cf2260 = Number(v_f71b56.searchParams.get("limit") ?? 50);
  const v_02be30 = Math.max(1, Math.min(200, Number.isFinite(v_cf2260) ? v_cf2260 : 50));

  const v_18b8bf = (
    await v_3f4e2e.env.DB
      .prepare(
        `SELECT fl.user_id     AS userId,
                MAX(fl.id)     AS likeId,
                MAX(fl.created_at) AS createdAt,
                u.name         AS userName,
                u.email        AS userEmail,
                u.avatar_url   AS userAvatarUrl
           FROM feed_likes fl
           JOIN feeds f ON f.id = fl.feed_id
           JOIN users u ON u.id = fl.user_id
          WHERE f.clone_id = ? AND u.deleted_at IS NULL
          GROUP BY fl.user_id, u.name, u.email, u.avatar_url
          ORDER BY likeId DESC
          LIMIT ?`,
      )
      .bind(v_6e0fd3, v_02be30)
      .all<{
        userId: number;
        likeId: number;
        createdAt: string;
        userName: string | null;
        userEmail: string;
        userAvatarUrl: string | null;
      }>()
  ).results;

  return v_3f4e2e.json({
    items: v_18b8bf.map((v_cb35cb) => ({
      likeId: v_cb35cb.likeId,
      userId: v_cb35cb.userId,
      name: v_cb35cb.userName,
      email: v_cb35cb.userEmail,
      avatarUrl: v_cb35cb.userAvatarUrl,
      createdAt: v_cb35cb.createdAt,
    })),
    nextCursor: null,
  });
});

v_96e8d7.delete("/:id/feeds/:feedId", v_6690d9, async (v_3f4e2e) => {
  const v_6e0fd3 = v_31113b(v_3f4e2e);
  const v_c09aa8 = v_102fa8(v_3f4e2e);
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_eb25ce = await v_5d4a51(v_3f4e2e.env.DB, v_6e0fd3);
  if (!v_eb25ce) throw new v_3ebe58("NOT_FOUND", "Clone not found.");
  await v_f1298d(v_3f4e2e.env.DB, v_6e0fd3, v_43e90c, v_eb25ce);

  const v_8f00b9 = await v_3f4e2e.env.DB
    .prepare(`DELETE FROM feeds WHERE id = ? AND clone_id = ?`)
    .bind(v_c09aa8, v_6e0fd3)
    .run();

  if (!v_8f00b9.success || (v_8f00b9.meta.changes ?? 0) === 0) {
    throw new v_3ebe58("NOT_FOUND", "Feed not found.");
  }
  return v_3f4e2e.json({ ok: true });
});
