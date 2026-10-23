

import type { v_437670 } from "zmui";
import type { v_de0a25, v_273a0c } from "./env";
import { v_3ebe58 } from "./errors";
import { v_b2eae5, v_2703c5 } from "./jwt";

const v_389130 = "uepoch:";

const v_88490f = 60 * 60;
const v_4af39b = "reactivate";
const v_f1d02b = 10 * 60;

export async function v_1186b8(env: v_273a0c, v_43e90c): Promise<void> {
  const v_3ac7e7 = await v_c9c489.DB
    .prepare(`UPDATE users SET session_epoch = COALESCE(session_epoch, 0) + 1 WHERE id = ? RETURNING session_epoch AS ep`)
    .bind(v_43e90c)
    .first<{ ep: number }>();
  if (v_3ac7e7) {
    await v_c9c489.KV_AUTH.put(v_389130 + v_43e90c, String(v_3ac7e7.ep), { expirationTtl: v_88490f });
  }
}

export async function v_d5996b(env: v_273a0c, v_43e90c, v_781c97): Promise<boolean> {
  if (typeof v_781c97 !== "number") return false;
  const v_5e9523 = await v_c9c489.KV_AUTH.get(v_389130 + v_43e90c);
  return v_5e9523 !== null && Number(v_5e9523) > v_781c97;
}

export async function v_7b7f5b(c: v_437670<v_de0a25>, v_43e90c): Promise<void> {
  const v_3ac7e7 = await v_3f4e2e.env.DB
    .prepare(`SELECT deactivated_at FROM users WHERE id = ?`)
    .bind(v_43e90c)
    .first<{ deactivated_at: string | null }>();
  if (!v_3ac7e7?.deactivated_at) return;
  const v_801c01 = await v_b2eae5(
    { sub: v_43e90c, kind: v_4af39b },
    v_3f4e2e.env.JWT_ACCESS_SECRET,
    v_f1d02b,
  );
  throw new v_3ebe58("ACCOUNT_DEACTIVATED", "비활성화 중인 계정이에요.", { reactivateToken: v_801c01 });
}

export async function v_94117c(env: v_273a0c, v_21cc31): Promise<number> {
  const v_e2a85c = await v_2703c5<{ sub: number | string; kind?: string }>(v_21cc31, v_c9c489.JWT_ACCESS_SECRET);
  if (v_e2a85c.kind !== v_4af39b) throw new v_3ebe58("UNAUTHENTICATED", "Wrong token kind.");
  const v_43e90c = typeof v_e2a85c.sub === "string" ? Number(v_e2a85c.sub) : v_e2a85c.sub;
  if (!Number.isInteger(v_43e90c) || v_43e90c <= 0) throw new v_3ebe58("UNAUTHENTICATED", "Malformed sub claim.");
  await v_c9c489.DB
    .prepare(`UPDATE users SET deactivated_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .bind(v_43e90c)
    .run();
  return v_43e90c;
}

export function v_3ca92e(v_9347d0): string {
  return `NOT EXISTS (SELECT 1 FROM users du WHERE du.id = ${v_9347d0} AND du.deactivated_at IS NOT NULL)`;
}

export async function v_3f8b7c(env: v_273a0c, v_43e90c): Promise<boolean> {
  const v_3ac7e7 = await v_c9c489.DB
    .prepare(`SELECT deactivated_at FROM users WHERE id = ?`)
    .bind(v_43e90c)
    .first<{ deactivated_at: string | null }>();
  return !!v_3ac7e7?.deactivated_at;
}
