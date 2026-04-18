import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../lib/env";
import { APIError } from "../lib/errors";

export interface RateLimitOpts {
  anon?: number;
  user?: number;
  admin?: number;
  bucket?: string;
}

export function rateLimit(opts: RateLimitOpts = {}): MiddlewareHandler<AppEnv> {
  const anon = opts.anon ?? 60;
  const user = opts.user ?? 300;
  const admin = opts.admin ?? 120;
  const bucket = opts.bucket ?? "default";

  return async (c, next) => {
    const userId = c.get("userId");
    const adminId = c.get("adminUserId");
    const ip =
      c.req.header("CF-Connecting-IP") ?? c.req.header("X-Forwarded-For") ?? "unknown";
    const subject = adminId
      ? `admin:${adminId}`
      : userId
        ? `user:${userId}`
        : `anon:${ip}`;
    const limit = adminId ? admin : userId ? user : anon;
    const windowId = Math.floor(Date.now() / 60_000);
    const key = `rl:${bucket}:${subject}:${windowId}`;

    const current = await c.env.KV_RATE.get(key);
    const count = current ? Number.parseInt(current, 10) : 0;
    if (count >= limit) {
      const retryAfter = 60 - (Math.floor(Date.now() / 1000) % 60);
      c.header("Retry-After", String(retryAfter));
      throw new APIError("RATE_LIMITED", `Rate limit exceeded (${limit}/min).`);
    }

    await c.env.KV_RATE.put(key, String(count + 1), { expirationTtl: 90 });
    await next();
  };
}
