

export type MatchCycle = { personId: number | null; displayName: string | null; score: number };

export type ResetRecognitionAction = { type: "RESET_RECOGNITION" };

export type SpeakerIdAction = MatchCycle | ResetRecognitionAction;

export type SpeakerEvent =
  | { type: "speaker_confirmed"; personId: number; displayName: string | null }
  | { type: "unknown_face" }
  | null;

export type SpeakerIdState = {
  confirmed: number | "unknown" | "none";
  candidate: number | "unknown" | null;
  streak: number;
};

export const CONFIRM_STREAK = 3;

export const INITIAL_SPEAKER_STATE: SpeakerIdState = {
  confirmed: "none",
  candidate: null,
  streak: 0,
};

function candidateKeyOf(cycle: MatchCycle): number | "unknown" {
  return cycle.personId === null ? "unknown" : cycle.personId;
}

export function speakerIdReducer(
  s: SpeakerIdState,
  action: SpeakerIdAction
): { state: SpeakerIdState; event: SpeakerEvent } {
  if ("type" in action && action.type === "RESET_RECOGNITION") {
    return { state: INITIAL_SPEAKER_STATE, event: null };
  }

  const cycle = action as MatchCycle;
  const key = candidateKeyOf(cycle);
  const streak = key === s.candidate ? s.streak + 1 : 1;

  let confirmed = s.confirmed;
  let event: SpeakerEvent = null;

  if (streak >= CONFIRM_STREAK && key !== confirmed) {
    confirmed = key;
    event =
      key === "unknown"
        ? { type: "unknown_face" }
        : { type: "speaker_confirmed", personId: key, displayName: cycle.displayName };
  }

  return { state: { confirmed, candidate: key, streak }, event };
}
