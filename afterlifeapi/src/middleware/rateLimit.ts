import type { v_ea2b42 } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_3ebe58 } from "../lib/errors";
import { v_2703c5 } from "../lib/jwt";

export interface RateLimitOpts {
  anon?: number;
  user?: number;
  admin?: number;

  internal?: number;
  bucket?: string;
}

export function v_353f26(v_328259 = {}): v_ea2b42<v_de0a25> {
  const v_0ddab0 = v_328259.anon ?? 60;
  const v_625c74 = v_328259.user ?? 300;
  const v_b7f2b4 = v_328259.admin ?? 120;
  const v_dcd415 = v_328259.internal ?? 6000;
  const v_dc53ea = v_328259.bucket ?? "default";

  return async (v_3f4e2e, v_a448ad) => {
    const v_db9be1 = v_3f4e2e.get("adminUserId");
    const v_70cac0 =
      v_3f4e2e.req.header("CF-Connecting-IP") ?? v_3f4e2e.req.header("X-Forwarded-For") ?? "unknown";
    let v_e3ba12;
    let v_02be30;
    if (v_db9be1) {
      v_e3ba12 = `admin:${v_db9be1}`;
      v_02be30 = v_b7f2b4;
    } else {
      const v_97d2e9 = v_3f4e2e.get("userId") ? { kind: "user" as const, id: v_3f4e2e.get("userId")! } : await v_30b108(v_3f4e2e.req.header("Authorization"), v_3f4e2e.env);
      if (v_97d2e9?.kind === "user") {
        v_e3ba12 = `user:${v_97d2e9.id}`;
        v_02be30 = v_625c74;
      } else if (v_97d2e9?.kind === "internal") {
        v_e3ba12 = "internal";
        v_02be30 = v_dcd415;
      } else {
        v_e3ba12 = `anon:${v_70cac0}`;
        v_02be30 = v_0ddab0;
      }
    }
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

function v_a155c4(v_779914, v_148ff6): boolean {
  if (v_779914.length !== v_148ff6.length) return false;
  let v_cb35cb = 0;
  for (let v_ebec57 = 0; v_ebec57 < v_779914.length; v_ebec57++) v_cb35cb |= v_779914.charCodeAt(v_ebec57) ^ v_148ff6.charCodeAt(v_ebec57);
  return v_cb35cb === 0;
}

async function v_30b108(
  v_ad8d0d,
  v_c9c489,
): Promise<{ kind: "user"; id: number } | { kind: "internal" } | null> {
  if (!v_ad8d0d?.startsWith("Bearer ")) return null;
  const v_21cc31 = v_ad8d0d.slice(7);
  if (!v_21cc31) return null;
  if (v_c9c489.ORCH_SECRET && v_a155c4(v_21cc31, v_c9c489.ORCH_SECRET)) return { kind: "internal" };
  if (!v_c9c489.JWT_ACCESS_SECRET) return null;
  try {
    const v_931bf0 = await v_2703c5<{ sub: number | string; kind?: string }>(v_21cc31, v_c9c489.JWT_ACCESS_SECRET);
    if (v_931bf0.kind && v_931bf0.kind !== "access") return null;
    const v_0c8987 = typeof v_931bf0.sub === "string" ? Number(v_931bf0.sub) : v_931bf0.sub;
    return Number.isInteger(v_0c8987) && v_0c8987 > 0 ? { kind: "user", id: v_0c8987 } : null;
  } catch {
    return null;
  }
}
