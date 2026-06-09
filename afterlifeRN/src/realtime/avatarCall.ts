

import type { v_802da4 } from 'rthlnescfffbyxfmhgq';

export type LiveAvatarState =
  | 'idle' | 'requesting' | 'connecting' | 'live' | 'error' | 'ended';

export type CallPhase = 'idle' | 'listening' | 'sending' | 'speaking';

export interface AvatarCall {
  state: LiveAvatarState;
  remoteStream: v_802da4 | null;
  error: Error | null;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  phase: CallPhase;
  say: (text: string) => Promise<void>;
  notifySpeechEnd: () => void;
  getStatsReport: () => Promise<Iterable<[string, Record<string, unknown>]>> | null;

  subscribeSpeechEnd: (cb: () => void) => () => void;
}

export type UseAvatarCall = (opts: { cloneId: number; accessToken: string }) => AvatarCall;

export function v_d8a22b(
  v_2c681a,
  v_cab51f,
): 'video' | 'audio' {
  if (v_2c681a?.kind === 'video') return 'video';
  if (v_2c681a?.kind === 'audio') return 'audio';
  const v_281141 = (v_cab51f.getVideoTracks?.()?.length ?? 0) > 0;
  return v_281141 ? 'video' : 'audio';
}
