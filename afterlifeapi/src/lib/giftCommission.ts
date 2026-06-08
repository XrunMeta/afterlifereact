

import type { AppEnv } from "./env";

interface GiftCommissionInput {
  cloneId: number;
  ownerXrunMember: number | null | undefined;
  totalXrun: number;
  giftName: string;
}

function kstPeriod(now: Date = new Date()): string {
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const yyyy = kst.getUTCFullYear();
  const mm = String(kst.getUTCMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

export async function recordAfterlifeGiftCommission(
  env: AppEnv["Bindings"],
  input: GiftCommissionInput,
): Promise<{ recorded: boolean; reason?: string; amount?: number; recommender?: number }> {
  const xrun = (env as unknown as { XRUN_DB?: D1Database }).XRUN_DB;
  if (!xrun) return { recorded: false, reason: "no_xrun_binding" };
  if (!input.ownerXrunMember) return { recorded: false, reason: "owner_not_linked" };

  const ownerRow = await xrun
    .prepare(`SELECT recommend FROM Members WHERE member = ? LIMIT 1`)
    .bind(input.ownerXrunMember)
    .first<{ recommend: number | null }>();
  const recommender = ownerRow?.recommend ?? 0;
  if (!recommender || recommender === 0) {
    return { recorded: false, reason: "no_recommender" };
  }

  const walletRow = await xrun
    .prepare(
      `SELECT w.address
         FROM Wallets w
         JOIN Members m ON m.wallet = w.wallet
        WHERE m.member = ? AND w.currency = 18
        LIMIT 1`,
    )
    .bind(recommender)
    .first<{ address: string | null }>();
  const walletAddress = walletRow?.address ?? null;

  const period = kstPeriod();
  let session = await xrun
    .prepare(
      `SELECT id FROM SettlementSessions
        WHERE period = ? AND source_type = 'afterlife_gift' AND status = 'pending'
        LIMIT 1`,
    )
    .bind(period)
    .first<{ id: number }>();

  if (!session) {
    const ins = await xrun
      .prepare(
        `INSERT INTO SettlementSessions
           (period, round, title, source_type, total_krw, total_xrun, status)
         VALUES (?, 1, ?, 'afterlife_gift', 0, 0, 'pending')`,
      )
      .bind(period, `에프터라이프 선물 ${period}`)
      .run();
    const sessionId = ins.meta?.last_row_id;
    if (!sessionId || typeof sessionId !== "number") {
      return { recorded: false, reason: "session_create_failed" };
    }
    session = { id: sessionId };
  }

  const amount = Math.round(input.totalXrun * 0.1 * 1_000_000) / 1_000_000;
  await xrun
    .prepare(
      `INSERT INTO SettlementRecords
         (session_id, member, wallet_address, krw_amount, xrun_amount, xrun_price,
          level, source_callback_id, source_type, status)
         VALUES (?, ?, ?, 0, ?, 0, 2, ?, 'afterlife_gift', 'pending')`,
    )
    .bind(session.id, recommender, walletAddress, amount, input.cloneId)
    .run();

  await xrun
    .prepare(
      `UPDATE SettlementSessions
          SET total_xrun = total_xrun + ?, updated_at = datetime('now')
        WHERE id = ?`,
    )
    .bind(amount, session.id)
    .run();

  return { recorded: true, amount, recommender };
}
