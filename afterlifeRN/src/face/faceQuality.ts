

export type FaceQuality = "ok" | "dark" | "small" | "turned" | "none";

export const v_7e6cd4 = 0.22;

export const v_300430 = 0.12;

export const v_f50976 = 0.35;

export function v_6722de(v_2d670d): number {
  'worklet';
  const v_c9b753 = Math.floor(v_2d670d.length / 3);
  if (v_c9b753 === 0) return 0;
  let v_dce0a8 = 0;
  for (let v_ebec57 = 0; v_ebec57 < v_c9b753 * 3; v_ebec57 += 3) {
    v_dce0a8 += 0.299 * v_2d670d[v_ebec57] + 0.587 * v_2d670d[v_ebec57 + 1] + 0.114 * v_2d670d[v_ebec57 + 2];
  }
  return v_dce0a8 / v_c9b753;
}

export function v_47bc73(v_ebec57): FaceQuality {
  'worklet';
  if (v_ebec57.luma < v_7e6cd4) return 'dark';
  if (v_ebec57.faceWidthRatio < v_300430) return 'small';
  if (v_ebec57.yawRatio !== null && v_ebec57.yawRatio > v_f50976) return 'turned';
  return 'ok';
}
