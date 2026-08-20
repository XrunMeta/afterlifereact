

import type { v_437670 } from "zmui";
import type { v_de0a25 } from "./env";
import { v_3ebe58 } from "./errors";
import { v_52acfb } from "./appConfig";

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

export async function v_4960d7(
  c: v_437670<v_de0a25>,
  v_43e90c,
): Promise<{ granted: boolean }> {
  const v_a1651b = v_3f4e2e.env.DB;
  const v_62c866 = `signup:${v_43e90c}`;
  const v_4e95b5 = await v_52acfb(v_3f4e2e.env);
  if (v_4e95b5 <= 0) return { granted: false }; 

  try {
    const v_a7f568 = await v_a1651b.batch([

      v_a1651b
        .prepare(
          `INSERT INTO credit_ledgers (user_id, amount, type, ref_id, idempotency_key)
             VALUES (?, ?, 'signup_grant', 'signup', ?)`,
        )
        .bind(v_43e90c, v_4e95b5, v_62c866),

      v_a1651b
        .prepare(
          `UPDATE users
              SET credits_free    = credits_free + ?,
                  credits         = credits + ?,
                  free_granted_at = CAST(strftime('%s','now') AS INTEGER) * 1000,
                  updated_at      = CURRENT_TIMESTAMP
            WHERE id = ? AND deleted_at IS NULL
              AND free_granted_at IS NULL`,
        )
        .bind(v_4e95b5, v_4e95b5, v_43e90c),
    ]);
    const v_1758ac = v_a7f568[1]?.meta?.changes ?? 0;
    return { granted: v_1758ac > 0 };
  } catch (v_49263d) {
    const v_badeaf = (v_49263d as Error).message ?? "";
    if (/UNIQUE constraint failed: credit_ledgers/.test(v_badeaf)) {

      return { granted: false };
    }
    throw v_49263d;
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

  credits_gift: number;
}

export async function v_a025af(
  c: v_437670<v_de0a25>,
  v_4317d1,
): Promise<SpendCallResult> {
  const { userId: v_43e90c, amountSec: v_b1cc8a, callId: v_be62d3 } = v_4317d1;
  if (!Number.isInteger(v_b1cc8a) || v_b1cc8a < 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "amountSec must be a non-negative integer.");
  }
  if (v_b1cc8a === 0) return { billedSec: 0, unbilledSec: 0 };

  const v_a1651b = v_3f4e2e.env.DB;

  for (let v_bc21cd = 0; v_bc21cd < 2; v_bc21cd++) {
    const v_3ac7e7 = await v_a1651b
      .prepare(
        `SELECT credits_free, credits_sub, credits_topup, credits_gift
           FROM users WHERE id = ? AND deleted_at IS NULL`,
      )
      .bind(v_43e90c)
      .first<BucketRow>();
    if (!v_3ac7e7) throw new v_3ebe58("NOT_FOUND", "User not found.");

    const v_c6935f = Math.min(v_b1cc8a, v_3ac7e7.credits_free);
    const v_adc4ac = Math.min(v_b1cc8a - v_c6935f, v_3ac7e7.credits_sub);
    const v_4e973d = Math.min(v_b1cc8a - v_c6935f - v_adc4ac, v_3ac7e7.credits_gift);
    const v_413d81 = Math.min(v_b1cc8a - v_c6935f - v_adc4ac - v_4e973d, v_3ac7e7.credits_topup);
    const v_49e7a6 = v_c6935f + v_adc4ac + v_4e973d + v_413d81;
    const v_79d5f0 = v_b1cc8a - v_49e7a6;

    if (v_49e7a6 === 0) return { billedSec: 0, unbilledSec: v_b1cc8a };

    const v_be9ad5 = [
      v_a1651b
        .prepare(
          `INSERT INTO credit_ledgers (user_id, amount, type, ref_id, idempotency_key)
             VALUES (?, ?, 'call_usage', ?, ?)`,
        )
        .bind(v_43e90c, -v_49e7a6, v_be62d3, v_be62d3),
      v_a1651b
        .prepare(
          `UPDATE users
              SET credits_free  = credits_free  - ?,
                  credits_sub   = credits_sub   - ?,
                  credits_gift  = credits_gift  - ?,
                  credits_topup = credits_topup - ?,
                  credits       = credits       - ?,
                  updated_at    = CURRENT_TIMESTAMP
            WHERE id = ?
              AND credits_free  >= ?
              AND credits_sub   >= ?
              AND credits_gift  >= ?
              AND credits_topup >= ?`,
        )
        .bind(v_c6935f, v_adc4ac, v_4e973d, v_413d81, v_49e7a6, v_43e90c, v_c6935f, v_adc4ac, v_4e973d, v_413d81),
    ];

    if (v_413d81 > 0) {

      const v_9fdb66 = await v_a1651b
        .prepare(
          `SELECT id, remaining FROM credit_lots
            WHERE user_id = ? AND remaining > 0
            ORDER BY expires_at ASC, id ASC`,
        )
        .bind(v_43e90c)
        .all<{ id: number; remaining: number }>();

      let v_dbaa7f = v_413d81;
      for (const v_41d9f0 of v_9fdb66.results ?? []) {
        if (v_dbaa7f <= 0) break;
        const v_04326c = Math.min(v_dbaa7f, v_41d9f0.remaining);
        v_be9ad5.push(
          v_a1651b
            .prepare(
              `UPDATE credit_lots SET remaining = remaining - ? WHERE id = ? AND remaining >= ?`,
            )
            .bind(v_04326c, v_41d9f0.id, v_04326c),
        );
        v_dbaa7f -= v_04326c;
      }
    }

    try {
      const v_a7f568 = await v_a1651b.batch(v_be9ad5);
      const v_1758ac = v_a7f568[1]?.meta?.changes ?? 0;
      if (v_1758ac === 0) continue; 
      return { billedSec: v_49e7a6, unbilledSec: v_79d5f0 };
    } catch (v_49263d) {
      const v_badeaf = (v_49263d as Error).message ?? "";
      if (/UNIQUE constraint failed: credit_ledgers/.test(v_badeaf)) {

        const v_2662e0 = await v_a1651b
          .prepare(
            `SELECT amount FROM credit_ledgers
              WHERE type = 'call_usage' AND idempotency_key = ? LIMIT 1`,
          )
          .bind(v_be62d3)
          .first<{ amount: number }>();
        const v_ba2215 = v_2662e0 ? -v_2662e0.amount : 0;
        return { billedSec: v_ba2215, unbilledSec: Math.max(0, v_b1cc8a - v_ba2215) };
      }
      throw v_49263d;
    }
  }

  throw new v_3ebe58("CONFLICT", "Credit balance changed concurrently; retry failed.");
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
