

import { v_c6dfdc } from "./totp.ts";

async function v_c34e2f(v_f71b56, v_4d33b2, v_183879) {
  const v_8f00b9 = await fetch(v_f71b56, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(v_183879 ? { Authorization: `Bearer ${v_183879}` } : {}) },
    body: JSON.stringify(v_4d33b2),
  });
  const v_9b6134 = await v_8f00b9.text();
  if (!v_8f00b9.ok) throw new Error(`${v_f71b56} → ${v_8f00b9.status}\n${v_9b6134.slice(0, 300)}`);
  return JSON.parse(v_9b6134);
}

export interface AdminSession {
  accessToken: string;
  refreshToken: string;
  admin: { id: number; email: string; role: string };
}

export async function v_9f52e1(v_6cdec8, v_e0c7e8, v_adc076): Promise<AdminSession> {
  const v_694b25 = `${v_6cdec8}/oth-path`;
  const v_182fdb = await v_c34e2f(`${v_694b25}/login`, { email: v_e0c7e8, password: v_adc076 });
  const v_483de2 = v_182fdb.pendingToken;
  if (!v_483de2) throw new Error(`login 응답에 pendingToken 이 없습니다: ${JSON.stringify(v_182fdb).slice(0, 200)}`);

  if (v_182fdb.totpEnrolled) {
    throw new Error(
      "이미 TOTP 가 등록된 어드민입니다. 시드가 매 실행마다 전용 어드민을 새로 만들어야 합니다.",
    );
  }

  const v_570847 = await v_c34e2f(`${v_694b25}/totp/enroll`, {}, v_483de2);
  const v_43fd42 = v_570847.secret;
  if (!v_43fd42) throw new Error("enroll 응답에 secret 이 없습니다 — 서버 동작이 바뀌었습니다.");

  const v_6dadb1 = await v_c34e2f(`${v_694b25}/totp/verify`, { code: v_c6dfdc(v_43fd42) }, v_483de2);
  const v_a0737a = v_6dadb1.accessToken;
  const v_1a1b9b = v_6dadb1.refreshToken;
  const v_b7f2b4 = v_6dadb1.admin;
  if (!v_a0737a || !v_1a1b9b || !v_b7f2b4) {
    throw new Error(`verify 응답 형태가 바뀌었습니다: ${JSON.stringify(v_6dadb1).slice(0, 200)}`);
  }
  return { accessToken: v_a0737a, refreshToken: v_1a1b9b, admin: v_b7f2b4 };
}

export async function v_48e571(v_6cdec8, v_e0c7e8, v_adc076): Promise<string> {
  const v_cb35cb = await v_c34e2f(`${v_6cdec8}/oth-path`, { email: v_e0c7e8, password: v_adc076 });
  if (!v_cb35cb.accessToken) throw new Error("login 응답에 accessToken 이 없습니다.");
  return v_cb35cb.accessToken;
}
