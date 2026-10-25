

import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_4c95c2, v_1f4ea7 } from "../lib/validate";
import { v_6690d9 } from "../middleware/auth";
import { v_a04a51 } from "../middleware/idempotency";
import { v_3ebe58 } from "../lib/errors";
import { v_20a4f4, v_696c65 } from "../lib/credits";
import { v_0edc13 } from "../lib/appConfig";
import { v_2d8130 } from "../lib/giftLots";
import { v_74defc } from "../lib/logger";

export const v_0bc486 = new v_b7c41b<v_de0a25>();

const v_78d17d = v_1f4ea7.object({
  giftId: v_1f4ea7.string().min(1).max(80),
  toUserId: v_1f4ea7.number().int().positive(),

  cloneId: v_1f4ea7.number().int().positive().optional(),
});

v_0bc486.post(
  "/send-offchain",
  v_6690d9,
  v_a04a51("gifts.send"),
  async (v_3f4e2e) => {
    const v_f7e120 = v_3f4e2e.get("userId")!;
    const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_78d17d);
    const v_62c866 = v_3f4e2e.req.header("X-Idempotency-Key")!;

    if (v_4d33b2.toUserId === v_f7e120) {
      throw new v_3ebe58("VALIDATION_FAILED", "자기 자신에게 선물할 수 없어요.");
    }

    const v_dbebe7 = await v_0edc13(v_3f4e2e.env);
    const v_8c0b26 = v_dbebe7.find((v_206b88) => v_206b88.id === v_4d33b2.giftId);
    if (!v_8c0b26) throw new v_3ebe58("NOT_FOUND", `선물 '${v_4d33b2.giftId}' 없음`);

    const v_4f783f =
      typeof v_8c0b26.xrunPrice === "number" && v_8c0b26.xrunPrice > 0
        ? v_8c0b26.xrunPrice * 60
        : v_8c0b26.price;
    const v_4547b1 = Math.max(1, Math.round(v_4f783f));
    if (!(v_4547b1 > 0)) {
      throw new v_3ebe58("VALIDATION_FAILED", "선물 가격 설정이 잘못됐어요.");
    }

    const v_b9fbb4 = await v_3f4e2e.env.DB

      .prepare(`SELECT id FROM users WHERE id = ? AND deleted_at IS NULL AND deactivated_at IS NULL`)
      .bind(v_4d33b2.toUserId)
      .first<{ id: number }>();
    if (!v_b9fbb4) throw new v_3ebe58("NOT_FOUND", "받을 사용자를 찾을 수 없어요.");

    const v_eef514 = await v_3f4e2e.env.DB
      .prepare(
        `UPDATE user_gift_inventory
            SET count = count - 1,
                updated_at = strftime('%s','now')
          WHERE user_id = ? AND gift_id = ? AND count > 0`,
      )
      .bind(v_f7e120, v_4d33b2.giftId)
      .run();
    if ((v_eef514.meta?.changes ?? 0) === 0) {
      throw new v_3ebe58("INSUFFICIENT_CREDITS", "선물 재고가 없어요.");
    }

    await v_2d8130(v_3f4e2e.env.DB, v_f7e120, v_4d33b2.giftId, 1);

    if (v_4d33b2.cloneId) {
      try {
        const v_1de203 = await v_3f4e2e.env.DB
          .prepare(`SELECT owner_id FROM clones WHERE id = ?`)
          .bind(v_4d33b2.cloneId)
          .first<{ owner_id: number }>();

        if (v_1de203 && v_1de203.owner_id === v_4d33b2.toUserId) {
          await v_3f4e2e.env.DB
            .prepare(
              `INSERT INTO gift_logs (
                 sender_user_id, clone_id, owner_user_id, gift_id, gift_name,
                 total_amount, company_amount, owner_amount, company_address, status, completed_at
               ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, 'offchain', 'sent', CURRENT_TIMESTAMP)`,
            )
            .bind(
              v_f7e120,
              v_4d33b2.cloneId,
              v_4d33b2.toUserId,
              v_4d33b2.giftId,
              v_8c0b26.name,
              v_4547b1,
              v_4547b1,
            )
            .run();
        }
      } catch (v_49263d) {

        console.warn("[gift.send-offchain] gift_logs INSERT skipped:", v_49263d);
      }
    }

    const v_5097fd = v_8c0b26.name;
    const v_56896b = v_8c0b26.emoji ?? "🎁";
    const v_92e7a1 = v_8c0b26.imageUrl ?? null;
    const v_a97aa2 = v_4d33b2.cloneId ?? null;

    const v_f9c48b =
      typeof (v_8c0b26 as any).xrunPrice === "number" && (v_8c0b26 as any).xrunPrice > 0
        ? Number((v_8c0b26 as any).xrunPrice)
        : 0.01;
    await v_3f4e2e.env.DB.batch([
      v_3f4e2e.env.DB
        .prepare(
          `INSERT INTO user_gift_inventory (user_id, gift_id, count, total_received, updated_at)
             VALUES (?, ?, 1, 1, strftime('%s','now'))
           ON CONFLICT(user_id, gift_id) DO UPDATE SET
             count = count + 1,
             total_received = total_received + 1,
             updated_at = strftime('%s','now')`,
        )
        .bind(v_4d33b2.toUserId, v_4d33b2.giftId),

      v_3f4e2e.env.DB
        .prepare(
          `INSERT INTO gift_inventory_events (user_id, counterpart_user_id, gift_id, count, xrun_amount, kind, ref_id,
                                               clone_id, gift_name_snapshot, gift_emoji_snapshot, gift_image_url_snapshot)
             VALUES (?, ?, ?, 1, ?, 'sent', ?, ?, ?, ?, ?)`,
        )
        .bind(v_f7e120, v_4d33b2.toUserId, v_4d33b2.giftId, v_4547b1, v_62c866,
              v_a97aa2, v_5097fd, v_56896b, v_92e7a1),
      v_3f4e2e.env.DB
        .prepare(
          `INSERT INTO gift_inventory_events (user_id, counterpart_user_id, gift_id, count, xrun_amount, kind, ref_id,
                                               clone_id, gift_name_snapshot, gift_emoji_snapshot, gift_image_url_snapshot)
             VALUES (?, ?, ?, 1, ?, 'received', ?, ?, ?, ?, ?)`,
        )
        .bind(v_4d33b2.toUserId, v_f7e120, v_4d33b2.giftId, v_4547b1, v_62c866,
              v_a97aa2, v_5097fd, v_56896b, v_92e7a1),

      v_3f4e2e.env.DB
        .prepare(
          `INSERT INTO user_gift_lots (user_id, gift_id, received_at, count_received, count_remaining, xrun_price_snapshot)
             VALUES (?, ?, strftime('%s','now'), 1, 1, ?)`,
        )
        .bind(v_4d33b2.toUserId, v_4d33b2.giftId, v_f9c48b),
    ]);

    await v_74defc(v_3f4e2e, {
      userId: v_f7e120,
      action: "gift.sent_offchain",
      details: { giftId: v_4d33b2.giftId, toUserId: v_4d33b2.toUserId, xrunAmount: v_4547b1 },
    });

    return v_3f4e2e.json({
      ok: true,
      giftId: v_4d33b2.giftId,
      xrunAmount: v_4547b1,
      receiverId: v_4d33b2.toUserId,
    });
  },
);

v_0bc486.get("/inventory", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_18b8bf = await v_3f4e2e.env.DB
    .prepare(
      `SELECT gift_id, count, total_received
         FROM user_gift_inventory
        WHERE user_id = ? AND count > 0
        ORDER BY updated_at DESC`,
    )
    .bind(v_43e90c)
    .all<{ gift_id: string; count: number; total_received: number }>();

  const v_dbebe7 = await v_0edc13(v_3f4e2e.env);
  const v_6413c7 = new Map(v_dbebe7.map((v_206b88) => [v_206b88.id, v_206b88]));

  const v_4622b9 = (v_18b8bf.results ?? []).map((v_cb35cb) => {
    const v_ab4c96 = v_6413c7.get(v_cb35cb.gift_id);

    const v_4547b1 =
      v_ab4c96 && typeof v_ab4c96.xrunPrice === "number" && v_ab4c96.xrunPrice > 0
        ? v_ab4c96.xrunPrice * 60
        : v_ab4c96?.price ?? 0;
    return {
      giftId: v_cb35cb.gift_id,
      name: v_ab4c96?.name ?? v_cb35cb.gift_id,
      emoji: v_ab4c96?.emoji ?? "🎁",
      imageUrl: v_ab4c96?.imageUrl,
      xrunPerItem: v_4547b1,       
      count: v_cb35cb.count,
      totalReceived: v_cb35cb.total_received,
      xrunTotal: v_4547b1 * v_cb35cb.count,  
    };
  });

  return v_3f4e2e.json({ items: v_4622b9 });
});

const v_9a7b9d = ["received", "ad_reward", "sent", "exchanged"];
function v_bf1264(v_94302c): string[] {
  if (v_94302c === "received") return ["received", "ad_reward"];
  if (v_94302c === "sent") return ["sent"];
  return v_9a7b9d;
}

v_0bc486.get("/activity-log", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_f71b56 = new URL(v_3f4e2e.req.url);
  const v_cf2260 = Number(v_f71b56.searchParams.get("limit") ?? 50);
  const v_02be30 = Math.max(1, Math.min(200, Number.isFinite(v_cf2260) ? v_cf2260 : 50));
  const v_40e259 = Number(v_f71b56.searchParams.get("offset") ?? 0);
  const v_3bbadf = Math.max(0, Number.isFinite(v_40e259) ? v_40e259 : 0);
  const v_28c2de = v_bf1264(v_f71b56.searchParams.get("kind"));
  const v_8b630e = v_28c2de.map(() => "?").join(", ");

  const v_18b8bf = await v_3f4e2e.env.DB
    .prepare(
      `SELECT e.id                        AS id,
              e.kind                      AS kind,
              e.counterpart_user_id       AS counterpartId,
              cp.email                    AS counterpartEmail,
              cp.name                     AS counterpartName,
              cp.avatar_url               AS counterpartAvatarUrl,
              e.clone_id                  AS cloneId,
              c.name                      AS cloneName,
              c.username                  AS cloneUsername,
              c.avatar_url                AS cloneAvatarUrl,
              e.gift_id                   AS giftId,
              e.gift_name_snapshot        AS giftNameSnap,
              e.gift_emoji_snapshot       AS giftEmojiSnap,
              e.gift_image_url_snapshot   AS giftImageUrlSnap,
              e.count                     AS count,
              e.xrun_amount               AS xrunAmount,
              e.created_at                AS createdAtSec
         FROM gift_inventory_events e
         LEFT JOIN users  cp ON cp.id = e.counterpart_user_id
         LEFT JOIN clones c  ON c.id  = e.clone_id
        WHERE e.user_id = ? AND e.kind IN (${v_8b630e})
        ORDER BY e.created_at DESC, e.id DESC
        LIMIT ? OFFSET ?`,
    )
    .bind(v_43e90c, ...v_28c2de, v_02be30, v_3bbadf)
    .all<{
      id: number;
      kind: string;
      counterpartId: number | null;
      counterpartEmail: string | null;
      counterpartName: string | null;
      counterpartAvatarUrl: string | null;
      cloneId: number | null;
      cloneName: string | null;
      cloneUsername: string | null;
      cloneAvatarUrl: string | null;
      giftId: string;
      giftNameSnap: string | null;
      giftEmojiSnap: string | null;
      giftImageUrlSnap: string | null;
      count: number;
      xrunAmount: number;
      createdAtSec: number;
    }>();

  const v_679404 = await v_3f4e2e.env.DB
    .prepare(
      `SELECT COUNT(*) AS n FROM gift_inventory_events
        WHERE user_id = ? AND kind IN (${v_8b630e})`,
    )
    .bind(v_43e90c, ...v_28c2de)
    .first<{ n: number }>();

  const v_e52c8b = await v_3f4e2e.env.DB
    .prepare(
      `SELECT COALESCE(SUM(count), 0) AS totalSent FROM gift_inventory_events
        WHERE user_id = ? AND kind = 'sent'`,
    )
    .bind(v_43e90c)
    .first<{ totalSent: number }>();

  const v_9ba17d = await v_3f4e2e.env.DB
    .prepare(`SELECT COALESCE(SUM(total_received), 0) AS totalReceived FROM user_gift_inventory WHERE user_id = ?`)
    .bind(v_43e90c)
    .first<{ totalReceived: number }>();

  const v_b5069d = await v_3f4e2e.env.DB
    .prepare(`SELECT COALESCE(SUM(count), 0) AS currentOwned FROM user_gift_inventory WHERE user_id = ?`)
    .bind(v_43e90c)
    .first<{ currentOwned: number }>();

  const v_dbebe7 = await v_0edc13(v_3f4e2e.env);
  const v_6413c7 = new Map(v_dbebe7.map((v_206b88) => [v_206b88.id, v_206b88]));

  const v_4622b9 = (v_18b8bf.results ?? []).map((v_cb35cb) => {
    const v_ab4c96 = v_6413c7.get(v_cb35cb.giftId);
    return {
      id: v_cb35cb.id,
      kind: v_cb35cb.kind, 
      counterpartId: v_cb35cb.counterpartId,
      counterpartEmail: v_cb35cb.counterpartEmail,
      counterpartName: v_cb35cb.counterpartName,
      counterpartAvatarUrl: v_cb35cb.counterpartAvatarUrl,
      cloneId: v_cb35cb.cloneId,
      cloneName: v_cb35cb.cloneName,
      cloneUsername: v_cb35cb.cloneUsername,
      cloneAvatarUrl: v_cb35cb.cloneAvatarUrl,
      giftId: v_cb35cb.giftId,
      giftName: v_cb35cb.giftNameSnap ?? v_ab4c96?.name ?? v_cb35cb.giftId,
      giftEmoji: v_cb35cb.giftEmojiSnap ?? v_ab4c96?.emoji ?? "🎁",
      giftImageUrl: v_cb35cb.giftImageUrlSnap ?? v_ab4c96?.imageUrl ?? null,
      count: v_cb35cb.count,
      xrunAmount: v_cb35cb.xrunAmount,
      createdAt: new Date(v_cb35cb.createdAtSec * 1000).toISOString(),
    };
  });

  return v_3f4e2e.json({
    items: v_4622b9,
    total: v_679404?.n ?? 0,
    totalReceived: v_9ba17d?.totalReceived ?? 0,
    totalSent: v_e52c8b?.totalSent ?? 0,
    currentOwned: v_b5069d?.currentOwned ?? 0,
    limit: v_02be30,
    offset: v_3bbadf,
  });
});

const v_d092c0 = v_1f4ea7.object({
  giftId: v_1f4ea7.string().min(1).max(80),
  count: v_1f4ea7.number().int().positive().max(10_000),
});

v_0bc486.post(
  "/swap",
  v_6690d9,
  v_a04a51("gifts.swap"),
  async (v_3f4e2e) => {
    const v_43e90c = v_3f4e2e.get("userId")!;
    const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_d092c0);
    const v_62c866 = v_3f4e2e.req.header("X-Idempotency-Key")!;

    const v_dbebe7 = await v_0edc13(v_3f4e2e.env);
    const v_8c0b26 = v_dbebe7.find((v_206b88) => v_206b88.id === v_4d33b2.giftId);
    if (!v_8c0b26) throw new v_3ebe58("NOT_FOUND", `선물 '${v_4d33b2.giftId}' 없음`);

    const v_4547b1 =
      typeof v_8c0b26.xrunPrice === "number" && v_8c0b26.xrunPrice > 0
        ? v_8c0b26.xrunPrice * 60
        : v_8c0b26.price;
    if (v_4547b1 <= 0) throw new v_3ebe58("VALIDATION_FAILED", "선물 가격이 0 이라 교환 불가.");

    const v_6b7cd0 = v_4547b1 * v_4d33b2.count;

    const v_615e11 = await v_3f4e2e.env.DB
      .prepare(
        `UPDATE user_gift_inventory
            SET count = count - ?, updated_at = strftime('%s','now')
          WHERE user_id = ? AND gift_id = ? AND count >= ?`,
      )
      .bind(v_4d33b2.count, v_43e90c, v_4d33b2.giftId, v_4d33b2.count)
      .run();
    if ((v_615e11.meta?.changes ?? 0) === 0) {
      throw new v_3ebe58("VALIDATION_FAILED", "인벤토리에 해당 선물이 부족해요.");
    }

    try {
      await v_696c65(v_3f4e2e, {
        userId: v_43e90c,
        amount: v_6b7cd0,
        type: "gift",
        refId: `swap:${v_4d33b2.giftId}:count=${v_4d33b2.count}`,
        idempotencyKey: v_62c866,
      });

      await v_3f4e2e.env.DB
        .prepare(
          `UPDATE users SET credits_gift = credits_gift + ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND deleted_at IS NULL`,
        )
        .bind(v_6b7cd0, v_43e90c)
        .run();
    } catch (v_49263d) {

      await v_3f4e2e.env.DB
        .prepare(
          `UPDATE user_gift_inventory SET count = count + ?, updated_at = strftime('%s','now')
             WHERE user_id = ? AND gift_id = ?`,
        )
        .bind(v_4d33b2.count, v_43e90c, v_4d33b2.giftId)
        .run();
      throw v_49263d;
    }

    await v_2d8130(v_3f4e2e.env.DB, v_43e90c, v_4d33b2.giftId, v_4d33b2.count);

    await v_3f4e2e.env.DB
      .prepare(
        `INSERT INTO gift_inventory_events (user_id, counterpart_user_id, gift_id, count, xrun_amount, kind, ref_id)
           VALUES (?, NULL, ?, ?, ?, 'swapped', ?)`,
      )
      .bind(v_43e90c, v_4d33b2.giftId, v_4d33b2.count, v_6b7cd0, v_62c866)
      .run();

    await v_74defc(v_3f4e2e, {
      userId: v_43e90c,
      action: "gift.swapped",
      details: { giftId: v_4d33b2.giftId, count: v_4d33b2.count, xrunAmount: v_6b7cd0 },
    });

    return v_3f4e2e.json({
      ok: true,
      giftId: v_4d33b2.giftId,
      count: v_4d33b2.count,
      xrunCredited: v_6b7cd0,
    });
  },
);

const v_c31ac2 = v_1f4ea7.object({
  callId: v_1f4ea7.string().min(1).max(128),
  round: v_1f4ea7.number().int().positive(),
  giftId: v_1f4ea7.string().min(1).max(80).optional(),
});
v_0bc486.post("/ad-reward-grant", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  const v_4d33b2 = await v_4c95c2(v_3f4e2e, v_c31ac2);
  const v_96f93d = v_4d33b2.giftId ?? "gift-bouquet";

  const v_d7296e = await v_3f4e2e.env.DB
    .prepare("SELECT user_id FROM call_sessions WHERE call_id = ?")
    .bind(v_4d33b2.callId)
    .first<{ user_id: number }>();
  if (!v_d7296e) throw new v_3ebe58("NOT_FOUND", "call_not_found");
  if (v_d7296e.user_id !== v_43e90c) throw new v_3ebe58("FORBIDDEN", "not_call_owner");

  const v_a0e308 = `ad-reward:${v_4d33b2.callId}:${v_4d33b2.round}`;
  const v_3c8572 = await v_3f4e2e.env.DB
    .prepare("SELECT id FROM gift_inventory_events WHERE ref_id = ? LIMIT 1")
    .bind(v_a0e308)
    .first<{ id: number }>();
  if (v_3c8572) {

    const v_f0104f = await v_3f4e2e.env.DB
      .prepare("SELECT count, total_received FROM user_gift_inventory WHERE user_id = ? AND gift_id = ?")
      .bind(v_43e90c, v_96f93d)
      .first<{ count: number; total_received: number }>();
    return v_3f4e2e.json({
      ok: true,
      giftId: v_96f93d,
      alreadyGranted: true,
      count: v_f0104f?.count ?? 0,
      totalReceived: v_f0104f?.total_received ?? 0,
    });
  }

  const v_897111 = await v_0edc13(v_3f4e2e.env);
  const v_910ae8 = v_897111.find((v_206b88) => v_206b88.id === v_96f93d);
  const v_5097fd = v_910ae8?.name ?? v_96f93d;
  const v_56896b = v_910ae8?.emoji ?? "🎁";
  const v_92e7a1 = v_910ae8?.imageUrl ?? null;
  const v_f9c48b =
    typeof (v_910ae8 as any)?.xrunPrice === "number" && (v_910ae8 as any).xrunPrice > 0
      ? Number((v_910ae8 as any).xrunPrice)
      : 0.01;

  const v_37fbac = await v_3f4e2e.env.DB
    .prepare("SELECT clone_id FROM call_sessions WHERE call_id = ?")
    .bind(v_4d33b2.callId)
    .first<{ clone_id: number | null }>();
  const v_a97aa2 = v_37fbac?.clone_id ?? null;
  await v_3f4e2e.env.DB.batch([
    v_3f4e2e.env.DB
      .prepare(
        `INSERT INTO user_gift_inventory (user_id, gift_id, count, total_received, updated_at)
           VALUES (?, ?, 1, 1, strftime('%s','now'))
         ON CONFLICT(user_id, gift_id) DO UPDATE SET
           count = count + 1,
           total_received = total_received + 1,
           updated_at = strftime('%s','now')`,
      )
      .bind(v_43e90c, v_96f93d),
    v_3f4e2e.env.DB
      .prepare(
        `INSERT INTO gift_inventory_events (user_id, counterpart_user_id, gift_id, count, xrun_amount, kind, ref_id,
                                             clone_id, gift_name_snapshot, gift_emoji_snapshot, gift_image_url_snapshot)
           VALUES (?, NULL, ?, 1, 0, 'ad_reward', ?, ?, ?, ?, ?)`,
      )
      .bind(v_43e90c, v_96f93d, v_a0e308, v_a97aa2, v_5097fd, v_56896b, v_92e7a1),

    v_3f4e2e.env.DB
      .prepare(
        `INSERT INTO user_gift_lots (user_id, gift_id, received_at, count_received, count_remaining, xrun_price_snapshot)
           VALUES (?, ?, strftime('%s','now'), 1, 1, ?)`,
      )
      .bind(v_43e90c, v_96f93d, v_f9c48b),
  ]);

  const v_f0104f = await v_3f4e2e.env.DB
    .prepare("SELECT count, total_received FROM user_gift_inventory WHERE user_id = ? AND gift_id = ?")
    .bind(v_43e90c, v_96f93d)
    .first<{ count: number; total_received: number }>();

  await v_74defc(v_3f4e2e, {
    userId: v_43e90c,
    action: "gift.ad_reward_granted",
    details: { callId: v_4d33b2.callId, round: v_4d33b2.round, giftId: v_96f93d, newCount: v_f0104f?.count ?? 0 },
  });

  return v_3f4e2e.json({
    ok: true,
    giftId: v_96f93d,
    alreadyGranted: false,
    count: v_f0104f?.count ?? 1,
    totalReceived: v_f0104f?.total_received ?? 1,
  });
});
