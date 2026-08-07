

import { Hono } from "hono";
import type { AppEnv } from "../lib/env";
import { parseJson, z } from "../lib/validate";
import { requireAuth } from "../middleware/auth";
import { requireIdempotencyKey } from "../middleware/idempotency";
import { APIError } from "../lib/errors";
import { spend, grant } from "../lib/credits";
import { getGiftCatalog } from "../lib/appConfig";
import { logActivity } from "../lib/logger";

export const giftInventory = new Hono<AppEnv>();

const sendSchema = z.object({
  giftId: z.string().min(1).max(80),
  toUserId: z.number().int().positive(),

  cloneId: z.number().int().positive().optional(),
});

giftInventory.post(
  "/send-offchain",
  requireAuth,
  requireIdempotencyKey("gifts.send"),
  async (c) => {
    const senderId = c.get("userId")!;
    const body = await parseJson(c, sendSchema);
    const idemKey = c.req.header("X-Idempotency-Key")!;

    if (body.toUserId === senderId) {
      throw new APIError("VALIDATION_FAILED", "자기 자신에게 선물할 수 없어요.");
    }

    const catalog = await getGiftCatalog(c.env);
    const item = catalog.find((g) => g.id === body.giftId);
    if (!item) throw new APIError("NOT_FOUND", `선물 '${body.giftId}' 없음`);
    if (item.price <= 0 || !Number.isInteger(item.price)) {
      throw new APIError("VALIDATION_FAILED", "선물 가격 설정이 잘못됐어요.");
    }

    const receiver = await c.env.DB
      .prepare(`SELECT id FROM users WHERE id = ? AND deleted_at IS NULL`)
      .bind(body.toUserId)
      .first<{ id: number }>();
    if (!receiver) throw new APIError("NOT_FOUND", "받을 사용자를 찾을 수 없어요.");

    try {
      await spend(c, {
        userId: senderId,
        amount: item.price,
        type: "gift",
        refId: `send:${body.giftId}:to=${body.toUserId}`,
        idempotencyKey: idemKey,
      });
    } catch (err) {
      if ((err as APIError).code === "INSUFFICIENT_CREDITS") {
        throw new APIError("INSUFFICIENT_CREDITS", "XRUN 잔액이 부족해요.");
      }
      throw err;
    }

    if (body.cloneId) {
      try {
        const cloneRow = await c.env.DB
          .prepare(`SELECT owner_id FROM clones WHERE id = ?`)
          .bind(body.cloneId)
          .first<{ owner_id: number }>();

        if (cloneRow && cloneRow.owner_id === body.toUserId) {
          await c.env.DB
            .prepare(
              `INSERT INTO gift_logs (
                 sender_user_id, clone_id, owner_user_id, gift_id, gift_name,
                 total_amount, company_amount, owner_amount, company_address, status, completed_at
               ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, 'offchain', 'sent', CURRENT_TIMESTAMP)`,
            )
            .bind(
              senderId,
              body.cloneId,
              body.toUserId,
              body.giftId,
              item.name,
              item.price,
              item.price,
            )
            .run();
        }
      } catch (err) {

        console.warn("[gift.send-offchain] gift_logs INSERT skipped:", err);
      }
    }

    await c.env.DB.batch([
      c.env.DB
        .prepare(
          `INSERT INTO user_gift_inventory (user_id, gift_id, count, total_received, updated_at)
             VALUES (?, ?, 1, 1, strftime('%s','now'))
           ON CONFLICT(user_id, gift_id) DO UPDATE SET
             count = count + 1,
             total_received = total_received + 1,
             updated_at = strftime('%s','now')`,
        )
        .bind(body.toUserId, body.giftId),

      c.env.DB
        .prepare(
          `INSERT INTO gift_inventory_events (user_id, counterpart_user_id, gift_id, count, xrun_amount, kind, ref_id)
             VALUES (?, ?, ?, 1, ?, 'sent', ?)`,
        )
        .bind(senderId, body.toUserId, body.giftId, item.price, idemKey),
      c.env.DB
        .prepare(
          `INSERT INTO gift_inventory_events (user_id, counterpart_user_id, gift_id, count, xrun_amount, kind, ref_id)
             VALUES (?, ?, ?, 1, ?, 'received', ?)`,
        )
        .bind(body.toUserId, senderId, body.giftId, item.price, idemKey),
    ]);

    await logActivity(c, {
      userId: senderId,
      action: "gift.sent_offchain",
      details: { giftId: body.giftId, toUserId: body.toUserId, xrunAmount: item.price },
    });

    return c.json({
      ok: true,
      giftId: body.giftId,
      xrunAmount: item.price,
      receiverId: body.toUserId,
    });
  },
);

giftInventory.get("/inventory", requireAuth, async (c) => {
  const userId = c.get("userId")!;
  const rows = await c.env.DB
    .prepare(
      `SELECT gift_id, count, total_received
         FROM user_gift_inventory
        WHERE user_id = ? AND count > 0
        ORDER BY updated_at DESC`,
    )
    .bind(userId)
    .all<{ gift_id: string; count: number; total_received: number }>();

  const catalog = await getGiftCatalog(c.env);
  const catalogMap = new Map(catalog.map((g) => [g.id, g]));

  const items = (rows.results ?? []).map((r) => {
    const meta = catalogMap.get(r.gift_id);
    return {
      giftId: r.gift_id,
      name: meta?.name ?? r.gift_id,
      emoji: meta?.emoji ?? "🎁",
      imageUrl: meta?.imageUrl,
      xrunPerItem: meta?.price ?? 0,       
      count: r.count,
      totalReceived: r.total_received,
      xrunTotal: (meta?.price ?? 0) * r.count,  
    };
  });

  return c.json({ items });
});

const swapSchema = z.object({
  giftId: z.string().min(1).max(80),
  count: z.number().int().positive().max(10_000),
});

giftInventory.post(
  "/swap",
  requireAuth,
  requireIdempotencyKey("gifts.swap"),
  async (c) => {
    const userId = c.get("userId")!;
    const body = await parseJson(c, swapSchema);
    const idemKey = c.req.header("X-Idempotency-Key")!;

    const catalog = await getGiftCatalog(c.env);
    const item = catalog.find((g) => g.id === body.giftId);
    if (!item) throw new APIError("NOT_FOUND", `선물 '${body.giftId}' 없음`);
    if (item.price <= 0) throw new APIError("VALIDATION_FAILED", "선물 가격이 0 이라 교환 불가.");

    const xrunTotal = item.price * body.count;

    const decRes = await c.env.DB
      .prepare(
        `UPDATE user_gift_inventory
            SET count = count - ?, updated_at = strftime('%s','now')
          WHERE user_id = ? AND gift_id = ? AND count >= ?`,
      )
      .bind(body.count, userId, body.giftId, body.count)
      .run();
    if ((decRes.meta?.changes ?? 0) === 0) {
      throw new APIError("VALIDATION_FAILED", "인벤토리에 해당 선물이 부족해요.");
    }

    try {
      await grant(c, {
        userId,
        amount: xrunTotal,
        type: "gift",
        refId: `swap:${body.giftId}:count=${body.count}`,
        idempotencyKey: idemKey,
      });
    } catch (err) {

      await c.env.DB
        .prepare(
          `UPDATE user_gift_inventory SET count = count + ?, updated_at = strftime('%s','now')
             WHERE user_id = ? AND gift_id = ?`,
        )
        .bind(body.count, userId, body.giftId)
        .run();
      throw err;
    }

    await c.env.DB
      .prepare(
        `INSERT INTO gift_inventory_events (user_id, counterpart_user_id, gift_id, count, xrun_amount, kind, ref_id)
           VALUES (?, NULL, ?, ?, ?, 'swapped', ?)`,
      )
      .bind(userId, body.giftId, body.count, xrunTotal, idemKey)
      .run();

    await logActivity(c, {
      userId,
      action: "gift.swapped",
      details: { giftId: body.giftId, count: body.count, xrunAmount: xrunTotal },
    });

    return c.json({
      ok: true,
      giftId: body.giftId,
      count: body.count,
      xrunCredited: xrunTotal,
    });
  },
);
