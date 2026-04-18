import type { Context } from "hono";
import type { AppEnv } from "./env";
import { APIError } from "./errors";
import { issueAccess, issueRefresh, verifyToken, JWT_TTL } from "./jwt";

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

const REVOKE_PREFIX = "revoked:";
const ROTATE_LOCK_PREFIX = "rotate_lock:";
const ROTATE_LOCK_TTL_SEC = 60; 

function revocationTtl(payload: Payload): number {
  const now = Math.floor(Date.now() / 1000);
  const remaining = (payload.exp ?? now) - now;
  return Math.max(remaining + 60, 60);
}

export async function issueSession(
  c: Context<AppEnv>,
  userId: number,
  deviceId?: string,
  admin = false,
): Promise<{ accessToken: string; refreshToken: string; accessExpiresIn: number }> {
  const base: Record<string, unknown> = { sub: userId, admin };
  if (deviceId) base["deviceId"] = deviceId;
  const accessToken = await issueAccess({ ...base, kind: "access" } as never, c.env.JWT_ACCESS_SECRET);
  const refreshToken = await issueRefresh({ ...base, kind: "refresh" } as never, c.env.JWT_REFRESH_SECRET);
  return { accessToken, refreshToken, accessExpiresIn: JWT_TTL.access };
}

export async function rotateSession(
  c: Context<AppEnv>,
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken: string; userId: number; accessExpiresIn: number }> {
  const payload = await verifyToken<Payload>(refreshToken, c.env.JWT_REFRESH_SECRET);
  if (payload.kind !== "refresh") {
    throw new APIError("UNAUTHENTICATED", "Not a refresh token.");
  }
  const revokedKey = REVOKE_PREFIX + payload.jti;
  const revoked = await c.env.KV_AUTH.get(revokedKey);
  if (revoked) throw new APIError("UNAUTHENTICATED", "Refresh token revoked.");

  const lockKey = ROTATE_LOCK_PREFIX + payload.jti;
  const ticket = crypto.randomUUID();
  await c.env.KV_AUTH.put(lockKey, ticket, { expirationTtl: ROTATE_LOCK_TTL_SEC });
  const winner = await c.env.KV_AUTH.get(lockKey);
  if (winner !== ticket) {
    throw new APIError("UNAUTHENTICATED", "Concurrent refresh rejected.");
  }

  await c.env.KV_AUTH.put(revokedKey, "1", { expirationTtl: revocationTtl(payload) });
  const pair = await issueSession(c, payload.sub, payload.deviceId, payload.admin ?? false);
  return { ...pair, userId: payload.sub };
}

export async function revokeRefresh(c: Context<AppEnv>, refreshToken: string): Promise<void> {
  try {
    const payload = await verifyToken<Payload>(refreshToken, c.env.JWT_REFRESH_SECRET);
    if (payload.kind !== "refresh") return;
    await c.env.KV_AUTH.put(REVOKE_PREFIX + payload.jti, "1", {
      expirationTtl: revocationTtl(payload),
    });
  } catch {

  }
}

export function setRefreshCookie(c: Context<AppEnv>, token: string): void {

  const secure = c.env.ENVIRONMENT === "development" ? "" : "Secure; ";
  c.header(
    "Set-Cookie",
    `refresh_token=${token}; Path=/oth-path; HttpOnly; ${secure}SameSite=Strict; Max-Age=${JWT_TTL.refresh}`,
  );
}

export function clearRefreshCookie(c: Context<AppEnv>): void {
  c.header(
    "Set-Cookie",
    `refresh_token=; Path=/oth-path; HttpOnly; SameSite=Strict; Max-Age=0`,
  );
}

export function readRefreshCookie(c: Context<AppEnv>): string | null {
  const raw = c.req.header("Cookie");
  if (!raw) return null;
  const match = raw.match(/(?:^|;\s*)refresh_token=([^;]+)/);
  return match?.[1] ?? null;
}
