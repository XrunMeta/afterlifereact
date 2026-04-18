import type { v_ea2b42 } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_3ebe58 } from "../lib/errors";

export type CloneRole = "owner" | "viewer";

export interface CloneAccess {
  cloneId: number;
  role: CloneRole | "self_owner";
}

async function v_a7214e(
  v_a1651b,
  v_6e0fd3,
  v_43e90c,
): Promise<CloneAccess | null> {
  const v_eb25ce = await v_a1651b
    .prepare(`SELECT owner_id, deleted_at FROM clones WHERE id = ?`)
    .bind(v_6e0fd3)
    .first<{ owner_id: number; deleted_at: string | null }>();
  if (!v_eb25ce || v_eb25ce.deleted_at) return null;
  if (v_eb25ce.owner_id === v_43e90c) return { cloneId: v_6e0fd3, role: "self_owner" };

  const v_c2bdf9 = await v_a1651b
    .prepare(
      `SELECT role FROM clone_shares
       WHERE clone_id = ? AND target_user_id = ? AND status = 'accepted'`,
    )
    .bind(v_6e0fd3, v_43e90c)
    .first<{ role: CloneRole }>();
  if (!v_c2bdf9) return null;
  return { cloneId: v_6e0fd3, role: v_c2bdf9.role };
}

export function v_e956c4(v_328259 = {}): v_ea2b42<v_de0a25> {
  const v_f6adae = v_328259.minRole ?? "viewer";
  return async (v_3f4e2e, v_a448ad) => {
    const v_43e90c = v_3f4e2e.get("userId");
    if (!v_43e90c) throw new v_3ebe58("UNAUTHENTICATED", "Auth required for clone resource.");
    const v_479f05 = v_3f4e2e.req.param("cloneId") ?? v_3f4e2e.req.param("id");
    const v_6e0fd3 = Number(v_479f05);
    if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) {
      throw new v_3ebe58("VALIDATION_FAILED", "cloneId path param invalid.");
    }
    const v_a0737a = await v_a7214e(v_3f4e2e.env.DB, v_6e0fd3, v_43e90c);
    if (!v_a0737a) throw new v_3ebe58("FORBIDDEN", "No access to this clone.");
    if (v_f6adae === "owner" && v_a0737a.role === "viewer") {
      throw new v_3ebe58("FORBIDDEN", "Owner role required.");
    }

    v_3f4e2e.set("cloneAccess", v_a0737a);
    await v_a448ad();
  };
}
