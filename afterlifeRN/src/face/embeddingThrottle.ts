

export const v_413278 = 10000;

export const v_00f5bb = 10000;

export function v_34e478(v_77aea7, v_74b69e): number {
  const v_f4e98d = v_74b69e != null && v_74b69e !== "" ? Number(v_74b69e) : NaN;
  if (Number.isFinite(v_f4e98d) && v_f4e98d > 0) return v_f4e98d;
  return v_77aea7 ? v_00f5bb : v_413278;
}

export const v_4043e6 = v_34e478(
  typeof __DEV__ !== "undefined" && __DEV__,
  process.env.EXPO_PUBLIC_FACE_THROTTLE_MS,
);

export function v_f7b672(v_33931a, v_67e77e): boolean {
  'worklet';
  return v_67e77e - v_33931a >= v_4043e6;
}
