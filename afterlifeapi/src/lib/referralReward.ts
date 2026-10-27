

import type { v_273a0c } from "./env";
import { v_0edc13 } from "./appConfig";
import { v_499cc6 } from "./xrun";

export const v_6d5a3b = 50;
export const v_da074e = "gift-bouquet";
export const v_fcf4d9 = "referral:";

async function v_6baff2(
  env: v_273a0c,
  v_43e90c,
  v_96f93d,
  v_d016c9,
  v_a0e308,
): Promise<boolean> {
  const v_a1651b = v_c9c489.DB;
  const v_292c43 = await v_a1651b.prepare("SELECT id FROM gift_inventory_events WHERE ref_id = ? LIMIT 1").bind(v_a0e308).first();
  if (v_292c43) return false;
  const v_ab4c96 = (await v_0edc13(v_c9c489)).find((v_206b88) => v_206b88.id === v_96f93d);
  const v_6bbb57 =
    typeof v_ab4c96?.xrunPrice === "number" && v_ab4c96.xrunPrice > 0 ? Number(v_ab4c96.xrunPrice) : 0.01;
  await v_a1651b.batch([
    v_a1651b
      .prepare(
        `INSERT INTO user_gift_inventory (user_id, gift_id, count, total_received, updated_at)
           VALUES (?, ?, ?, ?, strftime('%s','now'))
         ON CONFLICT(user_id, gift_id) DO UPDATE SET
           count = count + excluded.count,
           total_received = total_received + excluded.total_received,
           updated_at = strftime('%s','now')`,
      )
      .bind(v_43e90c, v_96f93d, v_d016c9, v_d016c9),
    v_a1651b
      .prepare(
        `INSERT INTO gift_inventory_events (user_id, counterpart_user_id, gift_id, count, xrun_amount, kind, ref_id,
                                             gift_name_snapshot, gift_emoji_snapshot, gift_image_url_snapshot, claimed_at)
           VALUES (?, NULL, ?, ?, 0, 'ad_reward', ?, ?, ?, ?, strftime('%s','now'))`,
      )
      .bind(v_43e90c, v_96f93d, v_d016c9, v_a0e308, v_ab4c96?.name ?? v_96f93d, v_ab4c96?.emoji ?? "🎁", v_ab4c96?.imageUrl ?? null),
    v_a1651b
      .prepare(
        `INSERT INTO user_gift_lots (user_id, gift_id, received_at, count_received, count_remaining, xrun_price_snapshot)
           VALUES (?, ?, strftime('%s','now'), ?, ?, ?)`,
      )
      .bind(v_43e90c, v_96f93d, v_d016c9, v_d016c9, v_6bbb57),
  ]);
  return true;
}

export interface SignupReferralResult {
  applied: boolean;
  reason?: string;
  referrerUserId?: number | null;
}

export async function v_7808c0(
  env: v_273a0c,
  v_dfe078,
  v_c99bd2,
): Promise<SignupReferralResult> {
  const v_6d4ed3 = await v_499cc6(v_c9c489, v_c99bd2);
  if (!v_6d4ed3.exists || !v_6d4ed3.member) return { applied: false, reason: v_6d4ed3.reason ?? "not_found" };

  const v_a1651b = v_c9c489.DB;
  const v_b32680 = await v_a1651b
    .prepare("SELECT xrun_member_id FROM users WHERE id = ?")
    .bind(v_dfe078)
    .first<{ xrun_member_id: number | null }>();
  if (v_b32680?.xrun_member_id && Number(v_b32680.xrun_member_id) === Number(v_6d4ed3.member)) {
    return { applied: false, reason: "self" };
  }
  const v_6b73c1 = await v_a1651b
    .prepare(
      `SELECT id FROM users
        WHERE xrun_member_id = ? AND id != ? AND deleted_at IS NULL AND deactivated_at IS NULL
        ORDER BY id LIMIT 1`,
    )
    .bind(v_6d4ed3.member, v_dfe078)
    .first<{ id: number }>();
  const v_d08e74 = v_6b73c1?.id ?? null;

  const v_43af15 = await v_a1651b
    .prepare(
      `INSERT OR IGNORE INTO signup_referrals (user_id, referral_code, referrer_xrun_member, referrer_user_id, gift_id, reward_qty)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(v_dfe078, v_c99bd2.trim().toUpperCase(), v_6d4ed3.member, v_d08e74, v_da074e, v_6d5a3b)
    .run();
  if (!v_43af15.meta?.changes) return { applied: false, reason: "already_applied", referrerUserId: v_d08e74 };

  if (await v_6baff2(v_c9c489, v_dfe078, v_da074e, v_6d5a3b, `${v_fcf4d9}${v_dfe078}:new`)) {
    await v_a1651b.prepare("UPDATE signup_referrals SET new_user_granted = 1 WHERE user_id = ?").bind(v_dfe078).run();
  }
  if (
    v_d08e74 &&
    (await v_6baff2(v_c9c489, v_d08e74, v_da074e, v_6d5a3b, `${v_fcf4d9}${v_dfe078}:referrer`))
  ) {
    await v_a1651b.prepare("UPDATE signup_referrals SET referrer_granted = 1 WHERE user_id = ?").bind(v_dfe078).run();
  }
  return { applied: true, referrerUserId: v_d08e74 };
}
