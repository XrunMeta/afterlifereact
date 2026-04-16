

import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_3ebe58 } from "../lib/errors";
import { v_c0a297 } from "../middleware/auth";
import {
  v_172c9f,
  v_ff8d3b,
  v_5fd134,
  type v_d33606,
  type v_da5f26,
} from "../lib/coldStorage";
import { v_e56fb3 } from "../lib/auditChain";

export const v_19f1fa = new v_b7c41b<v_de0a25>();

const v_bddcd9 = new Set<string>(["user", "clone", "message"]);

const TABLE: Record<v_d33606, string> = {
  user: "users",
  clone: "clones",
  message: "messages",
};

function v_8afb61(v_3b27d9, v_389afb): string {
  return `${v_5fd134}/${v_3b27d9}/${v_389afb}/snapshot.json.gz`;
}

v_19f1fa.post("/:type/:id/restore-from-cold", v_c0a297, async (v_3f4e2e) => {

  const v_105fc4 = v_3f4e2e.get("adminUserId") as number;
  const { type: v_3b27d9, id: v_2c44c0 } = v_3f4e2e.req.param();

  if (!v_bddcd9.has(v_3b27d9)) {
    throw new v_3ebe58("VALIDATION_FAILED", "type must be one of: user, clone, message");
  }
  const v_389afb = Number(v_2c44c0);
  if (!Number.isInteger(v_389afb) || v_389afb <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "id must be a positive integer");
  }

  const v_4d33b2 = await v_3f4e2e.req.json<{ reason?: string }>();
  if (!v_4d33b2.reason || v_4d33b2.reason.length < 5) {
    throw new v_3ebe58("VALIDATION_FAILED", "reason required (min 5 chars)");
  }
  const { reason: v_58ca36 } = v_4d33b2;

  const v_194c75 = v_3b27d9 as v_d33606;
  const v_cb9428 = v_edff4c[v_194c75];

  const v_3ac7e7 = await v_3f4e2e.env.DB.prepare(
    `SELECT id, deletion_state FROM ${v_cb9428} WHERE id = ?`,
  )
    .bind(v_389afb)
    .first<{ id: number; deletion_state: string | null }>();

  if (!v_3ac7e7) {
    throw new v_3ebe58("NOT_FOUND", `${v_3b27d9} not found`);
  }
  if (v_3ac7e7.deletion_state !== "archived_cold") {
    throw new v_3ebe58("CONFLICT", "not in archived_cold state");
  }

  const v_b24339 = v_8afb61(v_194c75, v_389afb);
  const v_cdab2a = await v_172c9f(v_3f4e2e.env.R2_ARCHIVE, v_b24339);
  if (!v_cdab2a) {

    throw new v_3ebe58("NOT_FOUND", "cold snapshot missing");
  }

  const v_5392c4 = v_cdab2a as v_da5f26;

  await v_ff8d3b(v_3f4e2e.env.DB, v_5392c4);

  await v_3f4e2e.env.DB.prepare(
    `UPDATE ${v_cb9428} SET deletion_state = 'active' WHERE id = ?`,
  )
    .bind(v_389afb)
    .run();

  await v_3f4e2e.env.R2_ARCHIVE.delete(v_b24339);

  await v_e56fb3(v_3f4e2e.env.DB, v_3f4e2e.env.AUDIT_SECRET, {
    actor: { type: "admin", id: v_105fc4 },
    op: "cold_restore",
    resourceType: v_3b27d9,
    resourceId: v_389afb,
    reason: v_58ca36,
  });

  return v_3f4e2e.json({ ok: true, type: v_3b27d9, id: v_389afb, state: "active" });
});
