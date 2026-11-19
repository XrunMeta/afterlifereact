

import { v_4e6e9c } from "fxidakcauhdmtazrhziou";
import { v_084137 } from "jyrbilrsgaufsmqlwpinn";
import { v_394453 } from "./ale";
import { v_60c684 } from "./faceEmbed";

export const v_c25ba9 = 32;

const v_acbce1 = new WeakMap<Uint8Array, Float32Array>();
const v_d53e93 = new Map<string, Float32Array>();

export function v_9c55e0(v_5ee049): Float32Array {
  const v_e2a6a6 = v_d53e93.get(v_5ee049);
  if (v_e2a6a6) return v_e2a6a6;
  const v_dac30a = v_394453(v_5ee049);
  const v_3c8572 = v_acbce1.get(v_dac30a);
  if (v_3c8572) {
    v_d53e93.set(v_5ee049, v_3c8572);
    return v_3c8572;
  }

  const v_c83285 = v_60c684 * v_c25ba9; 

  const v_5b664f = v_c83285 * 8; 

  const v_bce2fd = new TextEncoder().encode("face.fingerprint");
  const v_8ddfcf = new TextEncoder().encode("projection:v1");
  const v_9cfd2b = 255 * 32; 
  const v_cab51f = new Uint8Array(v_5b664f);
  let v_9e7a9d = 0;
  let v_a562b5 = 0;
  while (v_9e7a9d < v_5b664f) {
    const v_04326c = Math.min(v_9cfd2b, v_5b664f - v_9e7a9d);
    const v_546a46 = new Uint8Array(v_8ddfcf.length + 4);
    v_546a46.set(v_8ddfcf, 0);
    new DataView(v_546a46.buffer, v_546a46.byteOffset, v_546a46.byteLength).setUint32(v_8ddfcf.length, v_a562b5, false);
    v_cab51f.set(v_4e6e9c(v_084137, v_dac30a, v_bce2fd, v_546a46, v_04326c), v_9e7a9d);
    v_9e7a9d += v_04326c;
    v_a562b5 += 1;
  }

  const v_8d4337 = new Float32Array(v_c83285);
  const v_2836d4 = new DataView(v_cab51f.buffer, v_cab51f.byteOffset, v_cab51f.byteLength);
  for (let v_ebec57 = 0; v_ebec57 < v_c83285; v_ebec57++) {

    const v_cddb23 = v_2836d4.getUint32(v_ebec57 * 8, true);
    const v_16d6f0 = v_2836d4.getUint32(v_ebec57 * 8 + 4, true);
    const v_79e089 = Math.max(v_cddb23 / 0x1_0000_0000, 1e-12); 
    const v_b1ff3f = v_16d6f0 / 0x1_0000_0000;
    const v_cb35cb = Math.sqrt(-2 * Math.log(v_79e089));
    const v_85977b = 2 * Math.PI * v_b1ff3f;
    v_8d4337[v_ebec57] = v_cb35cb * Math.cos(v_85977b); 
  }

  v_acbce1.set(v_dac30a, v_8d4337);
  v_d53e93.set(v_5ee049, v_8d4337);
  return v_8d4337;
}

export function v_c74d52(v_207389, v_517c4e): number[] {
  if (v_207389.length !== v_60c684) {
    throw new Error(`fingerprintFromVector: expected ${v_60c684}-dim, got ${v_207389.length}`);
  }
  const v_8d4337 = new Array(v_c25ba9);
  for (let v_b75e36 = 0; v_b75e36 < v_c25ba9; v_b75e36++) {
    let v_9f1d92 = 0;
    for (let v_ebec57 = 0; v_ebec57 < v_60c684; v_ebec57++) {
      v_9f1d92 += (v_207389[v_ebec57] as number) * (v_517c4e[v_ebec57 * v_c25ba9 + v_b75e36] as number);
    }
    v_8d4337[v_b75e36] = v_9f1d92 >= 0 ? 1 : -1;
  }
  return v_8d4337;
}

export function v_3d4e91(v_779914, v_148ff6): number {
  let v_801ce6 = 0, v_6faaa0 = 0, v_78071c = 0;
  for (let v_ebec57 = 0; v_ebec57 < v_779914.length; v_ebec57++) {
    const v_8fe318 = v_779914[v_ebec57] ?? 0, v_095f0c = v_148ff6[v_ebec57] ?? 0;
    v_801ce6 += v_8fe318 * v_095f0c; v_6faaa0 += v_8fe318 * v_8fe318; v_78071c += v_095f0c * v_095f0c;
  }
  return v_801ce6 / (Math.sqrt(v_6faaa0) * Math.sqrt(v_78071c) || 1);
}
