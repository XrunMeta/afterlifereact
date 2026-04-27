

import type { Bindings } from "./env";
import { APIError } from "./errors";
import { sendMail } from "./gmail";

const KV_PREFIX = "signup_otp:";
const TTL_SECONDS = 5 * 60;
const COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

interface OtpRecord {
  codeHash: string;
  expiresAt: number;
  attempts: number;
  sentAt: number;
}

function key(email: string): string {
  return `${KV_PREFIX}${email.trim().toLowerCase()}`;
}

function generateCode(): string {
  const buf = new Uint8Array(4);
  crypto.getRandomValues(buf);

  const n = new DataView(buf.buffer).getUint32(0, false);
  return String(n % 1_000_000).padStart(6, "0");
}

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function emailHtml(code: string): string {
  return `<!DOCTYPE html><html><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#f6f6f6;padding:24px">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,.06)">
    <h2 style="margin:0 0 16px;color:#222">AfterLife 이메일 인증</h2>
    <p style="color:#555;line-height:1.6">아래 6자리 인증 코드를 가입 화면에 입력하세요.</p>
    <div style="font-size:32px;font-weight:700;letter-spacing:8px;text-align:center;background:#f0f4ff;color:#1a4cff;padding:20px;border-radius:8px;margin:24px 0">${code}</div>
    <p style="color:#888;font-size:13px;line-height:1.6">이 코드는 발송 후 5분간 유효합니다. 본인이 요청하지 않았다면 이 메일을 무시하세요.</p>
  </div></body></html>`;
}

export async function requestSignupOtp(env: Bindings, email: string): Promise<void> {
  const k = key(email);
  const existing = await env.KV_AUTH.get<OtpRecord>(k, "json");
  if (existing && Date.now() - existing.sentAt < COOLDOWN_MS) {
    const wait = Math.ceil((COOLDOWN_MS - (Date.now() - existing.sentAt)) / 1000);
    throw new APIError("OTP_COOLDOWN", `Wait ${wait}s before requesting another code.`);
  }

  const code = generateCode();
  const codeHash = await sha256Hex(code);
  const now = Date.now();
  const record: OtpRecord = {
    codeHash,
    expiresAt: now + TTL_SECONDS * 1000,
    attempts: 0,
    sentAt: now,
  };

  await env.KV_AUTH.put(k, JSON.stringify(record), { expirationTtl: TTL_SECONDS });
  await sendMail(env, {
    to: email,
    subject: "[AfterLife] 이메일 인증 코드",
    html: emailHtml(code),
  });
}

export async function verifySignupOtp(env: Bindings, email: string, code: string): Promise<void> {
  const k = key(email);
  const rec = await env.KV_AUTH.get<OtpRecord>(k, "json");
  if (!rec) {
    throw new APIError("OTP_REQUIRED", "No verification code in progress. Request one first.");
  }
  if (Date.now() > rec.expiresAt) {
    await env.KV_AUTH.delete(k);
    throw new APIError("OTP_EXPIRED", "Verification code has expired. Request a new one.");
  }
  const candidateHash = await sha256Hex(code.trim());
  if (candidateHash !== rec.codeHash) {
    rec.attempts += 1;
    if (rec.attempts >= MAX_ATTEMPTS) {
      await env.KV_AUTH.delete(k);
      throw new APIError("OTP_INVALID", "Too many wrong attempts. Request a new code.");
    }
    const ttl = Math.max(1, Math.ceil((rec.expiresAt - Date.now()) / 1000));
    await env.KV_AUTH.put(k, JSON.stringify(rec), { expirationTtl: ttl });
    throw new APIError("OTP_INVALID", `Wrong code. ${MAX_ATTEMPTS - rec.attempts} attempts left.`);
  }
  await env.KV_AUTH.delete(k);
}
