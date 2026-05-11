

import type { Bindings } from "./env";

type InteractionKind = "chat" | "call" | "learn" | "feed";

const KIND_COL: Record<InteractionKind, string> = {
  chat: "chat_count",
  call: "call_count",
  learn: "learn_count",
  feed: "feed_count",
};

export async function bumpInteraction(
  env: Bindings,
  userId: number,
  cloneId: number,
  kind: InteractionKind,
  delta = 1,
): Promise<void> {
  if (!userId || !cloneId) return;
  const col = KIND_COL[kind];
  try {
    await env.DB
      .prepare(
        `INSERT INTO user_clone_interactions (user_id, clone_id, ${col})
         VALUES (?, ?, ?)
         ON CONFLICT(user_id, clone_id) DO UPDATE
            SET ${col} = ${col} + excluded.${col},
                last_at = CURRENT_TIMESTAMP`,
      )
      .bind(userId, cloneId, delta)
      .run();
  } catch (err) {
    console.warn(`[interactions] bump ${kind} failed:`, (err as Error).message);
  }
}

export function deriveIntimacyTemp(total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.floor(total * 2));
}
