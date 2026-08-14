

export interface OwnerAutoEnrollInput {

  personCount: number;

  ownerName: string | null | undefined;

  alreadyTried: boolean;
}

export function v_b4a89f(v_bbda62): boolean {
  if (v_bbda62.alreadyTried) return false;
  if (v_bbda62.personCount !== 0) return false;
  const v_1833e7 = (v_bbda62.ownerName ?? "").trim();
  if (!v_1833e7) return false;
  return true;
}

export function v_8ae2cb(v_a8807b): string {
  return (v_a8807b ?? "").trim();
}
