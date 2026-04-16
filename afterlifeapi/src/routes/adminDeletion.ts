

import { Hono } from "hono";
import type { AppEnv } from "../lib/env";
import { APIError } from "../lib/errors";
import { requireAdmin } from "../middleware/auth";
import {
  coldKey,
  getSnapshot,
  restoreFromSnapshot,
  type ColdType,
  type Snapshot,
} from "../lib/coldStorage";
import { writeDecryptionAudit } from "../lib/auditChain";
import { parseJson, z } from "../lib/validate";

export const adminDeletion = new Hono<AppEnv>();

const COLD_TYPES = new Set<string>(["user", "clone", "message"]);

const TABLE: Record<ColdType, string> = {
  user: "users",
  clone: "clones",
  message: "messages",
};

const restoreBodySchema = z.object({
  reason: z.string().min(10).max(500), 
});

adminDeletion.post("/:type/:id/restore-from-cold", requireAdmin, async (c) => {

  const adminUserId = c.get("adminUserId")!;
  const { type, id: idRaw } = c.req.param();

  if (!COLD_TYPES.has(type)) {
    throw new APIError("VALIDATION_FAILED", "type must be one of: user, clone, message");
  }
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new APIError("VALIDATION_FAILED", "id must be a positive integer");
  }

  const { reason } = await parseJson(c, restoreBodySchema);

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

  let auditWarning = false;
  try {
    await writeDecryptionAudit(c.env.DB, c.env.AUDIT_SECRET, {
      actor: { type: "admin", id: adminUserId },
      op: "cold_restore",
      resourceType: type,
      resourceId: id,
      reason,
    });
  } catch (err) {
    console.error("cold_restore audit write failed", { type, id, err });
    auditWarning = true;
  }

  return c.json({ ok: true, type, id, state: "active", ...(auditWarning && { auditWarning: true }) });
});
