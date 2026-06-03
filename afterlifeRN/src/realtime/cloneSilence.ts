

export interface CloneSilenceConfig {

  levelThreshold: number;

  silenceHoldMs: number;

  awaitingTimeoutMs: number;

  fallbackWaitMs: number;

  maxWaitMs: number;
}

export const v_ccce9c = {
  levelThreshold: 0.01,
  silenceHoldMs: 1200,
  awaitingTimeoutMs: 8000,
  fallbackWaitMs: 6000,
  maxWaitMs: 20000,
};

export type CloneSilencePhase = 'awaiting' | 'active' | 'ended';

export interface CloneSilenceState {
  phase: CloneSilencePhase;

  elapsedMs: number;

  silenceMs: number;

  fallback: boolean;
}

export const v_396b87 = (): CloneSilenceState => ({
  phase: 'awaiting',
  elapsedMs: 0,
  silenceMs: 0,
  fallback: false,
});

export function v_7be8d9(
  v_2888b4,
): number | undefined {
  if (!v_2888b4) return undefined;

  for (const [, v_55172c] of v_2888b4) {
    if (v_55172c['type'] === 'inbound-rtp' && v_55172c['kind'] === 'audio') {
      const v_0f0c77 = v_55172c['audioLevel'];
      return typeof v_0f0c77 === 'number' ? v_0f0c77 : undefined;
    }
  }
  return undefined;
}

export function v_c506a5(
  v_b6e533,
  v_fbe91e,
  v_414ae9,
  v_01dcf5,
): CloneSilenceState {
  if (v_b6e533.phase === 'ended') return v_b6e533; 
  const v_3aa746 = v_b6e533.elapsedMs + v_414ae9;

  if (v_3aa746 >= v_01dcf5.maxWaitMs) {
    return { ...v_b6e533, phase: 'ended', elapsedMs: v_3aa746 };
  }

  if (v_fbe91e === undefined) {
    if (v_3aa746 >= v_01dcf5.fallbackWaitMs) {
      return { ...v_b6e533, phase: 'ended', elapsedMs: v_3aa746, fallback: true };
    }
    return { ...v_b6e533, elapsedMs: v_3aa746, fallback: true };
  }

  const v_da6613 = v_fbe91e <= v_01dcf5.levelThreshold;

  if (v_b6e533.phase === 'awaiting') {
    if (!v_da6613) {
      return { ...v_b6e533, phase: 'active', elapsedMs: v_3aa746, silenceMs: 0 };
    }
    if (v_3aa746 >= v_01dcf5.awaitingTimeoutMs) {
      return { ...v_b6e533, phase: 'ended', elapsedMs: v_3aa746 };
    }
    return { ...v_b6e533, elapsedMs: v_3aa746 };
  }

  if (v_da6613) {
    const v_05b2f6 = v_b6e533.silenceMs + v_414ae9;
    if (v_05b2f6 >= v_01dcf5.silenceHoldMs) {
      return { ...v_b6e533, phase: 'ended', elapsedMs: v_3aa746, silenceMs: v_05b2f6 };
    }
    return { ...v_b6e533, elapsedMs: v_3aa746, silenceMs: v_05b2f6 };
  }
  return { ...v_b6e533, elapsedMs: v_3aa746, silenceMs: 0 };
}
