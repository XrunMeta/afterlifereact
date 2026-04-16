

import { Hono } from "hono";
import type { AppEnv } from "../lib/env";
import { APIError } from "../lib/errors";
import { requireAdmin } from "../middleware/auth";
import {
  getSnapshot,
  restoreFromSnapshot,
  COLD_PREFIX,
  type ColdType,
  type Snapshot,
} from "../lib/coldStorage";
import { writeDecryptionAudit } from "../lib/auditChain";

export const adminDeletion = new Hono<AppEnv>();

const COLD_TYPES = new Set<string>(["user", "clone", "message"]);

const TABLE: Record<ColdType, string> = {
  user: "users",
  clone: "clones",
  message: "messages",
};

function coldKey(type: string, id: string | number): string {
  return `${COLD_PREFIX}/${type}/${id}/snapshot.json.gz`;
}

adminDeletion.post("/:type/:id/restore-from-cold", requireAdmin, async (c) => {

  const adminUserId = c.get("adminUserId") as number;
  const { type, id: idRaw } = c.req.param();

  if (!COLD_TYPES.has(type)) {
    throw new APIError("VALIDATION_FAILED", "type must be one of: user, clone, message");
  }
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new APIError("VALIDATION_FAILED", "id must be a positive integer");
  }

  const body = await c.req.json<{ reason?: string }>();
  if (!body.reason || body.reason.length < 5) {
    throw new APIError("VALIDATION_FAILED", "reason required (min 5 chars)");
  }
  const { reason } = body;

  const coldType = type as ColdType;
  const table = TABLE[coldType];

  const row = await c.env.DB.prepare(
    `SELECT id, deletion_state FROM ${table} WHERE id = ?`,
  )
    .bind(id)
    .first<{ id: number; deletion_state: string | null }>();

  if (!row) {
    throw new APIError("NOT_FOUND", `${type} not found`);
  }
  if (row.deletion_state !== "archived_cold") {
    throw new APIError("CONFLICT", "not in archived_cold state");
  }

  const key = coldKey(coldType, id);
  const snapshotRaw = await getSnapshot(c.env.R2_ARCHIVE, key);
  if (!snapshotRaw) {

    throw new APIError("NOT_FOUND", "cold snapshot missing");
  }

  const snapshot = snapshotRaw as Snapshot;

  await restoreFromSnapshot(c.env.DB, snapshot);

  await c.env.DB.prepare(
    `UPDATE ${table} SET deletion_state = 'active' WHERE id = ?`,
  )
    .bind(id)
    .run();

  await c.env.R2_ARCHIVE.delete(key);

  await writeDecryptionAudit(c.env.DB, c.env.AUDIT_SECRET, {
    actor: { type: "admin", id: adminUserId },
    op: "cold_restore",
    resourceType: type,
    resourceId: id,
    reason,
  });

  return c.json({ ok: true, type, id, state: "active" });
});
