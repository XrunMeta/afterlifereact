

import type { Bindings } from "./env";

const AMOUNT_PER_MONTH = 600;    
const MAX_MONTHS = 5;             
const GRACE_MONTHS = 3;           
const MAX_USERS_PER_RUN = 500;    

export interface DecayResult {
  candidatesFound: number;
  processed: number;
  totalDecayed: number;
  skipped: number;
  dryRun: boolean;
}

export async function runFreeDecayCron(env: Bindings): Promise<DecayResult> {
  const db = env.DB;
  const dryRun = env.CREDIT_DECAY_DRY_RUN === "1";
  const nowMs = Date.now();

  const candidates = await db
    .prepare(
      `SELECT id, credits_free, free_granted_at, free_decayed_months
         FROM users
        WHERE free_granted_at IS NOT NULL
          AND free_decayed_months < ?
          AND deleted_at IS NULL
        LIMIT ?`,
    )
    .bind(MAX_MONTHS, MAX_USERS_PER_RUN + 1)
    .all<{
      id: number;
      credits_free: number;
      free_granted_at: number;
      free_decayed_months: number;
    }>();

  const rows = candidates.results ?? [];
  const capped = rows.length > MAX_USERS_PER_RUN;
  const targets = capped ? rows.slice(0, MAX_USERS_PER_RUN) : rows;
  if (capped) {
    console.warn(
      `[free-decay] candidates > ${MAX_USERS_PER_RUN} (${rows.length}); capping to prevent runaway.`,
    );
  }

  let processed = 0;
  let totalDecayed = 0;
  let skipped = 0;

  for (const u of targets) {

    const monthsElapsed = Math.floor((nowMs - u.free_granted_at) / (30 * 24 * 60 * 60 * 1000));
    const targetIndex = Math.min(monthsElapsed - GRACE_MONTHS, MAX_MONTHS);
    if (targetIndex <= u.free_decayed_months) {
      skipped++;
      continue; 
    }

    for (let idx = u.free_decayed_months + 1; idx <= targetIndex; idx++) {
      const amount = Math.min(AMOUNT_PER_MONTH, u.credits_free);
      if (amount <= 0) {

        if (!dryRun) {
          await db
            .prepare(`UPDATE users SET free_decayed_months = ? WHERE id = ?`)
            .bind(idx, u.id)
            .run();
        }
        continue;
      }
      const idem = `free_decay:${u.id}:${idx}`;
      if (dryRun) {
        console.log(`[free-decay][dry] would decay user=${u.id} idx=${idx} amount=${amount}`);
        totalDecayed += amount;
        continue;
      }
      try {
        await db.batch([
          db
            .prepare(
              `INSERT INTO credit_ledgers (user_id, amount, type, ref_id, idempotency_key)
                 VALUES (?, ?, 'free_decay', ?, ?)`,
            )
            .bind(u.id, -amount, `month:${idx}`, idem),
          db
            .prepare(
              `UPDATE users
                  SET credits_free = MAX(0, credits_free - ?),
                      credits = MAX(0, credits - ?),
                      free_decayed_months = ?,
                      updated_at = CURRENT_TIMESTAMP
                WHERE id = ?`,
            )
            .bind(amount, amount, idx, u.id),
        ]);
        totalDecayed += amount;
        u.credits_free = Math.max(0, u.credits_free - amount);
      } catch (err) {
        const msg = (err as Error).message ?? "";
        if (/UNIQUE constraint failed: credit_ledgers/.test(msg)) {

          await db
            .prepare(`UPDATE users SET free_decayed_months = ? WHERE id = ?`)
            .bind(idx, u.id)
            .run();
        } else {
          console.error(`[free-decay] error user=${u.id} idx=${idx}: ${msg}`);
          throw err;
        }
      }
    }
    processed++;
  }

  const result: DecayResult = {
    candidatesFound: rows.length,
    processed,
    totalDecayed,
    skipped,
    dryRun,
  };
  console.log(
    `[free-decay] done dryRun=${dryRun} candidates=${result.candidatesFound} processed=${processed} totalDecayed=${totalDecayed} skipped=${skipped}${capped ? ' (capped)' : ''}`,
  );
  return result;
}
