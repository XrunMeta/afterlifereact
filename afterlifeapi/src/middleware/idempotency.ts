import type { v_ea2b42 } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_3ebe58 } from "../lib/errors";

const v_4fceec = 24 * 60 * 60;

export function v_a04a51(v_27ecba): v_ea2b42<v_de0a25> {
  return async (v_3f4e2e, v_a448ad) => {
    const v_b24339 = v_3f4e2e.req.header("X-Idempotency-Key");
    if (!v_b24339 || v_b24339.length < 8 || v_b24339.length > 128) {
      throw new v_3ebe58("IDEMPOTENCY_REQUIRED", "X-Idempotency-Key header required (8-128 chars).");
    }
    const v_43e90c = v_3f4e2e.get("userId") ?? 0;
    const v_7ac310 = `idem:${v_27ecba}:${v_43e90c}:${v_b24339}`;
    const v_e2a6a6 = await v_3f4e2e.env.KV_IDEMPOTENCY.get(v_7ac310, "json").catch(() => null);
    if (v_e2a6a6 && typeof v_e2a6a6 === "object") {
      const v_931bf0 = v_e2a6a6 as { status: number; body: unknown };
      return v_3f4e2e.json(v_931bf0.body as object, v_931bf0.status as never);
    }
    await v_a448ad();
    const v_8f00b9 = v_3f4e2e.res;
    if (!v_8f00b9 || v_8f00b9.status >= 500) return;
    try {
      const v_4c47eb = v_8f00b9.clone();
      const v_4d33b2 = await v_4c47eb.json().catch(() => null);
      if (v_4d33b2 !== null) {
        await v_3f4e2e.env.KV_IDEMPOTENCY.put(
          v_7ac310,
          JSON.stringify({ status: v_8f00b9.status, body: v_4d33b2 }),
          { expirationTtl: v_4fceec },
        );
      }
    } catch {

    }
  };
}
