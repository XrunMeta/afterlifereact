

export interface EyePoint { x: number; y: number }
export interface FaceLandmarkFull {
  bounds: { x: number; y: number; width: number; height: number };
  landmarks?: {
    LEFT_EYE?: EyePoint;
    RIGHT_EYE?: EyePoint;
    NOSE_BASE?: EyePoint;
    MOUTH_LEFT?: EyePoint;
    MOUTH_RIGHT?: EyePoint;
    MOUTH_BOTTOM?: EyePoint;
  } | null;
}

export interface LandmarkRatios {

  eyeSpacingRatio: number;

  noseBelowEyes: number;

  mouthBelowEyes: number;

  mouthWidth: number;

  noseXShift: number;

  mouthXShift: number;

  faceAspect: number;
}

export function v_6efd56<T extends FaceLandmarkFull>(v_7d769d): LandmarkRatios | null {
  'worklet';
  const v_8c6427 = v_7d769d.landmarks;
  if (v_8c6427 == null) return null;
  const v_e37196 = v_8c6427.LEFT_EYE;
  const v_d95200 = v_8c6427.RIGHT_EYE;
  const v_63db57 = v_8c6427.NOSE_BASE;
  const v_f95599 = v_8c6427.MOUTH_LEFT;
  const v_c1fa8d = v_8c6427.MOUTH_RIGHT;
  if (v_e37196 == null || v_d95200 == null || v_63db57 == null || v_f95599 == null || v_c1fa8d == null) return null;
  if (typeof v_e37196.x !== 'number' || typeof v_d95200.x !== 'number' || typeof v_63db57.x !== 'number') return null;

  const v_a35347 = v_d95200.x - v_e37196.x;
  const v_92e88e = v_d95200.y - v_e37196.y;
  const v_6b7bb0 = Math.sqrt(v_a35347 * v_a35347 + v_92e88e * v_92e88e);
  if (!(v_6b7bb0 > 0)) return null;

  const v_b69d1f = (v_e37196.x + v_d95200.x) / 2;
  const v_6926c1 = (v_e37196.y + v_d95200.y) / 2;
  const v_93cbab = (v_f95599.x + v_c1fa8d.x) / 2;
  const v_f7c27c = (v_f95599.y + v_c1fa8d.y) / 2;
  const v_017a89 = v_c1fa8d.x - v_f95599.x;
  const v_d067ba = v_c1fa8d.y - v_f95599.y;
  const v_4f6fed = Math.sqrt(v_017a89 * v_017a89 + v_d067ba * v_d067ba);

  const v_26953f = v_7d769d.bounds.width;
  const v_904665 = v_7d769d.bounds.height;
  if (!(v_26953f > 0) || !(v_904665 > 0)) return null;

  return {
    eyeSpacingRatio: v_6b7bb0 / v_26953f,
    noseBelowEyes: (v_63db57.y - v_6926c1) / v_6b7bb0,
    mouthBelowEyes: (v_f7c27c - v_6926c1) / v_6b7bb0,
    mouthWidth: v_4f6fed / v_6b7bb0,
    noseXShift: (v_63db57.x - v_b69d1f) / v_6b7bb0,
    mouthXShift: (v_93cbab - v_b69d1f) / v_6b7bb0,
    faceAspect: v_904665 / v_26953f,
  };
}

export function v_f9bbe6(v_779914, v_148ff6): number {
  const v_e5c9ed = {
    eyeSpacingRatio: 1.0,
    noseBelowEyes: 1.5,
    mouthBelowEyes: 1.5,
    mouthWidth: 1.2,
    noseXShift: 0.8,
    mouthXShift: 0.8,
    faceAspect: 0.8,
  };
  let v_4736b3 = 0;
  let v_99038f = 0;
  const v_fa53ec = [
    'eyeSpacingRatio', 'noseBelowEyes', 'mouthBelowEyes', 'mouthWidth', 'noseXShift', 'mouthXShift', 'faceAspect',
  ];
  for (const v_0eb677 of v_fa53ec) {
    const v_32f7b8 = v_e5c9ed[v_0eb677];
    v_4736b3 += v_32f7b8 * Math.abs(v_779914[v_0eb677] - v_148ff6[v_0eb677]);
    v_99038f += v_32f7b8;
  }
  const v_03ba68 = v_4736b3 / v_99038f;

  return Math.exp(-v_03ba68 * 10);
}

export function v_6285a0(v_ef8ab1): LandmarkRatios | null {
  if (v_ef8ab1.length === 0) return null;
  const v_fa53ec = [
    'eyeSpacingRatio', 'noseBelowEyes', 'mouthBelowEyes', 'mouthWidth', 'noseXShift', 'mouthXShift', 'faceAspect',
  ];
  const v_01eb1a = {};
  for (const v_0eb677 of v_fa53ec) v_01eb1a[v_0eb677] = 0;
  for (const v_cb35cb of v_ef8ab1) for (const v_0eb677 of v_fa53ec) v_01eb1a[v_0eb677] += v_cb35cb[v_0eb677];
  const v_f4e98d = v_ef8ab1.length;
  return {
    eyeSpacingRatio: v_01eb1a.eyeSpacingRatio / v_f4e98d,
    noseBelowEyes: v_01eb1a.noseBelowEyes / v_f4e98d,
    mouthBelowEyes: v_01eb1a.mouthBelowEyes / v_f4e98d,
    mouthWidth: v_01eb1a.mouthWidth / v_f4e98d,
    noseXShift: v_01eb1a.noseXShift / v_f4e98d,
    mouthXShift: v_01eb1a.mouthXShift / v_f4e98d,
    faceAspect: v_01eb1a.faceAspect / v_f4e98d,
  };
}
