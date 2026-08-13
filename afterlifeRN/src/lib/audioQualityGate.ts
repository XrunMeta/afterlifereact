

export const SILENCE_THRESHOLD_DB = -55; 
export const NOISE_SPIKE_DB = 30;         
export const WINDOW_SAMPLES = 25;         

export type AudioVerdict = "ok" | "silence" | "noise";

export interface AudioVerdictResult {
  verdict: AudioVerdict;
  avg: number;
  spread: number;
  sampleCount: number;
}

export function evaluateWindow(samples: readonly number[]): AudioVerdictResult {
  const finite = samples.filter((v) => Number.isFinite(v));
  if (finite.length === 0) {
    return { verdict: "ok", avg: -160, spread: 0, sampleCount: 0 };
  }
  const sum = finite.reduce((a, b) => a + b, 0);
  const avg = sum / finite.length;
  const max = Math.max(...finite);
  const min = Math.min(...finite);
  const spread = max - min;

  if (avg < SILENCE_THRESHOLD_DB) {
    return { verdict: "silence", avg, spread, sampleCount: finite.length };
  }

  if (spread >= NOISE_SPIKE_DB) {
    return { verdict: "noise", avg, spread, sampleCount: finite.length };
  }
  return { verdict: "ok", avg, spread, sampleCount: finite.length };
}

export function appendSample(
  buffer: readonly number[],
  value: number,
  windowSize: number = WINDOW_SAMPLES,
): number[] {
  const next = buffer.concat(value);
  return next.length > windowSize ? next.slice(next.length - windowSize) : next;
}
