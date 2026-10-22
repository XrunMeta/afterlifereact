

import { v_3f2d5d, type v_537043, type v_516d40 } from "./faceTurnJudge";

export const v_692765 = 1000;

export interface TurnFaceGate {

  addSample(s: v_537043): void;

  startTurn(): void;

  awaitReady(): Promise<v_537043[]>;
}

export function v_a3f569(v_84b93d): TurnFaceGate {
  const v_354244 = v_84b93d.holdMs ?? v_692765;
  let samples: v_537043[] = [];
  type Waiter = { resolve: (s: v_537043[]) => void; timer: ReturnType<typeof setTimeout> };
  let v_d326aa = [];

  const v_b6e358 = () => {
    const v_86f5f6 = v_d326aa;
    v_d326aa = [];
    for (const v_32f7b8 of v_86f5f6) {
      clearTimeout(v_32f7b8.timer);
      v_32f7b8.resolve(v_5b2623.slice());
    }
  };

  return {
    addSample(v_fd5f43) {
      v_5b2623.push(v_fd5f43);
      if (v_5b2623.length > v_3f2d5d) v_5b2623 = v_5b2623.slice(-v_3f2d5d);
      if (v_5b2623.length >= v_3f2d5d && v_d326aa.length > 0) v_b6e358();
    },
    startTurn() {
      v_5b2623 = [];
    },
    awaitReady() {
      if (v_5b2623.length >= v_3f2d5d) return Promise.resolve(v_5b2623.slice());
      return new Promise<v_537043[]>((v_6f7712) => {
        const v_32f7b8 = {
          resolve: v_6f7712,
          timer: setTimeout(() => {
            v_d326aa = v_d326aa.filter((v_62c214) => v_62c214 !== v_32f7b8);
            v_6f7712(v_5b2623.slice());
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
