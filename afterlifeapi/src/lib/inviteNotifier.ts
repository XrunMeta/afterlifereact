

import type { Bindings } from "./env";
import { sendMail } from "./gmail";
import { sendPushToUser } from "./push";

export interface InviteNotifyContext {
  cloneId: number;
  cloneName: string;
  inviteeEmail: string;
  inviterName: string;
  token: string; 
  expiresAt: string;
  acceptUrlBase?: string; 
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildEmailHtml(ctx: InviteNotifyContext, acceptUrl: string): string {
  const cloneName = escapeHtml(ctx.cloneName);
  const inviterName = escapeHtml(ctx.inviterName);
  return `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="utf-8"><title>afterlife 공동관리자 초대</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f7f8fa;margin:0;padding:32px 16px;color:#0f172a;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:32px 28px;border:1px solid #e2e8f0;">
    <h1 style="font-size:22px;font-weight:700;margin:0 0 16px;color:#0f172a;">공동관리자로 초대됐어요</h1>
    <p style="font-size:15px;line-height:1.6;color:#334155;margin:0 0 16px;">
      <strong>${inviterName}</strong>님이 페르소나 <strong>"${cloneName}"</strong>의 공동관리자로 초대했어요.
    </p>
    <p style="font-size:14px;line-height:1.6;color:#64748b;margin:0 0 24px;">
      수락하면 이 페르소나를 함께 관리하고 채팅할 수 있어요. <strong>3일 이내</strong>에 수락하지 않으면 초대가 만료됩니다.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${acceptUrl}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:15px;font-weight:600;">초대 수락하기</a>
    </div>
    <p style="font-size:12px;color:#94a3b8;margin:24px 0 0;line-height:1.6;">
      버튼이 작동하지 않으면 아래 링크를 직접 복사해서 열어주세요:<br>
      <span style="word-break:break-all;color:#475569;">${acceptUrl}</span>
    </p>
  </div>
  <p style="text-align:center;font-size:11px;color:#94a3b8;margin:16px 0 0;">© afterlife</p>
</body>
</html>`;
}

export async function notifyInvite(
  env: Bindings,
  ctx: InviteNotifyContext,
): Promise<{ emailSent: boolean; pushSent: number }> {
  const acceptUrl =
    (ctx.acceptUrlBase ?? "afterlife://invite/") + encodeURIComponent(ctx.token);

  const result = { emailSent: false, pushSent: 0 };

  try {
    await sendMail(env, {
      to: ctx.inviteeEmail,
      subject: `[afterlife] ${ctx.inviterName}님이 "${ctx.cloneName}" 공동관리자로 초대했어요`,
      html: buildEmailHtml(ctx, acceptUrl),
    });
    result.emailSent = true;
  } catch (err) {
    console.warn(`[invite-notify] email failed: ${(err as Error).message}`);
  }

  try {
    const userRow = await env.DB.prepare(
      `SELECT id FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1`,
    )
      .bind(ctx.inviteeEmail)
      .first<{ id: number }>();
    if (userRow?.id) {
      const push = await sendPushToUser(env, userRow.id, {
        title: "공동관리자 초대",
        body: `${ctx.inviterName}님이 "${ctx.cloneName}" 페르소나에 초대했어요. 3일 내 수락하세요.`,
        data: {
          type: "invite",
          cloneId: ctx.cloneId,
          token: ctx.token,
        },
      });
      result.pushSent = push.sent;
    }
  } catch (err) {
    console.warn(`[invite-notify] push failed: ${(err as Error).message}`);
  }

  return result;
}
