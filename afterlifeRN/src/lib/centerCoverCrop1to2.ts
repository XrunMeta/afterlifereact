
export function centerCoverCrop1to2(
  width: number,
  height: number,
): { originX: number; originY: number; width: number; height: number } {
  const target = 1 / 2;
  const aspect = width / height;
  if (aspect > target) {
    const w = height * target;
    return { originX: (width - w) / 2, originY: 0, width: w, height };
  }
  const h = width / target;
  return { originX: 0, originY: (height - h) / 2, width, height: h };
}
