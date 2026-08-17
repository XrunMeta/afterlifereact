

import { totpCode } from "./totp.ts";

async function postJson(url: string, body: unknown, bearer?: string) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}) },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${url} → ${res.status}\n${text.slice(0, 300)}`);
  return JSON.parse(text);
}

export interface AdminSession {
  accessToken: string;
  refreshToken: string;
  admin: { id: number; email: string; role: string };
}

export async function adminAccessToken(apiBase: string, email: string, password: string): Promise<AdminSession> {
  const base = `${apiBase}/oth-path`;
  const login = await postJson(`${base}/login`, { email, password });
  const pending: string | undefined = login.pendingToken;
  if (!pending) throw new Error(`login 응답에 pendingToken 이 없습니다: ${JSON.stringify(login).slice(0, 200)}`);

  if (login.totpEnrolled) {
    throw new Error(
      "이미 TOTP 가 등록된 어드민입니다. 시드가 매 실행마다 전용 어드민을 새로 만들어야 합니다.",
    );
  }

  const enrolled = await postJson(`${base}/totp/enroll`, {}, pending);
  const secret: string | undefined = enrolled.secret;
  if (!secret) throw new Error("enroll 응답에 secret 이 없습니다 — 서버 동작이 바뀌었습니다.");

  const verified = await postJson(`${base}/totp/verify`, { code: totpCode(secret) }, pending);
  const access: string | undefined = verified.accessToken;
  const refresh: string | undefined = verified.refreshToken;
  const admin: AdminSession["admin"] | undefined = verified.admin;
  if (!access || !refresh || !admin) {
    throw new Error(`verify 응답 형태가 바뀌었습니다: ${JSON.stringify(verified).slice(0, 200)}`);
  }
  return { accessToken: access, refreshToken: refresh, admin };
}
