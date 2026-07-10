

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
