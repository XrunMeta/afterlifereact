

export const SELF_CONFIRM_SAMPLE_COUNT = 3;
export const SELF_CONFIRM_INTERVAL_MS = 2000;

export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    dot += av * bv;
    na += av * av;
    nb += bv * bv;
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

export interface SelfConfirmInput {

  alreadyConfirmed: boolean;

  faceIdentifyEnabled: boolean;

  samples: number[][];

  threshold: number;
}

export type SelfConfirmAction =
  | { kind: 'idle' }
  | { kind: 'collect' }
  | { kind: 'reset' }
  | { kind: 'confirm'; vectors: number[][] };

export function decideSelfConfirm(input: SelfConfirmInput): SelfConfirmAction {
  const { alreadyConfirmed, faceIdentifyEnabled, samples, threshold } = input;

  if (alreadyConfirmed || !faceIdentifyEnabled) return { kind: 'idle' };
  if (samples.length < SELF_CONFIRM_SAMPLE_COUNT) return { kind: 'collect' };

  const window = samples.slice(-SELF_CONFIRM_SAMPLE_COUNT);

  for (let i = 0; i < window.length; i++) {
    for (let j = i + 1; j < window.length; j++) {
      if (cosine(window[i]!, window[j]!) < threshold) return { kind: 'reset' };
    }
  }
  return { kind: 'confirm', vectors: window };
}
