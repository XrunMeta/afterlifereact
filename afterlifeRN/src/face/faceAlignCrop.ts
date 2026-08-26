

export interface EyePoint { x: number; y: number }
export interface FaceLandmarksLike {
  bounds: { x: number; y: number; width: number; height: number };
  landmarks?: {
    LEFT_EYE?: EyePoint;
    RIGHT_EYE?: EyePoint;
  } | null;
}

export interface CropRect { x: number; y: number; width: number; height: number }

const v_56967b = 35.24;
const v_c71323 = 112;
const v_4ebe87 = 56 - 51.60; 

export function v_2c12f7<T extends FaceLandmarksLike>(v_7d769d): CropRect | null {
  'worklet';
  const v_8c6427 = v_7d769d.landmarks;
  if (v_8c6427 == null) return null;
  const v_e37196 = v_8c6427.LEFT_EYE;
  const v_d95200 = v_8c6427.RIGHT_EYE;
  if (v_e37196 == null || v_d95200 == null) return null;
  if (typeof v_e37196.x !== 'number' || typeof v_e37196.y !== 'number') return null;
  if (typeof v_d95200.x !== 'number' || typeof v_d95200.y !== 'number') return null;
  const v_a35347 = v_d95200.x - v_e37196.x;
  const v_92e88e = v_d95200.y - v_e37196.y;
  const v_6b7bb0 = Math.sqrt(v_a35347 * v_a35347 + v_92e88e * v_92e88e);
  if (!(v_6b7bb0 > 0)) return null;
  const v_b69d1f = (v_e37196.x + v_d95200.x) / 2;
  const v_6926c1 = (v_e37196.y + v_d95200.y) / 2;
  const v_199e12 = v_6b7bb0 * (v_c71323 / v_56967b);
  const v_057503 = v_6926c1 + (v_4ebe87 * v_199e12) / v_c71323;
  return {
    x: Math.max(0, v_b69d1f - v_199e12 / 2),
    y: Math.max(0, v_057503 - v_199e12 / 2),
    width: v_199e12,
    height: v_199e12,
  };
}
