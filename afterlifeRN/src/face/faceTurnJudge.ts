

import type { v_13de12 } from "./faceQuality";

export const v_3f2d5d = 3;

export type TurnSample = {

  personId: number | null;

  score: number;

  quality: v_13de12;

  atMs: number;
};

export type TurnVerdict = {
  kind: "known" | "switch" | "unknown" | "insufficient";
  personId: number | null;
  score: number | null;
  quality: v_13de12;
};

export const v_b4eadd = 0.1;

export function v_e0418a(v_fd5f43): boolean {
  if (v_fd5f43.quality === "none") return false;
  if (v_fd5f43.personId != null) return true;
  return v_fd5f43.quality === "ok" && v_fd5f43.score > v_b4eadd;
}

function v_29757a(v_5b2623): number | null {
  if (v_5b2623.length === 0) return null;
  return v_5b2623.reduce((v_35f85c, v_62c214) => (v_62c214.score > v_35f85c ? v_62c214.score : v_35f85c), v_5b2623[0].score);
}

export function v_2ec84d(v_5b2623): TurnSample | null {
  for (let v_ebec57 = v_5b2623.length - 1; v_ebec57 >= 0; v_ebec57--) {
    const v_62c214 = v_5b2623[v_ebec57];
    if (v_62c214.personId != null && v_e0418a(v_62c214)) return v_62c214;
  }
  return null;
}

export function v_6fea6b(v_5b2623, v_34a66a): TurnVerdict {
  const v_506e86 = v_5b2623.length > 0 ? v_5b2623[v_5b2623.length - 1] : null;
  const lastQuality: v_13de12 = v_506e86 ? v_506e86.quality : "none";

  const v_4cd692 = v_5b2623.slice(-v_3f2d5d);

  if (!v_4cd692.some(v_e0418a)) {
    return { kind: "insufficient", personId: null, score: null, quality: v_3a9e05 };
  }

  const v_63db2f = v_2ec84d(v_4cd692);
  if (v_63db2f) {
    const v_d4923e = v_63db2f.personId as number;
    return {
      kind: v_d4923e === v_34a66a ? "known" : "switch",
      personId: v_d4923e,
      score: v_63db2f.score,
      quality: v_3a9e05,
    };
  }

  if (v_4cd692.length >= v_3f2d5d && v_4cd692.every(v_e0418a)) {
    return { kind: "unknown", personId: null, score: v_29757a(v_4cd692), quality: v_3a9e05 };
  }

  if (v_34a66a !== null) {
    return { kind: "known", personId: v_34a66a, score: null, quality: v_3a9e05 };
  }
  return { kind: "insufficient", personId: null, score: null, quality: v_3a9e05 };
}
