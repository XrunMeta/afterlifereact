

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

export type FrameRotation = 0 | 90 | 180 | 270;
export type ResizeRotation = '0deg' | '90deg' | '180deg' | '270deg';

export function v_516b4f(v_d8dc1f): FrameRotation {
  'worklet';
  switch (v_d8dc1f) {
    case 'landscape-left':
      return 270;
    case 'landscape-right':
      return 90;
    case 'portrait-upside-down':
      return 180;
    default:
      return 0;
  }
}

export function v_f7fe68(v_29660d): ResizeRotation {
  'worklet';
  return v_29660d === 90 ? '90deg' : v_29660d === 180 ? '180deg' : v_29660d === 270 ? '270deg' : '0deg';
}

export function v_9871cb(v_cb35cb, v_e0560a, v_fc2e4f, v_29660d): CropRect {
  'worklet';
  let v_62c214;
  let v_64877a;
  let v_32f7b8;
  let v_65a2cd;
  if (v_29660d === 90) {

    v_62c214 = v_cb35cb.y; v_64877a = v_fc2e4f - v_cb35cb.x - v_cb35cb.width; v_32f7b8 = v_cb35cb.height; v_65a2cd = v_cb35cb.width;
  } else if (v_29660d === 270) {

    v_62c214 = v_e0560a - v_cb35cb.y - v_cb35cb.height; v_64877a = v_cb35cb.x; v_32f7b8 = v_cb35cb.height; v_65a2cd = v_cb35cb.width;
  } else if (v_29660d === 180) {
    v_62c214 = v_e0560a - v_cb35cb.x - v_cb35cb.width; v_64877a = v_fc2e4f - v_cb35cb.y - v_cb35cb.height; v_32f7b8 = v_cb35cb.width; v_65a2cd = v_cb35cb.height;
  } else {
    v_62c214 = v_cb35cb.x; v_64877a = v_cb35cb.y; v_32f7b8 = v_cb35cb.width; v_65a2cd = v_cb35cb.height;
  }
  const v_05b441 = Math.max(1, Math.min(v_32f7b8, v_65a2cd, v_e0560a, v_fc2e4f));
  const v_4148d9 = v_62c214 + v_32f7b8 / 2;
  const v_85ddfd = v_64877a + v_65a2cd / 2;
  const v_ccf361 = Math.min(Math.max(0, v_4148d9 - v_05b441 / 2), v_e0560a - v_05b441);
  const v_d36ad5 = Math.min(Math.max(0, v_85ddfd - v_05b441 / 2), v_fc2e4f - v_05b441);
  return { x: Math.floor(v_ccf361), y: Math.floor(v_d36ad5), width: Math.floor(v_05b441), height: Math.floor(v_05b441) };
}

export function v_fa192b<T extends FaceLandmarksLike>(
  v_7d769d,
  v_e0560a,
  v_fc2e4f,
  v_d8dc1f,
  v_37547f = 0.15,
): { crop: CropRect; rotation: ResizeRotation } {
  'worklet';
  const v_29660d = v_516b4f(v_d8dc1f);
  let v_99df03 = v_2c12f7(v_7d769d);
  if (v_99df03 == null) {
    const v_148ff6 = v_7d769d.bounds;
    const v_458f45 = v_148ff6.width * v_37547f;
    const v_8fc8f0 = v_148ff6.height * v_37547f;
    const v_fceac7 = Math.max(v_148ff6.width + v_458f45 * 2, v_148ff6.height + v_8fc8f0 * 2);
    v_99df03 = { x: v_148ff6.x + v_148ff6.width / 2 - v_fceac7 / 2, y: v_148ff6.y + v_148ff6.height / 2 - v_fceac7 / 2, width: v_fceac7, height: v_fceac7 };
  }
  return { crop: v_9871cb(v_99df03, v_e0560a, v_fc2e4f, v_29660d), rotation: v_f7fe68(v_29660d) };
}
