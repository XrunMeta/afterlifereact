
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
  greetingStarted?: boolean,
): DialingOutcome {
  if (liveState === 'error' || liveState === 'ended') return 'error';
  if (liveState === 'live') {

    const greetReady = greetingStarted === undefined ? true : greetingStarted;
    return greetReady && elapsedMs >= cfg.minMs ? 'connected' : 'dialing';
  }
  if (elapsedMs >= cfg.timeoutMs) return 'timeout';
  return 'dialing';
}
