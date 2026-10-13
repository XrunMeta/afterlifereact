

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

  const v_37b6fa = await v_3f4e2e.env.DB
    .prepare(
      `SELECT gift_id, count_remaining, xrun_price_snapshot
         FROM user_gift_lots
        WHERE user_id = ? AND count_remaining > 0
        ORDER BY gift_id, received_at ASC, id ASC`,
    )
    .bind(v_625c74.id)
    .all<{ gift_id: string; count_remaining: number; xrun_price_snapshot: number }>();
  const v_b16486 = new Map<string, { count: number; price: number }[]>();
  for (const v_1614db of v_37b6fa.results ?? []) {
    const v_d0c056 = v_b16486.get(v_1614db.gift_id) ?? [];
    v_d0c056.push({ count: Number(v_1614db.count_remaining), price: Number(v_1614db.xrun_price_snapshot) });
    v_b16486.set(v_1614db.gift_id, v_d0c056);
  }

  const v_520523 = 11;

  let v_2cb731 = 0;
  for (const [, v_d0c056] of v_b16486) {
    for (const v_41d9f0 of v_d0c056) v_2cb731 += v_41d9f0.count * v_41d9f0.price;
  }
  v_2cb731 = Number(v_2cb731.toFixed(8));

  const v_4622b9 = (v_18b8bf.results ?? []).map((v_cb35cb) => {
    const v_ab4c96 = v_6413c7.get(v_cb35cb.gift_id) as any;
    const v_4547b1 = v_ab4c96 ? v_c19d94(v_ab4c96) : 0;
    const v_b39525 = v_4547b1 / 60; 

    const v_9fdb66 = v_b16486.get(v_cb35cb.gift_id) ?? [];
    let v_d2d720 = v_520523;
    const v_065369 = [];
    for (const v_41d9f0 of v_9fdb66) {
      if (v_d2d720 === 0) break;
      const v_04326c = Math.min(v_d2d720, v_41d9f0.count);
      for (let v_ebec57 = 0; v_ebec57 < v_04326c; v_ebec57++) v_065369.push(v_41d9f0.price);
      v_d2d720 -= v_04326c;
    }

    const v_16efc3 = v_065369.length >= v_520523
      ? Number((v_065369.slice(0, v_520523 - 1).reduce((v_779914, v_148ff6) => v_779914 + v_148ff6, 0)).toFixed(8))
      : null;
    const v_22ecbb = v_065369.length >= v_520523
      ? Number((v_065369[v_520523 - 1] ?? 0).toFixed(8))
      : null;

    return {
      giftId: v_cb35cb.gift_id,
      name: v_ab4c96?.name ?? v_cb35cb.gift_id,
      emoji: v_ab4c96?.emoji ?? "🎁",
      imageUrl: v_ab4c96?.imageUrl ?? null,
      count: v_cb35cb.count,
      totalReceived: v_cb35cb.total_received,
      xrunPerItem: v_b39525,           
      nextRedeemPayout: v_16efc3,      
      nextRedeemFee: v_22ecbb,         
      exchangeUnit: v_520523,
    };
  });

  return v_3f4e2e.json({ items: v_4622b9, userFound: true, totalBagValue: v_2cb731, exchangeUnit: v_520523 });
});

const v_520523 = 11; 
const v_567ea6 = v_520523 - 1; 
const v_cd14b0 = 0.01; 

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

  const v_37b6fa = await v_3f4e2e.env.DB
    .prepare(
      `SELECT id, count_remaining, xrun_price_snapshot
         FROM user_gift_lots
        WHERE user_id = ? AND gift_id = ? AND count_remaining > 0
        ORDER BY received_at ASC, id ASC`,
    )
    .bind(v_625c74.id, v_4d33b2.giftId)
    .all<{ id: number; count_remaining: number; xrun_price_snapshot: number }>();
  const v_9fdb66 = v_37b6fa.results ?? [];
  const v_df2ccf = v_9fdb66.reduce((v_fd5f43, v_1614db) => v_fd5f43 + Number(v_1614db.count_remaining), 0);
  if (v_df2ccf < v_520523) {
    throw new v_3ebe58("VALIDATION_FAILED", `교환은 ${v_520523}개부터 가능해요`);
  }

  let v_d2d720 = v_520523;
  const v_065369 = []; 
  const v_8839ce = [];
  for (const v_41d9f0 of v_9fdb66) {
    if (v_d2d720 === 0) break;
    const v_04326c = Math.min(v_d2d720, Number(v_41d9f0.count_remaining));
    const v_6bbb57 = Number(v_41d9f0.xrun_price_snapshot) || v_cd14b0;
    for (let v_ebec57 = 0; v_ebec57 < v_04326c; v_ebec57++) v_065369.push(v_6bbb57);
    v_8839ce.push({ id: v_41d9f0.id, take: v_04326c });
    v_d2d720 -= v_04326c;
  }
  if (v_d2d720 > 0) {
    throw new v_3ebe58("VALIDATION_FAILED", `교환은 ${v_520523}개부터 가능해요`);
  }

  const v_d99192 = v_065369.reduce((v_779914, v_148ff6) => v_779914 + v_148ff6, 0);
  const v_07001a = v_065369[v_065369.length - 1] ?? 0;
  const v_f8f913 = Number((v_d99192 - v_07001a).toFixed(8));
  const v_e57e5c = v_065369[0] ?? v_cd14b0; 

  const v_fb1c1c = [];
  for (const v_ceb55a of v_8839ce) {
    v_fb1c1c.push(
      v_3f4e2e.env.DB
        .prepare(
          `UPDATE user_gift_lots
              SET count_remaining = count_remaining - ?
            WHERE id = ? AND count_remaining >= ?`,
        )
        .bind(v_ceb55a.take, v_ceb55a.id, v_ceb55a.take),
    );
  }
  v_fb1c1c.push(
    v_3f4e2e.env.DB
      .prepare(
        `UPDATE user_gift_inventory
            SET count = count - ?, updated_at = strftime('%s','now')
          WHERE user_id = ? AND gift_id = ? AND count >= ?`,
      )
      .bind(v_520523, v_625c74.id, v_4d33b2.giftId, v_520523),
  );
  const v_532a82 = await v_3f4e2e.env.DB.batch(v_fb1c1c);

  const v_70c7e2 = (v_532a82[v_532a82.length - 1]?.meta as any)?.changes ?? 0;
  if (v_70c7e2 === 0) {
    throw new v_3ebe58("VALIDATION_FAILED", `교환 중 재고 변동 — 다시 시도해주세요`);
  }

  const v_b291d9 = Math.round(v_f8f913 * 100);
  const v_5097fd = (v_8c0b26 as any).name ?? v_4d33b2.giftId;
  const v_56896b = (v_8c0b26 as any).emoji ?? "🎁";
  const v_92e7a1 = (v_8c0b26 as any).imageUrl ?? null;
  const v_f5353f = await v_3f4e2e.env.DB
    .prepare(
      `INSERT INTO gift_inventory_events (user_id, counterpart_user_id, gift_id, count, xrun_amount, kind, ref_id,
                                           clone_id, gift_name_snapshot, gift_emoji_snapshot, gift_image_url_snapshot)
         VALUES (?, NULL, ?, ?, ?, 'exchanged', ?, NULL, ?, ?, ?)`,
    )
    .bind(v_625c74.id, v_4d33b2.giftId, v_520523, v_b291d9, `xrun-bridge-ad:${Date.now()}`,
          v_5097fd, v_56896b, v_92e7a1)
    .run();
  const v_0a1a70 = Number(v_f5353f.meta?.last_row_id ?? 0);
  const v_a0e308 = `afterlife-redeem:${v_0a1a70 || Date.now()}`;

  let v_96c1fe = { ok: false };
  if (!v_3f4e2e.env.XRUN_API_URL || !v_3f4e2e.env.XRUN_INTERNAL_SECRET) {
    v_96c1fe = { ok: false, reason: "missing XRUN_API_URL/XRUN_INTERNAL_SECRET" };
    console.error(`[xrun-bridge] grant SKIP: ${v_96c1fe.reason}`);
  } else {
    try {
      const v_1e7a69 = await fetch(`${v_3f4e2e.env.XRUN_API_URL}/oth-path`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Secret": v_3f4e2e.env.XRUN_INTERNAL_SECRET,
        },
        body: JSON.stringify({
          email: v_4d33b2.email,
          xrunAmount: v_f8f913,
          refId: v_a0e308,
          source: "afterlife_flower_redeem",
        }),
      });
      const v_ba458c = await v_1e7a69.json().catch(() => ({})) as any;
      if (v_1e7a69.ok && v_ba458c?.status === "success") {
        v_96c1fe = {
          ok: true,
          txnId: v_ba458c?.data?.txnId ?? null,
          duplicate: !!v_ba458c?.data?.duplicate,
          newBalance: v_ba458c?.data?.newBalance ?? null,
        };
      } else {
        v_96c1fe = { ok: false, reason: `xrun-api ${v_1e7a69.status} ${v_ba458c?.message ?? "unknown"}` };
      }
    } catch (v_49263d) {
      v_96c1fe = { ok: false, reason: `network: ${(v_49263d as Error).message}` };
    }
  }

  console.log(`[xrun-bridge] redeem email=${v_4d33b2.email} giftId=${v_4d33b2.giftId} burned=${v_520523} payout=${v_f8f913}XRUN refId=${v_a0e308} grant=${v_96c1fe.ok ? `ok(txn=${v_96c1fe.txnId ?? "?"},bal=${v_96c1fe.newBalance ?? "?"},dup=${v_96c1fe.duplicate ? 1 : 0})` : `fail(${v_96c1fe.reason})`}`);

  await v_74defc(v_3f4e2e, {
    userId: v_625c74.id,
    action: "gift.xrun_bridge_redeem",
    details: {
      giftId: v_4d33b2.giftId,
      burned: v_520523,
      xrunPayout: v_f8f913,
      via: "pangle_ad",
      refId: v_a0e308,
      grant: v_96c1fe,
    },
  });

  return v_3f4e2e.json({
    ok: true,
    giftId: v_4d33b2.giftId,
    burned: v_520523,          
    xrunAmount: v_f8f913, 
    perFlowerXrun: v_e57e5c,
    grant: v_96c1fe,
  });
});
