

export type MatchCycle = { personId: number | null; displayName: string | null; score: number; topPersonId?: number | null };

export type ResetRecognitionAction = { type: "RESET_RECOGNITION" };

export type SpeakerIdAction = MatchCycle | ResetRecognitionAction;

export type SpeakerEvent =
  | { type: "speaker_confirmed"; personId: number; displayName: string | null }

  | { type: "unknown_face"; score: number; topPersonId?: number | null }
  | null;

export type SpeakerIdState = {
  confirmed: number | "unknown" | "none";
  candidate: number | "unknown" | null;
  streak: number;

  lastUnknownEmitMs: number | null;
};

export const CONFIRM_STREAK = 1;

export const UNKNOWN_FACE_REEMIT_MS = 3_000;

export const INITIAL_SPEAKER_STATE: SpeakerIdState = {
  confirmed: "none",
  candidate: null,
  streak: 0,
  lastUnknownEmitMs: null,
};

function candidateKeyOf(cycle: MatchCycle): number | "unknown" {
  return cycle.personId === null ? "unknown" : cycle.personId;
}

export function speakerIdReducer(
  s: SpeakerIdState,
  action: SpeakerIdAction,
  nowMs: number
): { state: SpeakerIdState; event: SpeakerEvent } {
  if ("type" in action && action.type === "RESET_RECOGNITION") {

    return { state: INITIAL_SPEAKER_STATE, event: null };
  }

  const cycle = action as MatchCycle;
  const key = candidateKeyOf(cycle);
  const streak = key === s.candidate ? s.streak + 1 : 1;

  let confirmed = s.confirmed;
  let lastUnknownEmitMs = s.lastUnknownEmitMs;
  let event: SpeakerEvent = null;

  if (streak >= CONFIRM_STREAK) {
    if (key !== confirmed) {
      confirmed = key;
      if (key === "unknown") {

        event = { type: "unknown_face", score: cycle.score, topPersonId: cycle.topPersonId ?? null };
        lastUnknownEmitMs = nowMs;
      } else {
        event = { type: "speaker_confirmed", personId: key, displayName: cycle.displayName };

        lastUnknownEmitMs = null;
      }
    } else if (
      key === "unknown" &&
      lastUnknownEmitMs !== null &&
      nowMs - lastUnknownEmitMs >= UNKNOWN_FACE_REEMIT_MS
    ) {

      event = { type: "unknown_face", score: cycle.score, topPersonId: cycle.topPersonId ?? null };
      lastUnknownEmitMs = nowMs;
    }
  }

  return { state: { confirmed, candidate: key, streak, lastUnknownEmitMs }, event };
}
