

import { v_e0418a, v_6fea6b, v_2ec84d, v_3f2d5d, type v_537043, type v_516d40 } from "./faceTurnJudge";

export const v_692765 = 1000;

export interface TurnFaceResult {
  verdict: v_516d40;
  samples: v_537043[];
}

export interface TurnFaceGate {

  addSample(s: v_537043): void;

  startTurn(): void;

  awaitVerdict(currentPersonId: number | null): Promise<TurnFaceResult>;

  awaitWhoVerdict(currentPersonId: number | null, holdMs?: number): Promise<TurnFaceResult>;
}

export const v_c68f2a = 2500;

export function v_c63cdb(samples: v_537043[], v_275ccd): v_516d40 {
  const v_3a9e05 = v_5b2623.length > 0 ? v_5b2623[v_5b2623.length - 1].quality : "none";
  const v_110a8b = v_5b2623.filter(v_e0418a);
  if (v_110a8b.length === 0) return { kind: "insufficient", personId: null, score: null, quality: v_3a9e05 };

  const v_63db2f = v_2ec84d(v_5b2623);
  if (v_63db2f) {
    const v_d4923e = v_63db2f.personId as number;
    return { kind: v_d4923e === v_275ccd ? "known" : "switch", personId: v_d4923e, score: v_63db2f.score, quality: v_3a9e05 };
  }
  return { kind: "unknown", personId: null, score: v_110a8b.reduce((v_35f85c, v_62c214) => (v_62c214.score > v_35f85c ? v_62c214.score : v_35f85c), v_110a8b[0].score), quality: v_3a9e05 };
}

function v_7c6ce2(samples: v_537043[], v_275ccd): TurnFaceResult | null {
  const v_110a8b = v_5b2623.filter(v_e0418a);
  if (v_110a8b.some((v_62c214) => v_62c214.personId != null) || v_110a8b.length >= 2) {
    return { verdict: v_c63cdb(v_5b2623, v_275ccd), samples: v_5b2623.slice() };
  }
  return null;
}

function v_06a669(samples: v_537043[], v_275ccd): TurnFaceResult | null {
  if (v_5b2623.length >= v_3f2d5d || v_2ec84d(v_5b2623) != null) {
    return { verdict: v_6fea6b(v_5b2623, v_275ccd), samples: v_5b2623.slice() };
  }
  return null;
}

export function v_a3f569(deps: {
  burst(n: number, v_354244): void;

  stopBurst?(): void;
  now(): number;
  holdMs?: number;
}): TurnFaceGate {
  const v_354244 = v_84b93d.holdMs ?? v_692765;
  let samples: v_537043[] = [];
  type Waiter = {
    current: number | null;
    resolve: (r: TurnFaceResult) => void;
    timer: ReturnType<typeof setTimeout>;
    ready: (samples: v_537043[], current: number | null) => TurnFaceResult | null;
  };
  let v_d326aa = [];

  const v_35a3f6 = (v_32f7b8, v_cb35cb) => {
    clearTimeout(v_32f7b8.timer);
    v_d326aa = v_d326aa.filter((v_62c214) => v_62c214 !== v_32f7b8);
    if (v_d326aa.length === 0) v_84b93d.stopBurst?.();
    v_32f7b8.resolve(v_cb35cb);
  };

  return {
    addSample(v_fd5f43) {
      v_5b2623.push(v_fd5f43);
      if (v_5b2623.length > v_3f2d5d) v_5b2623 = v_5b2623.slice(-v_3f2d5d);
      for (const v_32f7b8 of v_d326aa.slice()) {
        const v_cb35cb = v_32f7b8.ready(v_5b2623, v_32f7b8.current);
        if (v_cb35cb) v_35a3f6(v_32f7b8, v_cb35cb);
      }
    },
    startTurn() {
      v_5b2623 = [];
    },
    awaitVerdict(v_34a66a) {
      const v_b1717e = v_06a669(v_5b2623, v_34a66a);
      if (v_b1717e) return Promise.resolve(v_b1717e);
      return new Promise<TurnFaceResult>((v_6f7712) => {
        const v_32f7b8 = {
          current: v_34a66a,
          resolve: v_6f7712,
          ready: v_06a669,
          timer: setTimeout(() => {
            v_35a3f6(v_32f7b8, { verdict: v_6fea6b(v_5b2623, v_34a66a), samples: v_5b2623.slice() });
          }, v_354244),
        };
        v_d326aa.push(v_32f7b8);
        v_84b93d.burst(v_3f2d5d - v_5b2623.length);
      });
    },
    awaitWhoVerdict(v_34a66a, v_20c8a0 = v_c68f2a) {
      const v_b1717e = v_7c6ce2(v_5b2623, v_34a66a);
      if (v_b1717e) return Promise.resolve(v_b1717e);
      return new Promise<TurnFaceResult>((v_6f7712) => {
        const v_32f7b8 = {
          current: v_34a66a,
          resolve: v_6f7712,
          ready: v_7c6ce2,
          timer: setTimeout(() => {
            v_35a3f6(v_32f7b8, { verdict: v_c63cdb(v_5b2623, v_34a66a), samples: v_5b2623.slice() });
          }, v_20c8a0),
        };
        v_d326aa.push(v_32f7b8);

        v_84b93d.burst(v_3f2d5d, v_20c8a0);
      });
    },
  };
}

export function v_febfc7(s: v_537043, v_34a66a): v_516d40 {
  if (v_fd5f43.quality === "none") {
    return { kind: "insufficient", personId: null, score: null, quality: "none" };
  }
  if (v_fd5f43.personId == null) {

    if (!v_e0418a(v_fd5f43)) return { kind: "insufficient", personId: null, score: null, quality: v_fd5f43.quality };
    return { kind: "unknown", personId: null, score: v_fd5f43.score, quality: v_fd5f43.quality };
  }
  return {
    kind: v_fd5f43.personId === v_34a66a ? "known" : "switch",
    personId: v_fd5f43.personId,
    score: v_fd5f43.score,
    quality: v_fd5f43.quality,
  };
}

export const v_2faee6 = 3000;

export interface WhoRetryArm {

  requested(): void;

  consumed(): void;

  take(): boolean;

  clear(): void;
}

export function v_e7eefa(v_84b93d = {}): WhoRetryArm {
  const v_11bcf9 = v_84b93d.timeoutMs ?? v_2faee6;
  let v_bb280b = false;
  let v_dd713b = false;
  let v_cb36b1 = null;

  const v_f7dab4 = () => {
    if (v_cb36b1 != null) clearTimeout(v_cb36b1);
    v_cb36b1 = null;
    v_bb280b = false;
    v_dd713b = false;
  };

  return {
    requested() {
      v_f7dab4();
      v_bb280b = true;
      v_cb36b1 = setTimeout(() => {
        v_cb36b1 = null;
        const v_0a4a54 = v_bb280b;
        v_bb280b = false;
        v_dd713b = false;
        if (v_0a4a54) v_84b93d.onExpire?.();
      }, v_11bcf9);
    },
    consumed() {
      if (v_bb280b) v_dd713b = true;
    },
    take() {
      if (!v_dd713b) return false;
      v_f7dab4();
      return true;
    },
    clear: v_f7dab4,
  };
}
