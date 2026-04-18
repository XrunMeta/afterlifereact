

import type { Context } from "hono";
import type { AppEnv } from "../lib/env";
import { APIError } from "../lib/errors";

export type CloneRole = "owner" | "viewer";
export type AccessRole = CloneRole | "self" | "admin";

export interface AccessResult {
  kind: "clone" | "user" | "message" | "emergency_contact";
  resourceId: number;
  role: AccessRole;
}

async function resolveCloneAccess(
  db: D1Database,
  cloneId: number,
  userId: number,
): Promise<AccessResult | null> {
  const clone = await db
    .prepare(
      `SELECT owner_id, deletion_state, deleted_at
         FROM clones WHERE id = ?`,
    )
    .bind(cloneId)
    .first<{ owner_id: number; deletion_state: string | null; deleted_at: string | null }>();
  if (!clone) return null;
  if (clone.deleted_at) return null;
  if (clone.deletion_state && clone.deletion_state !== "active") return null;

  if (clone.owner_id === userId) {
    return { kind: "clone", resourceId: cloneId, role: "owner" };
  }
  const share = await db
    .prepare(
      `SELECT role FROM clone_shares
        WHERE clone_id = ? AND target_user_id = ? AND status = 'accepted'`,
    )
    .bind(cloneId, userId)
    .first<{ role: CloneRole }>();
  if (!share) return null;
  return { kind: "clone", resourceId: cloneId, role: share.role };
}

async function resolveUserAccess(
  _db: D1Database,
  targetUserId: number,
  userId: number,
): Promise<AccessResult | null> {
  if (targetUserId !== userId) return null;
  return { kind: "user", resourceId: targetUserId, role: "self" };
}

async function resolveMessageAccess(
  db: D1Database,
  messageId: number,
  userId: number,
): Promise<AccessResult | null> {
  const row = await db
    .prepare(`SELECT clone_id FROM messages WHERE id = ?`)
    .bind(messageId)
    .first<{ clone_id: number }>();
  if (!row) return null;
  const cloneAccess = await resolveCloneAccess(db, row.clone_id, userId);
  if (!cloneAccess) return null;
  return { kind: "message", resourceId: messageId, role: cloneAccess.role };
}

async function resolveEmergencyContactAccess(
  db: D1Database,
  contactId: number,
  userId: number,
): Promise<AccessResult | null> {
  const row = await db
    .prepare(
      `SELECT principal_user_id, contact_user_id
         FROM emergency_contacts WHERE id = ?`,
    )
    .bind(contactId)
    .first<{ principal_user_id: number; contact_user_id: number | null }>();
  if (!row) return null;
  if (row.principal_user_id === userId) {
    return { kind: "emergency_contact", resourceId: contactId, role: "owner" };
  }
  if (row.contact_user_id === userId) {
    return { kind: "emergency_contact", resourceId: contactId, role: "viewer" };
  }
  return null;
}

export interface AssertAccessOpts {
  kind: AccessResult["kind"];
  resourceId: number;
  minRole?: AccessRole; 
}

export async function assertAccess(
  c: Context<AppEnv>,
  opts: AssertAccessOpts,
): Promise<AccessResult> {
  const userId = c.get("userId");
  if (!userId) throw new APIError("UNAUTHENTICATED", "Auth required.");
  if (!Number.isInteger(opts.resourceId) || opts.resourceId <= 0) {
    throw new APIError("VALIDATION_FAILED", "resourceId invalid.");
  }

  let access: AccessResult | null = null;
  switch (opts.kind) {
    case "clone":
      access = await resolveCloneAccess(c.env.DB, opts.resourceId, userId);
      break;
    case "user":
      access = await resolveUserAccess(c.env.DB, opts.resourceId, userId);
      break;
    case "message":
      access = await resolveMessageAccess(c.env.DB, opts.resourceId, userId);
      break;
    case "emergency_contact":
      access = await resolveEmergencyContactAccess(c.env.DB, opts.resourceId, userId);
      break;
  }
  if (!access) throw new APIError("FORBIDDEN", `No access to ${opts.kind} #${opts.resourceId}.`);

  const minRole = opts.minRole ?? "viewer";
  if (minRole === "owner" && access.role === "viewer") {
    throw new APIError("FORBIDDEN", "Owner role required.");
  }
  return access;
}
