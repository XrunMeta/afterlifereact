

export const v_413278 = 30000;

export const v_00f5bb = 30000;

export function v_34e478(v_77aea7): number {
  return v_77aea7 ? v_00f5bb : v_413278;
}

export const v_4043e6 = v_34e478(
  typeof __DEV__ !== "undefined" && __DEV__,
);

export function v_f7b672(v_33931a, v_67e77e): boolean {
  'worklet';
  return v_67e77e - v_33931a >= v_4043e6;
}
