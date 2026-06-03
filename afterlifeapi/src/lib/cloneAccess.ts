

import type { v_437670 } from "zmui";
import type { v_de0a25 } from "./env";
import { v_2703c5 } from "./jwt";

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
}

export async function v_5d4a51(
  v_a1651b,
  v_6e0fd3,
): Promise<CloneRow | null> {
  return await v_a1651b
    .prepare(
      `SELECT c.id, c.owner_id, c.name, c.username, c.description, c.clone_type,
              c.category, c.visibility, c.avatar_url, c.cover_image_url,
              c.voice_type, c.voice_preset_id, c.training_status, c.created_at,
              c.is_system,
              c.idle_video_url, c.voice_se_url,
              COALESCE(s.followers_count, 0) AS followers_count,
              COALESCE(s.messages_count, 0)  AS messages_count,
              COALESCE(s.gifts_count, 0)     AS gifts_count
         FROM clones c
         LEFT JOIN clone_stats s ON s.clone_id = c.id
        WHERE c.id = ? AND c.deleted_at IS NULL`,
    )
    .bind(v_6e0fd3)
    .first<CloneRow>();
}

export async function v_7adf64(
  v_a1651b,
  v_6e0fd3,
  v_43e90c,
): Promise<"owner" | "viewer" | null> {
  const v_3ac7e7 = await v_a1651b
    .prepare(
      `SELECT role FROM clone_shares
        WHERE clone_id = ? AND target_user_id = ? AND status = 'accepted'
        LIMIT 1`,
    )
    .bind(v_6e0fd3, v_43e90c)
    .first<{ role: "owner" | "viewer" }>();
  return v_3ac7e7?.role ?? null;
}

export async function v_ab84f6(
  v_a1651b,
  v_6e0fd3,
  v_43e90c,
): Promise<boolean> {
  const v_3ac7e7 = await v_a1651b
    .prepare(`SELECT 1 AS x FROM clone_follows WHERE clone_id = ? AND user_id = ?`)
    .bind(v_6e0fd3, v_43e90c)
    .first<{ x: number }>();
  return !!v_3ac7e7;
}

export async function v_efcb2d(
  c: v_437670<v_de0a25>,
): Promise<number | null> {
  const v_ad8d0d = v_3f4e2e.req.header("Authorization");
  if (!v_ad8d0d?.startsWith("Bearer ")) return null;
  try {
    const v_931bf0 = await v_2703c5<{ sub: number; kind?: string }>(
      v_ad8d0d.slice(7),
      v_3f4e2e.env.JWT_ACCESS_SECRET,
    );
    if (v_931bf0.kind && v_931bf0.kind !== "access") return null;
    const v_0c8987 = typeof v_931bf0.sub === "string" ? Number(v_931bf0.sub) : v_931bf0.sub;
    return Number.isInteger(v_0c8987) && v_0c8987 > 0 ? v_0c8987 : null;
  } catch {
    return null;
  }
}

export type ViewerRole = "owner" | "viewer" | "follower" | "guest";

export type ResponseViewerRole = "owner" | "coowner" | "follower";

export async function v_d875d1(
  v_a1651b,
  v_eb25ce,
  v_43e90c,
): Promise<ResponseViewerRole | null> {
  if (v_43e90c === null) return null;
  if (v_43e90c === v_eb25ce.owner_id) return "owner";
  const v_c2bdf9 = await v_7adf64(v_a1651b, v_eb25ce.id, v_43e90c);
  if (v_c2bdf9 !== null) return "coowner";
  if (await v_ab84f6(v_a1651b, v_eb25ce.id, v_43e90c)) return "follower";
  return null;
}

export async function v_09d461(
  c: v_437670<v_de0a25>,
  v_eb25ce,
  v_43e90c,
): Promise<ViewerRole | null> {
  if (v_43e90c === v_eb25ce.owner_id) return "owner";
  if (v_43e90c !== null) {
    const v_c2bdf9 = await v_7adf64(v_3f4e2e.env.DB, v_eb25ce.id, v_43e90c);
    if (v_c2bdf9 === "owner") return "owner";
    if (v_c2bdf9 === "viewer") return "viewer";
  }
  if (v_eb25ce.visibility === "public") {
    if (v_43e90c !== null && (await v_ab84f6(v_3f4e2e.env.DB, v_eb25ce.id, v_43e90c))) {
      return "follower";
    }
    return "guest";
  }
  if (v_eb25ce.visibility === "followers") {
    if (v_43e90c !== null && (await v_ab84f6(v_3f4e2e.env.DB, v_eb25ce.id, v_43e90c))) {
      return "follower";
    }
    return null;
  }
  return null;
}
