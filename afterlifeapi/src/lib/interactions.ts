

import type { v_273a0c } from "./env";

type InteractionKind = "chat" | "call" | "learn" | "feed";

const v_dff7c1 = {
  chat: "chat_count",
  call: "call_count",
  learn: "learn_count",
  feed: "feed_count",
};

export async function v_dd9d7c(
  env: v_273a0c,
  v_43e90c,
  v_6e0fd3,
  v_94302c,
  v_e9396c = 1,
): Promise<void> {
  if (!v_43e90c || !v_6e0fd3) return;
  const v_c8b83f = v_dff7c1[v_94302c];
  try {
    await v_c9c489.DB
      .prepare(
        `INSERT INTO user_clone_interactions (user_id, clone_id, ${v_c8b83f})
         VALUES (?, ?, ?)
         ON CONFLICT(user_id, clone_id) DO UPDATE
            SET ${v_c8b83f} = ${v_c8b83f} + excluded.${v_c8b83f},
                last_at = CURRENT_TIMESTAMP`,
      )
      .bind(v_43e90c, v_6e0fd3, v_e9396c)
      .run();
  } catch (v_49263d) {
    console.warn(`[interactions] bump ${v_94302c} failed:`, (v_49263d as Error).message);
  }
}

export function v_4d20a8(v_c83285): number {
  if (v_c83285 <= 0) return 0;
  return Math.min(100, Math.floor(v_c83285 * 2));
}
