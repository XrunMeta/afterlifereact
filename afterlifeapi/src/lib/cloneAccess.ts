

import type { Context } from "hono";
import type { AppEnv } from "./env";
import { verifyToken } from "./jwt";

export function cloneActiveSql(alias = ""): string {
  const p = alias ? `${alias}.` : "";
  return `${p}deleted_at IS NULL AND ${p}deletion_state = 'active'`;
}

export function cloneNotSuspendedSql(alias = ""): string {
  const p = alias ? `${alias}.` : "";
  return `${p}admin_suspended_at IS NULL`;
}

export interface CloneRow {
  id: number;
  owner_id: number;
  name: string;
  username: string;
  description: string | null;
  clone_type: string;
  category: string | null;
  visibility: string;
  avatar_url: string | null;
  cover_image_url: string | null;
  voice_type: string | null;
  voice_preset_id: number | null;
  training_status: string;
  created_at: string;
  followers_count: number;
  messages_count: number;
  gifts_count: number;

  is_system: number;

  idle_video_url: string | null;
  voice_se_url: string | null;

  filler_video_urls: string | null;

  guide_video_urls: string | null;

  relation: string | null;

  admin_suspended_at: string | null;
}

export async function loadCloneById(
  db: D1Database,
  cloneId: number,
): Promise<CloneRow | null> {
  return await db
    .prepare(
      `SELECT c.id, c.owner_id, c.name, c.username, c.description, c.clone_type,
              c.category, c.visibility, c.avatar_url, c.cover_image_url,
              c.voice_type, c.voice_preset_id, c.training_status, c.created_at,
              c.is_system,
              c.idle_video_url, c.voice_se_url, c.filler_video_urls, c.guide_video_urls,
              c.relation, c.admin_suspended_at,
              COALESCE(s.followers_count, 0) AS followers_count,
              COALESCE(s.messages_count, 0)  AS messages_count,
              COALESCE(s.gifts_count, 0)     AS gifts_count
         FROM clones c
         LEFT JOIN clone_stats s ON s.clone_id = c.id
        WHERE c.id = ? AND ${cloneActiveSql("c")}`,
    )
    .bind(cloneId)
    .first<CloneRow>();
}

export async function hasAcceptedShare(
  db: D1Database,
  cloneId: number,
  userId: number,
): Promise<"owner" | "viewer" | null> {
  const row = await db
    .prepare(
      `SELECT role FROM clone_shares
        WHERE clone_id = ? AND target_user_id = ? AND status = 'accepted'
        LIMIT 1`,
    )
    .bind(cloneId, userId)
    .first<{ role: "owner" | "viewer" }>();
  return row?.role ?? null;
}

export async function isBlockedByOwner(
  db: D1Database,
  ownerId: number,
  userId: number | null,
): Promise<boolean> {
  if (userId === null || userId === ownerId) return false;
  const row = await db
    .prepare(`SELECT 1 AS x FROM user_blocks WHERE blocker_id = ? AND blocked_id = ? LIMIT 1`)
    .bind(ownerId, userId)
    .first<{ x: number }>();
  return !!row;
}

export async function isFollower(
  db: D1Database,
  cloneId: number,
  userId: number,
): Promise<boolean> {
  const row = await db
    .prepare(`SELECT 1 AS x FROM clone_follows WHERE clone_id = ? AND user_id = ?`)
    .bind(cloneId, userId)
    .first<{ x: number }>();
  return !!row;
}

export async function resolveOptionalUser(
  c: Context<AppEnv>,
): Promise<number | null> {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) return null;
  try {
    const payload = await verifyToken<{ sub: number; kind?: string }>(
      header.slice(7),
      c.env.JWT_ACCESS_SECRET,
    );
    if (payload.kind && payload.kind !== "access") return null;
    const uid = typeof payload.sub === "string" ? Number(payload.sub) : payload.sub;
    return Number.isInteger(uid) && uid > 0 ? uid : null;
  } catch {
    return null;
  }
}

export type ViewerRole = "owner" | "viewer" | "follower" | "guest";

export type ResponseViewerRole = "owner" | "coowner" | "follower";

export async function resolveResponseViewerRole(
  db: D1Database,
  clone: Pick<CloneRow, "id" | "owner_id">,
  userId: number | null,
): Promise<ResponseViewerRole | null> {
  if (userId === null) return null;
  if (userId === clone.owner_id) return "owner";

  if (await isBlockedByOwner(db, clone.owner_id, userId)) return null;
  const share = await hasAcceptedShare(db, clone.id, userId);
  if (share !== null) return "coowner";
  if (await isFollower(db, clone.id, userId)) return "follower";
  return null;
}

export function isSuspendedForViewer(
  clone: Pick<CloneRow, "admin_suspended_at">,
  viewerRole: ResponseViewerRole | null,
): boolean {
  if (!clone.admin_suspended_at) return false;
  return viewerRole !== "owner" && viewerRole !== "coowner";
}

export async function resolveViewerRole(
  c: Context<AppEnv>,
  clone: Pick<CloneRow, "id" | "owner_id" | "visibility">,
  userId: number | null,
): Promise<ViewerRole | null> {
  if (userId === clone.owner_id) return "owner";

  if (userId !== null && (await isBlockedByOwner(c.env.DB, clone.owner_id, userId))) {
    return null;
  }
  if (userId !== null) {
    const share = await hasAcceptedShare(c.env.DB, clone.id, userId);
    if (share === "owner") return "owner";
    if (share === "viewer") return "viewer";
  }
  if (clone.visibility === "public") {
    if (userId !== null && (await isFollower(c.env.DB, clone.id, userId))) {
      return "follower";
    }
    return "guest";
  }
  if (clone.visibility === "followers") {
    if (userId !== null && (await isFollower(c.env.DB, clone.id, userId))) {
      return "follower";
    }
    return null;
  }
  return null;
}

export function isSuspendedForCloneRole(
  clone: Pick<CloneRow, "admin_suspended_at">,
  role: ViewerRole | null,
): boolean {
  if (!clone.admin_suspended_at) return false;
  return role !== "owner";
}
