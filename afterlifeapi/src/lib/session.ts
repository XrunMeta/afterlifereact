import type { v_437670 } from "zmui";
import type { v_de0a25 } from "./env";
import { v_3ebe58 } from "./errors";
import { v_b64d29, v_72ca53, v_2703c5, v_806b99 } from "./jwt";

function v_e8cd3d(v_3a5fef): number {
  if (v_3a5fef.includes("T")) return new Date(v_3a5fef).getTime();
  return new Date(v_3a5fef.replace(" ", "T") + "Z").getTime();
}

type Kind = "access" | "refresh";

type Payload = Record<string, unknown> & {
  sub: number;
  jti: string;
  kind: Kind;
  deviceId?: string;
  admin?: boolean;
  exp?: number;
  iat?: number;
};

const v_5f2751 = "revoked:";
const v_698fc3 = "rotate_lock:";
const v_d4aa79 = 60; 

function v_be4706(v_931bf0): number {
  const v_5c2f9f = Math.floor(Date.now() / 1000);
  const v_916658 = (v_931bf0.exp ?? v_5c2f9f) - v_5c2f9f;
  return Math.max(v_916658 + 60, 60);
}

export async function v_8ab5ff(
  c: v_437670<v_de0a25>,
  v_43e90c,
  v_929b58,
  v_b7f2b4 = false,
): Promise<{ accessToken: string; refreshToken: string; accessExpiresIn: number }> {
  const v_694b25 = { sub: v_43e90c, admin: v_b7f2b4 };
  if (v_929b58) v_694b25["deviceId"] = v_929b58;
  const v_2ca7e0 = await v_b64d29({ ...v_694b25, kind: "access" } as never, v_3f4e2e.env.JWT_ACCESS_SECRET);
  const v_dfaee3 = await v_72ca53({ ...v_694b25, kind: "refresh" } as never, v_3f4e2e.env.JWT_REFRESH_SECRET);
  return { accessToken: v_2ca7e0, refreshToken: v_dfaee3, accessExpiresIn: v_806b99.access };
}

export async function v_27b603(
  c: v_437670<v_de0a25>,
  v_dfaee3,
): Promise<{ accessToken: string; refreshToken: string; userId: number; accessExpiresIn: number }> {
  const v_931bf0 = await v_2703c5<Payload>(v_dfaee3, v_3f4e2e.env.JWT_REFRESH_SECRET);
  if (v_931bf0.kind !== "refresh") {
    throw new v_3ebe58("UNAUTHENTICATED", "Not a refresh token.");
  }
  const v_c4e4af = v_5f2751 + v_931bf0.jti;
  const v_09dd65 = await v_3f4e2e.env.KV_AUTH.get(v_c4e4af);
  if (v_09dd65) throw new v_3ebe58("UNAUTHENTICATED", "Refresh token revoked.");

  const v_566038 = v_698fc3 + v_931bf0.jti;
  const v_c9c6be = crypto.randomUUID();
  await v_3f4e2e.env.KV_AUTH.put(v_566038, v_c9c6be, { expirationTtl: v_d4aa79 });
  const v_0a9f0b = await v_3f4e2e.env.KV_AUTH.get(v_566038);
  if (v_0a9f0b !== v_c9c6be) {
    throw new v_3ebe58("UNAUTHENTICATED", "Concurrent refresh rejected.");
  }

  if (!v_931bf0.admin) {
    const v_ceb55a = await v_3f4e2e.env.DB
      .prepare(`SELECT banned_until FROM users WHERE id = ? AND deleted_at IS NULL`)
      .bind(v_931bf0.sub)
      .first<{ banned_until: string | null }>();
    if (v_ceb55a?.banned_until && v_e8cd3d(v_ceb55a.banned_until) > Date.now()) {
      throw new v_3ebe58("ACCOUNT_SUSPENDED", "신고 누적으로 계정 사용이 정지되었습니다.", {
        bannedUntil: v_ceb55a.banned_until,
      });
    }
  }

  await v_3f4e2e.env.KV_AUTH.put(v_c4e4af, "1", { expirationTtl: v_be4706(v_931bf0) });
  const v_192af3 = await v_8ab5ff(v_3f4e2e, v_931bf0.sub, v_931bf0.deviceId, v_931bf0.admin ?? false);
  return { ...v_192af3, userId: v_931bf0.sub };
}

export async function v_e1c29b(c: v_437670<v_de0a25>, v_dfaee3): Promise<void> {
  try {
    const v_931bf0 = await v_2703c5<Payload>(v_dfaee3, v_3f4e2e.env.JWT_REFRESH_SECRET);
    if (v_931bf0.kind !== "refresh") return;
    await v_3f4e2e.env.KV_AUTH.put(v_5f2751 + v_931bf0.jti, "1", {
      expirationTtl: v_be4706(v_931bf0),
    });
  } catch {

  }
}

export function v_56035d(c: v_437670<v_de0a25>, v_21cc31): void {

  const v_969f2b = v_3f4e2e.env.ENVIRONMENT === "development" ? "" : "Secure; ";
  v_3f4e2e.header(
    "Set-Cookie",
    `refresh_token=${v_21cc31}; Path=/oth-path; HttpOnly; ${v_969f2b}SameSite=Strict; Max-Age=${v_806b99.refresh}`,
  );
}

export function v_91a253(c: v_437670<v_de0a25>): void {
  v_3f4e2e.header(
    "Set-Cookie",
    `refresh_token=; Path=/oth-path; HttpOnly; SameSite=Strict; Max-Age=0`,
  );
}

export function v_bde6da(c: v_437670<v_de0a25>): string | null {
  const v_479f05 = v_3f4e2e.req.header("Cookie");
  if (!v_479f05) return null;
  const v_a63110 = v_479f05.match(/(?:^|;\s*)refresh_token=([^;]+)/);
  return v_a63110?.[1] ?? null;
}
