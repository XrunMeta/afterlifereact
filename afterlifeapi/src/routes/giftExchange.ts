

import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_3ebe58 } from "../lib/errors";
import { v_6690d9 } from "../middleware/auth";
import {
  v_2e4a1b,
  v_0edc13,
  v_705aa5,
  v_e4ea0f,
  v_c47972,
  type v_83f27d,
} from "../lib/appConfig";
import { v_9bded0, v_cd69e7 } from "../lib/xrun";
import { v_74defc } from "../lib/logger";

export const v_7de069 = new v_b7c41b<v_de0a25>();

const v_b6e430 = 0.01; 

type Unit = { lotId: number | null; price: number };
type LotRow = { id: number; count_remaining: number; xrun_price_snapshot: number };

export function v_59ed24(v_389afb): string {
  return `EX-${String(v_389afb).padStart(6, "0")}`;
}

export function v_84faef(v_f4e98d): string {
  const v_fd5f43 = v_f4e98d.toFixed(8).replace(/0+$/, "").replace(/\.$/, "");
  return v_fd5f43 === "-0" ? "0" : v_fd5f43;
}

function v_26ec3c(item: v_83f27d | undefined): number {
  const v_e2a85c = Number((v_8c0b26 as { xrunPrice?: unknown } | undefined)?.xrunPrice);
  return Number.isFinite(v_e2a85c) && v_e2a85c > 0 ? v_e2a85c : v_b6e430;
}

async function v_16a6c1(
  v_a1651b,
  v_43e90c,
  v_96f93d,
  v_2ffbfb,
): Promise<{ owned: number; units: Unit[] }> {
  const v_f0104f = await v_a1651b
    .prepare(`SELECT count FROM user_gift_inventory WHERE user_id = ? AND gift_id = ?`)
    .bind(v_43e90c, v_96f93d)
    .first<{ count: number }>();
  const v_2461e1 = Math.max(0, Number(v_f0104f?.count ?? 0));
  const v_9fdb66 =
    (
      await v_a1651b
        .prepare(
          `SELECT id, count_remaining, xrun_price_snapshot FROM user_gift_lots
            WHERE user_id = ? AND gift_id = ? AND count_remaining > 0
            ORDER BY received_at ASC, id ASC`,
        )
        .bind(v_43e90c, v_96f93d)
        .all<LotRow>()
    ).results ?? [];
  const v_e7458e = [];
  for (const v_41d9f0 of v_9fdb66) {
    const v_6bbb57 = Number(v_41d9f0.xrun_price_snapshot) > 0 ? Number(v_41d9f0.xrun_price_snapshot) : v_b6e430;
    for (let v_ebec57 = 0; v_ebec57 < Number(v_41d9f0.count_remaining) && v_e7458e.length < v_2461e1; v_ebec57++) v_e7458e.push({ lotId: v_41d9f0.id, price: v_6bbb57 });
    if (v_e7458e.length >= v_2461e1) break;
  }
  while (v_e7458e.length < v_2461e1) v_e7458e.push({ lotId: null, price: v_2ffbfb });
  return { owned: v_2461e1, units: v_e7458e };
}

function v_8443fd(v_e7458e): Array<{ price: string; count: number }> {
  const v_8d4337 = [];
  for (const v_ceb55a of v_e7458e) {
    const v_e2a85c = v_84faef(v_ceb55a.price);
    const v_506e86 = v_8d4337[v_8d4337.length - 1];
    if (v_506e86 && v_506e86.price === v_e2a85c) v_506e86.count += 1;
    else v_8d4337.push({ price: v_e2a85c, count: 1 });
  }
  return v_8d4337;
}

async function v_659b01(
  v_a1651b,
  v_43e90c,
  v_96f93d,
): Promise<{ giftId: string | null; gifts: Array<{ giftId: string; ownedQty: number }> }> {
  const v_18b8bf =
    (
      await v_a1651b
        .prepare(`SELECT gift_id, count FROM user_gift_inventory WHERE user_id = ? AND count > 0 ORDER BY count DESC, gift_id`)
        .bind(v_43e90c)
        .all<{ gift_id: string; count: number }>()
    ).results ?? [];
  const v_68bb66 = v_18b8bf.map((v_cb35cb) => ({ giftId: v_cb35cb.gift_id, ownedQty: Number(v_cb35cb.count) }));
  if (v_96f93d) return { giftId: v_96f93d, gifts: v_68bb66 };
  return { giftId: v_68bb66[0]?.giftId ?? null, gifts: v_68bb66 };
}

v_7de069.get("/eligibility", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_01dcf5 = await v_705aa5(v_3f4e2e.env);
  const v_ffbee4 = v_2e4a1b(v_01dcf5);
  const v_dbebe7 = await v_0edc13(v_3f4e2e.env);
  const { giftId: v_96f93d, gifts: v_68bb66 } = await v_659b01(v_3f4e2e.env.DB, v_43e90c, v_3f4e2e.req.query("giftId") || undefined);
  const v_8c0b26 = v_96f93d ? v_dbebe7.find((v_206b88) => v_206b88.id === v_96f93d) : undefined;
  const { owned: v_2461e1, units: v_e7458e } = v_96f93d
    ? await v_16a6c1(v_3f4e2e.env.DB, v_43e90c, v_96f93d, v_26ec3c(v_8c0b26))
    : { owned: 0, units: [] as Unit[] };
  const v_38066f = await v_3f4e2e.env.DB
    .prepare(`SELECT xrun_member_id FROM users WHERE id = ?`)
    .bind(v_43e90c)
    .first<{ xrun_member_id: number | null }>();
  return v_3f4e2e.json({
    xrunLinked: !!v_38066f?.xrun_member_id,
    enabled: v_01dcf5.enabled,
    giftId: v_96f93d,
    giftName: v_8c0b26?.name ?? v_96f93d,
    giftEmoji: v_8c0b26?.emoji ?? "🎁",
    giftImageUrl: v_8c0b26?.imageUrl ?? null,
    gifts: v_68bb66.map((v_206b88) => {
      const v_ab4c96 = v_dbebe7.find((v_62c214) => v_62c214.id === v_206b88.giftId);
      return { ...v_206b88, name: v_ab4c96?.name ?? v_206b88.giftId, emoji: v_ab4c96?.emoji ?? "🎁", imageUrl: v_ab4c96?.imageUrl ?? null };
    }),
    ownedQty: v_2461e1,
    exchangeableQty: v_c47972(v_01dcf5, v_2461e1),
    minQty: v_01dcf5.minQty,
    feeQty: v_01dcf5.feeQty,
    feeUnit: v_01dcf5.feeUnit,
    rateVersion: v_01dcf5.version,

    priceSegments: v_8443fd(v_e7458e),
    currency: "XRUN",
    maintenance: v_ffbee4 ?? (v_01dcf5.enabled ? null : { from: 0, to: 0, message: "교환 서비스 점검 중이에요" }),
  });
});

type ExchangeRow = {
  id: number;
  gift_id: string;
  gift_name: string | null;
  qty: number;
  fee_qty: number;
  reward_xrun: string;
  status: string;
  failure_reason: string | null;
  created_at: number;
  claimed_at: number | null;
};

function v_c8c448(v_cb35cb) {
  return {
    exchangeId: v_cb35cb.id,
    exchangeNo: v_59ed24(v_cb35cb.id),
    giftId: v_cb35cb.gift_id,
    giftName: v_cb35cb.gift_name ?? v_cb35cb.gift_id,
    qty: v_cb35cb.qty,
    feeQty: v_cb35cb.fee_qty,
    deductedQty: v_cb35cb.qty + v_cb35cb.fee_qty,
    reward: v_cb35cb.reward_xrun,
    rewardStatus: v_cb35cb.status,
    createdAt: v_cb35cb.created_at,
    claimedAt: v_cb35cb.claimed_at,
  };
}

v_7de069.get("/history", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_18b8bf =
    (
      await v_3f4e2e.env.DB
        .prepare(
          `SELECT id, gift_id, gift_name, qty, fee_qty, reward_xrun, status, failure_reason, created_at, claimed_at
             FROM gift_exchanges
            WHERE user_id = ? AND status != 'processing'
            ORDER BY created_at DESC, id DESC
            LIMIT 50`,
        )
        .bind(v_43e90c)
        .all<ExchangeRow>()
    ).results ?? [];

  const v_483de2 = v_18b8bf.filter((v_cb35cb) => v_cb35cb.status === "pending_claim");
  if (v_483de2.length) {
    const v_72c7a6 = await v_cd69e7(v_3f4e2e.env, v_483de2.map((v_cb35cb) => `afterlife-exchange:${v_cb35cb.id}`));
    for (const v_cb35cb of v_483de2) {
      const v_fd5f43 = v_72c7a6.get(`afterlife-exchange:${v_cb35cb.id}`);
      if (v_fd5f43?.status !== "claimed") continue;
      const v_83d291 = v_fd5f43.claimedAt ? Date.parse(`${v_fd5f43.claimedAt.replace(" ", "T")}Z`) || Date.now() : Date.now();
      await v_3f4e2e.env.DB
        .prepare(`UPDATE gift_exchanges SET status = 'claimed', claimed_at = ? WHERE id = ? AND status = 'pending_claim'`)
        .bind(v_83d291, v_cb35cb.id)
        .run();
      v_cb35cb.status = "claimed";
      v_cb35cb.claimed_at = v_83d291;
    }
  }
  return v_3f4e2e.json({ items: v_18b8bf.map(v_c8c448) });
});

async function v_144b7d(
  v_a1651b,
  v_43e90c,
  v_96f93d,
  v_c83285,
  v_864b3a,
  v_0a1a70,
): Promise<void> {
  const v_3e6264 = v_864b3a.map((v_8d41d7) =>
    v_a1651b.prepare(`UPDATE user_gift_lots SET count_remaining = count_remaining + ? WHERE id = ?`).bind(v_8d41d7.take, v_8d41d7.id),
  );
  v_3e6264.push(
    v_a1651b
      .prepare(`UPDATE user_gift_inventory SET count = count + ?, updated_at = strftime('%s','now') WHERE user_id = ? AND gift_id = ?`)
      .bind(v_c83285, v_43e90c, v_96f93d),
  );
  if (v_0a1a70) v_3e6264.push(v_a1651b.prepare(`DELETE FROM gift_inventory_events WHERE id = ?`).bind(v_0a1a70));
  await v_a1651b.batch(v_3e6264);
}

v_7de069.post("/", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_a1651b = v_3f4e2e.env.DB;
  const v_62c866 = (v_3f4e2e.req.header("X-Idempotency-Key") ?? v_3f4e2e.req.header("Idempotency-Key") ?? "").trim();
  if (v_62c866.length < 8 || v_62c866.length > 128) {
    throw new v_3ebe58("IDEMPOTENCY_REQUIRED", "Idempotency-Key 가 필요해요.");
  }
  const v_4d33b2 = (await v_3f4e2e.req.json().catch(() => ({}))) as { giftId?: unknown; qty?: unknown; rateVersion?: unknown };
  const v_96f93d = typeof v_4d33b2.giftId === "string" ? v_4d33b2.giftId.trim() : "";
  const v_d016c9 = Number(v_4d33b2.qty);
  if (!v_96f93d) throw new v_3ebe58("VALIDATION_FAILED", "giftId 가 필요해요.");
  if (!Number.isInteger(v_d016c9) || v_d016c9 <= 0) throw new v_3ebe58("VALIDATION_FAILED", "교환할 수량을 입력해주세요");

  const v_01dcf5 = await v_705aa5(v_3f4e2e.env);
  const v_ffbee4 = v_2e4a1b(v_01dcf5);
  if (!v_01dcf5.enabled || v_ffbee4) {
    throw new v_3ebe58("MAINTENANCE", "교환 서비스 점검 중이에요", { maintenance: v_ffbee4 });
  }
  if (Number(v_4d33b2.rateVersion) !== v_01dcf5.version) {
    throw new v_3ebe58("RATE_CHANGED", "교환 조건이 바뀌었어요", {
      minQty: v_01dcf5.minQty,
      feeQty: v_01dcf5.feeQty,
      feeUnit: v_01dcf5.feeUnit,
      rateVersion: v_01dcf5.version,
    });
  }
  if (v_d016c9 < v_01dcf5.minQty) {
    throw new v_3ebe58("BELOW_MIN_QTY", `${v_01dcf5.minQty}송이부터 교환할 수 있어요 (수수료 ${v_01dcf5.feeUnit}송이당 ${v_01dcf5.feeQty}송이 별도)`, {
      minQty: v_01dcf5.minQty,
      feeQty: v_01dcf5.feeQty,
      feeUnit: v_01dcf5.feeUnit,
    });
  }
  const v_625c74 = await v_a1651b
    .prepare(`SELECT xrun_member_id FROM users WHERE id = ? AND deleted_at IS NULL`)
    .bind(v_43e90c)
    .first<{ xrun_member_id: number | null }>();
  if (!v_625c74?.xrun_member_id) throw new v_3ebe58("XRUN_NOT_LINKED", "XRUN 계정 연결이 필요해요");

  const v_dbebe7 = await v_0edc13(v_3f4e2e.env);
  const v_8c0b26 = v_dbebe7.find((v_206b88) => v_206b88.id === v_96f93d);
  const v_dcbe7a = v_8c0b26?.name ?? v_96f93d;

  const v_5c2f9f = Date.now();
  const v_43af15 = await v_a1651b
    .prepare(
      `INSERT INTO gift_exchanges (user_id, gift_id, gift_name, qty, fee_qty, idempotency_key, xrun_member_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, idempotency_key) DO NOTHING
       RETURNING id`,
    )
    .bind(v_43e90c, v_96f93d, v_dcbe7a, v_d016c9, v_e4ea0f(v_01dcf5, v_d016c9), v_62c866, v_625c74.xrun_member_id, v_5c2f9f)
    .first<{ id: number }>();
  if (!v_43af15) {
    const v_ba2215 = await v_a1651b
      .prepare(
        `SELECT id, gift_id, gift_name, qty, fee_qty, reward_xrun, status, failure_reason, created_at, claimed_at
           FROM gift_exchanges WHERE user_id = ? AND idempotency_key = ?`,
      )
      .bind(v_43e90c, v_62c866)
      .first<ExchangeRow>();
    if (!v_ba2215 || v_ba2215.status === "processing") {
      throw new v_3ebe58("DUPLICATE_REQUEST", "이미 교환을 처리하고 있어요");
    }
    if (v_ba2215.status === "failed") {
      throw new v_3ebe58("INTERNAL_ERROR", "교환하지 못했어요", { exchangeNo: v_59ed24(v_ba2215.id), reason: v_ba2215.failure_reason });
    }
    return v_3f4e2e.json(v_c8c448(v_ba2215));
  }
  const v_faf761 = v_43af15.id;
  const v_d5bb0f = async (v_58ca36) => {
    await v_a1651b
      .prepare(`UPDATE gift_exchanges SET status = 'failed', failure_reason = ? WHERE id = ?`)
      .bind(v_58ca36.slice(0, 500), v_faf761)
      .run();
  };

  const v_2d815e = v_e4ea0f(v_01dcf5, v_d016c9);
  const v_565b1e = v_d016c9 + v_2d815e;
  const { owned: v_2461e1, units: v_e7458e } = await v_16a6c1(v_a1651b, v_43e90c, v_96f93d, v_26ec3c(v_8c0b26));
  if (v_2461e1 < v_565b1e) {
    await v_d5bb0f(`insufficient owned=${v_2461e1} need=${v_565b1e}`);
    throw new v_3ebe58("INSUFFICIENT_QTY", "보유 수량이 바뀌었어요", { ownedQty: v_2461e1, exchangeableQty: v_c47972(v_01dcf5, v_2461e1) });
  }

  const v_e68f9f = v_e7458e.slice(0, v_565b1e);
  const v_36c043 = v_84faef(v_e68f9f.slice(0, v_d016c9).reduce((v_fd5f43, v_ceb55a) => v_fd5f43 + v_ceb55a.price, 0));
  const v_792d31 = new Map<number, number>();
  for (const v_ceb55a of v_e68f9f) if (v_ceb55a.lotId !== null) v_792d31.set(v_ceb55a.lotId, (v_792d31.get(v_ceb55a.lotId) ?? 0) + 1);
  const v_864b3a = [...v_792d31.entries()].map(([v_389afb, v_04326c]) => ({ id: v_389afb, take: v_04326c }));

  const v_3e6264 = v_864b3a.map((v_8d41d7) =>
    v_a1651b
      .prepare(`UPDATE user_gift_lots SET count_remaining = count_remaining - ? WHERE id = ? AND count_remaining >= ?`)
      .bind(v_8d41d7.take, v_8d41d7.id, v_8d41d7.take),
  );
  v_3e6264.push(
    v_a1651b
      .prepare(
        `UPDATE user_gift_inventory SET count = count - ?, updated_at = strftime('%s','now')
          WHERE user_id = ? AND gift_id = ? AND count >= ?`,
      )
      .bind(v_565b1e, v_43e90c, v_96f93d, v_565b1e),
  );
  const v_8f00b9 = await v_a1651b.batch(v_3e6264);
  const v_c5e2c1 = Number((v_8f00b9[v_8f00b9.length - 1]?.meta as { changes?: number } | undefined)?.changes ?? 0);
  if (v_c5e2c1 === 0) {

    const v_bb7410 = v_864b3a.filter((v_37eab7, v_ebec57) => Number((v_8f00b9[v_ebec57]?.meta as { changes?: number } | undefined)?.changes ?? 0) > 0);
    if (v_bb7410.length) {
      await v_a1651b.batch(
        v_bb7410.map((v_8d41d7) =>
          v_a1651b.prepare(`UPDATE user_gift_lots SET count_remaining = count_remaining + ? WHERE id = ?`).bind(v_8d41d7.take, v_8d41d7.id),
        ),
      );
    }
    await v_d5bb0f("inventory changed during exchange");
    const v_c3bc75 = await v_a1651b
      .prepare(`SELECT count FROM user_gift_inventory WHERE user_id = ? AND gift_id = ?`)
      .bind(v_43e90c, v_96f93d)
      .first<{ count: number }>();
    const v_57fae8 = Number(v_c3bc75?.count ?? 0);
    throw new v_3ebe58("INSUFFICIENT_QTY", "보유 수량이 바뀌었어요", { ownedQty: v_57fae8, exchangeableQty: v_c47972(v_01dcf5, v_57fae8) });
  }
  const v_136d64 = v_864b3a.filter((v_37eab7, v_ebec57) => Number((v_8f00b9[v_ebec57]?.meta as { changes?: number } | undefined)?.changes ?? 0) > 0);

  const v_1d299c = await v_a1651b
    .prepare(
      `INSERT INTO gift_inventory_events (user_id, counterpart_user_id, gift_id, count, xrun_amount, kind, ref_id,
                                           clone_id, gift_name_snapshot, gift_emoji_snapshot, gift_image_url_snapshot)
       VALUES (?, NULL, ?, ?, ?, 'exchanged', ?, NULL, ?, ?, ?)`,
    )
    .bind(v_43e90c, v_96f93d, v_565b1e, Math.round(Number(v_36c043) * 100), `gift-exchange:${v_faf761}`, v_dcbe7a, v_8c0b26?.emoji ?? "🎁", v_8c0b26?.imageUrl ?? null)
    .run();
  const v_0a1a70 = Number(v_1d299c.meta?.last_row_id ?? 0) || null;
  await v_a1651b
    .prepare(`UPDATE gift_exchanges SET reward_xrun = ?, lots_json = ?, event_id = ? WHERE id = ?`)
    .bind(v_36c043, JSON.stringify(v_136d64), v_0a1a70, v_faf761)
    .run();

  const v_a0e308 = `afterlife-exchange:${v_faf761}`;
  const v_4317d1 = { member: v_625c74.xrun_member_id, xrunAmount: v_36c043, refId: v_a0e308, giftName: v_dcbe7a, qty: v_d016c9 };
  let v_28eeb6 = await v_9bded0(v_3f4e2e.env, v_4317d1);
  if (v_28eeb6.status === "error") v_28eeb6 = await v_9bded0(v_3f4e2e.env, v_4317d1);

  if (v_28eeb6.status !== "ok") {
    await v_144b7d(v_a1651b, v_43e90c, v_96f93d, v_565b1e, v_136d64, v_0a1a70);
    await v_d5bb0f(`xrun ${v_28eeb6.status}: ${v_28eeb6.reason ?? ""}`);
    console.warn(`[gift.exchange] fail user=${v_43e90c} ex=${v_faf761} ${v_28eeb6.status} ${v_28eeb6.reason ?? ""}`);
    if (v_28eeb6.status === "restricted") throw new v_3ebe58("ACCOUNT_RESTRICTED", "교환할 수 없는 계정이에요");
    if (v_28eeb6.status === "missing") throw new v_3ebe58("XRUN_NOT_LINKED", "XRUN 계정을 찾을 수 없어요");
    throw new v_3ebe58("INTERNAL_ERROR", "교환하지 못했어요", { exchangeNo: v_59ed24(v_faf761) });
  }

  await v_a1651b
    .prepare(`UPDATE gift_exchanges SET status = 'pending_claim', xrun_reward_id = ? WHERE id = ?`)
    .bind(v_28eeb6.rewardId ?? null, v_faf761)
    .run();
  await v_74defc(v_3f4e2e, {
    userId: v_43e90c,
    action: "gift.exchange",
    details: { exchangeId: v_faf761, giftId: v_96f93d, qty: v_d016c9, feeQty: v_2d815e, reward: v_36c043, rewardId: v_28eeb6.rewardId },
  });
  return v_3f4e2e.json({
    exchangeId: v_faf761,
    exchangeNo: v_59ed24(v_faf761),
    giftId: v_96f93d,
    giftName: v_dcbe7a,
    qty: v_d016c9,
    feeQty: v_2d815e,
    deductedQty: v_565b1e,
    reward: v_36c043,
    rewardStatus: "pending_claim",
    createdAt: v_5c2f9f,
    claimedAt: null,
  });
});
