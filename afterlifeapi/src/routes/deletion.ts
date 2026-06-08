

import { Hono } from "hono";
import type { AppEnv } from "../lib/env";
import { APIError } from "../lib/errors";
import { requireAuth } from "../middleware/auth";
import type { ColdType } from "../lib/coldStorage";

export const deletion = new Hono<AppEnv>();

type SoftDeleteResult = "ok" | "not_found" | "not_owner" | "already_deleted";
type SoftRestoreResult = "ok" | "not_found" | "not_owner" | "not_soft_deleted" | "past_restore_window";

const TABLE: Record<ColdType, string> = {
  user: "users",
  clone: "clones",
  message: "messages",
};

const HAS_SOFT_DELETED_AT: Record<ColdType, boolean> = {
  user: true,
  clone: true,
  message: false,
};

const RESTORE_WINDOW_DAYS = 90;

async function softDelete(
  db: D1Database,
  type: ColdType,
  id: number,
  ownerCol: string,
  ownerId: number,
): Promise<SoftDeleteResult> {
  const table = TABLE[type];
  const row = await db
    .prepare(`SELECT id, deletion_state, ${ownerCol} FROM ${table} WHERE id = ?`)
    .bind(id)
    .first<{ id: number; deletion_state: string; [key: string]: unknown }>();

  if (!row) return "not_found";
  if (row[ownerCol] !== ownerId) return "not_owner";
  if (row.deletion_state !== "active") return "already_deleted";

  const setClause = HAS_SOFT_DELETED_AT[type]
    ? "deletion_state = 'soft_deleted', soft_deleted_at = CURRENT_TIMESTAMP"
    : "deletion_state = 'soft_deleted'";

  await db
    .prepare(`UPDATE ${table} SET ${setClause} WHERE id = ?`)
    .bind(id)
    .run();

  return "ok";
}

export async function softRestore(
  db: D1Database,
  type: ColdType,
  id: number,
  ownerCol: string,
  ownerId: number,
): Promise<SoftRestoreResult> {
  const table = TABLE[type];

  const selectSql = HAS_SOFT_DELETED_AT[type]
    ? `SELECT id, deletion_state, ${ownerCol}, soft_deleted_at FROM ${table} WHERE id = ?`
    : `SELECT id, deletion_state, ${ownerCol} FROM ${table} WHERE id = ?`;
  const row = await db
    .prepare(selectSql)
    .bind(id)
    .first<{
      id: number;
      deletion_state: string;
      soft_deleted_at: string | null;
      [key: string]: unknown;
    }>();

  if (!row) return "not_found";
  if (row[ownerCol] !== ownerId) return "not_owner";
  if (row.deletion_state !== "soft_deleted") return "not_soft_deleted";

  if (HAS_SOFT_DELETED_AT[type] && row.soft_deleted_at) {
    const deletedAt = new Date(row.soft_deleted_at).getTime();
    const cutoff = deletedAt + RESTORE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    if (Date.now() > cutoff) return "past_restore_window";
  }

  const setClause = HAS_SOFT_DELETED_AT[type]
    ? "deletion_state = 'active', soft_deleted_at = NULL"
    : "deletion_state = 'active'";

  await db
    .prepare(`UPDATE ${table} SET ${setClause} WHERE id = ?`)
    .bind(id)
    .run();

  return "ok";
}

function handleDeleteResult(result: SoftDeleteResult) {
  switch (result) {
    case "not_found":
      throw new APIError("NOT_FOUND", "Resource not found.");
    case "not_owner":
      throw new APIError("FORBIDDEN", "You do not own this resource.");
    case "already_deleted":
      throw new APIError("CONFLICT", "Resource is already deleted.");
  }
}

function handleRestoreResult(result: SoftRestoreResult) {
  switch (result) {
    case "not_found":
      throw new APIError("NOT_FOUND", "Resource not found.");
    case "not_owner":
      throw new APIError("FORBIDDEN", "You do not own this resource.");
    case "not_soft_deleted":
      throw new APIError("CONFLICT", "Resource is not in soft_deleted state.");
    case "past_restore_window":
      throw new APIError("SHREDDED", "Restore window has expired (90 days).");
  }
}

export async function cascadeSoftDeleteOwnedClones(
  db: D1Database,
  ownerId: number,
): Promise<{ softDeleted: number; transferred: number }> {
  const owned = (
    await db
      .prepare(
        `SELECT id FROM clones
          WHERE owner_id = ? AND deletion_state = 'active' AND deleted_at IS NULL`,
      )
      .bind(ownerId)
      .all<{ id: number }>()
  ).results;

  let softDeleted = 0;
  let transferred = 0;
  for (const { id: cloneId } of owned) {

    const successor = await db
      .prepare(
        `SELECT cs.id, cs.target_user_id
           FROM clone_shares cs
           JOIN users u ON u.id = cs.target_user_id
          WHERE cs.clone_id = ?
            AND cs.status = 'accepted'
            AND cs.target_user_id IS NOT NULL
            AND cs.target_user_id != ?
            AND u.deleted_at IS NULL
            AND u.deletion_state = 'active'
          ORDER BY cs.created_at ASC, cs.id ASC
          LIMIT 1`,
      )
      .bind(cloneId, ownerId)
      .first<{ id: number; target_user_id: number }>();

    if (successor) {
      await db.batch([
        db
          .prepare("UPDATE clones SET owner_id = ? WHERE id = ?")
          .bind(successor.target_user_id, cloneId),
        db
          .prepare(
            `UPDATE clones SET primary_editor_user_id = ?
              WHERE id = ? AND primary_editor_user_id = ?`,
          )
          .bind(successor.target_user_id, cloneId, ownerId),
        db.prepare("DELETE FROM clone_shares WHERE id = ?").bind(successor.id),
      ]);
      transferred += 1;
    } else {
      await db
        .prepare(
          `UPDATE clones
              SET deletion_state = 'soft_deleted',
                  soft_deleted_at = CURRENT_TIMESTAMP,
                  owner_cascade_deleted_at = CURRENT_TIMESTAMP
            WHERE id = ? AND deletion_state = 'active'`,
        )
        .bind(cloneId)
        .run();
      softDeleted += 1;
    }
  }
  return { softDeleted, transferred };
}

deletion.delete("/me", requireAuth, async (c) => {
  const userId = c.get("userId")!;
  const result = await softDelete(c.env.DB, "user", userId, "id", userId);
  if (result !== "ok" && result !== "already_deleted") {
    handleDeleteResult(result); 
  }
  const alreadyDeleted = result === "already_deleted";

  const clones = await cascadeSoftDeleteOwnedClones(c.env.DB, userId);
  console.log(
    `[deletion.me] clones cascade: softDeleted=${clones.softDeleted} transferred=${clones.transferred}`,
  );

  const followRes = await c.env.DB
    .prepare(`DELETE FROM user_follows WHERE follower_id = ? OR followee_id = ?`)
    .bind(userId, userId)
    .run();
  console.log(`[deletion.me] user_follows removed: ${followRes.meta?.changes ?? 0}`);

  try {
    const linkRow = await c.env.DB
      .prepare(`SELECT xrun_member_id FROM users WHERE id = ?`)
      .bind(userId)
      .first<{ xrun_member_id: number | null }>();
    const xrunMember = linkRow?.xrun_member_id ?? null;
    if (xrunMember) {
      const { markAfterlifeDeletedOnXrun } = await import("../lib/xrun");
      await markAfterlifeDeletedOnXrun(c.env, xrunMember);
    }
  } catch (err) {
    console.warn("[deletion.me] xrun mark failed:", (err as Error).message);
  }

  return c.json({ ok: true, state: "soft_deleted", alreadyDeleted });
});

deletion.delete("/oth-path", requireAuth, async (c) => {
  const cloneId = Number(c.req.param("id"));
  if (!Number.isInteger(cloneId) || cloneId <= 0) {
    throw new APIError("VALIDATION_FAILED", "Invalid clone id.");
  }
  const userId = c.get("userId")!;
  const db = c.env.DB;

  const clone = await db
    .prepare("SELECT id, owner_id, deletion_state FROM clones WHERE id = ?")
    .bind(cloneId)
    .first<{ id: number; owner_id: number; deletion_state: string }>();
  if (!clone) throw new APIError("NOT_FOUND", "Clone not found.");
  if (clone.owner_id !== userId) throw new APIError("FORBIDDEN", "You do not own this clone.");
  if (clone.deletion_state !== "active") throw new APIError("CONFLICT", "Clone is already deleted.");

  const successor = await db
    .prepare(
      `SELECT cs.id, cs.target_user_id
         FROM clone_shares cs
         JOIN users u ON u.id = cs.target_user_id
        WHERE cs.clone_id = ?
          AND cs.status = 'accepted'
          AND cs.target_user_id IS NOT NULL
          AND cs.target_user_id != ?
          AND u.deleted_at IS NULL
        ORDER BY cs.created_at ASC, cs.id ASC
        LIMIT 1`,
    )
    .bind(cloneId, userId)
    .first<{ id: number; target_user_id: number }>();

  if (!successor) {

    await db
      .prepare(
        `UPDATE clones
            SET deletion_state = 'soft_deleted', soft_deleted_at = CURRENT_TIMESTAMP
          WHERE id = ?`,
      )
      .bind(cloneId)
      .run();
    return c.json({ ok: true, state: "soft_deleted", transferred: null });
  }

  await db.batch([
    db.prepare("UPDATE clones SET owner_id = ? WHERE id = ?").bind(successor.target_user_id, cloneId),
    db
      .prepare(
        `UPDATE clones SET primary_editor_user_id = ?
          WHERE id = ? AND primary_editor_user_id = ?`,
      )
      .bind(successor.target_user_id, cloneId, userId),
    db.prepare("DELETE FROM clone_shares WHERE id = ?").bind(successor.id),
  ]);

  return c.json({
    ok: true,
    state: "transferred",
    transferred: { newOwnerId: successor.target_user_id },
  });
});

deletion.post("/oth-path", requireAuth, async (c) => {
  const cloneId = Number(c.req.param("id"));
  if (!Number.isInteger(cloneId) || cloneId <= 0) {
    throw new APIError("VALIDATION_FAILED", "Invalid clone id.");
  }
  const userId = c.get("userId")!;
  const result = await softRestore(c.env.DB, "clone", cloneId, "owner_id", userId);
  handleRestoreResult(result);
  return c.json({ ok: true, state: "active" });
});

deletion.delete("/messages/:id", requireAuth, async (c) => {
  const messageId = Number(c.req.param("id"));
  if (!Number.isInteger(messageId) || messageId <= 0) {
    throw new APIError("VALIDATION_FAILED", "Invalid message id.");
  }
  const userId = c.get("userId")!;
  const result = await softDelete(c.env.DB, "message", messageId, "user_id", userId);
  handleDeleteResult(result);
  return c.json({ ok: true, state: "soft_deleted" });
});

deletion.post("/messages/:id/restore", requireAuth, async (c) => {
  const messageId = Number(c.req.param("id"));
  if (!Number.isInteger(messageId) || messageId <= 0) {
    throw new APIError("VALIDATION_FAILED", "Invalid message id.");
  }
  const userId = c.get("userId")!;
  const result = await softRestore(c.env.DB, "message", messageId, "user_id", userId);
  handleRestoreResult(result);
  return c.json({ ok: true, state: "active" });
});
