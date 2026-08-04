

import type { v_273a0c } from "./env";
import { v_33d48f } from "./notify";

type InteractionKind = "chat" | "call" | "learn" | "feed";

const v_dff7c1 = {
  chat: "chat_count",
  call: "call_count",
  learn: "learn_count",
  feed: "feed_count",
};

export async function v_dd9d7c(
  env: v_273a0c,
  v_43e90c,
  v_6e0fd3,
  v_94302c,
  v_e9396c = 1,
): Promise<void> {
  if (!v_43e90c || !v_6e0fd3) return;
  const v_c8b83f = v_dff7c1[v_94302c];
  try {
    await v_c9c489.DB
      .prepare(
        `INSERT INTO user_clone_interactions (user_id, clone_id, ${v_c8b83f})
         VALUES (?, ?, ?)
         ON CONFLICT(user_id, clone_id) DO UPDATE
            SET ${v_c8b83f} = ${v_c8b83f} + excluded.${v_c8b83f},
                last_at = CURRENT_TIMESTAMP`,
      )
      .bind(v_43e90c, v_6e0fd3, v_e9396c)
      .run();
  } catch (v_49263d) {
    console.warn(`[interactions] bump ${v_94302c} failed:`, (v_49263d as Error).message);
  }
}

export async function v_1ad6ed(
  env: v_273a0c,
  v_43e90c,
  v_6e0fd3,
  v_94302c,
  v_2a320e,
): Promise<{ bumped: boolean }> {
  if (!v_43e90c || !v_6e0fd3) return { bumped: false };
  const v_b24339 = `interact:${v_94302c}:${v_43e90c}:${v_6e0fd3}`;
  try {
    const v_110a8b = await v_c9c489.KV_RATE.get(v_b24339);
    if (v_110a8b) return { bumped: false };
    await v_c9c489.KV_RATE.put(v_b24339, "1", { expirationTtl: v_2a320e });
    await v_dd9d7c(v_c9c489, v_43e90c, v_6e0fd3, v_94302c);
    return { bumped: true };
  } catch (v_49263d) {
    console.warn(
      `[interactions] throttled bump ${v_94302c} failed:`,
      (v_49263d as Error).message,
    );
    return { bumped: false };
  }
}

export function v_4d20a8(v_c83285): number {
  if (v_c83285 <= 0) return 0;
  return Math.min(100, Math.floor(v_c83285 * 2));
}

export const v_9cb764 = 15;

export const v_b27eeb = 100;

export const v_7cdbac = 4;

export const v_cf0463 = {
  chat: 1,
  call: 15,
  learn: 2,
  feed: 2,
} as const;

export const v_22b4d2 = 1200;

function v_fc5b77(v_5c2f9f = new Date()): string {
  const v_a8a114 = new Date(v_5c2f9f.getTime() + 9 * 60 * 60 * 1000);
  const v_64877a = v_a8a114.getUTCFullYear();
  const v_35f85c = String(v_a8a114.getUTCMonth() + 1).padStart(2, "0");
  const v_d5dda0 = String(v_a8a114.getUTCDate()).padStart(2, "0");
  return `${v_64877a}${v_35f85c}${v_d5dda0}`;
}

export async function v_721d54(
  env: v_273a0c,
  v_43e90c,
  v_6e0fd3,
  v_740dd8,
  v_9b064f,
  v_c09aa8,
): Promise<{ applied: number; dailyRemaining: number }> {
  if (!v_43e90c || !v_6e0fd3 || v_740dd8 <= 0) {
    return { applied: 0, dailyRemaining: v_9cb764 };
  }
  const v_4918a3 = `intimacy_daily:${v_43e90c}:${v_6e0fd3}:${v_fc5b77()}`;
  try {
    const v_e89bae = await v_c9c489.KV_RATE.get(v_4918a3);
    const v_840d49 = v_e89bae ? Number(v_e89bae) : 0;
    const v_179598 = Math.max(0, v_9cb764 - v_840d49);
    if (v_179598 <= 0) {
      return { applied: 0, dailyRemaining: 0 };
    }
    const v_cdef5f = Math.min(v_740dd8, v_179598);

    await v_c9c489.DB
      .prepare(
        `INSERT INTO user_clone_interactions (user_id, clone_id, intimacy_score)
         VALUES (?, ?, ?)
         ON CONFLICT(user_id, clone_id) DO UPDATE
            SET intimacy_score = MIN(${v_b27eeb}, intimacy_score + excluded.intimacy_score),
                last_at = CURRENT_TIMESTAMP`,
      )
      .bind(v_43e90c, v_6e0fd3, v_cdef5f)
      .run();

    await v_c9c489.KV_RATE.put(v_4918a3, String(v_840d49 + v_cdef5f), {
      expirationTtl: 26 * 60 * 60,
    });

    try {
      await v_c9c489.DB
        .prepare(
          `INSERT INTO intimacy_events (user_id, clone_id, action, score, feed_id)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .bind(v_43e90c, v_6e0fd3, v_9b064f, v_cdef5f, v_c09aa8 ?? null)
        .run();
    } catch (v_4e67d8) {
      console.warn(
        `[interactions] event log failed:`,
        (v_4e67d8 as Error).message,
      );
    }

    await v_33d48f(v_c9c489, {
      actorId: v_43e90c,
      cloneId: v_6e0fd3,
      action: v_9b064f,
      score: v_cdef5f,
    });

    return { applied: v_cdef5f, dailyRemaining: v_179598 - v_cdef5f };
  } catch (v_49263d) {
    console.warn(
      `[interactions] addIntimacyScore failed:`,
      (v_49263d as Error).message,
    );
    return { applied: 0, dailyRemaining: v_9cb764 };
  }
}

const v_418c2e = new Set<number>([9007]);

export async function v_70d294(
  env: v_273a0c,
  v_43e90c,
  v_6e0fd3,
  v_40c855,
): Promise<{ crossedThreshold: boolean; scoreApplied: number; totalSeconds: number }> {
  if (!v_43e90c || !v_6e0fd3 || v_40c855 <= 0) {
    return { crossedThreshold: false, scoreApplied: 0, totalSeconds: 0 };
  }

  if (v_418c2e.has(v_43e90c)) {
    console.log(`[T-250 test] direct +1 for user=${v_43e90c} clone=${v_6e0fd3} dur=${v_40c855}`);
    const v_cb35cb = await v_721d54(v_c9c489, v_43e90c, v_6e0fd3, 1, "call");
    console.log(`[T-250 test] addIntimacyScore result applied=${v_cb35cb.applied} remaining=${v_cb35cb.dailyRemaining}`);
    return {
      crossedThreshold: v_cb35cb.applied > 0,
      scoreApplied: v_cb35cb.applied,
      totalSeconds: v_40c855,
    };
  }
  const v_b24339 = `intimacy_call_total:${v_43e90c}:${v_6e0fd3}:${v_fc5b77()}`;
  let v_2dadc1 = 0;
  let v_b8f4d0 = v_40c855;
  try {
    const v_c1b1f6 = await v_c9c489.KV_RATE.get(v_b24339);
    v_2dadc1 = v_c1b1f6 ? Number(v_c1b1f6) : 0;
    v_b8f4d0 = v_2dadc1 + v_40c855;
    await v_c9c489.KV_RATE.put(v_b24339, String(v_b8f4d0), { expirationTtl: 26 * 60 * 60 });
  } catch (v_49263d) {
    console.warn(`[interactions] addCallIntimacyDaily KV failed:`, (v_49263d as Error).message);
    return { crossedThreshold: false, scoreApplied: 0, totalSeconds: v_b8f4d0 };
  }
  const v_75fa40 =
    v_2dadc1 < v_22b4d2 && v_b8f4d0 >= v_22b4d2;
  if (!v_75fa40) {
    return { crossedThreshold: false, scoreApplied: 0, totalSeconds: v_b8f4d0 };
  }
  const v_cb35cb = await v_721d54(v_c9c489, v_43e90c, v_6e0fd3, v_cf0463.call, "call");
  return { crossedThreshold: true, scoreApplied: v_cb35cb.applied, totalSeconds: v_b8f4d0 };
}

export async function v_6f97bc(
  env: v_273a0c,
  v_43e90c,
  v_6e0fd3,
  v_c09aa8,
  v_740dd8,
): Promise<{ applied: number }> {
  if (!v_43e90c || !v_6e0fd3 || !v_c09aa8 || v_740dd8 <= 0) return { applied: 0 };
  const v_b24339 = `intimacy_feed:${v_43e90c}:${v_6e0fd3}:${v_c09aa8}`;
  try {
    const v_db465b = await v_c9c489.KV_RATE.get(v_b24339);
    const v_87cbd5 = v_db465b ? Number(v_db465b) : 0;
    const v_15064d = Math.max(0, v_7cdbac - v_87cbd5);
    if (v_15064d <= 0) return { applied: 0 };
    const v_19dc48 = Math.min(v_740dd8, v_15064d);
    const { applied: v_cdef5f } = await v_721d54(
      v_c9c489,
      v_43e90c,
      v_6e0fd3,
      v_19dc48,
      "feed",
      v_c09aa8,
    );
    if (v_cdef5f > 0) {
      await v_c9c489.KV_RATE.put(v_b24339, String(v_87cbd5 + v_cdef5f), {
        expirationTtl: 30 * 24 * 60 * 60, 
      });
    }
    return { applied: v_cdef5f };
  } catch (v_49263d) {
    console.warn(
      `[interactions] addPerFeedIntimacyScore failed:`,
      (v_49263d as Error).message,
    );
    return { applied: 0 };
  }
}
