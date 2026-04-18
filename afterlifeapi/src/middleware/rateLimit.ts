import type { v_ea2b42 } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_3ebe58 } from "../lib/errors";

export interface RateLimitOpts {
  anon?: number;
  user?: number;
  admin?: number;
  bucket?: string;
}

export function v_353f26(v_328259 = {}): v_ea2b42<v_de0a25> {
  const v_0ddab0 = v_328259.anon ?? 60;
  const v_625c74 = v_328259.user ?? 300;
  const v_b7f2b4 = v_328259.admin ?? 120;
  const v_dc53ea = v_328259.bucket ?? "default";

  return async (v_3f4e2e, v_a448ad) => {
    const v_43e90c = v_3f4e2e.get("userId");
    const v_db9be1 = v_3f4e2e.get("adminUserId");
    const v_70cac0 =
      v_3f4e2e.req.header("CF-Connecting-IP") ?? v_3f4e2e.req.header("X-Forwarded-For") ?? "unknown";
    const v_e3ba12 = v_db9be1
      ? `admin:${v_db9be1}`
      : v_43e90c
        ? `user:${v_43e90c}`
        : `anon:${v_70cac0}`;
    const v_02be30 = v_db9be1 ? v_b7f2b4 : v_43e90c ? v_625c74 : v_0ddab0;
    const v_394d5e = Math.floor(Date.now() / 60_000);
    const v_b24339 = `rl:${v_dc53ea}:${v_e3ba12}:${v_394d5e}`;

    const v_275ccd = await v_3f4e2e.env.KV_RATE.get(v_b24339);
    const v_9e8c70 = v_275ccd ? Number.parseInt(v_275ccd, 10) : 0;
    if (v_9e8c70 >= v_02be30) {
      const v_550b3f = 60 - (Math.floor(Date.now() / 1000) % 60);
      v_3f4e2e.header("Retry-After", String(v_550b3f));
      throw new v_3ebe58("RATE_LIMITED", `Rate limit exceeded (${v_02be30}/min).`);
    }

    await v_3f4e2e.env.KV_RATE.put(v_b24339, String(v_9e8c70 + 1), { expirationTtl: 90 });
    await v_a448ad();
  };
}
