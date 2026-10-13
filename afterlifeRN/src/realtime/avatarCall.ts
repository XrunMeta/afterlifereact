

import type { v_802da4 } from 'rthlnescfffbyxfmhgq';

import type { v_2a0baf } from '../components/viseme/VisemePlayer';

export type LiveAvatarState =
  | 'idle' | 'requesting' | 'connecting' | 'live' | 'error' | 'ended';

export type CallPhase = 'idle' | 'listening' | 'sending' | 'speaking';

export interface SpeechSignal {
  type: 'speech_start' | 'speech_end' | 'speech_text';
  seq?: number;
  ts: number;

  text?: string;

  remainingMs?: number;
}

export interface FaceEvent {
  event: 'speaker_confirmed' | 'unknown_face' | 'multi_face';
  personId?: number;
  displayName?: string | null;

  silent?: boolean;

  rejoin?: boolean;

  mentionName?: boolean;
}

export interface AvatarCall {
  state: LiveAvatarState;
  remoteStream: v_802da4 | null;
  error: Error | null;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  phase: CallPhase;
  say: (text: string, opts?: { adNotice?: 'pre' }) => Promise<void>;
  notifySpeechEnd: () => void;
  getStatsReport: () => Promise<Iterable<[string, Record<string, unknown>]>> | null;

  greet?: () => Promise<void>;
  speak?: (text: string) => Promise<void>;

  lastSignal?: SpeechSignal | null;

  sendFaceEvent?: (evt: FaceEvent) => void;

  sendAudioReady?: () => void;

  sendAdPrepareReturn?: () => void;
  sendAdReturned?: () => void;

  visemeResponse?: v_2a0baf | null;

  getCallId?: () => string | null;
}

export type UseAvatarCall = (opts: {
  cloneId: number;
  accessToken: string;

  onEnrollSuggest?: (name: string, personId?: number) => void;

  onRememberMe?: () => void;

  pipeline?: string | null;

  usesBridge?: boolean;

  ttsOutput?: string | null;

  voiceModelManifestUrl?: string | null;
}) => AvatarCall;

export function v_d8a22b(
  v_2c681a,
  v_cab51f,
): 'video' | 'audio' {
  if (v_2c681a?.kind === 'video') return 'video';
  if (v_2c681a?.kind === 'audio') return 'audio';
  const v_281141 = (v_cab51f.getVideoTracks?.()?.length ?? 0) > 0;
  return v_281141 ? 'video' : 'audio';
}
