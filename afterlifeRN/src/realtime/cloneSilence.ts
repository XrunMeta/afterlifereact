

export interface CloneSilenceConfig {

  levelThreshold: number;

  silenceHoldMs: number;

  awaitingTimeoutMs: number;

  fallbackWaitMs: number;

  maxWaitMs: number;
}

export const DEFAULT_CLONE_SILENCE_CONFIG: CloneSilenceConfig = {
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

export const initCloneSilenceState = (): CloneSilenceState => ({
  phase: 'awaiting',
  elapsedMs: 0,
  silenceMs: 0,
  fallback: false,
});

export function extractCloneAudioLevel(
  report: Iterable<[string, Record<string, unknown>]> | null | undefined,
): number | undefined {
  if (!report) return undefined;

  for (const [, stat] of report) {
    if (stat['type'] === 'inbound-rtp' && stat['kind'] === 'audio') {
      const lv = stat['audioLevel'];
      return typeof lv === 'number' ? lv : undefined;
    }
  }
  return undefined;
}

export function cloneSilenceStep(
  state: CloneSilenceState,
  level: number | undefined,
  dtMs: number,
  cfg: CloneSilenceConfig,
): CloneSilenceState {
  if (state.phase === 'ended') return state; 
  const elapsedMs = state.elapsedMs + dtMs;

  if (elapsedMs >= cfg.maxWaitMs) {
    return { ...state, phase: 'ended', elapsedMs };
  }

  if (level === undefined) {
    if (elapsedMs >= cfg.fallbackWaitMs) {
      return { ...state, phase: 'ended', elapsedMs, fallback: true };
    }
    return { ...state, elapsedMs, fallback: true };
  }

  const isSilent = level <= cfg.levelThreshold;

  if (state.phase === 'awaiting') {
    if (!isSilent) {
      return { ...state, phase: 'active', elapsedMs, silenceMs: 0 };
    }
    if (elapsedMs >= cfg.awaitingTimeoutMs) {
      return { ...state, phase: 'ended', elapsedMs };
    }
    return { ...state, elapsedMs };
  }

  if (isSilent) {
    const silenceMs = state.silenceMs + dtMs;
    if (silenceMs >= cfg.silenceHoldMs) {
      return { ...state, phase: 'ended', elapsedMs, silenceMs };
    }
    return { ...state, elapsedMs, silenceMs };
  }
  return { ...state, elapsedMs, silenceMs: 0 };
}
