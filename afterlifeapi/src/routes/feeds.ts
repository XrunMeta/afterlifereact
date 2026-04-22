

import { Hono } from "hono";
import type { AppEnv } from "../lib/env";
import { APIError } from "../lib/errors";
import { parseJson, z } from "../lib/validate";
import { requireAuth } from "../middleware/auth";
import {
  hasAcceptedShare,
  isFollower,
  loadCloneById,
  resolveOptionalUser,
} from "../lib/cloneAccess";

export const cloneFeeds = new Hono<AppEnv>();

function parseCloneId(c: { req: { param: (k: string) => string } }): number {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) {
    throw new APIError("VALIDATION_FAILED", "Invalid clone id.");
  }
  return id;
}
function parseFeedId(c: { req: { param: (k: string) => string } }): number {
  const fid = Number(c.req.param("feedId"));
  if (!Number.isInteger(fid) || fid <= 0) {
    throw new APIError("VALIDATION_FAILED", "Invalid feed id.");
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
    throw new APIError("FORBIDDEN", "Owner/coowner only.");
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
  if (!clone) throw new APIError("NOT_FOUND", "Clone not found.");

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
    throw new APIError("FORBIDDEN", "Private clone.");
  }
  if (clone.visibility === "followers" && !role) {
    throw new APIError("FORBIDDEN", "Followers-only clone.");
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

cloneFeeds.post("/:id/feeds", requireAuth, async (c) => {
  const cloneId = parseCloneId(c);
  const userId = c.get("userId")!;
  const clone = await loadCloneById(c.env.DB, cloneId);
  if (!clone) throw new APIError("NOT_FOUND", "Clone not found.");
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

cloneFeeds.delete("/:id/feeds/:feedId", requireAuth, async (c) => {
  const cloneId = parseCloneId(c);
  const feedId = parseFeedId(c);
  const userId = c.get("userId")!;
  const clone = await loadCloneById(c.env.DB, cloneId);
  if (!clone) throw new APIError("NOT_FOUND", "Clone not found.");
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
