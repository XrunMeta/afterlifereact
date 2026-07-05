
export type FaceVerdict = "confirmed" | "unknown" | "candidate" | "none";

export interface FaceDiag {
  score: number;
  personId: number | null;
  displayName: string | null;
  streak: number;
  verdict: FaceVerdict;
  threshold: number;
}

const v_21cf8a = process.env.EXPO_PUBLIC_FACE_DIAG;
export const v_55dbc4 = v_21cf8a != null ? v_21cf8a === "1" : __DEV__;

export function v_8682a9(v_d5dda0): string {
  const v_97d2e9 = v_d5dda0.displayName ?? (v_d5dda0.personId != null ? `#${v_d5dda0.personId}` : "-");
  return `face ${v_d5dda0.score.toFixed(3)} ${v_97d2e9} ${v_d5dda0.streak}/3 ${v_d5dda0.verdict} thr:${v_d5dda0.threshold}`;
}
