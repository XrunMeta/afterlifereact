

export interface EyePoint { x: number; y: number }
export interface FaceLandmarksLike {
  bounds: { x: number; y: number; width: number; height: number };
  landmarks?: {
    LEFT_EYE?: EyePoint;
    RIGHT_EYE?: EyePoint;

    NOSE_BASE?: EyePoint;
    MOUTH_LEFT?: EyePoint;
    MOUTH_RIGHT?: EyePoint;
  } | null;
}

export interface CropRect { x: number; y: number; width: number; height: number }

const v_56967b = 35.24;
const v_c71323 = 112;
const v_4ebe87 = 56 - 51.60; 
const v_ff6b87 = 55.91;
const v_170803 = 51.60;

const v_addd8a = {
  leftEye:    { x: 38.29, y: 51.69 },
  rightEye:   { x: 73.53, y: 51.50 },
  nose:       { x: 56.02, y: 72.00 },
  mouthLeft:  { x: 41.55, y: 92.37 },
  mouthRight: { x: 70.72, y: 92.37 },
} as const;
const v_19de8e = {
  x: (v_addd8a.leftEye.x + v_addd8a.rightEye.x + v_addd8a.nose.x + v_addd8a.mouthLeft.x + v_addd8a.mouthRight.x) / 5,
  y: (v_addd8a.leftEye.y + v_addd8a.rightEye.y + v_addd8a.nose.y + v_addd8a.mouthLeft.y + v_addd8a.mouthRight.y) / 5,
};

const v_961af1 = (1.5 * Math.PI) / 180;

export function v_12b919(v_e37196, v_d95200): number {
  'worklet';
  return Math.atan2(v_d95200.y - v_e37196.y, v_d95200.x - v_e37196.x);
}

export function v_e24300(v_b476a0): number {
  'worklet';
  return Math.abs(Math.cos(v_b476a0)) + Math.abs(Math.sin(v_b476a0));
}

interface AlignedCropWithRoll {
  crop: CropRect;
  rollRad: number;
  rollExpand: number;
}

interface FivePointFit {
  scale: number;       
  rollRad: number;     
  cropCenter: { x: number; y: number }; 
}

function v_107cf7<T extends FaceLandmarksLike>(v_7d769d): FivePointFit | null {
  'worklet';
  const v_8c6427 = v_7d769d.landmarks;
  if (v_8c6427 == null) return null;
  const { LEFT_EYE: v_e37196, RIGHT_EYE: v_d95200, NOSE_BASE: v_e39ea6, MOUTH_LEFT: v_f95599, MOUTH_RIGHT: v_c1fa8d } = v_8c6427;
  if (v_e37196 == null || v_d95200 == null || v_e39ea6 == null || v_f95599 == null || v_c1fa8d == null) return null;

  const v_553162 = [v_e37196, v_d95200, v_e39ea6, v_f95599, v_c1fa8d];
  for (const v_e2a85c of v_553162) {
    if (typeof v_e2a85c.x !== 'number' || typeof v_e2a85c.y !== 'number') return null;
    if (!Number.isFinite(v_e2a85c.x) || !Number.isFinite(v_e2a85c.y)) return null;
  }
  const v_2b3f7c = [
    v_addd8a.leftEye,
    v_addd8a.rightEye,
    v_addd8a.nose,
    v_addd8a.mouthLeft,
    v_addd8a.mouthRight,
  ];

  let v_54e7f0 = 0, v_a97bb6 = 0, v_5d98a3 = 0, v_ed9f38 = 0;
  for (let v_ebec57 = 0; v_ebec57 < 5; v_ebec57++) {
    v_54e7f0 += v_553162[v_ebec57]!.x; v_a97bb6 += v_553162[v_ebec57]!.y;
    v_5d98a3 += v_2b3f7c[v_ebec57]!.x; v_ed9f38 += v_2b3f7c[v_ebec57]!.y;
  }
  v_54e7f0 /= 5; v_a97bb6 /= 5; v_5d98a3 /= 5; v_ed9f38 /= 5;

  let v_f50528 = 0, v_e78b66 = 0, v_370b05 = 0;
  for (let v_ebec57 = 0; v_ebec57 < 5; v_ebec57++) {
    const v_e5f36b = v_553162[v_ebec57]!.x - v_54e7f0;
    const v_e37af0 = v_553162[v_ebec57]!.y - v_a97bb6;
    const v_a35347 = v_2b3f7c[v_ebec57]!.x - v_5d98a3;
    const v_92e88e = v_2b3f7c[v_ebec57]!.y - v_ed9f38;
    v_f50528 += v_a35347 * v_e5f36b + v_92e88e * v_e37af0;
    v_e78b66 += v_92e88e * v_e5f36b - v_a35347 * v_e37af0;
    v_370b05 += v_e5f36b * v_e5f36b + v_e37af0 * v_e37af0;
  }
  if (!(v_370b05 > 0)) return null;
  const v_64e654 = v_f50528 / v_370b05;
  const v_3164f3 = v_e78b66 / v_370b05;
  const v_787b92 = Math.sqrt(v_64e654 * v_64e654 + v_3164f3 * v_3164f3);
  if (!(v_787b92 > 0) || !Number.isFinite(v_787b92)) return null;

  const v_b476a0 = -Math.atan2(v_3164f3, v_64e654);
  const v_a37637 = v_787b92; 

  const v_94bbae = v_64e654 * v_64e654 + v_3164f3 * v_3164f3;
  const v_17d9f0 = v_64e654 / v_94bbae;
  const v_b91965 = -v_3164f3 / v_94bbae;
  const v_6b26d3 = 56 - v_5d98a3;
  const v_8e5557 = 56 - v_ed9f38;

  const v_4148d9 = v_6b26d3 * v_17d9f0 - v_8e5557 * v_b91965 + v_54e7f0;
  const v_85ddfd = v_6b26d3 * v_b91965 + v_8e5557 * v_17d9f0 + v_a97bb6;
  return { scale: v_a37637, rollRad: v_b476a0, cropCenter: { x: v_4148d9, y: v_85ddfd } };
}

function v_af002e<T extends FaceLandmarksLike>(v_7d769d): AlignedCropWithRoll | null {
  'worklet';
  const v_8c6427 = v_7d769d.landmarks;
  if (v_8c6427 == null) return null;

  const v_9ad07a = v_107cf7(v_7d769d);
  if (v_9ad07a != null) {
    const v_075d74 = v_e24300(v_9ad07a.rollRad);

    const v_199e12 = (v_c71323 / v_9ad07a.scale) * v_075d74;
    if (!(v_199e12 > 0) || !Number.isFinite(v_199e12)) {

    } else {
      return {
        crop: {
          x: Math.max(0, v_9ad07a.cropCenter.x - v_199e12 / 2),
          y: Math.max(0, v_9ad07a.cropCenter.y - v_199e12 / 2),
          width: v_199e12,
          height: v_199e12,
        },
        rollRad: v_9ad07a.rollRad,
        rollExpand: v_075d74,
      };
    }
  }

  const v_e37196 = v_8c6427.LEFT_EYE;
  const v_d95200 = v_8c6427.RIGHT_EYE;
  if (v_e37196 == null || v_d95200 == null) return null;
  if (typeof v_e37196.x !== 'number' || typeof v_e37196.y !== 'number') return null;
  if (typeof v_d95200.x !== 'number' || typeof v_d95200.y !== 'number') return null;
  const v_a35347 = v_d95200.x - v_e37196.x;
  const v_92e88e = v_d95200.y - v_e37196.y;
  const v_6b7bb0 = Math.sqrt(v_a35347 * v_a35347 + v_92e88e * v_92e88e);
  if (!(v_6b7bb0 > 0)) return null;
  const v_b476a0 = v_12b919(v_e37196, v_d95200);
  const v_075d74 = v_e24300(v_b476a0);
  const v_199e12 = v_6b7bb0 * (v_c71323 / v_56967b) * v_075d74;
  const v_b69d1f = (v_e37196.x + v_d95200.x) / 2;
  const v_6926c1 = (v_e37196.y + v_d95200.y) / 2;
  const v_057503 = v_6926c1 + (v_4ebe87 * v_199e12) / v_c71323;
  return {
    crop: {
      x: Math.max(0, v_b69d1f - v_199e12 / 2),
      y: Math.max(0, v_057503 - v_199e12 / 2),
      width: v_199e12,
      height: v_199e12,
    },
    rollRad: v_b476a0,
    rollExpand: v_075d74,
  };
}

export { v_107cf7 };

export function v_2c12f7<T extends FaceLandmarksLike>(v_7d769d): CropRect | null {
  'worklet';
  const v_b855bd = v_af002e(v_7d769d);
  return v_b855bd == null ? null : v_b855bd.crop;
}

export function v_e2ddec(
  v_38d084,
  v_05b441,
  v_b476a0,
  v_46889d,
): Float32Array {
  'worklet';
  if (
    !(Math.abs(v_b476a0) >= v_961af1) ||
    !(v_46889d > 0) ||
    !Number.isFinite(v_46889d) ||
    !Number.isFinite(v_b476a0)
  ) {
    return v_38d084;
  }
  const v_4148d9 = v_ff6b87 * (v_05b441 / v_c71323);
  const v_85ddfd = v_170803 * (v_05b441 / v_c71323);

  const v_fa7d4c = Math.cos(v_b476a0);
  const v_2cbb96 = Math.sin(v_b476a0);
  const v_8d4337 = new Float32Array(v_38d084.length);
  const v_506e86 = v_05b441 - 1;
  for (let v_b49a44 = 0; v_b49a44 < v_05b441; v_b49a44++) {
    for (let v_8fea6d = 0; v_8fea6d < v_05b441; v_8fea6d++) {
      const v_f99bf7 = v_8fea6d - v_4148d9;
      const v_22a50a = v_b49a44 - v_85ddfd;
      const v_6bdf03 = (v_fa7d4c * v_f99bf7 + v_2cbb96 * v_22a50a) / v_46889d + v_4148d9;
      const v_53a0b5 = (-v_2cbb96 * v_f99bf7 + v_fa7d4c * v_22a50a) / v_46889d + v_85ddfd;

      const v_13214f = v_6bdf03 < 0 ? 0 : v_6bdf03 > v_506e86 ? v_506e86 : v_6bdf03;
      const v_3cda46 = v_53a0b5 < 0 ? 0 : v_53a0b5 > v_506e86 ? v_506e86 : v_53a0b5;
      const v_855751 = Math.floor(v_13214f);
      const v_33cd07 = Math.floor(v_3cda46);
      const v_f0b70d = v_855751 < v_506e86 ? v_855751 + 1 : v_506e86;
      const v_98efa0 = v_33cd07 < v_506e86 ? v_33cd07 + 1 : v_506e86;
      const v_8fbe32 = v_13214f - v_855751;
      const v_d1e044 = v_3cda46 - v_33cd07;
      const v_4d71d5 = (1 - v_8fbe32) * (1 - v_d1e044);
      const v_f1f346 = v_8fbe32 * (1 - v_d1e044);
      const v_097175 = (1 - v_8fbe32) * v_d1e044;
      const v_cca231 = v_8fbe32 * v_d1e044;
      const v_4e8708 = (v_33cd07 * v_05b441 + v_855751) * 3;
      const v_e48981 = (v_33cd07 * v_05b441 + v_f0b70d) * 3;
      const v_4fda6f = (v_98efa0 * v_05b441 + v_855751) * 3;
      const v_a2a7a3 = (v_98efa0 * v_05b441 + v_f0b70d) * 3;
      const v_48d7f2 = (v_b49a44 * v_05b441 + v_8fea6d) * 3;
      for (let v_3f4e2e = 0; v_3f4e2e < 3; v_3f4e2e++) {
        v_8d4337[v_48d7f2 + v_3f4e2e] =
          v_38d084[v_4e8708 + v_3f4e2e]! * v_4d71d5 + v_38d084[v_e48981 + v_3f4e2e]! * v_f1f346 + v_38d084[v_4fda6f + v_3f4e2e]! * v_097175 + v_38d084[v_a2a7a3 + v_3f4e2e]! * v_cca231;
      }
    }
  }
  return v_8d4337;
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

export interface ModelCropResult {
  crop: CropRect;
  rotation: ResizeRotation;

  rollRad: number;

  rollExpand: number;
}

export function v_fa192b<T extends FaceLandmarksLike>(
  v_7d769d,
  v_e0560a,
  v_fc2e4f,
  v_d8dc1f,
  v_37547f = 0.15,
): ModelCropResult {
  'worklet';
  const v_29660d = v_516b4f(v_d8dc1f);
  const v_b855bd = v_af002e(v_7d769d);
  let v_99df03;
  let v_b476a0 = 0;
  let v_075d74 = 1;
  if (v_b855bd != null) {
    v_99df03 = v_b855bd.crop;
    v_b476a0 = v_b855bd.rollRad;
    v_075d74 = v_b855bd.rollExpand;
  } else {
    const v_148ff6 = v_7d769d.bounds;
    const v_458f45 = v_148ff6.width * v_37547f;
    const v_8fc8f0 = v_148ff6.height * v_37547f;
    const v_fceac7 = Math.max(v_148ff6.width + v_458f45 * 2, v_148ff6.height + v_8fc8f0 * 2);
    v_99df03 = {
      x: v_148ff6.x + v_148ff6.width / 2 - v_fceac7 / 2,
      y: v_148ff6.y + v_148ff6.height / 2 - v_fceac7 / 2,
      width: v_fceac7,
      height: v_fceac7,
    };
  }
  return {
    crop: v_9871cb(v_99df03, v_e0560a, v_fc2e4f, v_29660d),
    rotation: v_f7fe68(v_29660d),
    rollRad: v_b476a0,
    rollExpand: v_075d74,
  };
}
