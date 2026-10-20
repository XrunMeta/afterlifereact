

import type { v_273a0c } from "./env";
import { v_c226a5, type v_dbf3ef } from "./notify";
import type { v_f32241 } from "./notificationTemplates";

export function v_33a486(v_1833e7): string {
  const v_10a17d = v_1833e7.charCodeAt(v_1833e7.length - 1);
  if (v_10a17d >= 0xac00 && v_10a17d <= 0xd7a3) return `${v_1833e7}${(v_10a17d - 0xac00) % 28 === 0 ? "와" : "과"}`;
  return `${v_1833e7}와`;
}

export function v_b09c2e(v_94302c, v_931bf0, v_f2ff36): string | null {
  if (v_94302c === "intimacy_milestone" && typeof v_931bf0.score === "number") {
    return `${v_33a486(v_f2ff36)}의 온도가 ${v_931bf0.score}°C가 됐어요`;
  }
  return null;
}

export async function v_a00a76(
  env: v_273a0c,
  v_4317d1,
  v_336f81,
): Promise<boolean> {
  if (v_336f81 > 0) await new Promise((v_cb35cb) => setTimeout(v_cb35cb, v_336f81));
  const v_0dd7c7 = await v_c9c489.DB
    .prepare(
      `SELECT 1 FROM conversation_read_markers
        WHERE user_id = ? AND clone_id = ? AND datetime(last_read_at) >= datetime(?)`,
    )
    .bind(v_4317d1.userId, v_4317d1.cloneId, v_4317d1.replyCreatedAt)
    .first();
  if (v_0dd7c7) return false;
  const v_8d41d7 = v_4317d1.replyText.replace(/\s+/g, " ").trim();
  return v_f1d400(v_c9c489, {
    userId: v_4317d1.userId,
    cloneId: v_4317d1.cloneId,
    type: "clone_message",
    title: v_4317d1.cloneName,
    body: v_8d41d7.length > 80 ? `${v_8d41d7.slice(0, 80)}…` : v_8d41d7,
  });
}

export async function v_f1d400(
  env: v_273a0c,
  args: {
    userId: number;
    cloneId: number;
    type: v_dbf3ef;
    title: string;
    body: string;

    templateKey?: string;
    vars?: v_f32241;
  },
): Promise<boolean> {
  try {
    const v_9c58a3 = await v_c9c489.DB
      .prepare(`SELECT 1 FROM clone_notification_mutes WHERE user_id = ? AND clone_id = ? LIMIT 1`)
      .bind(v_4317d1.userId, v_4317d1.cloneId)
      .first();
    if (v_9c58a3) return false;
    await v_c226a5(v_c9c489, {
      userId: v_4317d1.userId,
      type: v_4317d1.type,
      title: v_4317d1.title,
      body: v_4317d1.body,
      templateKey: v_4317d1.templateKey,
      vars: v_4317d1.vars,
      url: `afterlife://chat/${v_4317d1.cloneId}`,
      data: { cloneId: v_4317d1.cloneId, chat: true },
      skipEmail: true,
      skipInApp: true,
    });
    return true;
  } catch (v_49263d) {
    console.warn("[pushChatEvent] failed:", (v_49263d as Error).message);
    return false;
  }
}
