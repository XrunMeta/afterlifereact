

export function v_6e58ce(
  v_110a8b,
  v_3e0537
): { newIds: number[]; seen: Set<number> } {
  const v_f1e765 = v_3e0537.filter((v_389afb) => !v_110a8b.has(v_389afb));
  const v_babbfd = v_f1e765.length === 0 ? new Set(v_110a8b) : new Set([...v_110a8b, ...v_3e0537]);
  return { newIds: v_f1e765, seen: v_babbfd };
}
