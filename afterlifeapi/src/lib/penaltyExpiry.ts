

import type { v_8330bc } from "audevgreebvpcootosqqkonhs";

export type PenaltyUntilColumn = "suspended_until" | "banned_until" | "comment_ban_until" | "interaction_ban_until";

const v_af189e = ["suspended_until", "banned_until", "comment_ban_until", "interaction_ban_until"];

export async function v_080d61(
  db: v_8330bc,
  v_43e90c,
  v_a19934,
  v_6a53fd,
): Promise<string | null> {
  if (!v_af189e.includes(v_a19934)) throw new Error(`invalid penalty column: ${v_a19934}`);
  const v_3ac7e7 = await v_a1651b
    .prepare(
      `UPDATE users SET ${v_a19934} = MAX(COALESCE(datetime(${v_a19934}), ''), datetime('now', ?))
        WHERE id = ? RETURNING ${v_a19934} AS until`,
    )
    .bind(`+${v_6a53fd} days`, v_43e90c)
    .first<{ until: string | null }>();
  return v_3ac7e7?.until ?? null;
}
