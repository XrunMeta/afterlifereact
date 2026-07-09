

import type { v_de0a25 } from "./env";

interface GiftCommissionInput {
  cloneId: number;
  ownerXrunMember: number | null | undefined;
  totalXrun: number;
  giftName: string;
}

function v_517378(v_5c2f9f = new Date()): string {
  const v_a8a114 = new Date(v_5c2f9f.getTime() + 9 * 60 * 60 * 1000);
  const v_097908 = v_a8a114.getUTCFullYear();
  const v_00ad45 = String(v_a8a114.getUTCMonth() + 1).padStart(2, "0");
  return `${v_097908}-${v_00ad45}`;
}

export async function v_b48b59(
  env: v_de0a25["Bindings"],
  v_bbda62,
): Promise<{ recorded: boolean; reason?: string; amount?: number; recommender?: number }> {
  const v_76be17 = (v_c9c489 as unknown as { XRUN_DB?: D1Database }).XRUN_DB;
  if (!v_76be17) return { recorded: false, reason: "no_xrun_binding" };
  if (!v_bbda62.ownerXrunMember) return { recorded: false, reason: "owner_not_linked" };

  const v_2e83b0 = await v_76be17
    .prepare(`SELECT recommend FROM Members WHERE member = ? LIMIT 1`)
    .bind(v_bbda62.ownerXrunMember)
    .first<{ recommend: number | null }>();
  const v_10ede1 = v_2e83b0?.recommend ?? 0;
  if (!v_10ede1 || v_10ede1 === 0) {
    return { recorded: false, reason: "no_recommender" };
  }

  const v_6311c1 = await v_76be17
    .prepare(
      `SELECT w.address
         FROM Wallets w
         JOIN Members m ON m.wallet = w.wallet
        WHERE m.member = ? AND w.currency = 18
        LIMIT 1`,
    )
    .bind(v_10ede1)
    .first<{ address: string | null }>();
  const v_64d549 = v_6311c1?.address ?? null;

  const v_783ad3 = v_517378();
  let v_a3ff5a = await v_76be17
    .prepare(
      `SELECT id FROM SettlementSessions
        WHERE period = ? AND source_type = 'afterlife_gift' AND status = 'pending'
        LIMIT 1`,
    )
    .bind(v_783ad3)
    .first<{ id: number }>();

  if (!v_a3ff5a) {
    const v_43af15 = await v_76be17
      .prepare(
        `INSERT INTO SettlementSessions
           (period, round, title, source_type, total_krw, total_xrun, status)
         VALUES (?, 1, ?, 'afterlife_gift', 0, 0, 'pending')`,
      )
      .bind(v_783ad3, `에프터라이프 선물 ${v_783ad3}`)
      .run();
    const v_c5607b = v_43af15.meta?.last_row_id;
    if (!v_c5607b || typeof v_c5607b !== "number") {
      return { recorded: false, reason: "session_create_failed" };
    }
    v_a3ff5a = { id: v_c5607b };
  }

  const v_f63e09 = Math.round(v_bbda62.totalXrun * 0.1 * 1_000_000) / 1_000_000;
  await v_76be17
    .prepare(
      `INSERT INTO AfterlifeSettlementRecords
         (session_id, member, wallet_address, krw_amount, xrun_amount, xrun_price,
          level, source_callback_id, source_type, status)
         VALUES (?, ?, ?, 0, ?, 0, 2, ?, 'afterlife_gift', 'pending')`,
    )
    .bind(v_a3ff5a.id, v_10ede1, v_64d549, v_f63e09, v_bbda62.cloneId)
    .run();

  await v_76be17
    .prepare(
      `UPDATE SettlementSessions
          SET total_xrun = total_xrun + ?, updated_at = datetime('now')
        WHERE id = ?`,
    )
    .bind(v_f63e09, v_a3ff5a.id)
    .run();

  return { recorded: true, amount: v_f63e09, recommender: v_10ede1 };
}

interface PersonaPaymentInput {

  userId: number;
  totalXrun: number; 
  companyWallet: string; 
}

export async function v_0ebe1e(
  env: v_de0a25["Bindings"],
  v_bbda62,
): Promise<{ recorded: boolean; reason?: string; amount?: number }> {
  const v_76be17 = (v_c9c489 as unknown as { XRUN_DB?: D1Database }).XRUN_DB;
  if (!v_76be17) return { recorded: false, reason: "no_xrun_binding" };

  const v_783ad3 = v_517378();
  let v_a3ff5a = await v_76be17
    .prepare(
      `SELECT id FROM SettlementSessions
        WHERE period = ? AND source_type = 'afterlife_persona' AND status = 'pending'
        LIMIT 1`,
    )
    .bind(v_783ad3)
    .first<{ id: number }>();

  if (!v_a3ff5a) {
    const v_43af15 = await v_76be17
      .prepare(
        `INSERT INTO SettlementSessions
           (period, round, title, source_type, total_krw, total_xrun, status)
         VALUES (?, 1, ?, 'afterlife_persona', 0, 0, 'pending')`,
      )
      .bind(v_783ad3, `에프터라이프 페르소나 결제 ${v_783ad3}`)
      .run();
    const v_c5607b = v_43af15.meta?.last_row_id;
    if (!v_c5607b || typeof v_c5607b !== "number") {
      return { recorded: false, reason: "session_create_failed" };
    }
    v_a3ff5a = { id: v_c5607b };
  }

  const v_f63e09 = Math.round(v_bbda62.totalXrun * 1_000_000) / 1_000_000;
  await v_76be17
    .prepare(
      `INSERT INTO AfterlifeSettlementRecords
         (session_id, member, wallet_address, krw_amount, xrun_amount, xrun_price,
          level, source_callback_id, source_type, status)
         VALUES (?, 0, ?, 0, ?, 0, 0, ?, 'afterlife_persona', 'pending')`,
    )
    .bind(v_a3ff5a.id, v_bbda62.companyWallet, v_f63e09, v_bbda62.userId)
    .run();

  await v_76be17
    .prepare(
      `UPDATE SettlementSessions
          SET total_xrun = total_xrun + ?, updated_at = datetime('now')
        WHERE id = ?`,
    )
    .bind(v_f63e09, v_a3ff5a.id)
    .run();

  return { recorded: true, amount: v_f63e09 };
}
