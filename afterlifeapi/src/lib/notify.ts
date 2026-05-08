

import type { Bindings } from "./env";
import { sendMail } from "./gmail";
import { sendPushToUser } from "./expoPush";

export type NotificationType =
  | "invite_received"
  | "invite_accepted"
  | "share_kicked"
  | "ownership_transferred";

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

  let emailTo = opts.email;
  if (!emailTo && opts.userId) {
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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
