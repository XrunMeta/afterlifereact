

import { v_6fea6b, v_3f2d5d, type v_537043, type v_516d40 } from "./faceTurnJudge";

export const v_692765 = 1000;

export interface TurnFaceResult {
  verdict: v_516d40;
  samples: v_537043[];
}

export interface TurnFaceGate {

  addSample(s: v_537043): void;

  startTurn(): void;

  awaitVerdict(currentPersonId: number | null): Promise<TurnFaceResult>;
}

function v_e3b24b(samples: v_537043[], v_275ccd): v_516d40 | null {
  if (v_275ccd == null || v_5b2623.length === 0) return null;
  const v_1c1268 = v_5b2623.filter((v_62c214) => v_62c214.personId === v_275ccd);
  if (v_1c1268.length === 0) return null;
  return {
    kind: "known",
    personId: v_275ccd,
    score: v_1c1268.reduce((v_35f85c, v_62c214) => (v_62c214.score > v_35f85c ? v_62c214.score : v_35f85c), v_1c1268[0].score),
    quality: v_5b2623[v_5b2623.length - 1].quality,
  };
}

function v_03a5b0(samples: v_537043[], v_275ccd): v_516d40 | null {
  if (v_275ccd != null) return null;
  const v_110a8b = v_5b2623.filter((v_62c214) => v_62c214.quality !== "none");
  if (v_110a8b.length === 0) return null;
  const v_e2a85c = v_110a8b[0].personId;
  if (v_e2a85c == null || !v_110a8b.every((v_62c214) => v_62c214.personId === v_e2a85c)) return null;
  return {
    kind: "switch",
    personId: v_e2a85c,
    score: v_110a8b.reduce((v_35f85c, v_62c214) => (v_62c214.score > v_35f85c ? v_62c214.score : v_35f85c), v_110a8b[0].score),
    quality: v_5b2623[v_5b2623.length - 1].quality,
  };
}

function v_06a669(samples: v_537043[], v_275ccd): TurnFaceResult | null {
  if (v_5b2623.length >= v_3f2d5d) {
    return { verdict: v_6fea6b(v_5b2623, v_275ccd), samples: v_5b2623.slice() };
  }
  const v_2857fe = v_e3b24b(v_5b2623, v_275ccd) ?? v_03a5b0(v_5b2623, v_275ccd);
  return v_2857fe ? { verdict: v_2857fe, samples: v_5b2623.slice() } : null;
}

export function v_a3f569(v_84b93d): TurnFaceGate {
  const v_354244 = v_84b93d.holdMs ?? v_692765;
  let samples: v_537043[] = [];
  type Waiter = {
    current: number | null;
    resolve: (r: TurnFaceResult) => void;
    timer: ReturnType<typeof setTimeout>;
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
        const v_cb35cb = v_06a669(v_5b2623, v_32f7b8.current);
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
          timer: setTimeout(() => {
            v_35a3f6(v_32f7b8, { verdict: v_6fea6b(v_5b2623, v_34a66a), samples: v_5b2623.slice() });
          }, v_354244),
        };
        v_d326aa.push(v_32f7b8);
        v_84b93d.burst(v_3f2d5d - v_5b2623.length);
      });
    },
  };
}

export function v_febfc7(s: v_537043, v_34a66a): v_516d40 {
  if (v_fd5f43.quality === "none") {
    return { kind: "insufficient", personId: null, score: null, quality: "none" };
  }
  if (v_fd5f43.personId == null) {
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
