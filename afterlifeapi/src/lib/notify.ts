

import type { Bindings } from "./env";
import { sendMail } from "./gmail";
import { sendPushToUser } from "./expoPush";

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

  | "intimacy_score";

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

export async function notify(env: Bindings, opts: NotifyOptions): Promise<NotifyResult> {
  let inserted = false;
  let pushAttempted = 0;
  let pushSent = 0;
  let emailSent = false;

  if (opts.userId) {
    try {
      await env.DB
        .prepare(
          `INSERT INTO notifications (user_id, type, title, body, data_json)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .bind(
          opts.userId,
          opts.type,
          opts.title,
          opts.body,
          JSON.stringify({ url: opts.url ?? null, ...(opts.data ?? {}) }),
        )
        .run();
      inserted = true;
    } catch (err) {
      console.warn("[notify] insert failed:", (err as Error).message);
    }
  }

  if (opts.userId) {
    try {
      const r = await sendPushToUser(env, opts.userId, {
        title: opts.title,
        body: opts.body,
        data: { url: opts.url, type: opts.type, ...(opts.data ?? {}) },
      });
      pushAttempted = r.attempted;
      pushSent = r.sent;
    } catch (err) {
      console.warn("[notify] push failed:", (err as Error).message);
    }
  }

  let emailTo = opts.skipEmail ? undefined : opts.email;
  if (!emailTo && opts.userId && !opts.skipEmail) {
    try {
      const row = await env.DB
        .prepare(`SELECT email FROM users WHERE id = ?`)
        .bind(opts.userId)
        .first<{ email: string }>();
      emailTo = row?.email ?? undefined;
    } catch (err) {
      console.warn("[notify] email lookup failed:", (err as Error).message);
    }
  }
  if (emailTo) {
    try {
      const html =
        opts.emailHtml ??
        `<div style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6">
           <h2 style="margin:0 0 12px">${escapeHtml(opts.title)}</h2>
           <p>${escapeHtml(opts.body)}</p>
           ${opts.url ? `<p><a href="${opts.url}" style="display:inline-block;padding:10px 16px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:8px">열기</a></p>` : ""}
         </div>`;
      await sendMail(env, {
        to: emailTo,
        subject: opts.emailSubject ?? opts.title,
        html,
      });
      emailSent = true;
    } catch (err) {
      console.warn("[notify] email send failed:", (err as Error).message);
    }
  }

  return { inserted, pushAttempted, pushSent, emailSent };
}

export async function notifyCloneEvent(
  env: Bindings,
  type: "clone_like" | "clone_comment" | "clone_follow" | "clone_gift",
  args: { actorId: number; cloneId: number; extraBody?: string },
): Promise<void> {
  try {
    const clone = await env.DB
      .prepare(`SELECT owner_id, name FROM clones WHERE id = ? AND deleted_at IS NULL`)
      .bind(args.cloneId)
      .first<{ owner_id: number; name: string }>();
    if (!clone) return;
    if (clone.owner_id === args.actorId) return; 

    const actor = await env.DB
      .prepare(`SELECT name, email FROM users WHERE id = ?`)
      .bind(args.actorId)
      .first<{ name: string | null; email: string | null }>();
    const actorName = actor?.name || actor?.email?.split("@")[0] || "누군가";

    let title = "";
    let body = "";
    switch (type) {
      case "clone_like":
        title = "❤️ 좋아요";
        body = `${actorName} 님이 ${clone.name} 에게 좋아요를 눌렀어요`;
        break;
      case "clone_comment":
        title = "💬 새 댓글";
        body = args.extraBody
          ? `${actorName} 님: ${args.extraBody.slice(0, 60)}`
          : `${actorName} 님이 ${clone.name} 에게 댓글을 남겼어요`;
        break;
      case "clone_follow":
        title = "✨ 새 팔로워";
        body = `${actorName} 님이 ${clone.name} 을(를) 팔로우했어요`;
        break;
      case "clone_gift":
        title = "🎁 선물 도착";
        body = args.extraBody
          ? `${actorName} 님이 ${args.extraBody}`
          : `${actorName} 님이 ${clone.name} 에게 선물을 보냈어요`;
        break;
    }

    await notify(env, {
      userId: clone.owner_id,
      type,
      title,
      body,
      url: `afterlife://clone/${args.cloneId}`,
      data: { cloneId: args.cloneId, actorId: args.actorId },
      skipEmail: true,
    });
  } catch (err) {
    console.warn("[notifyCloneEvent] failed:", (err as Error).message);
  }
}

export async function notifyIntimacyScore(
  env: Bindings,
  args: {
    actorId: number;
    cloneId: number;
    action: "chat" | "call" | "learn" | "feed";
    score: number;
  },
): Promise<void> {
  try {
    if (args.score <= 0) return;
    const clone = await env.DB
      .prepare(`SELECT owner_id, name FROM clones WHERE id = ? AND deleted_at IS NULL`)
      .bind(args.cloneId)
      .first<{ owner_id: number; name: string }>();
    if (!clone) return;
    if (clone.owner_id === args.actorId) return; 

    const ACTION_LABEL: Record<"chat" | "call" | "learn" | "feed", string> = {
      chat: "채팅",
      call: "통화",
      learn: "프로필 탐색",
      feed: "피드 소통",
    };
    const label = ACTION_LABEL[args.action];

    await notify(env, {
      userId: clone.owner_id,
      type: "intimacy_score",
      title: `🌡️ +${args.score}°C 온도 상승`,
      body: `${clone.name} 의 친밀도가 ${label} 활동으로 ${args.score}°C 올랐어요`,
      url: `afterlife://clone/${args.cloneId}/intimacy`,
      data: {
        cloneId: args.cloneId,
        action: args.action,
        score: args.score,
        actorId: args.actorId,
      },
      skipEmail: true,
    });
  } catch (err) {
    console.warn("[notifyIntimacyScore] failed:", (err as Error).message);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
