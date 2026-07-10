

export type EnrollSuggestAction =
  | { kind: "silent" }
  | { kind: "card" }
  | { kind: "reflect_name" }
  | { kind: "ignore" };

export interface EnrollSuggestDecisionInput {

  personId: number | undefined;

  faceBiometricConsent: boolean | null;

  autoEnrolledNoName: boolean;

  enrolling: boolean;
}

export function v_0362e7(v_bbda62): EnrollSuggestAction {
  if (v_bbda62.personId !== undefined) {
    return v_bbda62.autoEnrolledNoName ? { kind: "reflect_name" } : { kind: "ignore" };
  }
  if (v_bbda62.enrolling) return { kind: "ignore" };
  return v_bbda62.faceBiometricConsent === true ? { kind: "silent" } : { kind: "card" };
}

export type OrphanCleanupAction = "delete" | "detach" | "none";

export interface EnrollSuggestCleanupInput {

  enrolling: boolean;

  pendingPersonId: number | null;

  enrolledPersonId: number | null;

  incomingName: string;

  lastName: string;
}

export function v_de73d9(v_bbda62): OrphanCleanupAction {
  if (v_bbda62.enrolling) return "none";
  if (v_bbda62.incomingName === v_bbda62.lastName) return "none";
  if (v_bbda62.pendingPersonId != null) return "delete";
  if (v_bbda62.enrolledPersonId != null) return "detach";
  return "none";
}
