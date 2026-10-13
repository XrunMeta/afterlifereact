

import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_4c95c2, v_1f4ea7 } from "../lib/validate";
import { v_3ebe58 } from "../lib/errors";
import { v_0edc13 } from "../lib/appConfig";
import { v_74defc } from "../lib/logger";

export const v_62a1b6 = new v_b7c41b<v_de0a25>();

v_62a1b6.use("*", async (v_3f4e2e, v_a448ad) => {
  const v_505a6d = v_3f4e2e.env.XRUN_BRIDGE_SECRET;
  if (!v_505a6d) {
    throw new v_3ebe58("UNAUTHENTICATED", "XRUN bridge disabled (secret 미설정)");
  }
  const v_df0713 = v_3f4e2e.req.header("X-Xrun-Bridge-Secret");
  if (!v_df0713 || v_df0713 !== v_505a6d) {
    throw new v_3ebe58("UNAUTHENTICATED", "XRUN bridge secret 불일치");
  }
  await v_a448ad();
});

async function v_ce5ee9(
  v_a1651b,
  v_b4e012,
): Promise<{ id: number } | null> {
  const v_e0c7e8 = v_b4e012.trim().toLowerCase();
  if (!v_e0c7e8 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v_e0c7e8)) return null;
  const v_3ac7e7 = await v_a1651b
    .prepare(`SELECT id FROM users WHERE LOWER(email) = ? AND deleted_at IS NULL LIMIT 1`)
    .bind(v_e0c7e8)
    .first<{ id: number }>();
  return v_3ac7e7 ?? null;
}

function v_c19d94(v_8c0b26): number {
  return typeof v_8c0b26.xrunPrice === "number" && v_8c0b26.xrunPrice > 0
    ? v_8c0b26.xrunPrice * 60
    : v_8c0b26.price;
}

v_62a1b6.get("/received-gifts", async (v_3f4e2e) => {
  const v_e0c7e8 = v_3f4e2e.req.query("email") ?? "";
  const v_625c74 = await v_ce5ee9(v_3f4e2e.env.DB, v_e0c7e8);
  if (!v_625c74) {
    return v_3f4e2e.json({ items: [], userFound: false });
  }
  const v_18b8bf = await v_3f4e2e.env.DB
    .prepare(
      `SELECT gift_id, count, total_received
         FROM user_gift_inventory
        WHERE user_id = ? AND count > 0
        ORDER BY updated_at DESC`,
    )
    .bind(v_625c74.id)
    .all<{ gift_id: string; count: number; total_received: number }>();

  const v_dbebe7 = await v_0edc13(v_3f4e2e.env);
  const v_6413c7 = new Map(v_dbebe7.map((v_206b88) => [v_206b88.id, v_206b88]));

  const v_4622b9 = (v_18b8bf.results ?? []).map((v_cb35cb) => {
    const v_ab4c96 = v_6413c7.get(v_cb35cb.gift_id) as any;
    const v_4547b1 = v_ab4c96 ? v_c19d94(v_ab4c96) : 0;

    const v_b39525 = v_4547b1 / 60;
    return {
      giftId: v_cb35cb.gift_id,
      name: v_ab4c96?.name ?? v_cb35cb.gift_id,
      emoji: v_ab4c96?.emoji ?? "🎁",
      imageUrl: v_ab4c96?.imageUrl ?? null,
      count: v_cb35cb.count,
      totalReceived: v_cb35cb.total_received,
      xrunPerItem: v_b39525, 
    };
  });

  return v_3f4e2e.json({ items: v_4622b9, userFound: true });
});

const v_520523 = 11; 
const v_ecb35d = 0.1; 

const v_597473 = v_1f4ea7.object({
  email: v_1f4ea7.string().email(),
  giftId: v_1f4ea7.string().min(1).max(80),
  adToken: v_1f4ea7.string().max(2048).optional(),
});

v_62a1b6.post("/redeem-with-ad", async (v_3f4e2e) => {
  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_597473);
  const v_625c74 = await v_ce5ee9(v_3f4e2e.env.DB, v_4d33b2.email);
  if (!v_625c74) throw new v_3ebe58("NOT_FOUND", "회원 매칭 실패 (이메일)");

  const v_dbebe7 = await v_0edc13(v_3f4e2e.env);
  const v_8c0b26 = (v_dbebe7 as any[]).find((v_206b88) => v_206b88.id === v_4d33b2.giftId);
  if (!v_8c0b26) throw new v_3ebe58("NOT_FOUND", `선물 '${v_4d33b2.giftId}' 없음`);

  const v_eef514 = await v_3f4e2e.env.DB
    .prepare(
      `UPDATE user_gift_inventory
          SET count = count - ?, updated_at = strftime('%s','now')
        WHERE user_id = ? AND gift_id = ? AND count >= ?`,
    )
    .bind(v_520523, v_625c74.id, v_4d33b2.giftId, v_520523)
    .run();
  if ((v_eef514.meta?.changes ?? 0) === 0) {
    throw new v_3ebe58("VALIDATION_FAILED", `교환은 ${v_520523}개부터 가능해요`);
  }

  const v_b291d9 = Math.round(v_ecb35d * 100); 
  const v_5097fd = (v_8c0b26 as any).name ?? v_4d33b2.giftId;
  const v_56896b = (v_8c0b26 as any).emoji ?? "🎁";
  const v_92e7a1 = (v_8c0b26 as any).imageUrl ?? null;
  await v_3f4e2e.env.DB
    .prepare(
      `INSERT INTO gift_inventory_events (user_id, counterpart_user_id, gift_id, count, xrun_amount, kind, ref_id,
                                           clone_id, gift_name_snapshot, gift_emoji_snapshot, gift_image_url_snapshot)
         VALUES (?, NULL, ?, ?, ?, 'exchanged', ?, NULL, ?, ?, ?)`,
    )
    .bind(v_625c74.id, v_4d33b2.giftId, v_520523, v_b291d9, `xrun-bridge-ad:${Date.now()}`,
          v_5097fd, v_56896b, v_92e7a1)
    .run();

  console.log(`[xrun-bridge] redeem OK email=${v_4d33b2.email} giftId=${v_4d33b2.giftId} burned=${v_520523} payout=${v_ecb35d}XRUN — attendance debit TODO`);

  await v_74defc(v_3f4e2e, {
    userId: v_625c74.id,
    action: "gift.xrun_bridge_redeem",
    details: { giftId: v_4d33b2.giftId, burned: v_520523, xrunPayout: v_ecb35d, via: "pangle_ad" },
  });

  return v_3f4e2e.json({
    ok: true,
    giftId: v_4d33b2.giftId,
    burned: v_520523,          
    xrunAmount: v_ecb35d, 
  });
});
