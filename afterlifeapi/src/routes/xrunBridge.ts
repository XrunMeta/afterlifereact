

import { Hono } from "hono";
import type { AppEnv } from "../lib/env";
import { parseJson, z } from "../lib/validate";
import { APIError } from "../lib/errors";
import { getGiftCatalog } from "../lib/appConfig";
import { logActivity } from "../lib/logger";

export const xrunBridge = new Hono<AppEnv>();

xrunBridge.use("*", async (c, next) => {
  const expected = c.env.XRUN_BRIDGE_SECRET;
  if (!expected) {
    throw new APIError("UNAUTHENTICATED", "XRUN bridge disabled (secret 미설정)");
  }
  const got = c.req.header("X-Xrun-Bridge-Secret");
  if (!got || got !== expected) {
    throw new APIError("UNAUTHENTICATED", "XRUN bridge secret 불일치");
  }
  await next();
});

async function findUserByEmail(
  db: D1Database,
  emailRaw: string,
): Promise<{ id: number } | null> {
  const email = emailRaw.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  const row = await db
    .prepare(`SELECT id FROM users WHERE LOWER(email) = ? AND deleted_at IS NULL LIMIT 1`)
    .bind(email)
    .first<{ id: number }>();
  return row ?? null;
}

function catalogPriceCredits(item: any): number {
  return typeof item.xrunPrice === "number" && item.xrunPrice > 0
    ? item.xrunPrice * 60
    : item.price;
}

xrunBridge.get("/received-gifts", async (c) => {
  const email = c.req.query("email") ?? "";
  const user = await findUserByEmail(c.env.DB, email);
  if (!user) {
    return c.json({ items: [], userFound: false });
  }
  const rows = await c.env.DB
    .prepare(
      `SELECT gift_id, count, total_received
         FROM user_gift_inventory
        WHERE user_id = ? AND count > 0
        ORDER BY updated_at DESC`,
    )
    .bind(user.id)
    .all<{ gift_id: string; count: number; total_received: number }>();

  const catalog = await getGiftCatalog(c.env);
  const catalogMap = new Map(catalog.map((g: any) => [g.id, g]));

  const items = (rows.results ?? []).map((r) => {
    const meta = catalogMap.get(r.gift_id) as any;
    const priceCredits = meta ? catalogPriceCredits(meta) : 0;

    const xrunPerItem = priceCredits / 60;
    return {
      giftId: r.gift_id,
      name: meta?.name ?? r.gift_id,
      emoji: meta?.emoji ?? "🎁",
      imageUrl: meta?.imageUrl ?? null,
      count: r.count,
      totalReceived: r.total_received,
      xrunPerItem, 
    };
  });

  return c.json({ items, userFound: true });
});

const redeemSchema = z.object({
  email: z.string().email(),
  giftId: z.string().min(1).max(80),
  adToken: z.string().max(2048).optional(),
});

xrunBridge.post("/redeem-with-ad", async (c) => {
  const body = await parseJson(c, redeemSchema);
  const user = await findUserByEmail(c.env.DB, body.email);
  if (!user) throw new APIError("NOT_FOUND", "회원 매칭 실패 (이메일)");

  const catalog = await getGiftCatalog(c.env);
  const item = (catalog as any[]).find((g: any) => g.id === body.giftId);
  if (!item) throw new APIError("NOT_FOUND", `선물 '${body.giftId}' 없음`);
  const priceCredits = catalogPriceCredits(item);
  if (!(priceCredits > 0)) {
    throw new APIError("VALIDATION_FAILED", "선물 가격 0 — 교환 불가");
  }

  const dec = await c.env.DB
    .prepare(
      `UPDATE user_gift_inventory
          SET count = count - 1, updated_at = strftime('%s','now')
        WHERE user_id = ? AND gift_id = ? AND count >= 1`,
    )
    .bind(user.id, body.giftId)
    .run();
  if ((dec.meta?.changes ?? 0) === 0) {
    throw new APIError("VALIDATION_FAILED", "받은 선물 재고가 없어요");
  }

  try {
    const upd = await c.env.DB
      .prepare(
        `UPDATE users SET credits_gift = credits_gift + ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND deleted_at IS NULL`,
      )
      .bind(priceCredits, user.id)
      .run();
    if ((upd.meta?.changes ?? 0) === 0) throw new Error("credits_gift 갱신 실패");
  } catch (err) {
    await c.env.DB
      .prepare(
        `UPDATE user_gift_inventory SET count = count + 1, updated_at = strftime('%s','now')
           WHERE user_id = ? AND gift_id = ?`,
      )
      .bind(user.id, body.giftId)
      .run();
    throw err;
  }

  await c.env.DB
    .prepare(
      `INSERT INTO gift_inventory_events (user_id, counterpart_user_id, gift_id, count, xrun_amount, kind, ref_id)
         VALUES (?, NULL, ?, 1, ?, 'swapped', ?)`,
    )
    .bind(user.id, body.giftId, priceCredits, `xrun-bridge-ad:${Date.now()}`)
    .run();

  await logActivity(c, {
    userId: user.id,
    action: "gift.xrun_bridge_redeem",
    details: { giftId: body.giftId, xrunAmount: priceCredits, via: "pangle_ad" },
  });

  return c.json({
    ok: true,
    giftId: body.giftId,
    xrunCredited: priceCredits, 
    xrunAmount: priceCredits / 60,
  });
});
