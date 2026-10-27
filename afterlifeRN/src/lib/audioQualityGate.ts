

export const v_974277 = -55; 
export const v_45d7ec = 30;         
export const v_b955ff = 25;         

export const v_e7c7a4 = -1; 

export function v_44adb0(v_a1651b): boolean {
  return typeof v_a1651b === "number" && Number.isFinite(v_a1651b) && v_a1651b >= v_e7c7a4;
}

export type AudioVerdict = "ok" | "silence" | "noise";

export interface AudioVerdictResult {
  verdict: AudioVerdict;
  avg: number;
  spread: number;
  sampleCount: number;
}

export function v_dac67e(v_5b2623): AudioVerdictResult {
  const v_710f85 = v_5b2623.filter((v_81e2ef) => Number.isFinite(v_81e2ef));
  if (v_710f85.length === 0) {
    return { verdict: "ok", avg: -160, spread: 0, sampleCount: 0 };
  }
  const v_dce0a8 = v_710f85.reduce((v_779914, v_148ff6) => v_779914 + v_148ff6, 0);
  const v_b94caa = v_dce0a8 / v_710f85.length;
  const v_d2c6bf = Math.max(...v_710f85);
  const v_43e24b = Math.min(...v_710f85);
  const v_8c0f82 = v_d2c6bf - v_43e24b;

  if (v_b94caa < v_974277) {
    return { verdict: "silence", avg: v_b94caa, spread: v_8c0f82, sampleCount: v_710f85.length };
  }

  if (v_8c0f82 >= v_45d7ec) {
    return { verdict: "noise", avg: v_b94caa, spread: v_8c0f82, sampleCount: v_710f85.length };
  }
  return { verdict: "ok", avg: v_b94caa, spread: v_8c0f82, sampleCount: v_710f85.length };
}

export function v_184958(
  v_062bb0,
  v_3b402b,
  v_eab09f = v_b955ff,
): number[] {
  const v_a448ad = v_062bb0.concat(v_3b402b);
  return v_a448ad.length > v_eab09f ? v_a448ad.slice(v_a448ad.length - v_eab09f) : v_a448ad;
}
