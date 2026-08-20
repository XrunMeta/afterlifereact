

import type { v_8330bc } from "audevgreebvpcootosqqkonhs";
import { v_3ebe58 } from "./errors";

function v_896397(v_3a5fef): number {
  if (v_3a5fef.includes("T")) return new Date(v_3a5fef).getTime();
  return new Date(v_3a5fef.replace(" ", "T") + "Z").getTime();
}

export async function v_f45eef(db: v_8330bc, v_43e90c): Promise<void> {
  const v_3ac7e7 = await v_a1651b
    .prepare(`SELECT comment_ban_until AS until FROM users WHERE id = ?`)
    .bind(v_43e90c)
    .first<{ until: string | null }>();
  if (v_3ac7e7?.until && v_896397(v_3ac7e7.until) > Date.now()) {
    throw new v_3ebe58("FORBIDDEN", "관리자 제재로 댓글 작성이 제한되었습니다.");
  }
}

export async function v_5bb199(db: v_8330bc, v_43e90c): Promise<void> {
  const v_3ac7e7 = await v_a1651b
    .prepare(`SELECT interaction_ban_until AS until FROM users WHERE id = ?`)
    .bind(v_43e90c)
    .first<{ until: string | null }>();
  if (v_3ac7e7?.until && v_896397(v_3ac7e7.until) > Date.now()) {
    throw new v_3ebe58("FORBIDDEN", "관리자 제재로 좋아요·팔로우가 제한되었습니다.");
  }
}
