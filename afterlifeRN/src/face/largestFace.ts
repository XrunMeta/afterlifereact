

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
