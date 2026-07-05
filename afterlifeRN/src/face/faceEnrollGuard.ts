

export interface EnrollSuggestGuardInput {

  enrolling: boolean;

  pendingPersonId: number | null;

  incomingName: string;

  lastName: string;
}

export function shouldCleanupOrphanOnSuggest(input: EnrollSuggestGuardInput): boolean {
  if (input.enrolling) return false;
  return input.pendingPersonId != null && input.incomingName !== input.lastName;
}
