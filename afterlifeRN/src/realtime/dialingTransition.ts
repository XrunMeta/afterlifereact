
import type { LiveAvatarState } from './avatarCall';

export type DialingOutcome = 'dialing' | 'connected' | 'timeout' | 'error';

export interface DialingConfig {

  minMs: number;

  timeoutMs: number;
}

export const DEFAULT_DIALING_CONFIG: DialingConfig = { minMs: 3000, timeoutMs: 20000 };

export function dialingOutcome(
  liveState: LiveAvatarState,
  elapsedMs: number,
  cfg: DialingConfig,
): DialingOutcome {
  if (liveState === 'error' || liveState === 'ended') return 'error';
  if (liveState === 'live') return elapsedMs >= cfg.minMs ? 'connected' : 'dialing';
  if (elapsedMs >= cfg.timeoutMs) return 'timeout';
  return 'dialing';
}
