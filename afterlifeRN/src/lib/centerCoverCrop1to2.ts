
export function v_9dd2d6(
  v_8e4fb6,
  v_c86e33,
): { originX: number; originY: number; width: number; height: number } {
  const v_5f5d6d = 1 / 2;
  const v_a21485 = v_8e4fb6 / v_c86e33;
  if (v_a21485 > v_5f5d6d) {
    const v_32f7b8 = v_c86e33 * v_5f5d6d;
    return { originX: (v_8e4fb6 - v_32f7b8) / 2, originY: 0, width: v_32f7b8, height: v_c86e33 };
  }
  const v_65a2cd = v_8e4fb6 / v_5f5d6d;
  return { originX: 0, originY: (v_c86e33 - v_65a2cd) / 2, width: v_8e4fb6, height: v_65a2cd };
}
