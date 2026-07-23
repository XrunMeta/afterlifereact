

import type { MediaStream } from 'react-native-webrtc';

export type LiveAvatarState =
  | 'idle' | 'requesting' | 'connecting' | 'live' | 'error' | 'ended';

export type CallPhase = 'idle' | 'listening' | 'sending' | 'speaking';

export interface SpeechSignal {
  type: 'speech_start' | 'speech_end' | 'speech_text';
  seq?: number;
  ts: number;

  text?: string;
}

export interface FaceEvent {
  event: 'speaker_confirmed' | 'unknown_face' | 'multi_face';
  personId?: number;
  displayName?: string | null;
}

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

  greet?: () => Promise<void>;
  speak?: (text: string) => Promise<void>;

  lastSignal?: SpeechSignal | null;

  sendFaceEvent?: (evt: FaceEvent) => void;
}

export type UseAvatarCall = (opts: {
  cloneId: number;
  accessToken: string;

  onEnrollSuggest?: (name: string, personId?: number) => void;
}) => AvatarCall;

export function classifyTrack(
  track: { kind?: string },
  stream: { getVideoTracks?: () => unknown[] },
): 'video' | 'audio' {
  if (track?.kind === 'video') return 'video';
  if (track?.kind === 'audio') return 'audio';
  const hasVideo = (stream.getVideoTracks?.()?.length ?? 0) > 0;
  return hasVideo ? 'video' : 'audio';
}
