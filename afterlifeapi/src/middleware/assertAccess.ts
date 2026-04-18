

import type { v_437670 } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_3ebe58 } from "../lib/errors";

export type CloneRole = "owner" | "viewer";
export type AccessRole = CloneRole | "self" | "admin";

export interface AccessResult {
  kind: "clone" | "user" | "message" | "emergency_contact";
  resourceId: number;
  role: AccessRole;
}

async function v_a7214e(
  v_a1651b,
  v_6e0fd3,
  v_43e90c,
): Promise<AccessResult | null> {
  const v_eb25ce = await v_a1651b
    .prepare(
      `SELECT owner_id, deletion_state, deleted_at
         FROM clones WHERE id = ?`,
    )
    .bind(v_6e0fd3)
    .first<{ owner_id: number; deletion_state: string | null; deleted_at: string | null }>();
  if (!v_eb25ce) return null;
  if (v_eb25ce.deleted_at) return null;
  if (v_eb25ce.deletion_state && v_eb25ce.deletion_state !== "active") return null;

  if (v_eb25ce.owner_id === v_43e90c) {
    return { kind: "clone", resourceId: v_6e0fd3, role: "owner" };
  }
  const v_c2bdf9 = await v_a1651b
    .prepare(
      `SELECT role FROM clone_shares
        WHERE clone_id = ? AND target_user_id = ? AND status = 'accepted'`,
    )
    .bind(v_6e0fd3, v_43e90c)
    .first<{ role: CloneRole }>();
  if (!v_c2bdf9) return null;
  return { kind: "clone", resourceId: v_6e0fd3, role: v_c2bdf9.role };
}

async function v_b5bfb0(
  v_94ad75,
  v_489382,
  v_43e90c,
): Promise<AccessResult | null> {
  if (v_489382 !== v_43e90c) return null;
  return { kind: "user", resourceId: v_489382, role: "self" };
}

async function v_09f6d6(
  v_a1651b,
  v_7f4466,
  v_43e90c,
): Promise<AccessResult | null> {
  const v_3ac7e7 = await v_a1651b
    .prepare(`SELECT clone_id FROM messages WHERE id = ?`)
    .bind(v_7f4466)
    .first<{ clone_id: number }>();
  if (!v_3ac7e7) return null;
  const v_e290d2 = await v_a7214e(v_a1651b, v_3ac7e7.clone_id, v_43e90c);
  if (!v_e290d2) return null;
  return { kind: "message", resourceId: v_7f4466, role: v_e290d2.role };
}

async function v_5de085(
  v_a1651b,
  v_b6d18d,
  v_43e90c,
): Promise<AccessResult | null> {
  const v_3ac7e7 = await v_a1651b
    .prepare(
      `SELECT principal_user_id, contact_user_id
         FROM emergency_contacts WHERE id = ?`,
    )
    .bind(v_b6d18d)
    .first<{ principal_user_id: number; contact_user_id: number | null }>();
  if (!v_3ac7e7) return null;
  if (v_3ac7e7.principal_user_id === v_43e90c) {
    return { kind: "emergency_contact", resourceId: v_b6d18d, role: "owner" };
  }
  if (v_3ac7e7.contact_user_id === v_43e90c) {
    return { kind: "emergency_contact", resourceId: v_b6d18d, role: "viewer" };
  }
  return null;
}

export interface AssertAccessOpts {
  kind: AccessResult["kind"];
  resourceId: number;
  minRole?: AccessRole; 
}

export async function v_a5cf83(
  c: v_437670<v_de0a25>,
  v_328259,
): Promise<AccessResult> {
  const v_43e90c = v_3f4e2e.get("userId");
  if (!v_43e90c) throw new v_3ebe58("UNAUTHENTICATED", "Auth required.");
  if (!Number.isInteger(v_328259.resourceId) || v_328259.resourceId <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "resourceId invalid.");
  }

  let v_a0737a = null;
  switch (v_328259.kind) {
    case "clone":
      v_a0737a = await v_a7214e(v_3f4e2e.env.DB, v_328259.resourceId, v_43e90c);
      break;
    case "user":
      v_a0737a = await v_b5bfb0(v_3f4e2e.env.DB, v_328259.resourceId, v_43e90c);
      break;
    case "message":
      v_a0737a = await v_09f6d6(v_3f4e2e.env.DB, v_328259.resourceId, v_43e90c);
      break;
    case "emergency_contact":
      v_a0737a = await v_5de085(v_3f4e2e.env.DB, v_328259.resourceId, v_43e90c);
      break;
  }
  if (!v_a0737a) throw new v_3ebe58("FORBIDDEN", `No access to ${v_328259.kind} #${v_328259.resourceId}.`);

  const v_f6adae = v_328259.minRole ?? "viewer";
  if (v_f6adae === "owner" && v_a0737a.role === "viewer") {
    throw new v_3ebe58("FORBIDDEN", "Owner role required.");
  }
  return v_a0737a;
}
