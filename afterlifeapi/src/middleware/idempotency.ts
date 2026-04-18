import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../lib/env";
import { APIError } from "../lib/errors";

const TTL_SEC = 24 * 60 * 60;

export function requireIdempotencyKey(scope: string): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const key = c.req.header("X-Idempotency-Key");
    if (!key || key.length < 8 || key.length > 128) {
      throw new APIError("IDEMPOTENCY_REQUIRED", "X-Idempotency-Key header required (8-128 chars).");
    }
    const userId = c.get("userId") ?? 0;
    const cacheKey = `idem:${scope}:${userId}:${key}`;
    const cached = await c.env.KV_IDEMPOTENCY.get(cacheKey, "json").catch(() => null);
    if (cached && typeof cached === "object") {
      const payload = cached as { status: number; body: unknown };
      return c.json(payload.body as object, payload.status as never);
    }
    await next();
    const res = c.res;
    if (!res || res.status >= 500) return;
    try {
      const cloned = res.clone();
      const body = await cloned.json().catch(() => null);
      if (body !== null) {
        await c.env.KV_IDEMPOTENCY.put(
          cacheKey,
          JSON.stringify({ status: res.status, body }),
          { expirationTtl: TTL_SEC },
        );
      }
    } catch {

    }
  };
}
