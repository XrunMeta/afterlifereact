

export interface OwnerAutoEnrollInput {

  personCount: number;

  ownerName: string | null | undefined;

  alreadyTried: boolean;
}

export function shouldAutoEnrollOwner(input: OwnerAutoEnrollInput): boolean {

  void input;
  return false;
}

export function ownerEnrollName(ownerName: string | null | undefined): string {
  return (ownerName ?? "").trim();
}
