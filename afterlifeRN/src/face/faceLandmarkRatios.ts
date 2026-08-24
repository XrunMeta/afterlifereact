

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

export function computeLandmarkRatios<T extends FaceLandmarkFull>(face: T): LandmarkRatios | null {
  'worklet';
  const lm = face.landmarks;
  if (lm == null) return null;
  const le = lm.LEFT_EYE;
  const re = lm.RIGHT_EYE;
  const nose = lm.NOSE_BASE;
  const ml = lm.MOUTH_LEFT;
  const mr = lm.MOUTH_RIGHT;
  if (le == null || re == null || nose == null || ml == null || mr == null) return null;
  if (typeof le.x !== 'number' || typeof re.x !== 'number' || typeof nose.x !== 'number') return null;

  const dx = re.x - le.x;
  const dy = re.y - le.y;
  const eyeDist = Math.sqrt(dx * dx + dy * dy);
  if (!(eyeDist > 0)) return null;

  const eyeMidX = (le.x + re.x) / 2;
  const eyeMidY = (le.y + re.y) / 2;
  const mouthMidX = (ml.x + mr.x) / 2;
  const mouthMidY = (ml.y + mr.y) / 2;
  const mouthDx = mr.x - ml.x;
  const mouthDy = mr.y - ml.y;
  const mouthDist = Math.sqrt(mouthDx * mouthDx + mouthDy * mouthDy);

  const faceWidth = face.bounds.width;
  const faceHeight = face.bounds.height;
  if (!(faceWidth > 0) || !(faceHeight > 0)) return null;

  return {
    eyeSpacingRatio: eyeDist / faceWidth,
    noseBelowEyes: (nose.y - eyeMidY) / eyeDist,
    mouthBelowEyes: (mouthMidY - eyeMidY) / eyeDist,
    mouthWidth: mouthDist / eyeDist,
    noseXShift: (nose.x - eyeMidX) / eyeDist,
    mouthXShift: (mouthMidX - eyeMidX) / eyeDist,
    faceAspect: faceHeight / faceWidth,
  };
}

export function compareLandmarkRatios(a: LandmarkRatios, b: LandmarkRatios): number {
  const weights = {
    eyeSpacingRatio: 1.0,
    noseBelowEyes: 1.5,
    mouthBelowEyes: 1.5,
    mouthWidth: 1.2,
    noseXShift: 0.8,
    mouthXShift: 0.8,
    faceAspect: 0.8,
  };
  let sumWeightedDiff = 0;
  let sumWeight = 0;
  const keys: (keyof LandmarkRatios)[] = [
    'eyeSpacingRatio', 'noseBelowEyes', 'mouthBelowEyes', 'mouthWidth', 'noseXShift', 'mouthXShift', 'faceAspect',
  ];
  for (const k of keys) {
    const w = weights[k];
    sumWeightedDiff += w * Math.abs(a[k] - b[k]);
    sumWeight += w;
  }
  const meanDiff = sumWeightedDiff / sumWeight;

  return Math.exp(-meanDiff * 10);
}

export function averageLandmarkRatios(list: LandmarkRatios[]): LandmarkRatios | null {
  if (list.length === 0) return null;
  const keys: (keyof LandmarkRatios)[] = [
    'eyeSpacingRatio', 'noseBelowEyes', 'mouthBelowEyes', 'mouthWidth', 'noseXShift', 'mouthXShift', 'faceAspect',
  ];
  const sums: Record<string, number> = {};
  for (const k of keys) sums[k] = 0;
  for (const r of list) for (const k of keys) sums[k] += r[k];
  const n = list.length;
  return {
    eyeSpacingRatio: sums.eyeSpacingRatio / n,
    noseBelowEyes: sums.noseBelowEyes / n,
    mouthBelowEyes: sums.mouthBelowEyes / n,
    mouthWidth: sums.mouthWidth / n,
    noseXShift: sums.noseXShift / n,
    mouthXShift: sums.mouthXShift / n,
    faceAspect: sums.faceAspect / n,
  };
}
