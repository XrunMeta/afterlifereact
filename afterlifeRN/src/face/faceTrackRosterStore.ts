

import type { v_8a6b56 } from "../config/faceDiag";
import {
  v_40137b,
  v_6e2c23,
  v_99b411,
  type v_2f9753,
} from "./faceTrackRoster";

let state: v_2f9753 = v_6e2c23();
let subs: Array<(s: v_2f9753) => void> = [];

function v_c226a5(): void {
  const v_5392c4 = v_b6e533;

  for (const v_16dbdb of v_ab371b.slice()) {
    try {
      v_16dbdb(v_5392c4);
    } catch (v_9e86fd) {
      if (!__DEV__) return;

      console.log("[Call][faceTrack][subscriber-error]", String(v_9e86fd));
    }
  }
}

export function v_538902(v_3e0537, v_67e77e): void {
  if (!__DEV__) return;
  const v_a448ad = v_99b411(v_b6e533, v_3e0537, v_67e77e);
  if (v_a448ad === v_b6e533) return; 
  v_b6e533 = v_a448ad;
  v_c226a5();
}

export function v_3f18f7(diag: v_8a6b56 | null, v_67e77e): void {
  if (!__DEV__) return;
  const v_a448ad = v_40137b(v_b6e533, v_ef2205, v_67e77e);
  if (v_a448ad === v_b6e533) return;
  v_b6e533 = v_a448ad;
  v_c226a5();
}

export function v_85e000(): void {
  v_b6e533 = v_6e2c23();
  v_c226a5();
}

export function v_8d4e3c(): v_2f9753 {
  return v_b6e533;
}

export function v_60d2d9(cb: (s: v_2f9753) => void): () => void {
  v_ab371b.push(v_16dbdb);
  v_16dbdb(v_b6e533); 
  return () => {
    v_ab371b = v_ab371b.filter((v_8b5cd8) => v_8b5cd8 !== v_16dbdb);
  };
}
