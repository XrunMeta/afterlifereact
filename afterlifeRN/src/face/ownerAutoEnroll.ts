

export interface OwnerAutoEnrollInput {

  personCount: number;

  ownerName: string | null | undefined;

  alreadyTried: boolean;
}

export function shouldAutoEnrollOwner(input: OwnerAutoEnrollInput): boolean {
  if (input.alreadyTried) return false;
  if (input.personCount !== 0) return false;
  const name = (input.ownerName ?? "").trim();
  if (!name) return false;
  return true;
}

export function ownerEnrollName(ownerName: string | null | undefined): string {
  return (ownerName ?? "").trim();
}
