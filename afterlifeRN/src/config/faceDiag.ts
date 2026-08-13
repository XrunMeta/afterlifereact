
import { CONFIRM_STREAK } from "../face/speakerIdReducer";

export type FaceVerdict = "confirmed" | "unknown" | "candidate" | "none";

export interface FaceDiag {
  score: number;
  personId: number | null;
  displayName: string | null;
  streak: number;
  verdict: FaceVerdict;
  threshold: number;
}

const envFlag = process.env.EXPO_PUBLIC_FACE_DIAG;
export const FACE_DIAG_ENABLED: boolean = envFlag != null ? envFlag === "1" : __DEV__;

export function formatFaceHud(d: FaceDiag): string {
  const who = d.displayName ?? (d.personId != null ? `#${d.personId}` : "-");

  return `face ${d.score.toFixed(3)} ${who} ${d.streak}/${CONFIRM_STREAK} ${d.verdict} thr:${d.threshold}`;
}
