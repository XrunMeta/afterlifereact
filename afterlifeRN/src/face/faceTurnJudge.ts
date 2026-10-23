

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

export function v_6fea6b(v_5b2623, v_34a66a): TurnVerdict {
  const v_506e86 = v_5b2623.length > 0 ? v_5b2623[v_5b2623.length - 1] : null;
  const lastQuality: v_13de12 = v_506e86 ? v_506e86.quality : "none";

  if (v_5b2623.length < v_3f2d5d) {
    return { kind: "insufficient", personId: null, score: null, quality: v_3a9e05 };
  }

  const v_4cd692 = v_5b2623.slice(-v_3f2d5d);
  const v_ea719c = v_4cd692[0].personId;

  if (v_4cd692.every((v_62c214) => v_62c214.personId === null)) {
    if (v_4cd692.every(v_e0418a)) {
      return { kind: "unknown", personId: null, score: v_29757a(v_4cd692), quality: v_3a9e05 };
    }
    return { kind: "insufficient", personId: null, score: null, quality: v_3a9e05 };
  }

  if (v_ea719c !== null && v_4cd692.every((v_62c214) => v_62c214.personId === v_ea719c)) {
    return {
      kind: v_ea719c === v_34a66a ? "known" : "switch",
      personId: v_ea719c,
      score: v_29757a(v_4cd692),
      quality: v_3a9e05,
    };
  }

  if (v_34a66a !== null) {
    const v_e4f965 = v_4cd692.filter((v_62c214) => v_62c214.personId === v_34a66a);
    return {
      kind: "known",
      personId: v_34a66a,
      score: v_29757a(v_e4f965),
      quality: v_3a9e05,
    };
  }
  return { kind: "insufficient", personId: null, score: null, quality: v_3a9e05 };
}
