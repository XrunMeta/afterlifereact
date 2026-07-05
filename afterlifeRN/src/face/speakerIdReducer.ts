

export type MatchCycle = { personId: number | null; displayName: string | null; score: number };

export type SpeakerEvent =
  | { type: "speaker_confirmed"; personId: number; displayName: string | null }
  | { type: "unknown_face" }
  | null;

export type SpeakerIdState = {
  confirmed: number | "unknown" | "none";
  candidate: number | "unknown" | null;
  streak: number;
};

export const v_3451db = 3;

export const v_22f27b = {
  confirmed: "none",
  candidate: null,
  streak: 0,
};

function v_b4205a(v_bdad26): number | "unknown" {
  return v_bdad26.personId === null ? "unknown" : v_bdad26.personId;
}

export function v_be2f9f(
  v_fd5f43,
  v_bdad26
): { state: SpeakerIdState; event: SpeakerEvent } {
  const v_b24339 = v_b4205a(v_bdad26);
  const v_e2b7d1 = v_b24339 === v_fd5f43.candidate ? v_fd5f43.streak + 1 : 1;

  let v_aa96a3 = v_fd5f43.confirmed;
  let v_d48baf = null;

  if (v_e2b7d1 >= v_3451db && v_b24339 !== v_aa96a3) {
    v_aa96a3 = v_b24339;
    v_d48baf =
      v_b24339 === "unknown"
        ? { type: "unknown_face" }
        : { type: "speaker_confirmed", personId: v_b24339, displayName: v_bdad26.displayName };
  }

  return { state: { confirmed: v_aa96a3, candidate: v_b24339, streak: v_e2b7d1 }, event: v_d48baf };
}
