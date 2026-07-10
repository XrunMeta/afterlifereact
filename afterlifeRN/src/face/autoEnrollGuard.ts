

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

export function decideEnrollSuggestAction(input: EnrollSuggestDecisionInput): EnrollSuggestAction {
  if (input.personId !== undefined) {
    return input.autoEnrolledNoName ? { kind: "reflect_name" } : { kind: "ignore" };
  }
  if (input.enrolling) return { kind: "ignore" };
  return input.faceBiometricConsent === true ? { kind: "silent" } : { kind: "card" };
}

export type OrphanCleanupAction = "delete" | "detach" | "none";

export interface EnrollSuggestCleanupInput {

  enrolling: boolean;

  pendingPersonId: number | null;

  enrolledPersonId: number | null;

  incomingName: string;

  lastName: string;
}

export function decideOrphanCleanupBeforeSilent(input: EnrollSuggestCleanupInput): OrphanCleanupAction {
  if (input.enrolling) return "none";
  if (input.incomingName === input.lastName) return "none";
  if (input.pendingPersonId != null) return "delete";
  if (input.enrolledPersonId != null) return "detach";
  return "none";
}
