

import type { v_437670 } from "zmui";
import type { v_de0a25 } from "./env";
import { v_3ebe58 } from "./errors";

export type LedgerType =
  | "charge_inapp"
  | "charge_xrun"
  | "gift"
  | "clone_create"
  | "message_send"
  | "refund"
  | "admin_grant";

export interface SpendArgs {
  userId: number;
  amount: number; 
  type: LedgerType; 
  refId?: string; 
  idempotencyKey: string; 
}

export async function v_20a4f4(c: v_437670<v_de0a25>, v_4317d1): Promise<void> {
  if (!Number.isInteger(v_4317d1.amount) || v_4317d1.amount <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "amount must be a positive integer.");
  }
  const v_a1651b = v_3f4e2e.env.DB;
  try {
    const v_a7f568 = await v_a1651b.batch([
      v_a1651b
        .prepare(
          `INSERT INTO credit_ledgers (user_id, amount, type, ref_id, idempotency_key)
             SELECT ?, ?, ?, ?, ?
               FROM users
              WHERE id = ? AND credits >= ? AND deleted_at IS NULL`,
        )
        .bind(v_4317d1.userId, -v_4317d1.amount, v_4317d1.type, v_4317d1.refId ?? null, v_4317d1.idempotencyKey, v_4317d1.userId, v_4317d1.amount),
      v_a1651b
        .prepare(
          `UPDATE users
              SET credits = credits - ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND credits >= ? AND deleted_at IS NULL`,
        )
        .bind(v_4317d1.amount, v_4317d1.userId, v_4317d1.amount),
    ]);
    const v_fd0533 = v_a7f568[0]?.meta?.changes ?? 0;
    const v_1758ac = v_a7f568[1]?.meta?.changes ?? 0;
    if (v_fd0533 === 0 || v_1758ac === 0) {
      throw new v_3ebe58("INSUFFICIENT_CREDITS", "Not enough credits.");
    }
  } catch (v_49263d) {
    if (v_49263d instanceof v_3ebe58) throw v_49263d;
    const v_badeaf = (v_49263d as Error).message ?? "";
    if (/UNIQUE constraint failed: credit_ledgers/.test(v_badeaf)) {

      const v_2662e0 = await v_a1651b
        .prepare(
          `SELECT id FROM credit_ledgers WHERE type = ? AND idempotency_key = ? LIMIT 1`,
        )
        .bind(v_4317d1.type, v_4317d1.idempotencyKey)
        .first<{ id: number }>();
      if (v_2662e0) return;
    }
    throw v_49263d;
  }
}

export async function v_696c65(
  c: v_437670<v_de0a25>,
  v_4317d1,
): Promise<void> {
  if (!Number.isInteger(v_4317d1.amount) || v_4317d1.amount <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "amount must be a positive integer.");
  }
  const v_a1651b = v_3f4e2e.env.DB;
  try {
    await v_a1651b.batch([
      v_a1651b
        .prepare(
          `INSERT INTO credit_ledgers (user_id, amount, type, ref_id, idempotency_key)
             VALUES (?, ?, ?, ?, ?)`,
        )
        .bind(v_4317d1.userId, v_4317d1.amount, v_4317d1.type, v_4317d1.refId ?? null, v_4317d1.idempotencyKey),
      v_a1651b
        .prepare(
          `UPDATE users SET credits = credits + ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND deleted_at IS NULL`,
        )
        .bind(v_4317d1.amount, v_4317d1.userId),
    ]);
  } catch (v_49263d) {
    const v_badeaf = (v_49263d as Error).message ?? "";
    if (/UNIQUE constraint failed: credit_ledgers/.test(v_badeaf)) return; 
    throw v_49263d;
  }
}
