

export type MatchCycle = { personId: number | null; displayName: string | null; score: number };

export type ResetRecognitionAction = { type: "RESET_RECOGNITION" };

export type SpeakerIdAction = MatchCycle | ResetRecognitionAction;

export type SpeakerEvent =
  | { type: "speaker_confirmed"; personId: number; displayName: string | null }

  | { type: "unknown_face"; score: number }
  | null;

export type SpeakerIdState = {
  confirmed: number | "unknown" | "none";
  candidate: number | "unknown" | null;
  streak: number;

  lastUnknownEmitMs: number | null;
};

export const v_3451db = 1;

export const v_fcf2b4 = 10_000;

export const v_22f27b = {
  confirmed: "none",
  candidate: null,
  streak: 0,
  lastUnknownEmitMs: null,
};

function v_b4205a(v_bdad26): number | "unknown" {
  return v_bdad26.personId === null ? "unknown" : v_bdad26.personId;
}

export function v_be2f9f(
  v_fd5f43,
  v_9b064f,
  v_67e77e
): { state: SpeakerIdState; event: SpeakerEvent } {
  if ("type" in v_9b064f && v_9b064f.type === "RESET_RECOGNITION") {

    return { state: v_22f27b, event: null };
  }

  const v_bdad26 = v_9b064f as MatchCycle;
  const v_b24339 = v_b4205a(v_bdad26);
  const v_e2b7d1 = v_b24339 === v_fd5f43.candidate ? v_fd5f43.streak + 1 : 1;

  let v_aa96a3 = v_fd5f43.confirmed;
  let v_f2ea56 = v_fd5f43.lastUnknownEmitMs;
  let v_d48baf = null;

  if (v_e2b7d1 >= v_3451db) {
    if (v_b24339 !== v_aa96a3) {
      v_aa96a3 = v_b24339;
      if (v_b24339 === "unknown") {

        v_d48baf = { type: "unknown_face", score: v_bdad26.score };
        v_f2ea56 = v_67e77e;
      } else {
        v_d48baf = { type: "speaker_confirmed", personId: v_b24339, displayName: v_bdad26.displayName };

        v_f2ea56 = null;
      }
    } else if (
      v_b24339 === "unknown" &&
      v_f2ea56 !== null &&
      v_67e77e - v_f2ea56 >= v_fcf2b4
    ) {

      v_d48baf = { type: "unknown_face", score: v_bdad26.score };
      v_f2ea56 = v_67e77e;
    }
  }

  return { state: { confirmed: v_aa96a3, candidate: v_b24339, streak: v_e2b7d1, lastUnknownEmitMs: v_f2ea56 }, event: v_d48baf };
}
