

import type { v_273a0c } from "./env";
import { v_a71d8b } from "./gmail";
import { v_51b1f7 } from "./expoPush";
import { v_74c502 } from "./cloneAccess";

export type NotificationType =
  | "invite_received"
  | "invite_accepted"
  | "share_kicked"
  | "ownership_transferred"
  | "clone_like"
  | "clone_comment"
  | "clone_follow"
  | "clone_gift"

  | "user_follow"

  | "followee_new_clone"

  | "intimacy_score"

  | "moderation";

export interface NotifyOptions {

  userId?: number;

  email?: string;
  type: NotificationType;
  title: string;
  body: string;

  url?: string;

  data?: Record<string, unknown>;

  emailHtml?: string;

  emailSubject?: string;

  skipEmail?: boolean;
}

export interface NotifyResult {
  inserted: boolean;
  pushAttempted: number;
  pushSent: number;
  emailSent: boolean;
}

export type NotificationPrefCategory = "new_follower" | "following_activity" | "reactions";

const v_e6c9c1 = {
  user_follow: "new_follower",
  followee_new_clone: "following_activity",
  clone_like: "reactions",
  clone_comment: "reactions",
  clone_follow: "reactions",
  clone_gift: "reactions",
};

export async function v_5f5ee2(
  env: v_273a0c,
  v_43e90c,
  v_3b27d9,
): Promise<boolean> {
  const v_8b9cd4 = v_e6c9c1[v_3b27d9];
  if (!v_8b9cd4) return true;
  try {
    const v_3ac7e7 = await v_c9c489.DB
      .prepare(`SELECT ${v_8b9cd4} AS v FROM user_notification_prefs WHERE user_id = ?`)
      .bind(v_43e90c)
      .first<{ v: number }>();
    return v_3ac7e7 ? v_3ac7e7.v === 1 : true;
  } catch (v_49263d) {
    console.warn("[notify] prefs lookup failed:", (v_49263d as Error).message);
    return true;
  }
}

export async function v_c226a5(env: v_273a0c, v_328259): Promise<NotifyResult> {
  let v_81161e = false;
  let v_871c5a = 0;
  let v_49ca22 = 0;
  let v_c5c953 = false;

  const v_762d02 = v_328259.userId ? await v_5f5ee2(v_c9c489, v_328259.userId, v_328259.type) : true;

  if (v_328259.userId) {
    try {
      await v_c9c489.DB
        .prepare(
          `INSERT INTO notifications (user_id, type, title, body, data_json)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .bind(
          v_328259.userId,
          v_328259.type,
          v_328259.title,
          v_328259.body,
          JSON.stringify({ url: v_328259.url ?? null, ...(v_328259.data ?? {}) }),
        )
        .run();
      v_81161e = true;
    } catch (v_49263d) {
      console.warn("[notify] insert failed:", (v_49263d as Error).message);
    }
  }

  if (v_328259.userId && v_762d02) {
    try {
      const v_cb35cb = await v_51b1f7(v_c9c489, v_328259.userId, {
        title: v_328259.title,
        body: v_328259.body,
        data: { url: v_328259.url, type: v_328259.type, ...(v_328259.data ?? {}) },
      });
      v_871c5a = v_cb35cb.attempted;
      v_49ca22 = v_cb35cb.sent;
    } catch (v_49263d) {
      console.warn("[notify] push failed:", (v_49263d as Error).message);
    }
  }

  let v_db9acb = v_328259.skipEmail || !v_762d02 ? undefined : v_328259.email;
  if (!v_db9acb && v_328259.userId && !v_328259.skipEmail && v_762d02) {
    try {
      const v_3ac7e7 = await v_c9c489.DB
        .prepare(`SELECT email FROM users WHERE id = ?`)
        .bind(v_328259.userId)
        .first<{ email: string }>();
      v_db9acb = v_3ac7e7?.email ?? undefined;
    } catch (v_49263d) {
      console.warn("[notify] email lookup failed:", (v_49263d as Error).message);
    }
  }
  if (v_db9acb) {
    try {
      const v_d91d98 =
        v_328259.emailHtml ??
        `<div style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6">
           <h2 style="margin:0 0 12px">${v_8fd199(v_328259.title)}</h2>
           <p>${v_8fd199(v_328259.body)}</p>
           ${v_328259.url ? `<p><a href="${v_328259.url}" style="display:inline-block;padding:10px 16px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:8px">열기</a></p>` : ""}
         </div>`;
      await v_a71d8b(v_c9c489, {
        to: v_db9acb,
        subject: v_328259.emailSubject ?? v_328259.title,
        html: v_d91d98,
      });
      v_c5c953 = true;
    } catch (v_49263d) {
      console.warn("[notify] email send failed:", (v_49263d as Error).message);
    }
  }

  return { inserted: v_81161e, pushAttempted: v_871c5a, pushSent: v_49ca22, emailSent: v_c5c953 };
}

export async function v_80a022(
  env: v_273a0c,
  v_3b27d9,
  v_4317d1,
): Promise<void> {
  try {
    const v_eb25ce = await v_c9c489.DB
      .prepare(`SELECT owner_id, name FROM clones WHERE id = ? AND ${v_74c502()}`)
      .bind(v_4317d1.cloneId)
      .first<{ owner_id: number; name: string }>();
    if (!v_eb25ce) return;
    if (v_eb25ce.owner_id === v_4317d1.actorId) return; 

    const v_9c58a3 = await v_c9c489.DB
      .prepare(
        `SELECT 1 FROM clone_notification_mutes WHERE user_id = ? AND clone_id = ? LIMIT 1`,
      )
      .bind(v_eb25ce.owner_id, v_4317d1.cloneId)
      .first<{ 1: number }>();
    if (v_9c58a3) return;

    const v_380fb2 = await v_c9c489.DB
      .prepare(`SELECT name, email FROM users WHERE id = ?`)
      .bind(v_4317d1.actorId)
      .first<{ name: string | null; email: string | null }>();
    const v_6dd0ab = v_380fb2?.name || v_380fb2?.email?.split("@")[0] || "누군가";

    let v_9f1622 = "";
    let v_4d33b2 = "";
    switch (v_3b27d9) {
      case "clone_like":
        v_9f1622 = "❤️ 좋아요";
        v_4d33b2 = `${v_6dd0ab} 님이 ${v_eb25ce.name} 에게 좋아요를 눌렀어요`;
        break;
      case "clone_comment":
        v_9f1622 = "💬 새 댓글";
        v_4d33b2 = v_4317d1.extraBody
          ? `${v_6dd0ab} 님: ${v_4317d1.extraBody.slice(0, 60)}`
          : `${v_6dd0ab} 님이 ${v_eb25ce.name} 에게 댓글을 남겼어요`;
        break;
      case "clone_follow":

        v_9f1622 = "✨ 새 구독";
        v_4d33b2 = `${v_6dd0ab} 님이 ${v_eb25ce.name} 을(를) 구독했어요`;
        break;
      case "clone_gift":
        v_9f1622 = "🎁 선물 도착";
        v_4d33b2 = v_4317d1.extraBody
          ? `${v_6dd0ab} 님이 ${v_4317d1.extraBody}`
          : `${v_6dd0ab} 님이 ${v_eb25ce.name} 에게 선물을 보냈어요`;
        break;
    }

    await v_c226a5(v_c9c489, {
      userId: v_eb25ce.owner_id,
      type: v_3b27d9,
      title: v_9f1622,
      body: v_4d33b2,
      url: `afterlife://clone/${v_4317d1.cloneId}`,

      data: {
        cloneId: v_4317d1.cloneId,
        actorId: v_4317d1.actorId,
        ...(v_4317d1.feedId != null ? { feedId: v_4317d1.feedId } : {}),
      },
      skipEmail: true,
    });
  } catch (v_49263d) {
    console.warn("[notifyCloneEvent] failed:", (v_49263d as Error).message);
  }
}

export async function v_33d48f(
  env: v_273a0c,
  v_4317d1,
): Promise<void> {
  try {
    if (v_4317d1.score <= 0) return;
    const v_eb25ce = await v_c9c489.DB
      .prepare(`SELECT owner_id, name FROM clones WHERE id = ? AND ${v_74c502()}`)
      .bind(v_4317d1.cloneId)
      .first<{ owner_id: number; name: string }>();
    if (!v_eb25ce) return;

    const v_b0b8c8 = {
      chat: "채팅",
      call: "통화",
      learn: "프로필 탐색",
      feed: "피드 소통",
    };
    const v_2869c1 = v_b0b8c8[v_4317d1.action];
    const v_9390e8 = {
      cloneId: v_4317d1.cloneId,
      action: v_4317d1.action,
      score: v_4317d1.score,
      actorId: v_4317d1.actorId,
    };
    const v_f71b56 = `afterlife://clone/${v_4317d1.cloneId}/intimacy`;
    const v_9f1622 = `🌡️ +${v_4317d1.score}°C 온도 상승`;

    await v_c226a5(v_c9c489, {
      userId: v_4317d1.actorId,
      type: "intimacy_score",
      title: v_9f1622,
      body: `${v_eb25ce.name} 과의 친밀도가 ${v_2869c1} 활동으로 ${v_4317d1.score}°C 올랐어요`,
      url: v_f71b56,
      data: v_9390e8,
      skipEmail: true,
    });

    if (v_eb25ce.owner_id !== v_4317d1.actorId) {
      await v_c226a5(v_c9c489, {
        userId: v_eb25ce.owner_id,
        type: "intimacy_score",
        title: v_9f1622,
        body: `${v_eb25ce.name} 의 친밀도가 ${v_2869c1} 활동으로 ${v_4317d1.score}°C 올랐어요`,
        url: v_f71b56,
        data: v_9390e8,
        skipEmail: true,
      });
    }
  } catch (v_49263d) {
    console.warn("[notifyIntimacyScore] failed:", (v_49263d as Error).message);
  }
}

function v_8fd199(v_fd5f43): string {
  return v_fd5f43
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
