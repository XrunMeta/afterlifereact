import { v_266e0d, v_dd1173, v_f6c414, v_da110b } from "../lib/auth";

const v_8aa4be = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const v_b71808 = `${v_8aa4be}/oth-path`;

async function v_c34e2f<T>(v_9fe22d, v_4d33b2, v_183879): Promise<T> {
  const v_3f4675 = { "Content-Type": "application/json" };
  if (v_183879) v_3f4675["Authorization"] = `Bearer ${v_183879}`;
  const v_8f00b9 = await fetch(`${v_b71808}${v_9fe22d}`, {
    method: "POST",
    headers: v_3f4675,
    body: JSON.stringify(v_4d33b2),
  });
  const v_9b6134 = await v_8f00b9.text();
  let v_8decf8 = v_9b6134;
  try {
    v_8decf8 = v_9b6134 ? JSON.parse(v_9b6134) : null;
  } catch {

  }
  if (!v_8f00b9.ok) {
    const v_badeaf =
      typeof v_8decf8 === "object" && v_8decf8 && "error" in v_8decf8
        ? String((v_8decf8 as { error: unknown }).error)
        : v_8f00b9.statusText;
    throw new Error(v_badeaf);
  }
  return v_8decf8 as T;
}

export interface LoginResult {
  pendingToken: string;
  expiresIn: number;
  totpEnrolled: boolean;
}

interface LoginResponse {
  pendingToken: string;
  expiresIn: number;
  totpEnrolled?: boolean;
  totp_enrolled?: boolean;
}

export async function v_182fdb(v_e0c7e8, v_adc076): Promise<LoginResult> {
  const v_cb35cb = await v_c34e2f<LoginResponse>("/login", { email: v_e0c7e8, password: v_adc076 });
  v_266e0d(v_cb35cb.pendingToken);

  const v_31fd90 = Boolean(v_cb35cb.totpEnrolled ?? v_cb35cb.totp_enrolled);
  return { pendingToken: v_cb35cb.pendingToken, expiresIn: v_cb35cb.expiresIn, totpEnrolled: v_31fd90 };
}

export interface TotpEnrollResult {
  otpauthUrl: string;
  secret: string;
  recoveryCodes: string[];
}

export async function v_104d8e(): Promise<TotpEnrollResult> {
  const v_483de2 = v_f6c414();
  if (!v_483de2) throw new Error("로그인 세션이 만료되었습니다");
  return await v_c34e2f<TotpEnrollResult>("/totp/enroll", {}, v_483de2);
}

export interface VerifyResult {
  accessToken: string;
  refreshToken: string;
  accessExpiresIn: number;
  admin: { id: number; email: string; role: string };
}

export async function v_ac75b4(v_c99bd2): Promise<VerifyResult> {
  const v_483de2 = v_f6c414();
  if (!v_483de2) throw new Error("로그인 세션이 만료되었습니다");
  const v_cb35cb = await v_c34e2f<VerifyResult>("/totp/verify", { code: v_c99bd2 }, v_483de2);
  v_dd1173({
    accessToken: v_cb35cb.accessToken,
    refreshToken: v_cb35cb.refreshToken,
    profile: v_cb35cb.admin,
  });
  return v_cb35cb;
}

export function v_d7d5a2() {
  v_da110b();
}
