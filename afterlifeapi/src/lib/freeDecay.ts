

import type { v_273a0c } from "./env";

const v_91c325 = 600;    
const v_f165ab = 5;             
const v_8ccfb1 = 3;           
const v_3f7ef5 = 500;    

export interface DecayResult {
  candidatesFound: number;
  processed: number;
  totalDecayed: number;
  skipped: number;
  dryRun: boolean;
}

export async function v_4f6450(env: v_273a0c): Promise<DecayResult> {
  const v_a1651b = v_c9c489.DB;
  const v_1369e8 = v_c9c489.CREDIT_DECAY_DRY_RUN === "1";
  const v_67e77e = Date.now();

  const v_6f7c85 = await v_a1651b
    .prepare(
      `SELECT id, credits_free, free_granted_at, free_decayed_months
         FROM users
        WHERE free_granted_at IS NOT NULL
          AND free_decayed_months < ?
          AND deleted_at IS NULL
        LIMIT ?`,
    )
    .bind(v_f165ab, v_3f7ef5 + 1)
    .all<{
      id: number;
      credits_free: number;
      free_granted_at: number;
      free_decayed_months: number;
    }>();

  const v_18b8bf = v_6f7c85.results ?? [];
  const v_120b73 = v_18b8bf.length > v_3f7ef5;
  const v_f425f6 = v_120b73 ? v_18b8bf.slice(0, v_3f7ef5) : v_18b8bf;
  if (v_120b73) {
    console.warn(
      `[free-decay] candidates > ${v_3f7ef5} (${v_18b8bf.length}); capping to prevent runaway.`,
    );
  }

  let v_720567 = 0;
  let v_000ea5 = 0;
  let v_930bf2 = 0;

  for (const v_ceb55a of v_f425f6) {

    const v_ed5367 = Math.floor((v_67e77e - v_ceb55a.free_granted_at) / (30 * 24 * 60 * 60 * 1000));
    const v_36ac82 = Math.min(v_ed5367 - v_8ccfb1, v_f165ab);
    if (v_36ac82 <= v_ceb55a.free_decayed_months) {
      v_930bf2++;
      continue; 
    }

    for (let v_e86ad8 = v_ceb55a.free_decayed_months + 1; v_e86ad8 <= v_36ac82; v_e86ad8++) {
      const v_f63e09 = Math.min(v_91c325, v_ceb55a.credits_free);
      if (v_f63e09 <= 0) {

        if (!v_1369e8) {
          await v_a1651b
            .prepare(`UPDATE users SET free_decayed_months = ? WHERE id = ?`)
            .bind(v_e86ad8, v_ceb55a.id)
            .run();
        }
        continue;
      }
      const v_4fab5a = `free_decay:${v_ceb55a.id}:${v_e86ad8}`;
      if (v_1369e8) {
        console.log(`[free-decay][dry] would decay user=${v_ceb55a.id} idx=${v_e86ad8} amount=${v_f63e09}`);
        v_000ea5 += v_f63e09;
        continue;
      }
      try {
        await v_a1651b.batch([
          v_a1651b
            .prepare(
              `INSERT INTO credit_ledgers (user_id, amount, type, ref_id, idempotency_key)
                 VALUES (?, ?, 'free_decay', ?, ?)`,
            )
            .bind(v_ceb55a.id, -v_f63e09, `month:${v_e86ad8}`, v_4fab5a),
          v_a1651b
            .prepare(
              `UPDATE users
                  SET credits_free = MAX(0, credits_free - ?),
                      credits = MAX(0, credits - ?),
                      free_decayed_months = ?,
                      updated_at = CURRENT_TIMESTAMP
                WHERE id = ?`,
            )
            .bind(v_f63e09, v_f63e09, v_e86ad8, v_ceb55a.id),
        ]);
        v_000ea5 += v_f63e09;
        v_ceb55a.credits_free = Math.max(0, v_ceb55a.credits_free - v_f63e09);
      } catch (v_49263d) {
        const v_badeaf = (v_49263d as Error).message ?? "";
        if (/UNIQUE constraint failed: credit_ledgers/.test(v_badeaf)) {

          await v_a1651b
            .prepare(`UPDATE users SET free_decayed_months = ? WHERE id = ?`)
            .bind(v_e86ad8, v_ceb55a.id)
            .run();
        } else {
          console.error(`[free-decay] error user=${v_ceb55a.id} idx=${v_e86ad8}: ${v_badeaf}`);
          throw v_49263d;
        }
      }
    }
    v_720567++;
  }

  const v_43c42e = {
    candidatesFound: v_18b8bf.length,
    processed: v_720567,
    totalDecayed: v_000ea5,
    skipped: v_930bf2,
    dryRun: v_1369e8,
  };
  console.log(
    `[free-decay] done dryRun=${v_1369e8} candidates=${v_43c42e.candidatesFound} processed=${v_720567} totalDecayed=${v_000ea5} skipped=${v_930bf2}${v_120b73 ? ' (capped)' : ''}`,
  );
  return v_43c42e;
}
