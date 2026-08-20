

import type { D1Database } from "@cloudflare/workers-types";
import { APIError } from "./errors";

function parseTs(ts: string): number {
  if (ts.includes("T")) return new Date(ts).getTime();
  return new Date(ts.replace(" ", "T") + "Z").getTime();
}

export async function ensureNotCommentBanned(db: D1Database, userId: number): Promise<void> {
  const row = await db
    .prepare(`SELECT comment_ban_until AS until FROM users WHERE id = ?`)
    .bind(userId)
    .first<{ until: string | null }>();
  if (row?.until && parseTs(row.until) > Date.now()) {
    throw new APIError("FORBIDDEN", "관리자 제재로 댓글 작성이 제한되었습니다.");
  }
}

export async function ensureNotInteractionBanned(db: D1Database, userId: number): Promise<void> {
  const row = await db
    .prepare(`SELECT interaction_ban_until AS until FROM users WHERE id = ?`)
    .bind(userId)
    .first<{ until: string | null }>();
  if (row?.until && parseTs(row.until) > Date.now()) {
    throw new APIError("FORBIDDEN", "관리자 제재로 좋아요·팔로우가 제한되었습니다.");
  }
}

export async function ensureDeviceNotBanned(db: D1Database, deviceId: string | null | undefined): Promise<void> {
  if (!deviceId) return; 
  const row = await db
    .prepare(`SELECT 1 AS x FROM device_bans WHERE device_id = ? LIMIT 1`)
    .bind(deviceId)
    .first<{ x: number }>();
  if (row) {
    throw new APIError(
      "UNAUTHENTICATED",
      "관리자에 의해 이 디바이스의 사용이 차단되었습니다.",
    );
  }
}
