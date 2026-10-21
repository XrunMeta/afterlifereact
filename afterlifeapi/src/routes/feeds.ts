

import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_3ebe58 } from "../lib/errors";
import { v_4c95c2, v_1f4ea7 } from "../lib/validate";
import { v_6690d9 } from "../middleware/auth";
import { v_80a022 } from "../lib/notify";
import { v_dd9d7c, v_6f97bc, v_cf0463 } from "../lib/interactions";
import { v_f45eef, v_5bb199 } from "../lib/penaltyGate";
import { v_991113 } from "../lib/conversationLeave";
import {
  v_74c502,
  v_a9ae28,
  v_7adf64,
  v_ab84f6,
  v_a697ec,
  v_5d4a51,
  v_efcb2d,
} from "../lib/cloneAccess";

export const v_96e8d7 = new v_b7c41b<v_de0a25>();

export const v_f1d06f = new v_b7c41b<v_de0a25>();

function v_31113b(v_3f4e2e): number {
  const v_389afb = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_389afb) || v_389afb <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "잘못된 페르소나 ID 에요.");
  }
  return v_389afb;
}
function v_102fa8(v_3f4e2e): number {
  const v_8e2335 = Number(v_3f4e2e.req.param("feedId"));
  if (!Number.isInteger(v_8e2335) || v_8e2335 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "잘못된 피드 ID 에요.");
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
    throw new v_3ebe58("FORBIDDEN", "소유자만 가능해요.");
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
  if (!v_eb25ce) throw new v_3ebe58("NOT_FOUND", "페르소나를 찾을 수 없어요.");

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
    throw new v_3ebe58("FORBIDDEN", "비공개 페르소나예요.");
  }
  if (v_eb25ce.visibility === "followers" && !v_22da99) {
    throw new v_3ebe58("FORBIDDEN", "팔로워에게만 공개된 페르소나예요.");
  }

  if (v_a697ec(v_eb25ce, v_22da99)) {
    throw new v_3ebe58("FORBIDDEN", "이 페르소나는 현재 일시 중지 상태예요.");
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

  const v_013af2 = await v_efcb2d(v_3f4e2e);

  const v_abcc8d = [
    v_74c502("c"),
    "c.clone_type != 'memlow'",
  ];
  const v_925171 = [];

  if (v_013af2) {

    v_abcc8d.push(
      `(
         (c.owner_id = ? AND c.visibility != 'private')
         OR (${v_a9ae28("c")} AND (
              c.visibility = 'public'
              OR (c.visibility = 'followers' AND
                  EXISTS (SELECT 1 FROM clone_follows cf
                           WHERE cf.clone_id = c.id AND cf.user_id = ?))
              OR (c.visibility = 'selected' AND
                  EXISTS (SELECT 1 FROM clone_allowed_viewers cav
                           WHERE cav.clone_id = c.id AND cav.user_id = ?))
         ))
       )`,
    );
    v_925171.push(v_013af2, v_013af2, v_013af2);
  } else {

    v_abcc8d.push(`c.visibility = 'public' AND ${v_a9ae28("c")}`);
  }

  if (v_013af2) {

    v_abcc8d.push("c.id NOT IN (SELECT clone_id FROM clone_blocks WHERE user_id = ?)");
    v_925171.push(v_013af2);
    v_abcc8d.push(
      "c.owner_id NOT IN (SELECT blocked_id FROM user_blocks WHERE blocker_id = ?)",
    );
    v_925171.push(v_013af2);
  }
  if (v_75cbf4 && Number.isInteger(v_75cbf4) && v_75cbf4 > 0) {
    v_abcc8d.push("c.id < ?");
    v_925171.push(v_75cbf4);
  }

  const v_dd2234 = v_013af2
    ? `COALESCE((SELECT MIN(100, SUM(ie.score)) FROM intimacy_events ie
                  WHERE ie.user_id = ? AND ie.clone_id = c.id ${v_991113("ie")}), 0) AS myIntimacy`
    : `0 AS myIntimacy`;
  const v_9434a4 = v_013af2 ? [v_013af2] : [];

  const v_18b8bf = (
    await v_3f4e2e.env.DB
      .prepare(
        `SELECT c.id              AS cloneId,
                c.owner_id         AS cloneOwnerId,
                c.name             AS cloneName,
                c.username         AS cloneUsername,
                c.description      AS cloneDescription,
                c.avatar_url       AS cloneAvatarUrl,
                c.clone_type       AS cloneType,
                c.created_at       AS cloneCreatedAt,
                c.visibility       AS cloneVisibility,
                u.name             AS ownerName,
                u.avatar_url       AS ownerAvatarUrl,
                f.id               AS feedId,
                f.content          AS feedContent,
                f.media_url        AS feedMediaUrl,
                f.media_type       AS feedMediaType,
                f.created_at       AS feedCreatedAt,
                (SELECT COALESCE(SUM(f2.likes_count), 0) FROM feeds f2
                  WHERE f2.clone_id = c.id) AS likesCount,
                (SELECT COUNT(*) FROM feed_comments fc
                   JOIN feeds f3 ON f3.id = fc.feed_id
                   WHERE f3.clone_id = c.id) AS commentsCount,
                (SELECT COUNT(*) FROM gift_logs gl
                   WHERE gl.clone_id = c.id) AS giftsReceived,
                ${v_dd2234}
           FROM clones c
           LEFT JOIN users u ON u.id = c.owner_id
           LEFT JOIN feeds f ON f.id = (
             SELECT id FROM feeds WHERE clone_id = c.id
             ORDER BY id DESC LIMIT 1
           )
          WHERE ${v_abcc8d.join(" AND ")}
          ORDER BY c.id DESC
          LIMIT ?`,
      )
      .bind(...v_9434a4, ...v_925171, v_02be30 + 1)
      .all<{
        cloneId: number;
        cloneOwnerId: number;
        cloneName: string;
        cloneUsername: string;
        cloneDescription: string | null;
        cloneAvatarUrl: string | null;
        cloneType: string;
        cloneCreatedAt: string;
        cloneVisibility: string;
        ownerName: string | null;
        ownerAvatarUrl: string | null;
        feedId: number | null;
        feedContent: string | null;
        feedMediaUrl: string | null;
        feedMediaType: string | null;
        feedCreatedAt: string | null;
        likesCount: number;
        commentsCount: number;
        giftsReceived: number;
        myIntimacy: number;
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

  const v_ff3805 = new Set<number>();
  if (v_013af2) {
    const v_2b96e4 = v_2365e9.map((v_cb35cb) => v_cb35cb.cloneId);
    if (v_2b96e4.length > 0) {
      const v_1cdc07 = v_2b96e4.map(() => "?").join(",");
      const v_59d4e3 = (
        await v_3f4e2e.env.DB
          .prepare(
            `SELECT DISTINCT f.clone_id AS clone_id FROM feed_likes fl
               JOIN feeds f ON f.id = fl.feed_id
              WHERE fl.user_id = ? AND f.clone_id IN (${v_1cdc07})`,
          )
          .bind(v_013af2, ...v_2b96e4)
          .all<{ clone_id: number }>()
      ).results ?? [];
      for (const v_3ac7e7 of v_59d4e3) v_ff3805.add(v_3ac7e7.clone_id);
    }
  }

  return v_3f4e2e.json({
    items: v_2365e9.map((v_cb35cb) => ({

      id: v_cb35cb.feedId ?? -v_cb35cb.cloneId,
      cloneId: v_cb35cb.cloneId,

      content: v_cb35cb.feedContent ?? v_cb35cb.cloneDescription ?? "",
      mediaUrl: v_cb35cb.feedMediaUrl ?? v_cb35cb.cloneAvatarUrl ?? null,
      mediaType: v_cb35cb.feedMediaType,

      likesCount: v_cb35cb.likesCount,
      commentsCount: v_cb35cb.commentsCount,

      likedByMe: v_ff3805.has(v_cb35cb.cloneId),
      createdAt: v_cb35cb.feedCreatedAt ?? v_cb35cb.cloneCreatedAt,
      clone: {
        id: v_cb35cb.cloneId,

        ownerId: v_cb35cb.cloneOwnerId,
        name: v_cb35cb.cloneName,
        username: v_cb35cb.cloneUsername,
        avatarUrl: v_cb35cb.cloneAvatarUrl,
        cloneType: v_cb35cb.cloneType,
        visibility: v_cb35cb.cloneVisibility,

        ownerName: v_cb35cb.ownerName,
        ownerAvatarUrl: v_cb35cb.ownerAvatarUrl,
      },

      giftsReceived: v_cb35cb.giftsReceived,
      interests: v_9afb14.get(v_cb35cb.cloneId) ?? [],

      myIntimacy: Math.min(100, Math.max(0, v_cb35cb.myIntimacy ?? 0)),
    })),
    nextCursor: v_64f859,
  });
});

v_96e8d7.post("/:id/feeds", v_6690d9, async (v_3f4e2e) => {
  const v_6e0fd3 = v_31113b(v_3f4e2e);
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_eb25ce = await v_5d4a51(v_3f4e2e.env.DB, v_6e0fd3);
  if (!v_eb25ce) throw new v_3ebe58("NOT_FOUND", "페르소나를 찾을 수 없어요.");
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
        WHERE f.id = ? AND ${v_74c502("c")}`,
    )
    .bind(v_c09aa8)
    .first<{ id: number; cloneId: number; visibility: string; ownerId: number }>();
  return v_3ac7e7 ?? null;
}

v_f1d06f.post("/:id/like", v_6690d9, async (v_3f4e2e) => {
  const v_c09aa8 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_c09aa8) || v_c09aa8 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "잘못된 피드 ID 에요.");
  }
  const v_43e90c = v_3f4e2e.get("userId")!;

  await v_5bb199(v_3f4e2e.env.DB, v_43e90c);
  const v_2db2a5 = await v_c39991(v_3f4e2e.env.DB, v_c09aa8);
  if (!v_2db2a5) throw new v_3ebe58("NOT_FOUND", "피드를 찾을 수 없어요.");

  if (v_2db2a5.visibility === "private") {
    if (v_2db2a5.ownerId !== v_43e90c) {
      const v_22da99 = await v_7adf64(v_3f4e2e.env.DB, v_2db2a5.cloneId, v_43e90c);
      if (v_22da99 === null) throw new v_3ebe58("FORBIDDEN", "비공개 페르소나예요.");
    }
  }

  const v_43af15 = await v_3f4e2e.env.DB
    .prepare(
      `INSERT OR IGNORE INTO feed_likes (feed_id, user_id) VALUES (?, ?)`,
    )
    .bind(v_c09aa8, v_43e90c)
    .run();
  const v_81161e = (v_43af15.meta?.changes ?? 0) > 0;

  const v_3ac7e7 = await v_3f4e2e.env.DB
    .prepare(`SELECT likes_count FROM feeds WHERE id = ?`)
    .bind(v_c09aa8)
    .first<{ likes_count: number }>();
  if (v_81161e) {

    await v_80a022(v_3f4e2e.env, "clone_like", { actorId: v_43e90c, cloneId: v_2db2a5.cloneId });

    await v_dd9d7c(v_3f4e2e.env, v_43e90c, v_2db2a5.cloneId, "feed");

    await v_6f97bc(v_3f4e2e.env, v_43e90c, v_2db2a5.cloneId, v_c09aa8, v_cf0463.feed);
  }
  return v_3f4e2e.json({ ok: true, liked: true, likesCount: v_3ac7e7?.likes_count ?? 0 });
});

v_f1d06f.delete("/:id/like", v_6690d9, async (v_3f4e2e) => {
  const v_c09aa8 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_c09aa8) || v_c09aa8 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "잘못된 피드 ID 에요.");
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
    throw new v_3ebe58("VALIDATION_FAILED", "잘못된 피드 ID 에요.");
  }
  const v_f71b56 = new URL(v_3f4e2e.req.url);
  const v_15c8c5 = v_f71b56.searchParams.get("cursor");
  const v_75cbf4 = v_15c8c5 ? Number(v_15c8c5) : null;
  const v_cf2260 = Number(v_f71b56.searchParams.get("limit") ?? 30);
  const v_02be30 = Math.max(1, Math.min(100, Number.isFinite(v_cf2260) ? v_cf2260 : 30));

  const v_013af2 = await v_efcb2d(v_3f4e2e);
  const v_abcc8d = ["fl.feed_id = ?"];
  const v_925171 = [v_c09aa8];
  if (v_013af2) {
    v_abcc8d.push("fl.user_id NOT IN (SELECT blocked_id FROM user_blocks WHERE blocker_id = ?)");
    v_925171.push(v_013af2);
  }
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

  await v_5bb199(v_3f4e2e.env.DB, v_43e90c);
  const v_eb25ce = await v_5d4a51(v_3f4e2e.env.DB, v_6e0fd3);
  if (!v_eb25ce) throw new v_3ebe58("NOT_FOUND", "페르소나를 찾을 수 없어요.");
  if (v_eb25ce.visibility === "private") {
    if (v_eb25ce.owner_id !== v_43e90c) {
      const v_22da99 = await v_7adf64(v_3f4e2e.env.DB, v_6e0fd3, v_43e90c);
      if (v_22da99 === null) throw new v_3ebe58("FORBIDDEN", "비공개 페르소나예요.");
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

  const v_43af15 = await v_3f4e2e.env.DB
    .prepare(`INSERT OR IGNORE INTO feed_likes (feed_id, user_id) VALUES (?, ?)`)
    .bind(v_c09aa8, v_43e90c)
    .run();
  const v_81161e = (v_43af15.meta?.changes ?? 0) > 0;

  const v_7b3f91 = await v_3f4e2e.env.DB
    .prepare(`SELECT likes_count FROM feeds WHERE id = ?`)
    .bind(v_c09aa8)
    .first<{ likes_count: number }>();
  if (v_81161e) {

    await v_80a022(v_3f4e2e.env, "clone_like", { actorId: v_43e90c, cloneId: v_6e0fd3 });
    await v_dd9d7c(v_3f4e2e.env, v_43e90c, v_6e0fd3, "feed");

    await v_6f97bc(v_3f4e2e.env, v_43e90c, v_6e0fd3, v_c09aa8, v_cf0463.feed);
  }
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

const v_9c5bc5 = v_1f4ea7.object({
  content: v_1f4ea7.string().min(1).max(2000),

  parentCommentId: v_1f4ea7.number().int().positive().optional(),
});

v_f1d06f.post("/:id/comments", v_6690d9, async (v_3f4e2e) => {
  const v_c09aa8 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_c09aa8) || v_c09aa8 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "잘못된 피드 ID 에요.");
  }
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_9c5bc5);

  const v_2db2a5 = await v_c39991(v_3f4e2e.env.DB, v_c09aa8);
  if (!v_2db2a5) throw new v_3ebe58("NOT_FOUND", "피드를 찾을 수 없어요.");
  if (v_2db2a5.visibility === "private") {
    if (v_2db2a5.ownerId !== v_43e90c) {
      const v_22da99 = await v_7adf64(v_3f4e2e.env.DB, v_2db2a5.cloneId, v_43e90c);
      if (v_22da99 === null) throw new v_3ebe58("FORBIDDEN", "비공개 페르소나예요.");
    }
  }

  if (v_2db2a5.ownerId !== v_43e90c) {
    const v_3bebca = await v_3f4e2e.env.DB
      .prepare(`SELECT 1 AS x FROM user_blocks WHERE blocker_id = ? AND blocked_id = ? LIMIT 1`)
      .bind(v_2db2a5.ownerId, v_43e90c)
      .first();
    if (v_3bebca) throw new v_3ebe58("FORBIDDEN", "댓글을 작성할 수 없어요.");
  }

  await v_f45eef(v_3f4e2e.env.DB, v_43e90c);

  let v_ab1564 = null;
  if (v_4d33b2.parentCommentId) {
    const v_4eab4b = await v_3f4e2e.env.DB
      .prepare(
        `SELECT id, feed_id AS feedId, parent_comment_id AS parentId
           FROM feed_comments
          WHERE id = ?`,
      )
      .bind(v_4d33b2.parentCommentId)
      .first<{ id: number; feedId: number; parentId: number | null }>();
    if (!v_4eab4b) throw new v_3ebe58("NOT_FOUND", "댓글을 찾을 수 없어요.");
    if (v_4eab4b.feedId !== v_c09aa8) {
      throw new v_3ebe58("VALIDATION_FAILED", "부모 댓글이 다른 피드에 속해 있어요.");
    }

    v_ab1564 = v_4eab4b.parentId ?? v_4eab4b.id;
  }
  const v_cb35cb = await v_3f4e2e.env.DB
    .prepare(
      `INSERT INTO feed_comments (feed_id, user_id, content, parent_comment_id)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(v_c09aa8, v_43e90c, v_4d33b2.content.trim(), v_ab1564)
    .run();

  await v_80a022(v_3f4e2e.env, "clone_comment", {
    actorId: v_43e90c,
    cloneId: v_2db2a5.cloneId,
    extraBody: v_4d33b2.content.trim(),
    feedId: v_c09aa8,
  });
  await v_dd9d7c(v_3f4e2e.env, v_43e90c, v_2db2a5.cloneId, "feed");

  await v_6f97bc(v_3f4e2e.env, v_43e90c, v_2db2a5.cloneId, v_c09aa8, v_cf0463.feed);
  return v_3f4e2e.json(
    {
      ok: true,
      comment: {
        id: Number(v_cb35cb.meta.last_row_id),
        feedId: v_c09aa8,
        userId: v_43e90c,
        content: v_4d33b2.content.trim(),
        parentCommentId: v_ab1564,
      },
    },
    201,
  );
});

v_f1d06f.delete("/:id/comments/:cid", v_6690d9, async (v_3f4e2e) => {
  const v_c09aa8 = Number(v_3f4e2e.req.param("id"));
  const v_062ae9 = Number(v_3f4e2e.req.param("cid"));
  if (!Number.isInteger(v_c09aa8) || v_c09aa8 <= 0 || !Number.isInteger(v_062ae9) || v_062ae9 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "잘못된 ID 에요.");
  }
  const v_43e90c = v_3f4e2e.get("userId")!;

  const v_8f00b9 = await v_3f4e2e.env.DB
    .prepare(
      `DELETE FROM feed_comments
         WHERE id = ? AND feed_id = ?
           AND (
             user_id = ?
             OR EXISTS (
               SELECT 1 FROM feeds f
               INNER JOIN clones cl ON f.clone_id = cl.id
               WHERE f.id = ? AND cl.owner_id = ?
             )
           )`,
    )
    .bind(v_062ae9, v_c09aa8, v_43e90c, v_c09aa8, v_43e90c)
    .run();
  if ((v_8f00b9.meta?.changes ?? 0) === 0) {
    throw new v_3ebe58("NOT_FOUND", "댓글을 찾을 수 없거나 삭제 권한이 없어요.");
  }
  return v_3f4e2e.json({ ok: true });
});

v_f1d06f.post("/:id/comments/:cid/report", v_6690d9, async (v_3f4e2e) => {
  const v_c09aa8 = Number(v_3f4e2e.req.param("id"));
  const v_062ae9 = Number(v_3f4e2e.req.param("cid"));
  if (!Number.isInteger(v_c09aa8) || v_c09aa8 <= 0 || !Number.isInteger(v_062ae9) || v_062ae9 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "잘못된 ID 에요.");
  }
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_4d33b2 = await v_3f4e2e.req.json<{ reason?: string }>().catch(() => ({} as { reason?: string }));
  const v_58ca36 = (v_4d33b2.reason ?? "").slice(0, 500) || null;

  const v_ab4c96 = await v_3f4e2e.env.DB
    .prepare(
      `SELECT fc.id AS cid, fc.feed_id AS feedId, f.clone_id AS cloneId
         FROM feed_comments fc
         JOIN feeds f ON f.id = fc.feed_id
        WHERE fc.id = ? AND fc.feed_id = ?
        LIMIT 1`,
    )
    .bind(v_062ae9, v_c09aa8)
    .first<{ cid: number; feedId: number; cloneId: number }>();
  if (!v_ab4c96) throw new v_3ebe58("NOT_FOUND", "댓글을 찾을 수 없어요.");

  await v_3f4e2e.env.DB
    .prepare(
      `INSERT OR IGNORE INTO comment_reports
         (user_id, comment_id, feed_id, clone_id, reason)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(v_43e90c, v_062ae9, v_ab4c96.feedId, v_ab4c96.cloneId, v_58ca36)
    .run();
  return v_3f4e2e.json({ ok: true, reported: true });
});

v_f1d06f.get("/:id/comments", async (v_3f4e2e) => {
  const v_c09aa8 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_c09aa8) || v_c09aa8 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "잘못된 피드 ID 에요.");
  }
  const v_f71b56 = new URL(v_3f4e2e.req.url);
  const v_15c8c5 = v_f71b56.searchParams.get("cursor");
  const v_75cbf4 = v_15c8c5 ? Number(v_15c8c5) : null;
  const v_cf2260 = Number(v_f71b56.searchParams.get("limit") ?? 30);
  const v_02be30 = Math.max(1, Math.min(100, Number.isFinite(v_cf2260) ? v_cf2260 : 30));
  const v_013af2 = await v_efcb2d(v_3f4e2e);

  const v_abcc8d = [
    "fc.feed_id = ?",
    "fc.parent_comment_id IS NULL",
    "fc.id NOT IN (SELECT comment_id FROM comment_reports WHERE status IN ('open','reviewed','actioned'))",
  ];
  const v_925171 = [v_c09aa8];
  if (v_013af2) {
    v_abcc8d.push("fc.user_id NOT IN (SELECT blocked_id FROM user_blocks WHERE blocker_id = ?)");
    v_925171.push(v_013af2);
  }
  if (v_75cbf4 && Number.isInteger(v_75cbf4) && v_75cbf4 > 0) {
    v_abcc8d.push("fc.id < ?");
    v_925171.push(v_75cbf4);
  }

  const v_f36334 = v_013af2
    ? `EXISTS (SELECT 1 FROM feed_comment_likes fcl WHERE fcl.comment_id = fc.id AND fcl.user_id = ?)`
    : `0`;
  if (v_013af2) v_925171.unshift(v_013af2); 
  const v_18b8bf = (
    await v_3f4e2e.env.DB
      .prepare(
        `SELECT fc.id          AS commentId,
                fc.user_id     AS userId,
                fc.content     AS content,
                fc.created_at  AS createdAt,
                fc.likes_count AS likesCount,
                ${v_f36334} AS likedByMe,
                u.name         AS userName,
                u.email        AS userEmail,
                u.avatar_url   AS userAvatarUrl,
                (SELECT COUNT(*) FROM feed_comments fcc
                   WHERE fcc.parent_comment_id = fc.id
                     AND fcc.id NOT IN (SELECT comment_id FROM comment_reports WHERE status IN ('open','reviewed','actioned'))) AS repliesCount
           FROM feed_comments fc
           JOIN users u ON u.id = fc.user_id
          WHERE ${v_abcc8d.join(" AND ")} AND u.deleted_at IS NULL
          ORDER BY fc.id DESC
          LIMIT ?`,
      )
      .bind(...v_925171, v_02be30 + 1)
      .all<{
        commentId: number;
        userId: number;
        content: string;
        createdAt: string;
        likesCount: number;
        likedByMe: number;
        userName: string | null;
        userEmail: string;
        userAvatarUrl: string | null;
        repliesCount: number;
      }>()
  ).results;

  const v_6bbe19 = v_18b8bf.length > v_02be30;
  const v_2365e9 = v_6bbe19 ? v_18b8bf.slice(0, v_02be30) : v_18b8bf;
  const v_64f859 =
    v_6bbe19 && v_2365e9.length > 0 ? v_2365e9[v_2365e9.length - 1]!.commentId : null;

  return v_3f4e2e.json({
    items: v_2365e9.map((v_cb35cb) => ({
      id: v_cb35cb.commentId,
      userId: v_cb35cb.userId,
      content: v_cb35cb.content,
      createdAt: v_cb35cb.createdAt,
      repliesCount: v_cb35cb.repliesCount ?? 0,
      likesCount: v_cb35cb.likesCount ?? 0,
      likedByMe: !!v_cb35cb.likedByMe,
      user: {
        id: v_cb35cb.userId,
        name: v_cb35cb.userName,
        email: v_cb35cb.userEmail,
        avatarUrl: v_cb35cb.userAvatarUrl,
      },
    })),
    nextCursor: v_64f859,
  });
});

v_f1d06f.get("/:id/comments/:cid/replies", async (v_3f4e2e) => {
  const v_c09aa8 = Number(v_3f4e2e.req.param("id"));
  const v_062ae9 = Number(v_3f4e2e.req.param("cid"));
  if (!Number.isInteger(v_c09aa8) || v_c09aa8 <= 0 || !Number.isInteger(v_062ae9) || v_062ae9 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "잘못된 ID 에요.");
  }
  const v_f71b56 = new URL(v_3f4e2e.req.url);
  const v_cf2260 = Number(v_f71b56.searchParams.get("limit") ?? 50);
  const v_02be30 = Math.max(1, Math.min(200, Number.isFinite(v_cf2260) ? v_cf2260 : 50));
  const v_013af2 = await v_efcb2d(v_3f4e2e);
  const v_f36334 = v_013af2
    ? `EXISTS (SELECT 1 FROM feed_comment_likes fcl WHERE fcl.comment_id = fc.id AND fcl.user_id = ?)`
    : `0`;

  const v_fb635a = v_013af2
    ? " AND fc.user_id NOT IN (SELECT blocked_id FROM user_blocks WHERE blocker_id = ?)"
    : "";
  const v_925171 = v_013af2
    ? [v_013af2, v_c09aa8, v_062ae9, v_013af2, v_02be30]
    : [v_c09aa8, v_062ae9, v_02be30];
  const v_18b8bf = (
    await v_3f4e2e.env.DB
      .prepare(
        `SELECT fc.id          AS commentId,
                fc.user_id     AS userId,
                fc.content     AS content,
                fc.created_at  AS createdAt,
                fc.likes_count AS likesCount,
                ${v_f36334} AS likedByMe,
                u.name         AS userName,
                u.email        AS userEmail,
                u.avatar_url   AS userAvatarUrl
           FROM feed_comments fc
           JOIN users u ON u.id = fc.user_id
          WHERE fc.feed_id = ?
            AND fc.parent_comment_id = ?
            AND u.deleted_at IS NULL
            AND fc.id NOT IN (SELECT comment_id FROM comment_reports WHERE status IN ('open','reviewed','actioned'))
            AND fc.parent_comment_id NOT IN (SELECT comment_id FROM comment_reports WHERE status IN ('open','reviewed','actioned'))${v_fb635a}
          ORDER BY fc.id ASC
          LIMIT ?`,
      )
      .bind(...v_925171)
      .all<{
        commentId: number;
        userId: number;
        content: string;
        createdAt: string;
        likesCount: number;
        likedByMe: number;
        userName: string | null;
        userEmail: string;
        userAvatarUrl: string | null;
      }>()
  ).results;

  return v_3f4e2e.json({
    items: (v_18b8bf ?? []).map((v_cb35cb) => ({
      id: v_cb35cb.commentId,
      userId: v_cb35cb.userId,
      content: v_cb35cb.content,
      createdAt: v_cb35cb.createdAt,
      parentCommentId: v_062ae9,
      likesCount: v_cb35cb.likesCount ?? 0,
      likedByMe: !!v_cb35cb.likedByMe,
      user: {
        id: v_cb35cb.userId,
        name: v_cb35cb.userName,
        email: v_cb35cb.userEmail,
        avatarUrl: v_cb35cb.userAvatarUrl,
      },
    })),
  });
});

v_f1d06f.post("/:id/comments/:cid/like", v_6690d9, async (v_3f4e2e) => {
  const v_c09aa8 = Number(v_3f4e2e.req.param("id"));
  const v_062ae9 = Number(v_3f4e2e.req.param("cid"));
  if (!Number.isInteger(v_c09aa8) || v_c09aa8 <= 0 || !Number.isInteger(v_062ae9) || v_062ae9 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "잘못된 ID 에요.");
  }
  const v_43e90c = v_3f4e2e.get("userId")!;

  await v_5bb199(v_3f4e2e.env.DB, v_43e90c);

  const v_3ac7e7 = await v_3f4e2e.env.DB
    .prepare(`SELECT id FROM feed_comments WHERE id = ? AND feed_id = ?`)
    .bind(v_062ae9, v_c09aa8)
    .first<{ id: number }>();
  if (!v_3ac7e7) throw new v_3ebe58("NOT_FOUND", "댓글을 찾을 수 없어요.");
  await v_3f4e2e.env.DB
    .prepare(`INSERT OR IGNORE INTO feed_comment_likes (comment_id, user_id) VALUES (?, ?)`)
    .bind(v_062ae9, v_43e90c)
    .run();
  const v_7b3f91 = await v_3f4e2e.env.DB
    .prepare(`SELECT likes_count FROM feed_comments WHERE id = ?`)
    .bind(v_062ae9)
    .first<{ likes_count: number }>();
  return v_3f4e2e.json({ ok: true, liked: true, likesCount: v_7b3f91?.likes_count ?? 0 });
});

v_f1d06f.delete("/:id/comments/:cid/like", v_6690d9, async (v_3f4e2e) => {
  const v_c09aa8 = Number(v_3f4e2e.req.param("id"));
  const v_062ae9 = Number(v_3f4e2e.req.param("cid"));
  if (!Number.isInteger(v_c09aa8) || v_c09aa8 <= 0 || !Number.isInteger(v_062ae9) || v_062ae9 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "잘못된 ID 에요.");
  }
  const v_43e90c = v_3f4e2e.get("userId")!;
  await v_3f4e2e.env.DB
    .prepare(`DELETE FROM feed_comment_likes WHERE comment_id = ? AND user_id = ?`)
    .bind(v_062ae9, v_43e90c)
    .run();
  const v_7b3f91 = await v_3f4e2e.env.DB
    .prepare(`SELECT likes_count FROM feed_comments WHERE id = ?`)
    .bind(v_062ae9)
    .first<{ likes_count: number }>();
  return v_3f4e2e.json({ ok: true, liked: false, likesCount: v_7b3f91?.likes_count ?? 0 });
});

v_96e8d7.post("/:id/comments", v_6690d9, async (v_3f4e2e) => {
  const v_6e0fd3 = v_31113b(v_3f4e2e);
  const v_43e90c = v_3f4e2e.get("userId")!;

  await v_f45eef(v_3f4e2e.env.DB, v_43e90c);
  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_9c5bc5);
  const v_eb25ce = await v_5d4a51(v_3f4e2e.env.DB, v_6e0fd3);
  if (!v_eb25ce) throw new v_3ebe58("NOT_FOUND", "페르소나를 찾을 수 없어요.");
  if (v_eb25ce.visibility === "private") {
    if (v_eb25ce.owner_id !== v_43e90c) {
      const v_22da99 = await v_7adf64(v_3f4e2e.env.DB, v_6e0fd3, v_43e90c);
      if (v_22da99 === null) throw new v_3ebe58("FORBIDDEN", "비공개 페르소나예요.");
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
      .bind(v_6e0fd3, v_1de203?.description ?? "", v_1de203?.avatar_url ?? null, null)
      .run();
    v_c09aa8 = Number(v_cb35cb.meta.last_row_id);
    v_3459a5 = true;
  }
  const v_cb35cb = await v_3f4e2e.env.DB
    .prepare(`INSERT INTO feed_comments (feed_id, user_id, content) VALUES (?, ?, ?)`)
    .bind(v_c09aa8, v_43e90c, v_4d33b2.content.trim())
    .run();

  await v_80a022(v_3f4e2e.env, "clone_comment", {
    actorId: v_43e90c,
    cloneId: v_6e0fd3,
    extraBody: v_4d33b2.content.trim(),
    feedId: v_c09aa8,
  });
  await v_dd9d7c(v_3f4e2e.env, v_43e90c, v_6e0fd3, "feed");

  await v_6f97bc(v_3f4e2e.env, v_43e90c, v_6e0fd3, v_c09aa8, v_cf0463.feed);
  return v_3f4e2e.json(
    {
      ok: true,
      comment: {
        id: Number(v_cb35cb.meta.last_row_id),
        feedId: v_c09aa8,
        userId: v_43e90c,
        content: v_4d33b2.content.trim(),
      },
      promoted: v_3459a5,
    },
    201,
  );
});

v_96e8d7.get("/:id/comments", async (v_3f4e2e) => {
  const v_6e0fd3 = v_31113b(v_3f4e2e);
  const v_f71b56 = new URL(v_3f4e2e.req.url);
  const v_cf2260 = Number(v_f71b56.searchParams.get("limit") ?? 50);
  const v_02be30 = Math.max(1, Math.min(200, Number.isFinite(v_cf2260) ? v_cf2260 : 50));
  const v_013af2 = await v_efcb2d(v_3f4e2e);

  const v_f36334 = v_013af2
    ? `EXISTS (SELECT 1 FROM feed_comment_likes fcl WHERE fcl.comment_id = fc.id AND fcl.user_id = ?)`
    : `0`;

  const v_fb635a = v_013af2
    ? " AND fc.user_id NOT IN (SELECT blocked_id FROM user_blocks WHERE blocker_id = ?)"
    : "";
  const v_925171 = v_013af2
    ? [v_013af2, v_6e0fd3, v_013af2, v_02be30]
    : [v_6e0fd3, v_02be30];
  const v_18b8bf = (
    await v_3f4e2e.env.DB
      .prepare(
        `SELECT fc.id          AS commentId,
                fc.feed_id     AS feedId,
                fc.user_id     AS userId,
                fc.content     AS content,
                fc.created_at  AS createdAt,
                fc.likes_count AS likesCount,
                ${v_f36334} AS likedByMe,
                u.name         AS userName,
                u.email        AS userEmail,
                u.avatar_url   AS userAvatarUrl,
                (SELECT COUNT(*) FROM feed_comments fcc
                   WHERE fcc.parent_comment_id = fc.id
                     AND fcc.id NOT IN (SELECT comment_id FROM comment_reports WHERE status IN ('open','reviewed','actioned'))) AS repliesCount
           FROM feed_comments fc
           JOIN feeds f ON f.id = fc.feed_id
           JOIN users u ON u.id = fc.user_id
          WHERE f.clone_id = ?
            AND fc.parent_comment_id IS NULL
            AND u.deleted_at IS NULL
            AND fc.id NOT IN (SELECT comment_id FROM comment_reports WHERE status IN ('open','reviewed','actioned'))${v_fb635a}
          ORDER BY fc.id DESC
          LIMIT ?`,
      )
      .bind(...v_925171)
      .all<{
        commentId: number;
        feedId: number;
        userId: number;
        content: string;
        createdAt: string;
        likesCount: number;
        likedByMe: number;
        userName: string | null;
        userEmail: string;
        userAvatarUrl: string | null;
        repliesCount: number;
      }>()
  ).results;
  return v_3f4e2e.json({
    items: v_18b8bf.map((v_cb35cb) => ({
      id: v_cb35cb.commentId,
      feedId: v_cb35cb.feedId,
      userId: v_cb35cb.userId,
      content: v_cb35cb.content,
      createdAt: v_cb35cb.createdAt,
      repliesCount: v_cb35cb.repliesCount ?? 0,
      likesCount: v_cb35cb.likesCount ?? 0,
      likedByMe: !!v_cb35cb.likedByMe,
      user: {
        id: v_cb35cb.userId,
        name: v_cb35cb.userName,
        email: v_cb35cb.userEmail,
        avatarUrl: v_cb35cb.userAvatarUrl,
      },
    })),
    nextCursor: null,
  });
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
  if (!v_eb25ce) throw new v_3ebe58("NOT_FOUND", "페르소나를 찾을 수 없어요.");
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
