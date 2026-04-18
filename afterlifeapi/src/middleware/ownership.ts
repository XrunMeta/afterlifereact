import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../lib/env";
import { APIError } from "../lib/errors";

export type CloneRole = "owner" | "viewer";

export interface CloneAccess {
  cloneId: number;
  role: CloneRole | "self_owner";
}

async function resolveCloneAccess(
  db: D1Database,
  cloneId: number,
  userId: number,
): Promise<CloneAccess | null> {
  const clone = await db
    .prepare(`SELECT owner_id, deleted_at FROM clones WHERE id = ?`)
    .bind(cloneId)
    .first<{ owner_id: number; deleted_at: string | null }>();
  if (!clone || clone.deleted_at) return null;
  if (clone.owner_id === userId) return { cloneId, role: "self_owner" };

  const share = await db
    .prepare(
      `SELECT role FROM clone_shares
       WHERE clone_id = ? AND target_user_id = ? AND status = 'accepted'`,
    )
    .bind(cloneId, userId)
    .first<{ role: CloneRole }>();
  if (!share) return null;
  return { cloneId, role: share.role };
}

export function requireClone(opts: { minRole?: CloneRole } = {}): MiddlewareHandler<AppEnv> {
  const minRole: CloneRole = opts.minRole ?? "viewer";
  return async (c, next) => {
    const userId = c.get("userId");
    if (!userId) throw new APIError("UNAUTHENTICATED", "Auth required for clone resource.");
    const raw = c.req.param("cloneId") ?? c.req.param("id");
    const cloneId = Number(raw);
    if (!Number.isInteger(cloneId) || cloneId <= 0) {
      throw new APIError("VALIDATION_FAILED", "cloneId path param invalid.");
    }
    const access = await resolveCloneAccess(c.env.DB, cloneId, userId);
    if (!access) throw new APIError("FORBIDDEN", "No access to this clone.");
    if (minRole === "owner" && access.role === "viewer") {
      throw new APIError("FORBIDDEN", "Owner role required.");
    }

    c.set("cloneAccess", access);
    await next();
  };
}
