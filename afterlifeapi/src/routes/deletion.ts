

import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_3ebe58 } from "../lib/errors";
import { v_6690d9 } from "../middleware/auth";
import type { v_d33606 } from "../lib/coldStorage";

export const v_dda4b9 = new v_b7c41b<v_de0a25>();

type SoftDeleteResult = "ok" | "not_found" | "not_owner" | "already_deleted";
type SoftRestoreResult = "ok" | "not_found" | "not_owner" | "not_soft_deleted" | "past_restore_window";

const TABLE: Record<v_d33606, string> = {
  user: "users",
  clone: "clones",
  message: "messages",
};

const HAS_SOFT_DELETED_AT: Record<v_d33606, boolean> = {
  user: true,
  clone: true,
  message: false,
};

const v_8cc98d = 90;

async function v_b4f765(
  v_a1651b,
  type: v_d33606,
  v_389afb,
  v_9cd637,
  v_1badb6,
): Promise<SoftDeleteResult> {
  const v_cb9428 = v_edff4c[v_3b27d9];
  const v_3ac7e7 = await v_a1651b
    .prepare(`SELECT id, deletion_state, ${v_9cd637} FROM ${v_cb9428} WHERE id = ?`)
    .bind(v_389afb)
    .first<{ id: number; deletion_state: string; [key: string]: unknown }>();

  if (!v_3ac7e7) return "not_found";
  if (v_3ac7e7[v_9cd637] !== v_1badb6) return "not_owner";
  if (v_3ac7e7.deletion_state !== "active") return "already_deleted";

  const v_24f50c = v_66e19e[v_3b27d9]
    ? "deletion_state = 'soft_deleted', soft_deleted_at = CURRENT_TIMESTAMP"
    : "deletion_state = 'soft_deleted'";

  await v_a1651b
    .prepare(`UPDATE ${v_cb9428} SET ${v_24f50c} WHERE id = ?`)
    .bind(v_389afb)
    .run();

  return "ok";
}

async function v_c8311e(
  v_a1651b,
  type: v_d33606,
  v_389afb,
  v_9cd637,
  v_1badb6,
): Promise<SoftRestoreResult> {
  const v_cb9428 = v_edff4c[v_3b27d9];
  const v_3ac7e7 = await v_a1651b
    .prepare(
      `SELECT id, deletion_state, ${v_9cd637}, soft_deleted_at FROM ${v_cb9428} WHERE id = ?`,
    )
    .bind(v_389afb)
    .first<{
      id: number;
      deletion_state: string;
      soft_deleted_at: string | null;
      [key: string]: unknown;
    }>();

  if (!v_3ac7e7) return "not_found";
  if (v_3ac7e7[v_9cd637] !== v_1badb6) return "not_owner";
  if (v_3ac7e7.deletion_state !== "soft_deleted") return "not_soft_deleted";

  if (v_66e19e[v_3b27d9] && v_3ac7e7.soft_deleted_at) {
    const v_bee926 = new Date(v_3ac7e7.soft_deleted_at).getTime();
    const v_4c14f9 = v_bee926 + v_8cc98d * 24 * 60 * 60 * 1000;
    if (Date.now() > v_4c14f9) return "past_restore_window";
  }

  const v_24f50c = v_66e19e[v_3b27d9]
    ? "deletion_state = 'active', soft_deleted_at = NULL"
    : "deletion_state = 'active'";

  await v_a1651b
    .prepare(`UPDATE ${v_cb9428} SET ${v_24f50c} WHERE id = ?`)
    .bind(v_389afb)
    .run();

  return "ok";
}

function v_d24e3e(v_43c42e) {
  switch (v_43c42e) {
    case "not_found":
      throw new v_3ebe58("NOT_FOUND", "Resource not found.");
    case "not_owner":
      throw new v_3ebe58("FORBIDDEN", "You do not own this resource.");
    case "already_deleted":
      throw new v_3ebe58("CONFLICT", "Resource is already deleted.");
  }
}

function v_7b6df3(v_43c42e) {
  switch (v_43c42e) {
    case "not_found":
      throw new v_3ebe58("NOT_FOUND", "Resource not found.");
    case "not_owner":
      throw new v_3ebe58("FORBIDDEN", "You do not own this resource.");
    case "not_soft_deleted":
      throw new v_3ebe58("CONFLICT", "Resource is not in soft_deleted state.");
    case "past_restore_window":
      throw new v_3ebe58("SHREDDED", "Restore window has expired (90 days).");
  }
}

v_dda4b9.delete("/me", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_43c42e = await v_b4f765(v_3f4e2e.env.DB, "user", v_43e90c, "id", v_43e90c);
  v_d24e3e(v_43c42e);
  return v_3f4e2e.json({ ok: true, state: "soft_deleted" });
});

v_dda4b9.post("/me/restore", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_43c42e = await v_c8311e(v_3f4e2e.env.DB, "user", v_43e90c, "id", v_43e90c);
  v_7b6df3(v_43c42e);
  return v_3f4e2e.json({ ok: true, state: "active" });
});

v_dda4b9.delete("/oth-path", v_6690d9, async (v_3f4e2e) => {
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid clone id.");
  }
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_43c42e = await v_b4f765(v_3f4e2e.env.DB, "clone", v_6e0fd3, "owner_id", v_43e90c);
  v_d24e3e(v_43c42e);
  return v_3f4e2e.json({ ok: true, state: "soft_deleted" });
});

v_dda4b9.post("/oth-path", v_6690d9, async (v_3f4e2e) => {
  const v_6e0fd3 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_6e0fd3) || v_6e0fd3 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid clone id.");
  }
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_43c42e = await v_c8311e(v_3f4e2e.env.DB, "clone", v_6e0fd3, "owner_id", v_43e90c);
  v_7b6df3(v_43c42e);
  return v_3f4e2e.json({ ok: true, state: "active" });
});

v_dda4b9.delete("/messages/:id", v_6690d9, async (v_3f4e2e) => {
  const v_7f4466 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_7f4466) || v_7f4466 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid message id.");
  }
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_43c42e = await v_b4f765(v_3f4e2e.env.DB, "message", v_7f4466, "user_id", v_43e90c);
  v_d24e3e(v_43c42e);
  return v_3f4e2e.json({ ok: true, state: "soft_deleted" });
});

v_dda4b9.post("/messages/:id/restore", v_6690d9, async (v_3f4e2e) => {
  const v_7f4466 = Number(v_3f4e2e.req.param("id"));
  if (!Number.isInteger(v_7f4466) || v_7f4466 <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid message id.");
  }
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_43c42e = await v_c8311e(v_3f4e2e.env.DB, "message", v_7f4466, "user_id", v_43e90c);
  v_7b6df3(v_43c42e);
  return v_3f4e2e.json({ ok: true, state: "active" });
});
