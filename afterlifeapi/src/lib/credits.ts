

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
  | "admin_grant"

  | "call_usage"
  | "signup_grant"
  | "subscription_grant"
  | "free_decay"
  | "topup_expire";

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

export interface SpendCallResult {
  billedSec: number;
  unbilledSec: number;
}

interface BucketRow {
  credits_free: number;
  credits_sub: number;
  credits_topup: number;
}

export async function spendCallTime(
  c: Context<AppEnv>,
  args: { userId: number; amountSec: number; callId: string },
): Promise<SpendCallResult> {
  const { userId, amountSec, callId } = args;
  if (!Number.isInteger(amountSec) || amountSec < 0) {
    throw new APIError("VALIDATION_FAILED", "amountSec must be a non-negative integer.");
  }
  if (amountSec === 0) return { billedSec: 0, unbilledSec: 0 };

  const db = c.env.DB;

  for (let attempt = 0; attempt < 2; attempt++) {
    const row = await db
      .prepare(
        `SELECT credits_free, credits_sub, credits_topup
           FROM users WHERE id = ? AND deleted_at IS NULL`,
      )
      .bind(userId)
      .first<BucketRow>();
    if (!row) throw new APIError("NOT_FOUND", "User not found.");

    const useFree = Math.min(amountSec, row.credits_free);
    const useSub = Math.min(amountSec - useFree, row.credits_sub);
    const useTopup = Math.min(amountSec - useFree - useSub, row.credits_topup);
    const billedSec = useFree + useSub + useTopup;
    const unbilledSec = amountSec - billedSec;

    if (billedSec === 0) return { billedSec: 0, unbilledSec: amountSec };

    const statements = [
      db
        .prepare(
          `INSERT INTO credit_ledgers (user_id, amount, type, ref_id, idempotency_key)
             VALUES (?, ?, 'call_usage', ?, ?)`,
        )
        .bind(userId, -billedSec, callId, callId),
      db
        .prepare(
          `UPDATE users
              SET credits_free  = credits_free  - ?,
                  credits_sub   = credits_sub   - ?,
                  credits_topup = credits_topup - ?,
                  credits       = credits       - ?,
                  updated_at    = CURRENT_TIMESTAMP
            WHERE id = ?
              AND credits_free  >= ?
              AND credits_sub   >= ?
              AND credits_topup >= ?`,
        )
        .bind(useFree, useSub, useTopup, billedSec, userId, useFree, useSub, useTopup),
    ];

    if (useTopup > 0) {

      const lots = await db
        .prepare(
          `SELECT id, remaining FROM credit_lots
            WHERE user_id = ? AND remaining > 0
            ORDER BY expires_at ASC, id ASC`,
        )
        .bind(userId)
        .all<{ id: number; remaining: number }>();

      let left = useTopup;
      for (const lot of lots.results ?? []) {
        if (left <= 0) break;
        const take = Math.min(left, lot.remaining);
        statements.push(
          db
            .prepare(
              `UPDATE credit_lots SET remaining = remaining - ? WHERE id = ? AND remaining >= ?`,
            )
            .bind(take, lot.id, take),
        );
        left -= take;
      }
    }

    try {
      const results = await db.batch(statements);
      const updateChanges = results[1]?.meta?.changes ?? 0;
      if (updateChanges === 0) continue; 
      return { billedSec, unbilledSec };
    } catch (err) {
      const msg = (err as Error).message ?? "";
      if (/UNIQUE constraint failed: credit_ledgers/.test(msg)) {

        const prior = await db
          .prepare(
            `SELECT amount FROM credit_ledgers
              WHERE type = 'call_usage' AND idempotency_key = ? LIMIT 1`,
          )
          .bind(callId)
          .first<{ amount: number }>();
        const prev = prior ? -prior.amount : 0;
        return { billedSec: prev, unbilledSec: Math.max(0, amountSec - prev) };
      }
      throw err;
    }
  }

  throw new APIError("CONFLICT", "Credit balance changed concurrently; retry failed.");
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
