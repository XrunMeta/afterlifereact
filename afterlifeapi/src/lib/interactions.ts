

import type { Bindings } from "./env";
import { notifyIntimacyScore } from "./notify";

type InteractionKind = "chat" | "call" | "learn" | "feed";

const KIND_COL: Record<InteractionKind, string> = {
  chat: "chat_count",
  call: "call_count",
  learn: "learn_count",
  feed: "feed_count",
};

export async function bumpInteraction(
  env: Bindings,
  userId: number,
  cloneId: number,
  kind: InteractionKind,
  delta = 1,
): Promise<void> {
  if (!userId || !cloneId) return;
  const col = KIND_COL[kind];
  try {
    await env.DB
      .prepare(
        `INSERT INTO user_clone_interactions (user_id, clone_id, ${col})
         VALUES (?, ?, ?)
         ON CONFLICT(user_id, clone_id) DO UPDATE
            SET ${col} = ${col} + excluded.${col},
                last_at = CURRENT_TIMESTAMP`,
      )
      .bind(userId, cloneId, delta)
      .run();
  } catch (err) {
    console.warn(`[interactions] bump ${kind} failed:`, (err as Error).message);
  }
}

export async function bumpInteractionThrottled(
  env: Bindings,
  userId: number,
  cloneId: number,
  kind: InteractionKind,
  cooldownSec: number,
): Promise<{ bumped: boolean }> {
  if (!userId || !cloneId) return { bumped: false };
  const key = `interact:${kind}:${userId}:${cloneId}`;
  try {
    const seen = await env.KV_RATE.get(key);
    if (seen) return { bumped: false };
    await env.KV_RATE.put(key, "1", { expirationTtl: cooldownSec });
    await bumpInteraction(env, userId, cloneId, kind);
    return { bumped: true };
  } catch (err) {
    console.warn(
      `[interactions] throttled bump ${kind} failed:`,
      (err as Error).message,
    );
    return { bumped: false };
  }
}

export function deriveIntimacyTemp(total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.floor(total * 2));
}

export const INTIMACY_DAILY_CAP = 15;

export const INTIMACY_MAX = 100;

export const INTIMACY_PER_FEED_CAP = 4;

export const INTIMACY_WEIGHTS = {
  chat: 1,
  call: 15,
  learn: 2,
  feed: 2,
} as const;

export const CALL_MIN_SECONDS_FOR_SCORE = 1200;

function kstDateYYYYMMDD(now: Date = new Date()): string {
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(kst.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

export async function addIntimacyScore(
  env: Bindings,
  userId: number,
  cloneId: number,
  score: number,
  action: InteractionKind,
  feedId?: number,
): Promise<{ applied: number; dailyRemaining: number }> {
  if (!userId || !cloneId || score <= 0) {
    return { applied: 0, dailyRemaining: INTIMACY_DAILY_CAP };
  }
  const dailyKey = `intimacy_daily:${userId}:${cloneId}:${kstDateYYYYMMDD()}`;
  try {
    const dailyUsedRaw = await env.KV_RATE.get(dailyKey);
    const dailyUsed = dailyUsedRaw ? Number(dailyUsedRaw) : 0;
    const dailyRemaining = Math.max(0, INTIMACY_DAILY_CAP - dailyUsed);
    if (dailyRemaining <= 0) {
      return { applied: 0, dailyRemaining: 0 };
    }
    const applied = Math.min(score, dailyRemaining);

    await env.DB
      .prepare(
        `INSERT INTO user_clone_interactions (user_id, clone_id, intimacy_score)
         VALUES (?, ?, ?)
         ON CONFLICT(user_id, clone_id) DO UPDATE
            SET intimacy_score = MIN(${INTIMACY_MAX}, intimacy_score + excluded.intimacy_score),
                last_at = CURRENT_TIMESTAMP`,
      )
      .bind(userId, cloneId, applied)
      .run();

    await env.KV_RATE.put(dailyKey, String(dailyUsed + applied), {
      expirationTtl: 26 * 60 * 60,
    });

    try {
      await env.DB
        .prepare(
          `INSERT INTO intimacy_events (user_id, clone_id, action, score, feed_id)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .bind(userId, cloneId, action, applied, feedId ?? null)
        .run();
    } catch (logErr) {
      console.warn(
        `[interactions] event log failed:`,
        (logErr as Error).message,
      );
    }

    await notifyIntimacyScore(env, {
      actorId: userId,
      cloneId,
      action,
      score: applied,
    });

    return { applied, dailyRemaining: dailyRemaining - applied };
  } catch (err) {
    console.warn(
      `[interactions] addIntimacyScore failed:`,
      (err as Error).message,
    );
    return { applied: 0, dailyRemaining: INTIMACY_DAILY_CAP };
  }
}

const INTIMACY_CALL_TEST_USER_IDS = new Set<number>([9007]);

export async function addCallIntimacyDaily(
  env: Bindings,
  userId: number,
  cloneId: number,
  durationSeconds: number,
): Promise<{ crossedThreshold: boolean; scoreApplied: number; totalSeconds: number }> {
  if (!userId || !cloneId || durationSeconds <= 0) {
    return { crossedThreshold: false, scoreApplied: 0, totalSeconds: 0 };
  }

  if (INTIMACY_CALL_TEST_USER_IDS.has(userId)) {
    console.log(`[T-250 test] direct +1 for user=${userId} clone=${cloneId} dur=${durationSeconds}`);
    const r = await addIntimacyScore(env, userId, cloneId, 1, "call");
    console.log(`[T-250 test] addIntimacyScore result applied=${r.applied} remaining=${r.dailyRemaining}`);
    return {
      crossedThreshold: r.applied > 0,
      scoreApplied: r.applied,
      totalSeconds: durationSeconds,
    };
  }
  const key = `intimacy_call_total:${userId}:${cloneId}:${kstDateYYYYMMDD()}`;
  let oldTotal = 0;
  let newTotal = durationSeconds;
  try {
    const oldRaw = await env.KV_RATE.get(key);
    oldTotal = oldRaw ? Number(oldRaw) : 0;
    newTotal = oldTotal + durationSeconds;
    await env.KV_RATE.put(key, String(newTotal), { expirationTtl: 26 * 60 * 60 });
  } catch (err) {
    console.warn(`[interactions] addCallIntimacyDaily KV failed:`, (err as Error).message);
    return { crossedThreshold: false, scoreApplied: 0, totalSeconds: newTotal };
  }
  const crossed =
    oldTotal < CALL_MIN_SECONDS_FOR_SCORE && newTotal >= CALL_MIN_SECONDS_FOR_SCORE;
  if (!crossed) {
    return { crossedThreshold: false, scoreApplied: 0, totalSeconds: newTotal };
  }
  const r = await addIntimacyScore(env, userId, cloneId, INTIMACY_WEIGHTS.call, "call");
  return { crossedThreshold: true, scoreApplied: r.applied, totalSeconds: newTotal };
}

async function addCallIntimacyDailyD1(
  env: Bindings,
  userId: number,
  cloneId: number,
): Promise<{ crossedThreshold: boolean; scoreApplied: number; totalSeconds: number }> {

  const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const kstMidnightUtcMs =
    Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate()) -
    9 * 60 * 60 * 1000;

  const todayIsoStart = new Date(kstMidnightUtcMs)
    .toISOString()
    .replace("T", " ")
    .slice(0, 19);

  try {

    const totalRow = await env.DB
      .prepare(
        `SELECT COALESCE(SUM(duration_sec), 0) AS total
           FROM call_sessions
          WHERE user_id = ? AND clone_id = ? AND started_at >= ?`,
      )
      .bind(userId, cloneId, kstMidnightUtcMs)
      .first<{ total: number }>();
    const totalSec = Math.floor(Number(totalRow?.total ?? 0));
    const minutesAccrued = Math.floor(totalSec / 60);

    const awardedRow = await env.DB
      .prepare(
        `SELECT COALESCE(SUM(score), 0) AS awarded
           FROM intimacy_events
          WHERE user_id = ? AND clone_id = ? AND action = 'call' AND created_at >= ?`,
      )
      .bind(userId, cloneId, todayIsoStart)
      .first<{ awarded: number }>();
    const alreadyAwarded = Number(awardedRow?.awarded ?? 0);

    const remainingCap = Math.max(0, INTIMACY_DAILY_CAP - alreadyAwarded);
    const toAward = Math.max(0, Math.min(minutesAccrued - alreadyAwarded, remainingCap));

    if (toAward <= 0) {
      return { crossedThreshold: false, scoreApplied: 0, totalSeconds: totalSec };
    }

    let totalApplied = 0;
    for (let i = 0; i < toAward; i++) {
      const r = await addIntimacyScore(env, userId, cloneId, 1, "call");
      totalApplied += r.applied;
      if (r.applied === 0) break; 
    }
    return {
      crossedThreshold: totalApplied > 0,
      scoreApplied: totalApplied,
      totalSeconds: totalSec,
    };
  } catch (err) {
    console.warn(
      `[interactions] addCallIntimacyDailyD1 failed:`,
      (err as Error).message,
    );
    return { crossedThreshold: false, scoreApplied: 0, totalSeconds: 0 };
  }
}

export async function addPerFeedIntimacyScore(
  env: Bindings,
  userId: number,
  cloneId: number,
  feedId: number,
  score: number,
): Promise<{ applied: number }> {
  if (!userId || !cloneId || !feedId || score <= 0) return { applied: 0 };
  const key = `intimacy_feed:${userId}:${cloneId}:${feedId}`;
  try {
    const usedRaw = await env.KV_RATE.get(key);
    const used = usedRaw ? Number(usedRaw) : 0;
    const perFeedRemaining = Math.max(0, INTIMACY_PER_FEED_CAP - used);
    if (perFeedRemaining <= 0) return { applied: 0 };
    const candidate = Math.min(score, perFeedRemaining);
    const { applied } = await addIntimacyScore(
      env,
      userId,
      cloneId,
      candidate,
      "feed",
      feedId,
    );
    if (applied > 0) {
      await env.KV_RATE.put(key, String(used + applied), {
        expirationTtl: 30 * 24 * 60 * 60, 
      });
    }
    return { applied };
  } catch (err) {
    console.warn(
      `[interactions] addPerFeedIntimacyScore failed:`,
      (err as Error).message,
    );
    return { applied: 0 };
  }
}
