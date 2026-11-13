

export const v_d3c5d6 = 'sface_v1' as const;
export type EmbeddingVersion = typeof v_d3c5d6;

export const v_c42811 = 128;

export const v_769ee3 = 112;

export function v_87d5cb(v_2d670d): Float32Array {
  'worklet';
  const v_8d4337 = new Float32Array(v_2d670d.length);
  for (let v_ebec57 = 0; v_ebec57 < v_2d670d.length; v_ebec57 += 3) {
    v_8d4337[v_ebec57] = v_2d670d[v_ebec57 + 2] * 255; 
    v_8d4337[v_ebec57 + 1] = v_2d670d[v_ebec57 + 1] * 255; 
    v_8d4337[v_ebec57 + 2] = v_2d670d[v_ebec57] * 255; 
  }
  return v_8d4337;
}
