

import type { v_273a0c } from "./env";
import { v_0edc13, v_866cbe } from "./appConfig";
import { v_499cc6 } from "./xrun";
import { v_c226a5 } from "./notify";

export const v_da074e = "gift-bouquet";
export const v_fcf4d9 = "referral:";

async function v_734254(
  env: v_273a0c,
  v_43e90c,
  v_96f93d,
  v_d016c9,
  v_a0e308,

  v_6da63a,
): Promise<boolean> {
  const v_a1651b = v_c9c489.DB;
  const v_292c43 = await v_a1651b.prepare("SELECT id FROM gift_inventory_events WHERE ref_id = ? LIMIT 1").bind(v_a0e308).first();
  if (v_292c43) return false;
  const v_ab4c96 = (await v_0edc13(v_c9c489)).find((v_206b88) => v_206b88.id === v_96f93d);
  await v_a1651b
    .prepare(
      `INSERT INTO gift_inventory_events (user_id, counterpart_user_id, gift_id, count, xrun_amount, kind, ref_id,
                                           gift_name_snapshot, gift_emoji_snapshot, gift_image_url_snapshot, claimed_at)
         VALUES (?, ?, ?, ?, 0, 'ad_reward', ?, ?, ?, ?, NULL)`,
    )
    .bind(v_43e90c, v_6da63a, v_96f93d, v_d016c9, v_a0e308, v_ab4c96?.name ?? v_96f93d, v_ab4c96?.emoji ?? "🎁", v_ab4c96?.imageUrl ?? null)
    .run();
  return true;
}

export async function v_e82478(env: v_273a0c, v_a0e308): Promise<boolean> {
  const v_01dcf5 = await v_866cbe(v_c9c489);
  return v_a0e308.endsWith(":referrer") ? v_01dcf5.referrer.active : v_01dcf5.newUser.active;
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
  const v_01dcf5 = await v_866cbe(v_c9c489);

  const v_f7d5d5 = v_01dcf5.newUser.active ? v_01dcf5.newUser.qty : 0;
  const v_b1117f = v_01dcf5.referrer.active ? v_01dcf5.referrer.qty : 0;
  if (v_f7d5d5 <= 0 && v_b1117f <= 0) return { applied: false, reason: "disabled" };
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
    .bind(v_dfe078, v_c99bd2.trim().toUpperCase(), v_6d4ed3.member, v_d08e74, v_da074e, v_f7d5d5)
    .run();
  if (!v_43af15.meta?.changes) return { applied: false, reason: "already_applied", referrerUserId: v_d08e74 };

  if (
    v_f7d5d5 > 0 &&
    (await v_734254(v_c9c489, v_dfe078, v_da074e, v_f7d5d5, `${v_fcf4d9}${v_dfe078}:new`, v_d08e74))
  ) {
    await v_a1651b.prepare("UPDATE signup_referrals SET new_user_granted = 1 WHERE user_id = ?").bind(v_dfe078).run();
  }
  if (
    v_d08e74 &&
    v_b1117f > 0 &&
    (await v_734254(v_c9c489, v_d08e74, v_da074e, v_b1117f, `${v_fcf4d9}${v_dfe078}:referrer`, v_dfe078))
  ) {
    await v_a1651b.prepare("UPDATE signup_referrals SET referrer_granted = 1 WHERE user_id = ?").bind(v_dfe078).run();

    await v_c226a5(v_c9c489, {
      userId: v_d08e74,
      type: "referral_reward",
      title: "🎁 추천 보상 도착",
      body: `친구가 내 추천인 코드로 가입했어요. 선물함에서 꽃 ${v_b1117f}송이를 받아가세요!`,
      data: { type: "referral_reward", qty: v_b1117f },
      skipEmail: true,
    }).catch((v_49263d) => console.warn("[referral] notify failed:", (v_49263d as Error).message));
  }
  return { applied: true, referrerUserId: v_d08e74 };
}
