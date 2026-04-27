

import type { v_273a0c } from "./env";
import { v_3ebe58 } from "./errors";
import { v_a71d8b } from "./gmail";

const v_ffa8e2 = "signup_otp:";
const v_7dab9c = 5 * 60;
const v_bb4ed0 = 60 * 1000;
const v_138a00 = 5;

interface OtpRecord {
  codeHash: string;
  expiresAt: number;
  attempts: number;
  sentAt: number;
}

function v_b24339(v_e0c7e8): string {
  return `${v_ffa8e2}${v_e0c7e8.trim().toLowerCase()}`;
}

function v_ef6e02(): string {
  const v_83ee53 = new Uint8Array(4);
  crypto.getRandomValues(v_83ee53);

  const v_f4e98d = new DataView(v_83ee53.buffer).getUint32(0, false);
  return String(v_f4e98d % 1_000_000).padStart(6, "0");
}

async function v_921b04(v_fd5f43): Promise<string> {
  const v_83ee53 = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(v_fd5f43));
  return Array.from(new Uint8Array(v_83ee53))
    .map((v_148ff6) => v_148ff6.toString(16).padStart(2, "0"))
    .join("");
}

function v_742487(v_c99bd2): string {
  return `<!DOCTYPE html><html><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#f6f6f6;padding:24px">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,.06)">
    <h2 style="margin:0 0 16px;color:#222">AfterLife 이메일 인증</h2>
    <p style="color:#555;line-height:1.6">아래 6자리 인증 코드를 가입 화면에 입력하세요.</p>
    <div style="font-size:32px;font-weight:700;letter-spacing:8px;text-align:center;background:#f0f4ff;color:#1a4cff;padding:20px;border-radius:8px;margin:24px 0">${v_c99bd2}</div>
    <p style="color:#888;font-size:13px;line-height:1.6">이 코드는 발송 후 5분간 유효합니다. 본인이 요청하지 않았다면 이 메일을 무시하세요.</p>
  </div></body></html>`;
}

export async function v_b78f7e(env: v_273a0c, v_e0c7e8): Promise<void> {
  const v_0eb677 = v_b24339(v_e0c7e8);
  const v_3c8572 = await v_c9c489.KV_AUTH.get<OtpRecord>(v_0eb677, "json");
  if (v_3c8572 && Date.now() - v_3c8572.sentAt < v_bb4ed0) {
    const v_aa4609 = Math.ceil((v_bb4ed0 - (Date.now() - v_3c8572.sentAt)) / 1000);
    throw new v_3ebe58("OTP_COOLDOWN", `Wait ${v_aa4609}s before requesting another code.`);
  }

  const v_c99bd2 = v_ef6e02();
  const v_fe2fc4 = await v_921b04(v_c99bd2);
  const v_5c2f9f = Date.now();
  const v_cbbd71 = {
    codeHash: v_fe2fc4,
    expiresAt: v_5c2f9f + v_7dab9c * 1000,
    attempts: 0,
    sentAt: v_5c2f9f,
  };

  await v_c9c489.KV_AUTH.put(v_0eb677, JSON.stringify(v_cbbd71), { expirationTtl: v_7dab9c });
  await v_a71d8b(v_c9c489, {
    to: v_e0c7e8,
    subject: "[AfterLife] 이메일 인증 코드",
    html: v_742487(v_c99bd2),
  });
}

export async function v_656e8b(env: v_273a0c, v_e0c7e8, v_c99bd2): Promise<void> {
  const v_0eb677 = v_b24339(v_e0c7e8);
  const v_94a7a9 = await v_c9c489.KV_AUTH.get<OtpRecord>(v_0eb677, "json");
  if (!v_94a7a9) {
    throw new v_3ebe58("OTP_REQUIRED", "No verification code in progress. Request one first.");
  }
  if (Date.now() > v_94a7a9.expiresAt) {
    await v_c9c489.KV_AUTH.delete(v_0eb677);
    throw new v_3ebe58("OTP_EXPIRED", "Verification code has expired. Request a new one.");
  }
  const v_cc1855 = await v_921b04(v_c99bd2.trim());
  if (v_cc1855 !== v_94a7a9.codeHash) {
    v_94a7a9.attempts += 1;
    if (v_94a7a9.attempts >= v_138a00) {
      await v_c9c489.KV_AUTH.delete(v_0eb677);
      throw new v_3ebe58("OTP_INVALID", "Too many wrong attempts. Request a new code.");
    }
    const v_aaa6bf = Math.max(1, Math.ceil((v_94a7a9.expiresAt - Date.now()) / 1000));
    await v_c9c489.KV_AUTH.put(v_0eb677, JSON.stringify(v_94a7a9), { expirationTtl: v_aaa6bf });
    throw new v_3ebe58("OTP_INVALID", `Wrong code. ${v_138a00 - v_94a7a9.attempts} attempts left.`);
  }
  await v_c9c489.KV_AUTH.delete(v_0eb677);
}
