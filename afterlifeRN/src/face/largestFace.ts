

export interface FaceBoundsLike {
  bounds: { width: number; height: number; x: number; y: number };
  trackingId?: number;
}

export function v_e74bab<T extends FaceBoundsLike>(v_a51d09): T | null {
  'worklet';
  if (v_a51d09.length === 0) return null;
  let v_643757 = v_a51d09[0];
  let v_33f116 = v_643757.bounds.width * v_643757.bounds.height;
  for (let v_ebec57 = 1; v_ebec57 < v_a51d09.length; v_ebec57++) {
    const v_3df367 = v_a51d09[v_ebec57].bounds.width * v_a51d09[v_ebec57].bounds.height;
    if (v_3df367 > v_33f116) {
      v_643757 = v_a51d09[v_ebec57];
      v_33f116 = v_3df367;
    }
  }
  return v_643757;
}

export const v_9ac5ee = 0.5;

export function v_9ad8b5<T extends FaceBoundsLike>(v_a51d09, v_127e92): T[] {
  'worklet';
  if (v_127e92 == null) return [];
  const v_3f82af = v_127e92.bounds.width * v_9ac5ee;
  const v_8d4337 = [];
  for (let v_ebec57 = 0; v_ebec57 < v_a51d09.length; v_ebec57++) {
    if (v_a51d09[v_ebec57] === v_127e92 || v_a51d09[v_ebec57].bounds.width >= v_3f82af) v_8d4337.push(v_a51d09[v_ebec57]);
  }
  return v_8d4337;
}
