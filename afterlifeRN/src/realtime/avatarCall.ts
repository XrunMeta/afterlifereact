

import type { MediaStream } from 'react-native-webrtc';

export type LiveAvatarState =
  | 'idle' | 'requesting' | 'connecting' | 'live' | 'error' | 'ended';

export type CallPhase = 'idle' | 'listening' | 'sending' | 'speaking';

export interface AvatarCall {
  state: LiveAvatarState;
  remoteStream: MediaStream | null;
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

export function classifyTrack(
  track: { kind?: string },
  stream: { getVideoTracks?: () => unknown[] },
): 'video' | 'audio' {
  if (track?.kind === 'video') return 'video';
  if (track?.kind === 'audio') return 'audio';
  const hasVideo = (stream.getVideoTracks?.()?.length ?? 0) > 0;
  return hasVideo ? 'video' : 'audio';
}
