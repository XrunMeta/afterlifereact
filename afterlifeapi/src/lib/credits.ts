

import type { Context } from "hono";
import type { AppEnv } from "./env";
import { APIError } from "./errors";

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

export async function spend(c: Context<AppEnv>, args: SpendArgs): Promise<void> {
  if (!Number.isInteger(args.amount) || args.amount <= 0) {
    throw new APIError("VALIDATION_FAILED", "amount must be a positive integer.");
  }
  const db = c.env.DB;
  try {
    const results = await db.batch([
      db
        .prepare(
          `INSERT INTO credit_ledgers (user_id, amount, type, ref_id, idempotency_key)
             SELECT ?, ?, ?, ?, ?
               FROM users
              WHERE id = ? AND credits >= ? AND deleted_at IS NULL`,
        )
        .bind(args.userId, -args.amount, args.type, args.refId ?? null, args.idempotencyKey, args.userId, args.amount),
      db
        .prepare(
          `UPDATE users
              SET credits = credits - ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND credits >= ? AND deleted_at IS NULL`,
        )
        .bind(args.amount, args.userId, args.amount),
    ]);
    const insertChanges = results[0]?.meta?.changes ?? 0;
    const updateChanges = results[1]?.meta?.changes ?? 0;
    if (insertChanges === 0 || updateChanges === 0) {
      throw new APIError("INSUFFICIENT_CREDITS", "Not enough credits.");
    }
  } catch (err) {
    if (err instanceof APIError) throw err;
    const msg = (err as Error).message ?? "";
    if (/UNIQUE constraint failed: credit_ledgers/.test(msg)) {

      const prior = await db
        .prepare(
          `SELECT id FROM credit_ledgers WHERE type = ? AND idempotency_key = ? LIMIT 1`,
        )
        .bind(args.type, args.idempotencyKey)
        .first<{ id: number }>();
      if (prior) return;
    }
    throw err;
  }
}

export async function grant(
  c: Context<AppEnv>,
  args: { userId: number; amount: number; type: LedgerType; refId?: string; idempotencyKey: string },
): Promise<void> {
  if (!Number.isInteger(args.amount) || args.amount <= 0) {
    throw new APIError("VALIDATION_FAILED", "amount must be a positive integer.");
  }
  const db = c.env.DB;
  try {
    await db.batch([
      db
        .prepare(
          `INSERT INTO credit_ledgers (user_id, amount, type, ref_id, idempotency_key)
             VALUES (?, ?, ?, ?, ?)`,
        )
        .bind(args.userId, args.amount, args.type, args.refId ?? null, args.idempotencyKey),
      db
        .prepare(
          `UPDATE users SET credits = credits + ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND deleted_at IS NULL`,
        )
        .bind(args.amount, args.userId),
    ]);
  } catch (err) {
    const msg = (err as Error).message ?? "";
    if (/UNIQUE constraint failed: credit_ledgers/.test(msg)) return; 
    throw err;
  }
}
