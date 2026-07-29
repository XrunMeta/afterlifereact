import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_3ebe58 } from "../lib/errors";
import { v_4c95c2, v_1f4ea7 } from "../lib/validate";
import { v_6690d9 } from "../middleware/auth";
import { v_a04a51 } from "../middleware/idempotency";
import { v_696c65 } from "../lib/credits";
import { v_824292 } from "../lib/appleIap";
import { v_33874d, v_bc5949 } from "../lib/googlePlayIap";
import { v_83773a, v_6ec970 } from "../lib/iapProducts";

export const v_e2c945 = new v_b7c41b<v_de0a25>();

v_e2c945.get("/health", (v_3f4e2e) => v_3f4e2e.json({ ok: true, module: "credits" }));

v_e2c945.get("/balance", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_a1651b = v_3f4e2e.env.DB;

  const v_ceb55a = await v_a1651b
    .prepare(
      `SELECT credits, credits_free, credits_sub, credits_topup,
              free_granted_at, free_decayed_months
         FROM users WHERE id = ? AND deleted_at IS NULL`,
    )
    .bind(v_43e90c)
    .first<{
      credits: number;
      credits_free: number;
      credits_sub: number;
      credits_topup: number;
      free_granted_at: number | null;
      free_decayed_months: number;
    }>();
  if (!v_ceb55a) throw new v_3ebe58("NOT_FOUND", "User not found.");

  const v_1ae212 = await v_a1651b
    .prepare(
      `SELECT platform, product_id, plan_code, status,
              current_period_start, current_period_end, auto_renew
         FROM subscriptions
        WHERE user_id = ? AND status IN ('active','grace')
        ORDER BY current_period_end DESC LIMIT 1`,
    )
    .bind(v_43e90c)
    .first<{
      platform: "ios" | "android";
      product_id: string;
      plan_code: "light" | "basic" | "standard" | "plus" | "premium";
      status: "active" | "grace";
      current_period_start: number;
      current_period_end: number;
      auto_renew: number;
    }>();

  const v_f7f38a = await v_a1651b
    .prepare(
      `SELECT expires_at, remaining
         FROM credit_lots
        WHERE user_id = ? AND remaining > 0
        ORDER BY expires_at ASC LIMIT 1`,
    )
    .bind(v_43e90c)
    .first<{ expires_at: number; remaining: number }>();

  return v_3f4e2e.json({

    totalSec: v_ceb55a.credits,

    freeSec: v_ceb55a.credits_free,
    subSec: v_ceb55a.credits_sub,
    topupSec: v_ceb55a.credits_topup,

    freeGrantedAt: v_ceb55a.free_granted_at,   
    freeDecayedMonths: v_ceb55a.free_decayed_months,

    subscription: v_1ae212
      ? {
          platform: v_1ae212.platform,
          productId: v_1ae212.product_id,
          planCode: v_1ae212.plan_code,
          status: v_1ae212.status,
          periodStart: v_1ae212.current_period_start,
          periodEnd: v_1ae212.current_period_end,
          autoRenew: v_1ae212.auto_renew === 1,
        }
      : null,

    nextExpiry: v_f7f38a
      ? { expiresAt: v_f7f38a.expires_at, remainingSec: v_f7f38a.remaining }
      : null,
  });
});

v_e2c945.get("/me", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_a1651b = v_3f4e2e.env.DB;

  const v_ceb55a = await v_a1651b
    .prepare(
      `SELECT credits, balance_checkpoint, last_ledger_id, checkpoint_at
         FROM users WHERE id = ? AND deleted_at IS NULL`,
    )
    .bind(v_43e90c)
    .first<{
      credits: number;
      balance_checkpoint: number;
      last_ledger_id: number;
      checkpoint_at: string | null;
    }>();
  if (!v_ceb55a) throw new v_3ebe58("NOT_FOUND", "User not found.");

  const v_4cd692 = (
    await v_a1651b
      .prepare(
        `SELECT id, amount, type, ref_id, created_at
           FROM credit_ledgers
          WHERE user_id = ?
          ORDER BY id DESC
          LIMIT 10`,
      )
      .bind(v_43e90c)
      .all<{
        id: number;
        amount: number;
        type: string;
        ref_id: string | null;
        created_at: string;
      }>()
  ).results;

  return v_3f4e2e.json({
    credits: v_ceb55a.credits,
    balanceCheckpoint: v_ceb55a.balance_checkpoint,
    lastLedgerId: v_ceb55a.last_ledger_id,
    checkpointAt: v_ceb55a.checkpoint_at,
    recentLedgers: v_4cd692.map((v_cb35cb) => ({
      id: v_cb35cb.id,
      amount: v_cb35cb.amount,
      type: v_cb35cb.type,
      refId: v_cb35cb.ref_id,
      createdAt: v_cb35cb.created_at,
    })),
  });
});

const v_091140 = v_1f4ea7.object({
  after_id: v_1f4ea7.coerce.number().int().positive().optional(),
  limit: v_1f4ea7.coerce.number().int().min(1).max(100).default(50),
  type: v_1f4ea7
    .enum(["charge_inapp", "charge_xrun", "gift", "clone_create", "message_send", "refund", "admin_grant"])
    .optional(),
});

v_e2c945.get("/ledgers", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_8decf8 = v_091140.safeParse(
    Object.fromEntries(new URL(v_3f4e2e.req.url).searchParams.entries()),
  );
  if (!v_8decf8.success) {
    throw new v_3ebe58("VALIDATION_FAILED", "Query invalid.", v_8decf8.error.issues);
  }
  const { after_id: v_d7341b, limit: v_02be30, type: v_3b27d9 } = v_8decf8.data;

  const v_abcc8d = [`user_id = ?`];
  const v_925171 = [v_43e90c];
  if (v_d7341b) {
    v_abcc8d.push(`id < ?`);
    v_925171.push(v_d7341b);
  }
  if (v_3b27d9) {
    v_abcc8d.push(`type = ?`);
    v_925171.push(v_3b27d9);
  }
  const v_18b8bf = (
    await v_3f4e2e.env.DB
      .prepare(
        `SELECT id, amount, type, ref_id, created_at
           FROM credit_ledgers
          WHERE ${v_abcc8d.join(" AND ")}
          ORDER BY id DESC
          LIMIT ?`,
      )
      .bind(...v_925171, v_02be30 + 1)
      .all<{
        id: number;
        amount: number;
        type: string;
        ref_id: string | null;
        created_at: string;
      }>()
  ).results;

  const v_6bbe19 = v_18b8bf.length > v_02be30;
  const v_2365e9 = v_6bbe19 ? v_18b8bf.slice(0, v_02be30) : v_18b8bf;
  return v_3f4e2e.json({
    items: v_2365e9.map((v_cb35cb) => ({
      id: v_cb35cb.id,
      amount: v_cb35cb.amount,
      type: v_cb35cb.type,
      refId: v_cb35cb.ref_id,
      createdAt: v_cb35cb.created_at,
    })),
    nextAfterId: v_6bbe19 && v_2365e9.length > 0 ? v_2365e9[v_2365e9.length - 1]!.id : null,
  });
});

const v_f34a62 = {
  starter: { credits: 10, type: "charge_inapp" },
  regular: { credits: 30, type: "charge_inapp" },
  plus: { credits: 105, type: "charge_inapp" }, 
  pro: { credits: 575, type: "charge_inapp" }, 
};

const v_5810b3 = v_1f4ea7.object({
  package_id: v_1f4ea7.enum(["starter", "regular", "plus", "pro"]),
  payment_provider: v_1f4ea7
    .enum(["mock_beta", "xrun_wallet", "iap_google", "iap_apple"])
    .default("mock_beta"),
  payment_token: v_1f4ea7.string().max(2000).optional(),
});

v_e2c945.post(
  "/charge",
  v_6690d9,
  v_a04a51("credits.charge"),
  async (v_3f4e2e) => {
    const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_5810b3);
    const v_43e90c = v_3f4e2e.get("userId")!;
    const v_e42213 = v_f34a62[v_4d33b2.package_id]!;

    if (v_4d33b2.payment_provider !== "mock_beta") {
      throw new v_3ebe58(
        "UPSTREAM_FAILURE",
        `Payment provider ${v_4d33b2.payment_provider} not yet integrated.`,
      );
    }

    const v_62c866 = v_3f4e2e.req.header("X-Idempotency-Key")!;
    await v_696c65(v_3f4e2e, {
      userId: v_43e90c,
      amount: v_e42213.credits,
      type: v_e42213.type,
      refId: v_4d33b2.package_id,
      idempotencyKey: v_62c866,
    });

    const v_625c74 = await v_3f4e2e.env.DB
      .prepare(`SELECT credits FROM users WHERE id = ?`)
      .bind(v_43e90c)
      .first<{ credits: number }>();

    return v_3f4e2e.json({
      ok: true,
      packageId: v_4d33b2.package_id,
      credited: v_e42213.credits,
      credits: v_625c74?.credits ?? 0,
    });
  },
);

const v_63704e = v_1f4ea7.object({
  platform: v_1f4ea7.enum(["ios", "android"]),

  transactionId: v_1f4ea7.string().min(1).max(2000),
  productId: v_1f4ea7.string().min(1).max(200), 
});

v_e2c945.post("/purchase", v_6690d9, async (v_3f4e2e) => {
  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_63704e);
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_a1651b = v_3f4e2e.env.DB;

  let v_20a7b6;
  let v_da4b3c;
  let v_0b8131 = null;
  let v_f9eb69;

  if (v_4d33b2.platform === "ios") {
    const v_34d5e3 = await v_824292(v_3f4e2e.env, v_4d33b2.transactionId);
    v_20a7b6 = v_34d5e3.productId;
    v_da4b3c = v_34d5e3.purchaseDate;
    v_0b8131 = v_34d5e3.expiresDate ?? null;
    v_f9eb69 = v_34d5e3.originalTransactionId;
  } else {

    const v_4566d9 = v_83773a(v_4d33b2.productId);
    if (!v_4566d9) {
      throw new v_3ebe58("VALIDATION_FAILED", `Unknown productId: ${v_4d33b2.productId}`);
    }
    const v_34d5e3 = await v_33874d(v_3f4e2e.env, {
      productId: v_4d33b2.productId,
      purchaseToken: v_4d33b2.transactionId,
      kind: v_4566d9.kind,
    });
    v_20a7b6 = v_34d5e3.productId;
    v_da4b3c = v_34d5e3.purchaseTime;
    v_0b8131 = v_34d5e3.expiryTime ?? null;

    v_f9eb69 = v_34d5e3.orderId || v_4d33b2.transactionId;

    if (v_4566d9.kind === "consumable") {
      void v_bc5949(v_3f4e2e.env, {
        productId: v_4d33b2.productId,
        purchaseToken: v_4d33b2.transactionId,
      });
    }
  }

  const v_01bee9 = v_83773a(v_20a7b6);
  if (!v_01bee9) {
    throw new v_3ebe58(
      "VALIDATION_FAILED",
      `Unknown productId: ${v_20a7b6}`,
    );
  }

  const v_67e77e = Date.now();
  try {
    await v_a1651b
      .prepare(
        `INSERT INTO iap_transactions
           (platform, transaction_id, user_id, product_id, kind, credits, verified_at, raw_payload)
         VALUES (?, ?, ?, ?, ?, ?, ?, NULL)`,
      )
      .bind(
        v_4d33b2.platform,
        v_4d33b2.transactionId,
        v_43e90c,
        v_20a7b6,
        v_01bee9.kind,
        v_01bee9.creditsSec,
        v_67e77e,
      )
      .run();
  } catch (v_49263d) {
    const v_badeaf = (v_49263d as Error).message ?? "";
    if (/UNIQUE constraint failed: iap_transactions/.test(v_badeaf)) {

      const v_8dd686 = await v_a1651b
        .prepare(
          `SELECT credits, credits_free, credits_sub, credits_topup
             FROM users WHERE id = ?`,
        )
        .bind(v_43e90c)
        .first<{
          credits: number;
          credits_free: number;
          credits_sub: number;
          credits_topup: number;
        }>();
      return v_3f4e2e.json({
        ok: true,
        replay: true,
        productId: v_20a7b6,
        creditsSec: v_01bee9.creditsSec,
        balance: v_8dd686 ?? null,
      });
    }
    throw v_49263d;
  }

  if (v_01bee9.kind === "consumable") {

    const v_c7e149 = `${v_4d33b2.platform}:consumable:${v_4d33b2.transactionId}`;
    const v_a7f568 = await v_a1651b.batch([
      v_a1651b
        .prepare(
          `INSERT INTO credit_ledgers (user_id, amount, type, ref_id, idempotency_key)
             VALUES (?, ?, 'charge_inapp', ?, ?)`,
        )
        .bind(v_43e90c, v_01bee9.creditsSec, v_20a7b6, v_c7e149),
      v_a1651b
        .prepare(
          `UPDATE users
              SET credits       = credits + ?,
                  credits_topup = credits_topup + ?,
                  updated_at    = CURRENT_TIMESTAMP
            WHERE id = ?`,
        )
        .bind(v_01bee9.creditsSec, v_01bee9.creditsSec, v_43e90c),
    ]);
    const v_b9e521 = Number(v_a7f568[0]?.meta?.last_row_id ?? 0);
    if (v_b9e521 > 0) {
      await v_a1651b
        .prepare(
          `INSERT INTO credit_lots
             (user_id, amount, remaining, granted_at, expires_at, ledger_id)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          v_43e90c,
          v_01bee9.creditsSec,
          v_01bee9.creditsSec,
          v_da4b3c,
          v_da4b3c + v_6ec970,
          v_b9e521,
        )
        .run();
    }
  } else {

    if (!v_01bee9.planCode) {
      throw new v_3ebe58("UPSTREAM_FAILURE", `Subscription product missing planCode: ${v_20a7b6}`);
    }
    const v_c7e149 = `${v_4d33b2.platform}:sub:${v_4d33b2.transactionId}`;
    await v_a1651b.batch([
      v_a1651b
        .prepare(
          `INSERT INTO credit_ledgers (user_id, amount, type, ref_id, idempotency_key)
             VALUES (?, ?, 'subscription_grant', ?, ?)`,
        )
        .bind(v_43e90c, v_01bee9.creditsSec, v_20a7b6, v_c7e149),
      v_a1651b
        .prepare(
          `UPDATE users
              SET credits     = credits + ?,
                  credits_sub = credits_sub + ?,
                  updated_at  = CURRENT_TIMESTAMP
            WHERE id = ?`,
        )
        .bind(v_01bee9.creditsSec, v_01bee9.creditsSec, v_43e90c),
      v_a1651b
        .prepare(
          `INSERT INTO subscriptions
             (user_id, platform, product_id, plan_code, status, original_tx_id,
              current_period_start, current_period_end, auto_renew, updated_at)
           VALUES (?, ?, ?, ?, 'active', ?, ?, ?, 1, ?)
           ON CONFLICT(platform, original_tx_id) DO UPDATE SET
             status = 'active',
             current_period_start = excluded.current_period_start,
             current_period_end = excluded.current_period_end,
             updated_at = excluded.updated_at`,
        )
        .bind(
          v_43e90c,
          v_4d33b2.platform,
          v_20a7b6,
          v_01bee9.planCode,
          v_f9eb69,
          v_da4b3c,
          v_0b8131 ?? (v_da4b3c + 30 * 24 * 60 * 60 * 1000), 
          v_67e77e,
        ),
    ]);
  }

  const v_8dd686 = await v_a1651b
    .prepare(
      `SELECT credits, credits_free, credits_sub, credits_topup
         FROM users WHERE id = ?`,
    )
    .bind(v_43e90c)
    .first<{
      credits: number;
      credits_free: number;
      credits_sub: number;
      credits_topup: number;
    }>();

  return v_3f4e2e.json({
    ok: true,
    replay: false,
    productId: v_20a7b6,
    kind: v_01bee9.kind,
    creditsSec: v_01bee9.creditsSec,
    balance: v_8dd686 ?? null,
  });
});
