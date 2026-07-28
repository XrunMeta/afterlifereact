

import { Hono } from "hono";
import type { AppEnv } from "../lib/env";
import { APIError } from "../lib/errors";
import { parseJson, z } from "../lib/validate";
import { lookupProduct } from "../lib/iapProducts";
import { verifyGooglePlayTransaction } from "../lib/googlePlayIap";

export const iapWebhooks = new Hono<AppEnv>();

iapWebhooks.get("/health", (c) => c.json({ ok: true, module: "iap-webhooks" }));

function b64urlDecode(str: string): Uint8Array {
  const pad = str.length % 4 ? 4 - (str.length % 4) : 0;
  const b64 = (str + "=".repeat(pad)).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
const dec = new TextDecoder();

function parseJws<T>(jws: string): T {
  const parts = jws.split(".");
  if (parts.length !== 3) throw new APIError("VALIDATION_FAILED", "Malformed JWS.");
  return JSON.parse(dec.decode(b64urlDecode(parts[1]!))) as T;
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

iapWebhooks.post("/apple-notifications", async (c) => {
  const body = (await c.req.json().catch(() => null)) as { signedPayload?: string } | null;
  if (!body?.signedPayload) {

    return c.json({ ok: false, reason: "missing signedPayload" }, 200);
  }

  let payload: AppleNotificationPayload;
  try {
    payload = parseJws<AppleNotificationPayload>(body.signedPayload);
  } catch (err) {
    return c.json({ ok: false, reason: "parse failed" }, 200);
  }

  const type = payload.notificationType;
  const subtype = payload.subtype;
  console.log(`[apple-notify] ${type}/${subtype ?? '-'}`);

  const txJws = payload.data?.signedTransactionInfo;
  if (!txJws) {

    return c.json({ ok: true, ignored: true });
  }
  let tx: AppleTransactionInfo;
  try {
    tx = parseJws<AppleTransactionInfo>(txJws);
  } catch {
    return c.json({ ok: false, reason: "tx parse failed" }, 200);
  }

  const db = c.env.DB;

  const sub = await db
    .prepare(
      `SELECT id, user_id, plan_code, status
         FROM subscriptions
        WHERE platform = 'ios' AND original_tx_id = ? LIMIT 1`,
    )
    .bind(tx.originalTransactionId)
    .first<{ id: number; user_id: number; plan_code: string; status: string }>();
  if (!sub) {
    console.warn(`[apple-notify] unknown originalTx=${tx.originalTransactionId}`);
    return c.json({ ok: true, ignored: true, reason: "unknown subscription" });
  }

  const nowMs = Date.now();
  if (type === "DID_RENEW" || (type === "SUBSCRIBED" && subtype === "RESUBSCRIBE")) {

    const product = lookupProduct(tx.productId);
    if (product && product.kind === "subscription") {
      const idem = `apple:renew:${tx.transactionId}`;
      try {
        await db.batch([
          db
            .prepare(
              `INSERT INTO credit_ledgers (user_id, amount, type, ref_id, idempotency_key)
                 VALUES (?, ?, 'subscription_grant', ?, ?)`,
            )
            .bind(sub.user_id, product.creditsSec, tx.productId, idem),
          db
            .prepare(
              `UPDATE users SET credits = credits + ?, credits_sub = credits_sub + ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?`,
            )
            .bind(product.creditsSec, product.creditsSec, sub.user_id),
          db
            .prepare(
              `UPDATE subscriptions
                  SET status = 'active',
                      current_period_start = ?,
                      current_period_end = ?,
                      updated_at = ?
                WHERE id = ?`,
            )
            .bind(tx.purchaseDate, tx.expiresDate ?? nowMs, nowMs, sub.id),
        ]);
      } catch (err) {
        const msg = (err as Error).message ?? "";
        if (!/UNIQUE constraint failed: credit_ledgers/.test(msg)) throw err;

      }
    }
  } else if (type === "REFUND" || type === "REVOKE") {

    const product = lookupProduct(tx.productId);
    if (product && product.kind === "subscription") {
      const idem = `apple:refund:${tx.transactionId}`;
      try {
        await db.batch([
          db
            .prepare(
              `INSERT INTO credit_ledgers (user_id, amount, type, ref_id, idempotency_key)
                 VALUES (?, ?, 'refund', ?, ?)`,
            )
            .bind(sub.user_id, -product.creditsSec, tx.productId, idem),
          db
            .prepare(
              `UPDATE users
                  SET credits = MAX(0, credits - ?),
                      credits_sub = MAX(0, credits_sub - ?),
                      updated_at = CURRENT_TIMESTAMP
                WHERE id = ?`,
            )
            .bind(product.creditsSec, product.creditsSec, sub.user_id),
          db
            .prepare(`UPDATE subscriptions SET status = 'refunded', updated_at = ? WHERE id = ?`)
            .bind(nowMs, sub.id),
        ]);
      } catch (err) {
        const msg = (err as Error).message ?? "";
        if (!/UNIQUE constraint failed: credit_ledgers/.test(msg)) throw err;
      }
    }
  } else if (type === "EXPIRED" || (type === "DID_CHANGE_RENEWAL_STATUS" && subtype === "AUTO_RENEW_DISABLED")) {
    await db
      .prepare(`UPDATE subscriptions SET status = 'expired', auto_renew = 0, updated_at = ? WHERE id = ?`)
      .bind(nowMs, sub.id)
      .run();
  } else if (type === "GRACE_PERIOD_EXPIRED") {
    await db
      .prepare(`UPDATE subscriptions SET status = 'expired', updated_at = ? WHERE id = ?`)
      .bind(nowMs, sub.id)
      .run();
  } else if (type === "DID_CHANGE_RENEWAL_STATUS" && subtype === "AUTO_RENEW_ENABLED") {
    await db
      .prepare(`UPDATE subscriptions SET auto_renew = 1, updated_at = ? WHERE id = ?`)
      .bind(nowMs, sub.id)
      .run();
  }

  return c.json({ ok: true, type, subtype });
});

const rtdnMessageSchema = z.object({
  message: z.object({
    data: z.string().optional(),
    messageId: z.string().optional(),
  }),
  subscription: z.string().optional(),
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

iapWebhooks.post("/google-rtdn", async (c) => {
  const body = await parseJson(c, rtdnMessageSchema);
  if (!body.message.data) {
    return c.json({ ok: true, ignored: true });
  }
  let payload: RtdnPayload;
  try {
    payload = JSON.parse(dec.decode(b64urlDecode(body.message.data))) as RtdnPayload;
  } catch {
    return c.json({ ok: false, reason: "parse failed" }, 200);
  }

  if (payload.testNotification) {
    console.log("[rtdn] test notification received");
    return c.json({ ok: true, test: true });
  }

  const db = c.env.DB;
  const nowMs = Date.now();

  if (payload.subscriptionNotification) {
    const n = payload.subscriptionNotification;
    console.log(`[rtdn] sub notificationType=${n.notificationType} sku=${n.subscriptionId}`);

    let latest: Awaited<ReturnType<typeof verifyGooglePlayTransaction>> | null = null;
    try {
      latest = await verifyGooglePlayTransaction(c.env, {
        productId: n.subscriptionId,
        purchaseToken: n.purchaseToken,
        kind: "subscription",
      });
    } catch (err) {
      console.warn(`[rtdn] verifyGoogleTx failed: ${(err as Error).message}`);
    }

    const sub = await db
      .prepare(
        `SELECT id, user_id, plan_code FROM subscriptions
          WHERE platform = 'android' AND original_tx_id = ? LIMIT 1`,
      )
      .bind(n.purchaseToken)
      .first<{ id: number; user_id: number; plan_code: string }>();
    if (!sub) {
      console.warn(`[rtdn] unknown purchaseToken`);
      return c.json({ ok: true, ignored: true });
    }

    if (n.notificationType === 2 || n.notificationType === 4) {
      const product = lookupProduct(n.subscriptionId);
      if (product?.kind === "subscription") {
        const idem = `google:renew:${n.purchaseToken}:${payload.eventTimeMillis}`;
        try {
          await db.batch([
            db
              .prepare(
                `INSERT INTO credit_ledgers (user_id, amount, type, ref_id, idempotency_key)
                   VALUES (?, ?, 'subscription_grant', ?, ?)`,
              )
              .bind(sub.user_id, product.creditsSec, n.subscriptionId, idem),
            db
              .prepare(
                `UPDATE users SET credits = credits + ?, credits_sub = credits_sub + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
              )
              .bind(product.creditsSec, product.creditsSec, sub.user_id),
            db
              .prepare(
                `UPDATE subscriptions SET status='active',
                    current_period_start=?, current_period_end=?, updated_at=? WHERE id=?`,
              )
              .bind(
                latest?.purchaseTime ?? nowMs,
                latest?.expiryTime ?? nowMs,
                nowMs,
                sub.id,
              ),
          ]);
        } catch (err) {
          const msg = (err as Error).message ?? "";
          if (!/UNIQUE constraint failed: credit_ledgers/.test(msg)) throw err;
        }
      }
    } else if (n.notificationType === 12 || n.notificationType === 3) {

      if (n.notificationType === 12) {

        const product = lookupProduct(n.subscriptionId);
        if (product?.kind === "subscription") {
          const idem = `google:refund:${n.purchaseToken}:${payload.eventTimeMillis}`;
          try {
            await db.batch([
              db
                .prepare(
                  `INSERT INTO credit_ledgers (user_id, amount, type, ref_id, idempotency_key)
                     VALUES (?, ?, 'refund', ?, ?)`,
                )
                .bind(sub.user_id, -product.creditsSec, n.subscriptionId, idem),
              db
                .prepare(
                  `UPDATE users SET credits=MAX(0, credits - ?), credits_sub=MAX(0, credits_sub - ?),
                      updated_at=CURRENT_TIMESTAMP WHERE id=?`,
                )
                .bind(product.creditsSec, product.creditsSec, sub.user_id),
            ]);
          } catch (err) {
            const msg = (err as Error).message ?? "";
            if (!/UNIQUE constraint failed: credit_ledgers/.test(msg)) throw err;
          }
        }
        await db
          .prepare(`UPDATE subscriptions SET status='refunded', updated_at=? WHERE id=?`)
          .bind(nowMs, sub.id)
          .run();
      } else {

        await db
          .prepare(`UPDATE subscriptions SET auto_renew=0, updated_at=? WHERE id=?`)
          .bind(nowMs, sub.id)
          .run();
      }
    } else if (n.notificationType === 13) {

      await db
        .prepare(`UPDATE subscriptions SET status='expired', updated_at=? WHERE id=?`)
        .bind(nowMs, sub.id)
        .run();
    }
  } else if (payload.oneTimeProductNotification) {

    console.log(`[rtdn] oneTime type=${payload.oneTimeProductNotification.notificationType} sku=${payload.oneTimeProductNotification.sku}`);

  }

  return c.json({ ok: true });
});
