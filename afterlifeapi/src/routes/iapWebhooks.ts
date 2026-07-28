

import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_3ebe58 } from "../lib/errors";
import { v_4c95c2, v_1f4ea7 } from "../lib/validate";
import { v_83773a } from "../lib/iapProducts";
import { v_33874d } from "../lib/googlePlayIap";

export const v_9e7c53 = new v_b7c41b<v_de0a25>();

v_9e7c53.get("/health", (v_3f4e2e) => v_3f4e2e.json({ ok: true, module: "iap-webhooks" }));

function v_fb5305(v_fba864): Uint8Array {
  const v_3ee5fb = v_fba864.length % 4 ? 4 - (v_fba864.length % 4) : 0;
  const v_8a9589 = (v_fba864 + "=".repeat(v_3ee5fb)).replace(/-/g, "+").replace(/_/g, "/");
  const v_d8cac9 = atob(v_8a9589);
  const v_8d4337 = new Uint8Array(v_d8cac9.length);
  for (let v_ebec57 = 0; v_ebec57 < v_d8cac9.length; v_ebec57++) v_8d4337[v_ebec57] = v_d8cac9.charCodeAt(v_ebec57);
  return v_8d4337;
}
const v_eef514 = new TextDecoder();

function v_e10047<T>(v_cf7834): T {
  const v_468545 = v_cf7834.split(".");
  if (v_468545.length !== 3) throw new v_3ebe58("VALIDATION_FAILED", "Malformed JWS.");
  return JSON.parse(v_eef514.decode(v_fb5305(v_468545[1]!))) as T;
}

interface AppleNotificationPayload {
  notificationType: string;
  subtype?: string;
  data?: {
    bundleId?: string;
    signedTransactionInfo?: string;
    signedRenewalInfo?: string;
  };
}

interface AppleTransactionInfo {
  transactionId: string;
  originalTransactionId: string;
  productId: string;
  purchaseDate: number;
  expiresDate?: number;
  revocationDate?: number;
  revocationReason?: number;
  type: string;
}

v_9e7c53.post("/apple-notifications", async (v_3f4e2e) => {
  const v_4d33b2 = (await v_3f4e2e.req.json().catch(() => null)) as { signedPayload?: string } | null;
  if (!v_4d33b2?.signedPayload) {

    return v_3f4e2e.json({ ok: false, reason: "missing signedPayload" }, 200);
  }

  let v_931bf0;
  try {
    v_931bf0 = v_e10047<AppleNotificationPayload>(v_4d33b2.signedPayload);
  } catch (v_49263d) {
    return v_3f4e2e.json({ ok: false, reason: "parse failed" }, 200);
  }

  const v_3b27d9 = v_931bf0.notificationType;
  const v_f42fae = v_931bf0.subtype;
  console.log(`[apple-notify] ${v_3b27d9}/${v_f42fae ?? '-'}`);

  const v_d2c3c2 = v_931bf0.data?.signedTransactionInfo;
  if (!v_d2c3c2) {

    return v_3f4e2e.json({ ok: true, ignored: true });
  }
  let v_2f6fcc;
  try {
    v_2f6fcc = v_e10047<AppleTransactionInfo>(v_d2c3c2);
  } catch {
    return v_3f4e2e.json({ ok: false, reason: "tx parse failed" }, 200);
  }

  const v_a1651b = v_3f4e2e.env.DB;

  const v_1ae212 = await v_a1651b
    .prepare(
      `SELECT id, user_id, plan_code, status
         FROM subscriptions
        WHERE platform = 'ios' AND original_tx_id = ? LIMIT 1`,
    )
    .bind(v_2f6fcc.originalTransactionId)
    .first<{ id: number; user_id: number; plan_code: string; status: string }>();
  if (!v_1ae212) {
    console.warn(`[apple-notify] unknown originalTx=${v_2f6fcc.originalTransactionId}`);
    return v_3f4e2e.json({ ok: true, ignored: true, reason: "unknown subscription" });
  }

  const v_67e77e = Date.now();
  if (v_3b27d9 === "DID_RENEW" || (v_3b27d9 === "SUBSCRIBED" && v_f42fae === "RESUBSCRIBE")) {

    const v_01bee9 = v_83773a(v_2f6fcc.productId);
    if (v_01bee9 && v_01bee9.kind === "subscription") {
      const v_4fab5a = `apple:renew:${v_2f6fcc.transactionId}`;
      try {
        await v_a1651b.batch([
          v_a1651b
            .prepare(
              `INSERT INTO credit_ledgers (user_id, amount, type, ref_id, idempotency_key)
                 VALUES (?, ?, 'subscription_grant', ?, ?)`,
            )
            .bind(v_1ae212.user_id, v_01bee9.creditsSec, v_2f6fcc.productId, v_4fab5a),
          v_a1651b
            .prepare(
              `UPDATE users SET credits = credits + ?, credits_sub = credits_sub + ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?`,
            )
            .bind(v_01bee9.creditsSec, v_01bee9.creditsSec, v_1ae212.user_id),
          v_a1651b
            .prepare(
              `UPDATE subscriptions
                  SET status = 'active',
                      current_period_start = ?,
                      current_period_end = ?,
                      updated_at = ?
                WHERE id = ?`,
            )
            .bind(v_2f6fcc.purchaseDate, v_2f6fcc.expiresDate ?? v_67e77e, v_67e77e, v_1ae212.id),
        ]);
      } catch (v_49263d) {
        const v_badeaf = (v_49263d as Error).message ?? "";
        if (!/UNIQUE constraint failed: credit_ledgers/.test(v_badeaf)) throw v_49263d;

      }
    }
  } else if (v_3b27d9 === "REFUND" || v_3b27d9 === "REVOKE") {

    const v_01bee9 = v_83773a(v_2f6fcc.productId);
    if (v_01bee9 && v_01bee9.kind === "subscription") {
      const v_4fab5a = `apple:refund:${v_2f6fcc.transactionId}`;
      try {
        await v_a1651b.batch([
          v_a1651b
            .prepare(
              `INSERT INTO credit_ledgers (user_id, amount, type, ref_id, idempotency_key)
                 VALUES (?, ?, 'refund', ?, ?)`,
            )
            .bind(v_1ae212.user_id, -v_01bee9.creditsSec, v_2f6fcc.productId, v_4fab5a),
          v_a1651b
            .prepare(
              `UPDATE users
                  SET credits = MAX(0, credits - ?),
                      credits_sub = MAX(0, credits_sub - ?),
                      updated_at = CURRENT_TIMESTAMP
                WHERE id = ?`,
            )
            .bind(v_01bee9.creditsSec, v_01bee9.creditsSec, v_1ae212.user_id),
          v_a1651b
            .prepare(`UPDATE subscriptions SET status = 'refunded', updated_at = ? WHERE id = ?`)
            .bind(v_67e77e, v_1ae212.id),
        ]);
      } catch (v_49263d) {
        const v_badeaf = (v_49263d as Error).message ?? "";
        if (!/UNIQUE constraint failed: credit_ledgers/.test(v_badeaf)) throw v_49263d;
      }
    }
  } else if (v_3b27d9 === "EXPIRED" || (v_3b27d9 === "DID_CHANGE_RENEWAL_STATUS" && v_f42fae === "AUTO_RENEW_DISABLED")) {
    await v_a1651b
      .prepare(`UPDATE subscriptions SET status = 'expired', auto_renew = 0, updated_at = ? WHERE id = ?`)
      .bind(v_67e77e, v_1ae212.id)
      .run();
  } else if (v_3b27d9 === "GRACE_PERIOD_EXPIRED") {
    await v_a1651b
      .prepare(`UPDATE subscriptions SET status = 'expired', updated_at = ? WHERE id = ?`)
      .bind(v_67e77e, v_1ae212.id)
      .run();
  } else if (v_3b27d9 === "DID_CHANGE_RENEWAL_STATUS" && v_f42fae === "AUTO_RENEW_ENABLED") {
    await v_a1651b
      .prepare(`UPDATE subscriptions SET auto_renew = 1, updated_at = ? WHERE id = ?`)
      .bind(v_67e77e, v_1ae212.id)
      .run();
  }

  return v_3f4e2e.json({ ok: true, type: v_3b27d9, subtype: v_f42fae });
});

const v_30e8b4 = v_1f4ea7.object({
  message: v_1f4ea7.object({
    data: v_1f4ea7.string().optional(),
    messageId: v_1f4ea7.string().optional(),
  }),
  subscription: v_1f4ea7.string().optional(),
});

interface RtdnPayload {
  version: string;
  packageName: string;
  eventTimeMillis: string;
  subscriptionNotification?: {
    version: string;
    notificationType: number; 
    purchaseToken: string;
    subscriptionId: string;
  };
  oneTimeProductNotification?: {
    version: string;
    notificationType: number; 
    purchaseToken: string;
    sku: string;
  };
  testNotification?: { version: string };
}

v_9e7c53.post("/google-rtdn", async (v_3f4e2e) => {
  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_30e8b4);
  if (!v_4d33b2.message.data) {
    return v_3f4e2e.json({ ok: true, ignored: true });
  }
  let v_931bf0;
  try {
    v_931bf0 = JSON.parse(v_eef514.decode(v_fb5305(v_4d33b2.message.data))) as RtdnPayload;
  } catch {
    return v_3f4e2e.json({ ok: false, reason: "parse failed" }, 200);
  }

  if (v_931bf0.testNotification) {
    console.log("[rtdn] test notification received");
    return v_3f4e2e.json({ ok: true, test: true });
  }

  const v_a1651b = v_3f4e2e.env.DB;
  const v_67e77e = Date.now();

  if (v_931bf0.subscriptionNotification) {
    const v_f4e98d = v_931bf0.subscriptionNotification;
    console.log(`[rtdn] sub notificationType=${v_f4e98d.notificationType} sku=${v_f4e98d.subscriptionId}`);

    let latest: Awaited<ReturnType<typeof v_33874d>> | null = null;
    try {
      v_1300ee = await v_33874d(v_3f4e2e.env, {
        productId: v_f4e98d.subscriptionId,
        purchaseToken: v_f4e98d.purchaseToken,
        kind: "subscription",
      });
    } catch (v_49263d) {
      console.warn(`[rtdn] verifyGoogleTx failed: ${(v_49263d as Error).message}`);
    }

    const v_1ae212 = await v_a1651b
      .prepare(
        `SELECT id, user_id, plan_code FROM subscriptions
          WHERE platform = 'android' AND original_tx_id = ? LIMIT 1`,
      )
      .bind(v_f4e98d.purchaseToken)
      .first<{ id: number; user_id: number; plan_code: string }>();
    if (!v_1ae212) {
      console.warn(`[rtdn] unknown purchaseToken`);
      return v_3f4e2e.json({ ok: true, ignored: true });
    }

    if (v_f4e98d.notificationType === 2 || v_f4e98d.notificationType === 4) {
      const v_01bee9 = v_83773a(v_f4e98d.subscriptionId);
      if (v_01bee9?.kind === "subscription") {
        const v_4fab5a = `google:renew:${v_f4e98d.purchaseToken}:${v_931bf0.eventTimeMillis}`;
        try {
          await v_a1651b.batch([
            v_a1651b
              .prepare(
                `INSERT INTO credit_ledgers (user_id, amount, type, ref_id, idempotency_key)
                   VALUES (?, ?, 'subscription_grant', ?, ?)`,
              )
              .bind(v_1ae212.user_id, v_01bee9.creditsSec, v_f4e98d.subscriptionId, v_4fab5a),
            v_a1651b
              .prepare(
                `UPDATE users SET credits = credits + ?, credits_sub = credits_sub + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
              )
              .bind(v_01bee9.creditsSec, v_01bee9.creditsSec, v_1ae212.user_id),
            v_a1651b
              .prepare(
                `UPDATE subscriptions SET status='active',
                    current_period_start=?, current_period_end=?, updated_at=? WHERE id=?`,
              )
              .bind(
                v_1300ee?.purchaseTime ?? v_67e77e,
                v_1300ee?.expiryTime ?? v_67e77e,
                v_67e77e,
                v_1ae212.id,
              ),
          ]);
        } catch (v_49263d) {
          const v_badeaf = (v_49263d as Error).message ?? "";
          if (!/UNIQUE constraint failed: credit_ledgers/.test(v_badeaf)) throw v_49263d;
        }
      }
    } else if (v_f4e98d.notificationType === 12 || v_f4e98d.notificationType === 3) {

      if (v_f4e98d.notificationType === 12) {

        const v_01bee9 = v_83773a(v_f4e98d.subscriptionId);
        if (v_01bee9?.kind === "subscription") {
          const v_4fab5a = `google:refund:${v_f4e98d.purchaseToken}:${v_931bf0.eventTimeMillis}`;
          try {
            await v_a1651b.batch([
              v_a1651b
                .prepare(
                  `INSERT INTO credit_ledgers (user_id, amount, type, ref_id, idempotency_key)
                     VALUES (?, ?, 'refund', ?, ?)`,
                )
                .bind(v_1ae212.user_id, -v_01bee9.creditsSec, v_f4e98d.subscriptionId, v_4fab5a),
              v_a1651b
                .prepare(
                  `UPDATE users SET credits=MAX(0, credits - ?), credits_sub=MAX(0, credits_sub - ?),
                      updated_at=CURRENT_TIMESTAMP WHERE id=?`,
                )
                .bind(v_01bee9.creditsSec, v_01bee9.creditsSec, v_1ae212.user_id),
            ]);
          } catch (v_49263d) {
            const v_badeaf = (v_49263d as Error).message ?? "";
            if (!/UNIQUE constraint failed: credit_ledgers/.test(v_badeaf)) throw v_49263d;
          }
        }
        await v_a1651b
          .prepare(`UPDATE subscriptions SET status='refunded', updated_at=? WHERE id=?`)
          .bind(v_67e77e, v_1ae212.id)
          .run();
      } else {

        await v_a1651b
          .prepare(`UPDATE subscriptions SET auto_renew=0, updated_at=? WHERE id=?`)
          .bind(v_67e77e, v_1ae212.id)
          .run();
      }
    } else if (v_f4e98d.notificationType === 13) {

      await v_a1651b
        .prepare(`UPDATE subscriptions SET status='expired', updated_at=? WHERE id=?`)
        .bind(v_67e77e, v_1ae212.id)
        .run();
    }
  } else if (v_931bf0.oneTimeProductNotification) {

    console.log(`[rtdn] oneTime type=${v_931bf0.oneTimeProductNotification.notificationType} sku=${v_931bf0.oneTimeProductNotification.sku}`);

  }

  return v_3f4e2e.json({ ok: true });
});
