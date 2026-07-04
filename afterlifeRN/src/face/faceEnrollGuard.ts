

export interface EnrollSuggestGuardInput {

  enrolling: boolean;

  pendingPersonId: number | null;

  incomingName: string;

  lastName: string;
}

export function v_19be88(v_bbda62): boolean {
  if (v_bbda62.enrolling) return false;
  return v_bbda62.pendingPersonId != null && v_bbda62.incomingName !== v_bbda62.lastName;
}
