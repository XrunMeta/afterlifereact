

export const v_8eb272 = 100; 
export const v_5edc09 = 2; 

export type PlayoutStallState = { stalledPolls: number };

export function v_088069(): PlayoutStallState {
  return { stalledPolls: 0 };
}

export function v_700e84(
  v_b6e533,
  v_e9396c,
): { state: PlayoutStallState; stalled: boolean } {
  const v_44c0fb = v_e9396c.pkts >= v_8eb272;
  if (!v_44c0fb || v_e9396c.samples > 0) return { state: { stalledPolls: 0 }, stalled: false };
  const v_c2c140 = v_b6e533.stalledPolls + 1;
  return { state: { stalledPolls: v_c2c140 }, stalled: v_c2c140 % v_5edc09 === 0 };
}
