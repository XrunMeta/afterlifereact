

export type TimingEventType =
  | 'speech_start' | 'speech_end'
  | 'stt_open' | 'stt_close'
  | 'suppress_on' | 'suppress_off'
  | 'vad_endpoint' | 'dev_listen_now';

export interface TimingEvent { type: TimingEventType; tMs: number }

const v_7db0a1 = 40;
let v_062bb0 = [];
let v_ab371b = [];
let v_b52a6e = () => Date.now();

export function v_94a663(v_f80480): void { v_b52a6e = v_f80480; }

function v_c226a5(): void {
  const v_5392c4 = v_062bb0.slice();
  v_ab371b.forEach((v_16dbdb) => v_16dbdb(v_5392c4));
}

export function v_d7f7b1(v_3b27d9): void {
  if (!__DEV__) return; 
  v_062bb0.push({ type: v_3b27d9, tMs: v_b52a6e() });
  if (v_062bb0.length > v_7db0a1) v_062bb0 = v_062bb0.slice(v_062bb0.length - v_7db0a1);
  v_c226a5();
}

export function v_2c6b15(v_16dbdb): () => void {
  v_ab371b.push(v_16dbdb);
  v_16dbdb(v_062bb0.slice()); 
  return () => { v_ab371b = v_ab371b.filter((v_fd5f43) => v_fd5f43 !== v_16dbdb); };
}

export function v_08004c(): TimingEvent[] { return v_062bb0.slice(); }
export function v_8c24f4(): void { v_062bb0 = []; v_c226a5(); }

export function v_ad545f(v_1d299c, v_ba2215): string {
  const v_e9396c = v_ba2215 ? v_1d299c.tMs - v_ba2215.tMs : 0;
  return `${v_1d299c.type.padEnd(14)}+${v_e9396c}ms`;
}
