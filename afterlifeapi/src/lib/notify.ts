

import type { v_273a0c } from "./env";
import { v_a71d8b } from "./gmail";
import { v_51b1f7 } from "./expoPush";

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

export async function v_c226a5(env: v_273a0c, v_328259): Promise<NotifyResult> {
  let v_81161e = false;
  let v_871c5a = 0;
  let v_49ca22 = 0;
  let v_c5c953 = false;

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

  if (v_328259.userId) {
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

  let v_db9acb = v_328259.email;
  if (!v_db9acb && v_328259.userId) {
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

function v_8fd199(v_fd5f43): string {
  return v_fd5f43
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
