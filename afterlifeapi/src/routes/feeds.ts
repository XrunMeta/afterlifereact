

import { Hono } from "hono";
import type { AppEnv } from "../lib/env";
import { APIError } from "../lib/errors";
import { parseJson, z } from "../lib/validate";
import { requireAuth } from "../middleware/auth";
import { notifyCloneEvent } from "../lib/notify";
import { bumpInteraction } from "../lib/interactions";
import {
  hasAcceptedShare,
  isFollower,
  loadCloneById,
  resolveOptionalUser,
} from "../lib/cloneAccess";

export const cloneFeeds = new Hono<AppEnv>();

export const feedsDiscover = new Hono<AppEnv>();

function parseCloneId(c: { req: { param: (k: string) => string } }): number {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) {
    throw new APIError("VALIDATION_FAILED", "잘못된 페르소나 ID 에요.");
  }
  return id;
}
function parseFeedId(c: { req: { param: (k: string) => string } }): number {
  const fid = Number(c.req.param("feedId"));
  if (!Number.isInteger(fid) || fid <= 0) {
    throw new APIError("VALIDATION_FAILED", "잘못된 피드 ID 에요.");
  }
  return fid;
}

async function assertWriter(
  db: D1Database,
  cloneId: number,
  userId: number,
  clone: { owner_id: number },
): Promise<void> {
  if (clone.owner_id === userId) return;
  const role = await hasAcceptedShare(db, cloneId, userId);
  if (role !== "owner") {
    throw new APIError("FORBIDDEN", "소유자만 가능해요.");
  }
}

const createSchema = z
  .object({
    content: z.string().max(5000).optional(),
    mediaUrl: z.url().max(500).optional(),
    mediaType: z.enum(["image", "video", "short"]).optional(),
  })
  .refine((o) => Boolean(o.content || o.mediaUrl), {
    message: "content 또는 mediaUrl 중 하나는 필수.",
  });

cloneFeeds.get("/:id/feeds", async (c) => {
  const cloneId = parseCloneId(c);
  const clone = await loadCloneById(c.env.DB, cloneId);
  if (!clone) throw new APIError("NOT_FOUND", "페르소나를 찾을 수 없어요.");

  const userId = await resolveOptionalUser(c);
  let role: "owner" | "coowner" | "follower" | null = null;
  if (userId) {
    if (userId === clone.owner_id) role = "owner";
    else if ((await hasAcceptedShare(c.env.DB, cloneId, userId)) !== null) {
      role = "coowner";
    } else if (await isFollower(c.env.DB, cloneId, userId)) {
      role = "follower";
    }
  }

  if (clone.visibility === "private" && role !== "owner" && role !== "coowner") {
    throw new APIError("FORBIDDEN", "비공개 페르소나예요.");
  }
  if (clone.visibility === "followers" && !role) {
    throw new APIError("FORBIDDEN", "팔로워에게만 공개된 페르소나예요.");
  }

  const url = new URL(c.req.url);
  const cursorRaw = url.searchParams.get("cursor");
  const cursor = cursorRaw ? Number(cursorRaw) : null;
  const limitRaw = Number(url.searchParams.get("limit") ?? 20);
  const limit = Math.max(1, Math.min(50, Number.isFinite(limitRaw) ? limitRaw : 20));

  const where = ["clone_id = ?"];
  const binds: unknown[] = [cloneId];
  if (cursor && Number.isInteger(cursor) && cursor > 0) {
    where.push("id < ?");
    binds.push(cursor);
  }

  const rows = (
    await c.env.DB
      .prepare(
        `SELECT id, clone_id, content, media_url, media_type, likes_count, created_at
           FROM feeds
          WHERE ${where.join(" AND ")}
          ORDER BY id DESC
          LIMIT ?`,
      )
      .bind(...binds, limit + 1)
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

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor =
    hasMore && page.length > 0 ? page[page.length - 1]!.id : null;

  return c.json({
    items: page.map((r) => ({
      id: r.id,
      cloneId: r.clone_id,
      content: r.content,
      mediaUrl: r.media_url,
      mediaType: r.media_type,
      likesCount: r.likes_count,
      visibility: clone.visibility,
      createdAt: r.created_at,
    })),
    nextCursor,
  });
});

feedsDiscover.get("/discover", async (c) => {
  const url = new URL(c.req.url);
  const cursorRaw = url.searchParams.get("cursor");
  const cursor = cursorRaw ? Number(cursorRaw) : null;
  const limitRaw = Number(url.searchParams.get("limit") ?? 20);
  const limit = Math.max(1, Math.min(50, Number.isFinite(limitRaw) ? limitRaw : 20));

  const viewerId = await resolveOptionalUser(c);

  const where = [
    "c.deletion_state = 'active'",
    "c.deleted_at IS NULL",
    "c.clone_type != 'memlow'",
  ];
  const binds: unknown[] = [];

  if (viewerId) {
    where.push(
      `(
         c.visibility = 'public'
         OR c.owner_id = ?
         OR (c.visibility = 'followers' AND
             EXISTS (SELECT 1 FROM clone_follows cf
                      WHERE cf.clone_id = c.id AND cf.user_id = ?))
         OR (c.visibility = 'selected' AND
             EXISTS (SELECT 1 FROM clone_allowed_viewers cav
                      WHERE cav.clone_id = c.id AND cav.user_id = ?))
       )`,
    );
    binds.push(viewerId, viewerId, viewerId);
  } else {

    where.push("c.visibility = 'public'");
  }

  if (viewerId) {
    where.push("c.id NOT IN (SELECT clone_id FROM clone_blocks WHERE user_id = ?)");
    binds.push(viewerId);
  }
  if (cursor && Number.isInteger(cursor) && cursor > 0) {
    where.push("c.id < ?");
    binds.push(cursor);
  }

  const rows = (
    await c.env.DB
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
                f.id               AS feedId,
                f.content          AS feedContent,
                f.media_url        AS feedMediaUrl,
                f.media_type       AS feedMediaType,
                f.created_at       AS feedCreatedAt,
                (SELECT COALESCE(SUM(f2.likes_count), 0) FROM feeds f2
                  WHERE f2.clone_id = c.id) AS likesCount,
                (SELECT COUNT(*) FROM feed_comments fc
                   JOIN feeds f3 ON f3.id = fc.feed_id
                   WHERE f3.clone_id = c.id) AS commentsCount
           FROM clones c
           LEFT JOIN feeds f ON f.id = (
             SELECT id FROM feeds WHERE clone_id = c.id
             ORDER BY id DESC LIMIT 1
           )
          WHERE ${where.join(" AND ")}
          ORDER BY c.id DESC
          LIMIT ?`,
      )
      .bind(...binds, limit + 1)
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
        feedId: number | null;
        feedContent: string | null;
        feedMediaUrl: string | null;
        feedMediaType: string | null;
        feedCreatedAt: string | null;
        likesCount: number;
        commentsCount: number;
      }>()
  ).results;

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor =
    hasMore && page.length > 0 ? page[page.length - 1]!.cloneId : null;

  const cloneIds = Array.from(new Set(page.map((r) => r.cloneId)));
  const interestsByClone = new Map<number, string[]>();
  if (cloneIds.length > 0) {
    const placeholders = cloneIds.map(() => "?").join(",");
    const ir = (
      await c.env.DB
        .prepare(
          `SELECT clone_id, interest FROM clone_interests
            WHERE clone_id IN (${placeholders})`,
        )
        .bind(...cloneIds)
        .all<{ clone_id: number; interest: string }>()
    ).results ?? [];
    for (const row of ir) {
      const arr = interestsByClone.get(row.clone_id) ?? [];
      arr.push(row.interest);
      interestsByClone.set(row.clone_id, arr);
    }
  }

  const likedCloneIds = new Set<number>();
  if (viewerId) {
    const cloneIdsInPage = page.map((r) => r.cloneId);
    if (cloneIdsInPage.length > 0) {
      const placeholders = cloneIdsInPage.map(() => "?").join(",");
      const lr = (
        await c.env.DB
          .prepare(
            `SELECT DISTINCT f.clone_id AS clone_id FROM feed_likes fl
               JOIN feeds f ON f.id = fl.feed_id
              WHERE fl.user_id = ? AND f.clone_id IN (${placeholders})`,
          )
          .bind(viewerId, ...cloneIdsInPage)
          .all<{ clone_id: number }>()
      ).results ?? [];
      for (const row of lr) likedCloneIds.add(row.clone_id);
    }
  }

  return c.json({
    items: page.map((r) => ({

      id: r.feedId ?? -r.cloneId,
      cloneId: r.cloneId,

      content: r.feedContent ?? r.cloneDescription ?? "",
      mediaUrl: r.feedMediaUrl ?? r.cloneAvatarUrl ?? null,
      mediaType: r.feedMediaType,

      likesCount: r.likesCount,
      commentsCount: r.commentsCount,

      likedByMe: likedCloneIds.has(r.cloneId),
      createdAt: r.feedCreatedAt ?? r.cloneCreatedAt,
      clone: {
        id: r.cloneId,

        ownerId: r.cloneOwnerId,
        name: r.cloneName,
        username: r.cloneUsername,
        avatarUrl: r.cloneAvatarUrl,
        cloneType: r.cloneType,
        visibility: r.cloneVisibility,
      },
      interests: interestsByClone.get(r.cloneId) ?? [],
    })),
    nextCursor,
  });
});

cloneFeeds.post("/:id/feeds", requireAuth, async (c) => {
  const cloneId = parseCloneId(c);
  const userId = c.get("userId")!;
  const clone = await loadCloneById(c.env.DB, cloneId);
  if (!clone) throw new APIError("NOT_FOUND", "페르소나를 찾을 수 없어요.");
  await assertWriter(c.env.DB, cloneId, userId, clone);

  const body = await parseJson(c, createSchema);
  const r = await c.env.DB
    .prepare(
      `INSERT INTO feeds (clone_id, content, media_url, media_type, created_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    )
    .bind(
      cloneId,
      body.content ?? null,
      body.mediaUrl ?? null,
      body.mediaType ?? null,
    )
    .run();
  const feedId = Number(r.meta.last_row_id);

  return c.json(
    {
      feed: {
        id: feedId,
        cloneId,
        content: body.content ?? null,
        mediaUrl: body.mediaUrl ?? null,
        mediaType: body.mediaType ?? null,
        likesCount: 0,
        visibility: clone.visibility,
        createdAt: new Date().toISOString(),
      },
    },
    201,
  );
});

async function loadFeedAccessible(
  db: D1Database,
  feedId: number,
): Promise<{ id: number; cloneId: number; visibility: string; ownerId: number } | null> {
  const row = await db
    .prepare(
      `SELECT f.id AS id, f.clone_id AS cloneId, c.visibility AS visibility, c.owner_id AS ownerId
         FROM feeds f
         JOIN clones c ON c.id = f.clone_id
        WHERE f.id = ? AND c.deleted_at IS NULL`,
    )
    .bind(feedId)
    .first<{ id: number; cloneId: number; visibility: string; ownerId: number }>();
  return row ?? null;
}

feedsDiscover.post("/:id/like", requireAuth, async (c) => {
  const feedId = Number(c.req.param("id"));
  if (!Number.isInteger(feedId) || feedId <= 0) {
    throw new APIError("VALIDATION_FAILED", "잘못된 피드 ID 에요.");
  }
  const userId = c.get("userId")!;
  const feed = await loadFeedAccessible(c.env.DB, feedId);
  if (!feed) throw new APIError("NOT_FOUND", "피드를 찾을 수 없어요.");

  if (feed.visibility === "private") {
    if (feed.ownerId !== userId) {
      const role = await hasAcceptedShare(c.env.DB, feed.cloneId, userId);
      if (role === null) throw new APIError("FORBIDDEN", "비공개 페르소나예요.");
    }
  }

  await c.env.DB
    .prepare(
      `INSERT OR IGNORE INTO feed_likes (feed_id, user_id) VALUES (?, ?)`,
    )
    .bind(feedId, userId)
    .run();

  const row = await c.env.DB
    .prepare(`SELECT likes_count FROM feeds WHERE id = ?`)
    .bind(feedId)
    .first<{ likes_count: number }>();

  await notifyCloneEvent(c.env, "clone_like", { actorId: userId, cloneId: feed.cloneId });

  await bumpInteraction(c.env, userId, feed.cloneId, "feed");
  return c.json({ ok: true, liked: true, likesCount: row?.likes_count ?? 0 });
});

feedsDiscover.delete("/:id/like", requireAuth, async (c) => {
  const feedId = Number(c.req.param("id"));
  if (!Number.isInteger(feedId) || feedId <= 0) {
    throw new APIError("VALIDATION_FAILED", "잘못된 피드 ID 에요.");
  }
  const userId = c.get("userId")!;
  await c.env.DB
    .prepare(`DELETE FROM feed_likes WHERE feed_id = ? AND user_id = ?`)
    .bind(feedId, userId)
    .run();

  const row = await c.env.DB
    .prepare(`SELECT likes_count FROM feeds WHERE id = ?`)
    .bind(feedId)
    .first<{ likes_count: number }>();
  return c.json({ ok: true, liked: false, likesCount: row?.likes_count ?? 0 });
});

feedsDiscover.get("/:id/likes", async (c) => {
  const feedId = Number(c.req.param("id"));
  if (!Number.isInteger(feedId) || feedId <= 0) {
    throw new APIError("VALIDATION_FAILED", "잘못된 피드 ID 에요.");
  }
  const url = new URL(c.req.url);
  const cursorRaw = url.searchParams.get("cursor");
  const cursor = cursorRaw ? Number(cursorRaw) : null;
  const limitRaw = Number(url.searchParams.get("limit") ?? 30);
  const limit = Math.max(1, Math.min(100, Number.isFinite(limitRaw) ? limitRaw : 30));

  const where = ["fl.feed_id = ?"];
  const binds: unknown[] = [feedId];
  if (cursor && Number.isInteger(cursor) && cursor > 0) {
    where.push("fl.id < ?");
    binds.push(cursor);
  }
  const rows = (
    await c.env.DB
      .prepare(
        `SELECT fl.id        AS likeId,
                fl.user_id   AS userId,
                fl.created_at AS createdAt,
                u.name       AS userName,
                u.email      AS userEmail,
                u.avatar_url AS userAvatarUrl
           FROM feed_likes fl
           JOIN users u ON u.id = fl.user_id
          WHERE ${where.join(" AND ")} AND u.deleted_at IS NULL
          ORDER BY fl.id DESC
          LIMIT ?`,
      )
      .bind(...binds, limit + 1)
      .all<{
        likeId: number;
        userId: number;
        createdAt: string;
        userName: string | null;
        userEmail: string;
        userAvatarUrl: string | null;
      }>()
  ).results;

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor =
    hasMore && page.length > 0 ? page[page.length - 1]!.likeId : null;

  return c.json({
    items: page.map((r) => ({
      likeId: r.likeId,
      userId: r.userId,
      name: r.userName,
      email: r.userEmail,
      avatarUrl: r.userAvatarUrl,
      createdAt: r.createdAt,
    })),
    nextCursor,
  });
});

cloneFeeds.post("/:id/like", requireAuth, async (c) => {
  const cloneId = parseCloneId(c);
  const userId = c.get("userId")!;
  const clone = await loadCloneById(c.env.DB, cloneId);
  if (!clone) throw new APIError("NOT_FOUND", "페르소나를 찾을 수 없어요.");
  if (clone.visibility === "private") {
    if (clone.owner_id !== userId) {
      const role = await hasAcceptedShare(c.env.DB, cloneId, userId);
      if (role === null) throw new APIError("FORBIDDEN", "비공개 페르소나예요.");
    }
  }

  let feedId: number;
  let promoted = false;
  const existing = await c.env.DB
    .prepare(`SELECT id FROM feeds WHERE clone_id = ? ORDER BY id DESC LIMIT 1`)
    .bind(cloneId)
    .first<{ id: number }>();
  if (existing) {
    feedId = existing.id;
  } else {
    const cloneRow = await c.env.DB
      .prepare(`SELECT description, avatar_url FROM clones WHERE id = ?`)
      .bind(cloneId)
      .first<{ description: string | null; avatar_url: string | null }>();
    const r = await c.env.DB
      .prepare(
        `INSERT INTO feeds (clone_id, content, media_url, media_type, created_at)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      )
      .bind(
        cloneId,
        cloneRow?.description ?? "",
        cloneRow?.avatar_url ?? null,
        null,
      )
      .run();
    feedId = Number(r.meta.last_row_id);
    promoted = true;
  }

  await c.env.DB
    .prepare(`INSERT OR IGNORE INTO feed_likes (feed_id, user_id) VALUES (?, ?)`)
    .bind(feedId, userId)
    .run();

  const cnt = await c.env.DB
    .prepare(`SELECT likes_count FROM feeds WHERE id = ?`)
    .bind(feedId)
    .first<{ likes_count: number }>();

  await notifyCloneEvent(c.env, "clone_like", { actorId: userId, cloneId });
  await bumpInteraction(c.env, userId, cloneId, "feed");
  return c.json({
    ok: true,
    liked: true,
    feedId,
    promoted,
    likesCount: cnt?.likes_count ?? 0,
  });
});

cloneFeeds.delete("/:id/like", requireAuth, async (c) => {
  const cloneId = parseCloneId(c);
  const userId = c.get("userId")!;

  const f = await c.env.DB
    .prepare(`SELECT id FROM feeds WHERE clone_id = ? ORDER BY id DESC LIMIT 1`)
    .bind(cloneId)
    .first<{ id: number }>();
  if (!f) return c.json({ ok: true, liked: false, likesCount: 0 });
  await c.env.DB
    .prepare(`DELETE FROM feed_likes WHERE feed_id = ? AND user_id = ?`)
    .bind(f.id, userId)
    .run();
  const cnt = await c.env.DB
    .prepare(`SELECT likes_count FROM feeds WHERE id = ?`)
    .bind(f.id)
    .first<{ likes_count: number }>();
  return c.json({ ok: true, liked: false, feedId: f.id, likesCount: cnt?.likes_count ?? 0 });
});

const commentCreateSchema = z.object({
  content: z.string().min(1).max(2000),

  parentCommentId: z.number().int().positive().optional(),
});

feedsDiscover.post("/:id/comments", requireAuth, async (c) => {
  const feedId = Number(c.req.param("id"));
  if (!Number.isInteger(feedId) || feedId <= 0) {
    throw new APIError("VALIDATION_FAILED", "잘못된 피드 ID 에요.");
  }
  const userId = c.get("userId")!;
  const body = await parseJson(c, commentCreateSchema);

  const feed = await loadFeedAccessible(c.env.DB, feedId);
  if (!feed) throw new APIError("NOT_FOUND", "피드를 찾을 수 없어요.");
  if (feed.visibility === "private") {
    if (feed.ownerId !== userId) {
      const role = await hasAcceptedShare(c.env.DB, feed.cloneId, userId);
      if (role === null) throw new APIError("FORBIDDEN", "비공개 페르소나예요.");
    }
  }

  let resolvedParentId: number | null = null;
  if (body.parentCommentId) {
    const parent = await c.env.DB
      .prepare(
        `SELECT id, feed_id AS feedId, parent_comment_id AS parentId
           FROM feed_comments
          WHERE id = ?`,
      )
      .bind(body.parentCommentId)
      .first<{ id: number; feedId: number; parentId: number | null }>();
    if (!parent) throw new APIError("NOT_FOUND", "댓글을 찾을 수 없어요.");
    if (parent.feedId !== feedId) {
      throw new APIError("VALIDATION_FAILED", "부모 댓글이 다른 피드에 속해 있어요.");
    }

    resolvedParentId = parent.parentId ?? parent.id;
  }
  const r = await c.env.DB
    .prepare(
      `INSERT INTO feed_comments (feed_id, user_id, content, parent_comment_id)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(feedId, userId, body.content.trim(), resolvedParentId)
    .run();

  await notifyCloneEvent(c.env, "clone_comment", {
    actorId: userId,
    cloneId: feed.cloneId,
    extraBody: body.content.trim(),
  });
  await bumpInteraction(c.env, userId, feed.cloneId, "feed");
  return c.json(
    {
      ok: true,
      comment: {
        id: Number(r.meta.last_row_id),
        feedId,
        userId,
        content: body.content.trim(),
        parentCommentId: resolvedParentId,
      },
    },
    201,
  );
});

feedsDiscover.delete("/:id/comments/:cid", requireAuth, async (c) => {
  const feedId = Number(c.req.param("id"));
  const cid = Number(c.req.param("cid"));
  if (!Number.isInteger(feedId) || feedId <= 0 || !Number.isInteger(cid) || cid <= 0) {
    throw new APIError("VALIDATION_FAILED", "잘못된 ID 에요.");
  }
  const userId = c.get("userId")!;
  const res = await c.env.DB
    .prepare(`DELETE FROM feed_comments WHERE id = ? AND feed_id = ? AND user_id = ?`)
    .bind(cid, feedId, userId)
    .run();
  if ((res.meta?.changes ?? 0) === 0) {
    throw new APIError("NOT_FOUND", "댓글을 찾을 수 없거나 본인의 댓글이 아니에요.");
  }
  return c.json({ ok: true });
});

feedsDiscover.post("/:id/comments/:cid/report", requireAuth, async (c) => {
  const feedId = Number(c.req.param("id"));
  const cid = Number(c.req.param("cid"));
  if (!Number.isInteger(feedId) || feedId <= 0 || !Number.isInteger(cid) || cid <= 0) {
    throw new APIError("VALIDATION_FAILED", "잘못된 ID 에요.");
  }
  const userId = c.get("userId")!;
  const body = await c.req.json<{ reason?: string }>().catch(() => ({} as { reason?: string }));
  const reason = (body.reason ?? "").slice(0, 500) || null;

  const meta = await c.env.DB
    .prepare(
      `SELECT fc.id AS cid, fc.feed_id AS feedId, f.clone_id AS cloneId
         FROM feed_comments fc
         JOIN feeds f ON f.id = fc.feed_id
        WHERE fc.id = ? AND fc.feed_id = ?
        LIMIT 1`,
    )
    .bind(cid, feedId)
    .first<{ cid: number; feedId: number; cloneId: number }>();
  if (!meta) throw new APIError("NOT_FOUND", "댓글을 찾을 수 없어요.");

  await c.env.DB
    .prepare(
      `INSERT OR IGNORE INTO comment_reports
         (user_id, comment_id, feed_id, clone_id, reason)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(userId, cid, meta.feedId, meta.cloneId, reason)
    .run();
  return c.json({ ok: true, reported: true });
});

feedsDiscover.get("/:id/comments", async (c) => {
  const feedId = Number(c.req.param("id"));
  if (!Number.isInteger(feedId) || feedId <= 0) {
    throw new APIError("VALIDATION_FAILED", "잘못된 피드 ID 에요.");
  }
  const url = new URL(c.req.url);
  const cursorRaw = url.searchParams.get("cursor");
  const cursor = cursorRaw ? Number(cursorRaw) : null;
  const limitRaw = Number(url.searchParams.get("limit") ?? 30);
  const limit = Math.max(1, Math.min(100, Number.isFinite(limitRaw) ? limitRaw : 30));
  const viewerId = await resolveOptionalUser(c);

  const where = ["fc.feed_id = ?", "fc.parent_comment_id IS NULL"];
  const binds: unknown[] = [feedId];
  if (cursor && Number.isInteger(cursor) && cursor > 0) {
    where.push("fc.id < ?");
    binds.push(cursor);
  }

  const likedByMeExpr = viewerId
    ? `EXISTS (SELECT 1 FROM feed_comment_likes fcl WHERE fcl.comment_id = fc.id AND fcl.user_id = ?)`
    : `0`;
  if (viewerId) binds.unshift(viewerId); 
  const rows = (
    await c.env.DB
      .prepare(
        `SELECT fc.id          AS commentId,
                fc.user_id     AS userId,
                fc.content     AS content,
                fc.created_at  AS createdAt,
                fc.likes_count AS likesCount,
                ${likedByMeExpr} AS likedByMe,
                u.name         AS userName,
                u.email        AS userEmail,
                u.avatar_url   AS userAvatarUrl,
                (SELECT COUNT(*) FROM feed_comments fcc
                   WHERE fcc.parent_comment_id = fc.id) AS repliesCount
           FROM feed_comments fc
           JOIN users u ON u.id = fc.user_id
          WHERE ${where.join(" AND ")} AND u.deleted_at IS NULL
          ORDER BY fc.id DESC
          LIMIT ?`,
      )
      .bind(...binds, limit + 1)
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

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor =
    hasMore && page.length > 0 ? page[page.length - 1]!.commentId : null;

  return c.json({
    items: page.map((r) => ({
      id: r.commentId,
      userId: r.userId,
      content: r.content,
      createdAt: r.createdAt,
      repliesCount: r.repliesCount ?? 0,
      likesCount: r.likesCount ?? 0,
      likedByMe: !!r.likedByMe,
      user: {
        id: r.userId,
        name: r.userName,
        email: r.userEmail,
        avatarUrl: r.userAvatarUrl,
      },
    })),
    nextCursor,
  });
});

feedsDiscover.get("/:id/comments/:cid/replies", async (c) => {
  const feedId = Number(c.req.param("id"));
  const cid = Number(c.req.param("cid"));
  if (!Number.isInteger(feedId) || feedId <= 0 || !Number.isInteger(cid) || cid <= 0) {
    throw new APIError("VALIDATION_FAILED", "잘못된 ID 에요.");
  }
  const url = new URL(c.req.url);
  const limitRaw = Number(url.searchParams.get("limit") ?? 50);
  const limit = Math.max(1, Math.min(200, Number.isFinite(limitRaw) ? limitRaw : 50));
  const viewerId = await resolveOptionalUser(c);
  const likedByMeExpr = viewerId
    ? `EXISTS (SELECT 1 FROM feed_comment_likes fcl WHERE fcl.comment_id = fc.id AND fcl.user_id = ?)`
    : `0`;
  const binds: unknown[] = viewerId ? [viewerId, feedId, cid, limit] : [feedId, cid, limit];
  const rows = (
    await c.env.DB
      .prepare(
        `SELECT fc.id          AS commentId,
                fc.user_id     AS userId,
                fc.content     AS content,
                fc.created_at  AS createdAt,
                fc.likes_count AS likesCount,
                ${likedByMeExpr} AS likedByMe,
                u.name         AS userName,
                u.email        AS userEmail,
                u.avatar_url   AS userAvatarUrl
           FROM feed_comments fc
           JOIN users u ON u.id = fc.user_id
          WHERE fc.feed_id = ?
            AND fc.parent_comment_id = ?
            AND u.deleted_at IS NULL
          ORDER BY fc.id ASC
          LIMIT ?`,
      )
      .bind(...binds)
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

  return c.json({
    items: (rows ?? []).map((r) => ({
      id: r.commentId,
      userId: r.userId,
      content: r.content,
      createdAt: r.createdAt,
      parentCommentId: cid,
      likesCount: r.likesCount ?? 0,
      likedByMe: !!r.likedByMe,
      user: {
        id: r.userId,
        name: r.userName,
        email: r.userEmail,
        avatarUrl: r.userAvatarUrl,
      },
    })),
  });
});

feedsDiscover.post("/:id/comments/:cid/like", requireAuth, async (c) => {
  const feedId = Number(c.req.param("id"));
  const cid = Number(c.req.param("cid"));
  if (!Number.isInteger(feedId) || feedId <= 0 || !Number.isInteger(cid) || cid <= 0) {
    throw new APIError("VALIDATION_FAILED", "잘못된 ID 에요.");
  }
  const userId = c.get("userId")!;

  const row = await c.env.DB
    .prepare(`SELECT id FROM feed_comments WHERE id = ? AND feed_id = ?`)
    .bind(cid, feedId)
    .first<{ id: number }>();
  if (!row) throw new APIError("NOT_FOUND", "댓글을 찾을 수 없어요.");
  await c.env.DB
    .prepare(`INSERT OR IGNORE INTO feed_comment_likes (comment_id, user_id) VALUES (?, ?)`)
    .bind(cid, userId)
    .run();
  const cnt = await c.env.DB
    .prepare(`SELECT likes_count FROM feed_comments WHERE id = ?`)
    .bind(cid)
    .first<{ likes_count: number }>();
  return c.json({ ok: true, liked: true, likesCount: cnt?.likes_count ?? 0 });
});

feedsDiscover.delete("/:id/comments/:cid/like", requireAuth, async (c) => {
  const feedId = Number(c.req.param("id"));
  const cid = Number(c.req.param("cid"));
  if (!Number.isInteger(feedId) || feedId <= 0 || !Number.isInteger(cid) || cid <= 0) {
    throw new APIError("VALIDATION_FAILED", "잘못된 ID 에요.");
  }
  const userId = c.get("userId")!;
  await c.env.DB
    .prepare(`DELETE FROM feed_comment_likes WHERE comment_id = ? AND user_id = ?`)
    .bind(cid, userId)
    .run();
  const cnt = await c.env.DB
    .prepare(`SELECT likes_count FROM feed_comments WHERE id = ?`)
    .bind(cid)
    .first<{ likes_count: number }>();
  return c.json({ ok: true, liked: false, likesCount: cnt?.likes_count ?? 0 });
});

cloneFeeds.post("/:id/comments", requireAuth, async (c) => {
  const cloneId = parseCloneId(c);
  const userId = c.get("userId")!;
  const body = await parseJson(c, commentCreateSchema);
  const clone = await loadCloneById(c.env.DB, cloneId);
  if (!clone) throw new APIError("NOT_FOUND", "페르소나를 찾을 수 없어요.");
  if (clone.visibility === "private") {
    if (clone.owner_id !== userId) {
      const role = await hasAcceptedShare(c.env.DB, cloneId, userId);
      if (role === null) throw new APIError("FORBIDDEN", "비공개 페르소나예요.");
    }
  }

  let feedId: number;
  let promoted = false;
  const existing = await c.env.DB
    .prepare(`SELECT id FROM feeds WHERE clone_id = ? ORDER BY id DESC LIMIT 1`)
    .bind(cloneId)
    .first<{ id: number }>();
  if (existing) {
    feedId = existing.id;
  } else {
    const cloneRow = await c.env.DB
      .prepare(`SELECT description, avatar_url FROM clones WHERE id = ?`)
      .bind(cloneId)
      .first<{ description: string | null; avatar_url: string | null }>();
    const r = await c.env.DB
      .prepare(
        `INSERT INTO feeds (clone_id, content, media_url, media_type, created_at)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      )
      .bind(cloneId, cloneRow?.description ?? "", cloneRow?.avatar_url ?? null, null)
      .run();
    feedId = Number(r.meta.last_row_id);
    promoted = true;
  }
  const r = await c.env.DB
    .prepare(`INSERT INTO feed_comments (feed_id, user_id, content) VALUES (?, ?, ?)`)
    .bind(feedId, userId, body.content.trim())
    .run();

  await notifyCloneEvent(c.env, "clone_comment", {
    actorId: userId,
    cloneId,
    extraBody: body.content.trim(),
  });
  await bumpInteraction(c.env, userId, cloneId, "feed");
  return c.json(
    {
      ok: true,
      comment: {
        id: Number(r.meta.last_row_id),
        feedId,
        userId,
        content: body.content.trim(),
      },
      promoted,
    },
    201,
  );
});

cloneFeeds.get("/:id/comments", async (c) => {
  const cloneId = parseCloneId(c);
  const url = new URL(c.req.url);
  const limitRaw = Number(url.searchParams.get("limit") ?? 50);
  const limit = Math.max(1, Math.min(200, Number.isFinite(limitRaw) ? limitRaw : 50));
  const viewerId = await resolveOptionalUser(c);

  const likedByMeExpr = viewerId
    ? `EXISTS (SELECT 1 FROM feed_comment_likes fcl WHERE fcl.comment_id = fc.id AND fcl.user_id = ?)`
    : `0`;
  const binds: unknown[] = viewerId ? [viewerId, cloneId, limit] : [cloneId, limit];
  const rows = (
    await c.env.DB
      .prepare(
        `SELECT fc.id          AS commentId,
                fc.feed_id     AS feedId,
                fc.user_id     AS userId,
                fc.content     AS content,
                fc.created_at  AS createdAt,
                fc.likes_count AS likesCount,
                ${likedByMeExpr} AS likedByMe,
                u.name         AS userName,
                u.email        AS userEmail,
                u.avatar_url   AS userAvatarUrl,
                (SELECT COUNT(*) FROM feed_comments fcc
                   WHERE fcc.parent_comment_id = fc.id) AS repliesCount
           FROM feed_comments fc
           JOIN feeds f ON f.id = fc.feed_id
           JOIN users u ON u.id = fc.user_id
          WHERE f.clone_id = ?
            AND fc.parent_comment_id IS NULL
            AND u.deleted_at IS NULL
          ORDER BY fc.id DESC
          LIMIT ?`,
      )
      .bind(...binds)
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
  return c.json({
    items: rows.map((r) => ({
      id: r.commentId,
      feedId: r.feedId,
      userId: r.userId,
      content: r.content,
      createdAt: r.createdAt,
      repliesCount: r.repliesCount ?? 0,
      likesCount: r.likesCount ?? 0,
      likedByMe: !!r.likedByMe,
      user: {
        id: r.userId,
        name: r.userName,
        email: r.userEmail,
        avatarUrl: r.userAvatarUrl,
      },
    })),
    nextCursor: null,
  });
});

cloneFeeds.get("/:id/likes", async (c) => {
  const cloneId = parseCloneId(c);
  const url = new URL(c.req.url);
  const limitRaw = Number(url.searchParams.get("limit") ?? 50);
  const limit = Math.max(1, Math.min(200, Number.isFinite(limitRaw) ? limitRaw : 50));

  const rows = (
    await c.env.DB
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
      .bind(cloneId, limit)
      .all<{
        userId: number;
        likeId: number;
        createdAt: string;
        userName: string | null;
        userEmail: string;
        userAvatarUrl: string | null;
      }>()
  ).results;

  return c.json({
    items: rows.map((r) => ({
      likeId: r.likeId,
      userId: r.userId,
      name: r.userName,
      email: r.userEmail,
      avatarUrl: r.userAvatarUrl,
      createdAt: r.createdAt,
    })),
    nextCursor: null,
  });
});

cloneFeeds.delete("/:id/feeds/:feedId", requireAuth, async (c) => {
  const cloneId = parseCloneId(c);
  const feedId = parseFeedId(c);
  const userId = c.get("userId")!;
  const clone = await loadCloneById(c.env.DB, cloneId);
  if (!clone) throw new APIError("NOT_FOUND", "페르소나를 찾을 수 없어요.");
  await assertWriter(c.env.DB, cloneId, userId, clone);

  const res = await c.env.DB
    .prepare(`DELETE FROM feeds WHERE id = ? AND clone_id = ?`)
    .bind(feedId, cloneId)
    .run();

  if (!res.success || (res.meta.changes ?? 0) === 0) {
    throw new APIError("NOT_FOUND", "Feed not found.");
  }
  return c.json({ ok: true });
});
