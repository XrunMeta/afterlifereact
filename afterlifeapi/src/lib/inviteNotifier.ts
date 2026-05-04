

import type { v_273a0c } from "./env";
import { v_a71d8b } from "./gmail";
import { v_51b1f7 } from "./push";

export interface InviteNotifyContext {
  cloneId: number;
  cloneName: string;
  inviteeEmail: string;
  inviterName: string;
  token: string; 
  expiresAt: string;
  acceptUrlBase?: string; 
}

function v_8fd199(v_fd5f43): string {
  return v_fd5f43
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function v_6fee64(v_16e2dd, v_63f891): string {
  const v_f2ff36 = v_8fd199(v_16e2dd.cloneName);
  const v_5c400c = v_8fd199(v_16e2dd.inviterName);
  return `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="utf-8"><title>afterlife 공동관리자 초대</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f7f8fa;margin:0;padding:32px 16px;color:#0f172a;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:32px 28px;border:1px solid #e2e8f0;">
    <h1 style="font-size:22px;font-weight:700;margin:0 0 16px;color:#0f172a;">공동관리자로 초대됐어요</h1>
    <p style="font-size:15px;line-height:1.6;color:#334155;margin:0 0 16px;">
      <strong>${v_5c400c}</strong>님이 페르소나 <strong>"${v_f2ff36}"</strong>의 공동관리자로 초대했어요.
    </p>
    <p style="font-size:14px;line-height:1.6;color:#64748b;margin:0 0 24px;">
      수락하면 이 페르소나를 함께 관리하고 채팅할 수 있어요. <strong>3일 이내</strong>에 수락하지 않으면 초대가 만료됩니다.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${v_63f891}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:15px;font-weight:600;">초대 수락하기</a>
    </div>
    <p style="font-size:12px;color:#94a3b8;margin:24px 0 0;line-height:1.6;">
      버튼이 작동하지 않으면 아래 링크를 직접 복사해서 열어주세요:<br>
      <span style="word-break:break-all;color:#475569;">${v_63f891}</span>
    </p>
  </div>
  <p style="text-align:center;font-size:11px;color:#94a3b8;margin:16px 0 0;">© afterlife</p>
</body>
</html>`;
}

export async function v_55b118(
  env: v_273a0c,
  v_16e2dd,
): Promise<{ emailSent: boolean; pushSent: number }> {
  const v_63f891 =
    (v_16e2dd.acceptUrlBase ?? "afterlife://invite/") + encodeURIComponent(v_16e2dd.token);

  const v_43c42e = { emailSent: false, pushSent: 0 };

  try {
    await v_a71d8b(v_c9c489, {
      to: v_16e2dd.inviteeEmail,
      subject: `[afterlife] ${v_16e2dd.inviterName}님이 "${v_16e2dd.cloneName}" 공동관리자로 초대했어요`,
      html: v_6fee64(v_16e2dd, v_63f891),
    });
    v_43c42e.emailSent = true;
  } catch (v_49263d) {
    console.warn(`[invite-notify] email failed: ${(v_49263d as Error).message}`);
  }

  try {
    const v_d1b635 = await v_c9c489.DB.prepare(
      `SELECT id FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1`,
    )
      .bind(v_16e2dd.inviteeEmail)
      .first<{ id: number }>();
    if (v_d1b635?.id) {
      const v_0faf90 = await v_51b1f7(v_c9c489, v_d1b635.id, {
        title: "공동관리자 초대",
        body: `${v_16e2dd.inviterName}님이 "${v_16e2dd.cloneName}" 페르소나에 초대했어요. 3일 내 수락하세요.`,
        data: {
          type: "invite",
          cloneId: v_16e2dd.cloneId,
          token: v_16e2dd.token,
        },
      });
      v_43c42e.pushSent = v_0faf90.sent;
    }
  } catch (v_49263d) {
    console.warn(`[invite-notify] push failed: ${(v_49263d as Error).message}`);
  }

  return v_43c42e;
}
