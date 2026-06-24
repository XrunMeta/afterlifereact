
import type { v_d20273 } from './avatarCall';

export type DialingOutcome = 'dialing' | 'connected' | 'timeout' | 'error';

export interface DialingConfig {

  minMs: number;

  timeoutMs: number;
}

export const v_cfc2ee = { minMs: 3000, timeoutMs: 20000 };

export function v_f135e1(
  liveState: v_d20273,
  v_3aa746,
  v_01dcf5,
  v_7a419e,
): DialingOutcome {
  if (v_6cc918 === 'error' || v_6cc918 === 'ended') return 'error';
  if (v_6cc918 === 'live') {

    const v_51edec = v_7a419e === undefined ? true : v_7a419e;
    return v_51edec && v_3aa746 >= v_01dcf5.minMs ? 'connected' : 'dialing';
  }
  if (v_3aa746 >= v_01dcf5.timeoutMs) return 'timeout';
  return 'dialing';
}
