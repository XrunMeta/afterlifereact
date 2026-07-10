

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
