

const v_e93b52 = new Map<number, string>();

export function v_c905f8(v_7f4466, v_cd1446): void {
  if (!Number.isFinite(v_7f4466) || !v_cd1446) return;
  v_e93b52.set(v_7f4466, v_cd1446);
}

export function v_49c1e3(v_7f4466): string | undefined {
  return v_e93b52.get(v_7f4466);
}

export function v_73c438(v_5f8f85, v_1d0a65): void {
  const v_cd1446 = v_e93b52.get(v_5f8f85);
  if (!v_cd1446) return;
  v_e93b52.delete(v_5f8f85);
  v_e93b52.set(v_1d0a65, v_cd1446);
}

export function v_daaf83(v_7f4466): void {
  v_e93b52.delete(v_7f4466);
}
