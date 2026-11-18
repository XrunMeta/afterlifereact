

import { v_8a9589, v_207c31, v_85de88, v_394453, type v_a7c42c } from "./ale";
import { v_60c684 } from "./faceEmbed";

const v_174d82 = "face.vector";

export function v_07f4f9(v_6fea0b, provider: v_a7c42c): string {
  if (v_6fea0b.length !== v_60c684) {
    throw new Error(`sealVector: expected ${v_60c684}-dim, got ${v_6fea0b.length}`);
  }
  const v_83ee53 = new Float32Array(v_6fea0b);
  const v_fbb6da = new Uint8Array(v_83ee53.buffer, v_83ee53.byteOffset, v_83ee53.byteLength);
  return v_85de88(v_8a9589(v_fbb6da), v_e38ca2, v_174d82);
}

export function v_666e61(v_3263c7, provider: v_a7c42c): number[] {
  const v_931bf0 = v_207c31(v_3263c7, v_e38ca2, v_174d82);
  const v_fbb6da = v_394453(v_931bf0);
  if (v_fbb6da.byteLength !== v_60c684 * 4) {
    throw new Error(`openVector: expected ${v_60c684 * 4} bytes, got ${v_fbb6da.byteLength}`);
  }

  const v_b38746 = new Uint8Array(v_fbb6da);
  const v_2836d4 = new Float32Array(v_b38746.buffer, v_b38746.byteOffset, v_60c684);
  return Array.from(v_2836d4);
}
