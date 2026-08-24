

export interface EyePoint { x: number; y: number }
export interface FaceLandmarksLike {
  bounds: { x: number; y: number; width: number; height: number };
  landmarks?: {
    LEFT_EYE?: EyePoint;
    RIGHT_EYE?: EyePoint;
  } | null;
}

export interface CropRect { x: number; y: number; width: number; height: number }

const TARGET_EYE_DIST = 35.24;
const TARGET_CROP_SIZE = 112;
const EYE_MID_TO_CENTER_Y = 56 - 51.60; 

export function computeAlignedCrop<T extends FaceLandmarksLike>(face: T): CropRect | null {
  'worklet';
  const lm = face.landmarks;
  if (lm == null) return null;
  const le = lm.LEFT_EYE;
  const re = lm.RIGHT_EYE;
  if (le == null || re == null) return null;
  if (typeof le.x !== 'number' || typeof le.y !== 'number') return null;
  if (typeof re.x !== 'number' || typeof re.y !== 'number') return null;
  const dx = re.x - le.x;
  const dy = re.y - le.y;
  const eyeDist = Math.sqrt(dx * dx + dy * dy);
  if (!(eyeDist > 0)) return null;
  const eyeMidX = (le.x + re.x) / 2;
  const eyeMidY = (le.y + re.y) / 2;
  const cropSize = eyeDist * (TARGET_CROP_SIZE / TARGET_EYE_DIST);
  const centerY = eyeMidY + (EYE_MID_TO_CENTER_Y * cropSize) / TARGET_CROP_SIZE;
  return {
    x: Math.max(0, eyeMidX - cropSize / 2),
    y: Math.max(0, centerY - cropSize / 2),
    width: cropSize,
    height: cropSize,
  };
}
