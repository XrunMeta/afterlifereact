

export const v_739ab4 = 700;
export const v_830c66 = 3000;

export type FaceCountTriggerState = {

  stable: number;

  pending: number;
  pendingSinceMs: number;
  lastTriggerMs: number;
};

export const v_db5e62 = {
  stable: -1,
  pending: -1,
  pendingSinceMs: 0,
  lastTriggerMs: -1e12, 
};

export function v_58dba0(
  v_fd5f43,
  v_9e8c70,
  v_67e77e,
): { state: FaceCountTriggerState; trigger: boolean } {
  'worklet';

  if (v_fd5f43.stable === -1) {
    return { state: { ...v_fd5f43, stable: v_9e8c70, pending: -1 }, trigger: false };
  }
  if (v_9e8c70 === v_fd5f43.stable) {
    return v_fd5f43.pending === -1 ? { state: v_fd5f43, trigger: false } : { state: { ...v_fd5f43, pending: -1 }, trigger: false };
  }
  if (v_9e8c70 !== v_fd5f43.pending) {
    return { state: { ...v_fd5f43, pending: v_9e8c70, pendingSinceMs: v_67e77e }, trigger: false };
  }
  if (v_67e77e - v_fd5f43.pendingSinceMs < v_739ab4) {
    return { state: v_fd5f43, trigger: false };
  }

  const v_4412ae = v_67e77e - v_fd5f43.lastTriggerMs >= v_830c66;
  return {
    state: { stable: v_9e8c70, pending: -1, pendingSinceMs: 0, lastTriggerMs: v_4412ae ? v_67e77e : v_fd5f43.lastTriggerMs },
    trigger: v_4412ae,
  };
}
