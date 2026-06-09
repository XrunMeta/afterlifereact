

const UNIFY_MSID = true;

export function unifySdpMsid(sdp: string): string {

  const sections = sdp.split(/(?=^m=)/m);

  let videoSection: string | null = null;
  let audioSection: string | null = null;
  let videoIdx = -1;
  let audioIdx = -1;

  for (let i = 0; i < sections.length; i++) {
    const sec = sections[i];
    if (/^m=video\b/m.test(sec)) {
      videoSection = sec;
      videoIdx = i;
    } else if (/^m=audio\b/m.test(sec)) {
      audioSection = sec;
      audioIdx = i;
    }
  }

  if (!videoSection || !audioSection || videoIdx < 0 || audioIdx < 0) {
    return sdp; 
  }

  const videoMsidLineMatch = videoSection.match(/^a=msid:(\S+)\s+\S+/m);
  const videoSsrcMsidMatch = videoSection.match(/^a=ssrc:\S+\s+msid:(\S+)\s+\S+/m);
  const videoStreamId = (videoMsidLineMatch?.[1] ?? videoSsrcMsidMatch?.[1] ?? '').trim();

  const audioMsidLineMatch = audioSection.match(/^a=msid:(\S+)\s+\S+/m);
  const audioSsrcMsidMatch = audioSection.match(/^a=ssrc:\S+\s+msid:(\S+)\s+\S+/m);
  const audioStreamId = (audioMsidLineMatch?.[1] ?? audioSsrcMsidMatch?.[1] ?? '').trim();

  if (!videoStreamId || !audioStreamId) {
    return sdp; 
  }

  if (videoStreamId === audioStreamId) {
    return sdp; 
  }

  const escaped = audioStreamId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  let patched = audioSection
    .replace(
      new RegExp(`(^a=msid:)${escaped}(\\s)`, 'gm'),
      `$1${videoStreamId}$2`,
    )

    .replace(
      new RegExp(`(^a=ssrc:\\S+\\s+msid:)${escaped}(\\s)`, 'gm'),
      `$1${videoStreamId}$2`,
    )

    .replace(
      new RegExp(`(^a=ssrc:\\S+\\s+mslabel:)${escaped}(\\s*$)`, 'gm'),
      `$1${videoStreamId}$2`,
    );

  sections[audioIdx] = patched;
  return sections.join('');
}

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  RTCPeerConnection,
  RTCSessionDescription,
  MediaStream,
} from 'react-native-webrtc';
import { startCall as defaultStartCall, endCall as defaultEndCall, sayInCall as defaultSayInCall } from '../api/calls';
import { type AudioSessionControl, defaultAudioSessionControl } from './useAudioSession';

export const ICE_SERVERS = [
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:stun.l.google.com:19302' },
];

export type LiveAvatarState =
  | 'idle'
  | 'requesting'
  | 'connecting'
  | 'live'
  | 'error'
  | 'ended';

export interface LivePeerConnection {
  connectionState?: string;
  iceConnectionState?: string;
  addEventListener(type: string, listener: (ev: any) => void): void;
  setRemoteDescription(desc: RTCSessionDescription): Promise<void>;
  createAnswer(): Promise<{ type?: string; sdp?: string }>;
  setLocalDescription(desc: { type?: string; sdp?: string }): Promise<void>;
  getStats?: () => Promise<Iterable<[string, Record<string, unknown>]>>;
  close(): void;
}

export interface LiveAvatarDeps {
  startCall: typeof defaultStartCall;
  endCall: typeof defaultEndCall;
  sayInCall: typeof defaultSayInCall;
  createPeerConnection: (config: { iceServers: typeof ICE_SERVERS }) => LivePeerConnection;

  audioSession: AudioSessionControl;
}

const defaultDeps: LiveAvatarDeps = {
  startCall: defaultStartCall,
  endCall: defaultEndCall,
  sayInCall: defaultSayInCall,
  createPeerConnection: (config) =>
    new RTCPeerConnection(config) as unknown as LivePeerConnection,
  audioSession: defaultAudioSessionControl,
};

async function postSignal(url: string, token: string, body: object): Promise<Record<string, unknown>> {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  let data: Record<string, unknown> = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }
  if (!r.ok) throw new Error(`subscribe_http_${r.status}`);
  return data;
}

export function useLiveAvatar(opts: {
  cloneId: number;
  accessToken: string;
  deps?: LiveAvatarDeps;
}) {
  const { cloneId, accessToken } = opts;
  const deps = opts.deps ?? defaultDeps;
  const [state, setState] = useState<LiveAvatarState>('idle');
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [phase, setPhase] = useState<'idle' | 'listening' | 'sending' | 'speaking'>('idle');
  const pcRef = useRef<LivePeerConnection | null>(null);
  const callIdRef = useRef<string | null>(null);
  const speakTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const statsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const audioStreamRef = useRef<MediaStream | null>(null);

  const genRef = useRef(0);

  const SPEAK_SOFT_TIMEOUT_MS = 30_000;

  const say = useCallback(async (text: string) => {
    if (!pcRef.current || !callIdRef.current) return; 
    if (phase === 'sending' || phase === 'speaking') return; 
    const t = text.trim();
    if (!t) return;
    setPhase('sending');
    try {
      await deps.sayInCall(accessToken, cloneId, callIdRef.current, t);

      setPhase('speaking');
      if (speakTimer.current) clearTimeout(speakTimer.current);
      speakTimer.current = setTimeout(() => setPhase('idle'), SPEAK_SOFT_TIMEOUT_MS);
    } catch (e) {
      setError(e as Error);
      setPhase('idle');
    }
  }, [accessToken, cloneId, deps, phase]);

  const notifySpeechEnd = useCallback(() => {
    if (speakTimer.current) {
      clearTimeout(speakTimer.current);
      speakTimer.current = null;
    }
    setPhase('idle');
  }, []);

  const getStatsReport = useCallback((): Promise<Iterable<[string, Record<string, unknown>]>> | null => {
    const pc = pcRef.current;
    if (!pc || typeof pc.getStats !== 'function') return null;
    return pc.getStats();
  }, []);

  const stop = useCallback(async () => {
    genRef.current += 1; 
    if (speakTimer.current) clearTimeout(speakTimer.current);

    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
      statsIntervalRef.current = null;
    }
    setPhase('idle');
    const pc = pcRef.current;
    pcRef.current = null;
    if (pc) {
      try {
        pc.close();
      } catch {

      }
    }
    setRemoteStream(null);
    audioStreamRef.current = null;

    try {
      deps.audioSession.deactivate();
    } catch {

    }
    const callId = callIdRef.current;
    callIdRef.current = null;
    if (callId) {
      try {
        await deps.endCall(accessToken, cloneId, callId);
      } catch {

      }
    }
    setState('ended');
  }, [accessToken, cloneId, deps]);

  const start = useCallback(async () => {
    if (pcRef.current) return; 
    const myGen = (genRef.current += 1);
    const alive = () => genRef.current === myGen;

    setError(null);
    setState('requesting');
    let ticket;
    try {
      ticket = await deps.startCall(accessToken, cloneId);
    } catch (e) {
      if (!alive()) return;
      setError(e as Error);
      setState('error');
      return;
    }
    if (!alive()) return; 
    callIdRef.current = ticket.callId;

    const pc = deps.createPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;
    pc.addEventListener('track', (ev: { streams?: MediaStream[]; track: any }) => {
      if (!alive()) return;
      const stream =
        ev.streams && ev.streams[0]
          ? ev.streams[0]
          : new MediaStream([ev.track as never]);

      const trackKind: string | undefined = ev.track?.kind;
      if (trackKind === 'video') {
        setRemoteStream(stream);
      } else if (trackKind === 'audio') {

        audioStreamRef.current = stream;
      } else {

        const hasVideo = ((stream as any).getVideoTracks?.()?.length ?? 0) > 0;
        if (hasVideo) {
          setRemoteStream(stream);
        } else {
          audioStreamRef.current = stream;
        }
      }
    });
    const onConn = () => {
      if (!alive()) return;
      const s = pc.connectionState;
      if (s === 'connected') setState('live');
      else if (s === 'failed') setState('error');
    };
    const onIce = () => {
      if (!alive()) return;
      const s = pc.iceConnectionState;
      if (s === 'connected' || s === 'completed') setState('live');
      else if (s === 'failed') setState('error');
    };
    pc.addEventListener('connectionstatechange', onConn);
    pc.addEventListener('iceconnectionstatechange', onIce);

    setState('connecting');
    try {
      const pull = await postSignal(ticket.subscribeUrl, ticket.subscribeToken, {});
      if (!alive()) {
        pc.close();
        return;
      }
      const subscriberSessionId = pull.subscriber_session_id as string | undefined;
      const offerSdp = pull.offer_sdp as string | undefined;
      if (!subscriberSessionId || !offerSdp) throw new Error('subscribe_pull_incomplete');

      if (__DEV__) {
        console.log('[SDP-DIAG][offer]\n' + offerSdp);
      }

      const finalOfferSdp = UNIFY_MSID ? unifySdpMsid(offerSdp) : offerSdp;
      if (__DEV__ && UNIFY_MSID) {
        if (finalOfferSdp !== offerSdp) {

          const audioSidMatch = offerSdp.match(/^m=audio[\s\S]*?^a=msid:(\S+)\s+\S+/m)
            ?? offerSdp.match(/^m=audio[\s\S]*?^a=ssrc:\S+\s+msid:(\S+)\s+\S+/m);
          const videoSidMatch = offerSdp.match(/^m=video[\s\S]*?^a=msid:(\S+)\s+\S+/m)
            ?? offerSdp.match(/^m=video[\s\S]*?^a=ssrc:\S+\s+msid:(\S+)\s+\S+/m);
          console.log(`[T-045] msid unified: ${audioSidMatch?.[1] ?? '?'} -> ${videoSidMatch?.[1] ?? '?'}`);
          console.log('[SDP-DIAG][offer-munged]\n' + finalOfferSdp);
        } else {
          console.log('[SDP-DIAG][offer-munged] no-op (stream-id already equal or extraction failed)');
        }
      }
      await pc.setRemoteDescription(
        new RTCSessionDescription({ type: 'offer', sdp: finalOfferSdp }),
      );
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (__DEV__) {
        console.log('[SDP-DIAG][answer]\n' + (answer.sdp ?? '(sdp empty)'));
      }
      if (!alive()) {
        pc.close();
        return;
      }
      await postSignal(ticket.renegotiateUrl, ticket.subscribeToken, {
        subscriber_session_id: subscriberSessionId,
        answer_sdp: answer.sdp,
      });
      if (!alive()) {
        pc.close();
        return;
      }

      try {
        deps.audioSession.activate();
      } catch {

      }

      if (__DEV__) {
        const pcWithStats = pc as unknown as {
          getStats?: () => Promise<Iterable<[string, Record<string, unknown>]>>;
        };
        if (typeof pcWithStats.getStats === 'function') {
          if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
          statsIntervalRef.current = setInterval(async () => {
            if (!alive()) {
              if (statsIntervalRef.current) {
                clearInterval(statsIntervalRef.current);
                statsIntervalRef.current = null;
              }
              return;
            }
            try {
              const report = await pcWithStats.getStats!();
              let audioStats: Record<string, unknown> | null = null;
              let videoStats: Record<string, unknown> | null = null;
              for (const [, stat] of report) {
                if (stat['type'] === 'inbound-rtp') {
                  if (stat['kind'] === 'audio') audioStats = stat;
                  else if (stat['kind'] === 'video') videoStats = stat;
                }
              }
              const toAvgDelayMs = (delay: unknown, count: unknown) => {
                const d = typeof delay === 'number' ? delay : undefined;
                const c = typeof count === 'number' ? count : undefined;
                if (d !== undefined && c !== undefined && c > 0) return (d / c * 1000).toFixed(2);
                return undefined;
              };
              if (audioStats) {
                const avgDelay = toAvgDelayMs(audioStats['jitterBufferDelay'], audioStats['jitterBufferEmittedCount']);
                console.log('[STATS-DIAG]', JSON.stringify({
                  kind: 'audio',
                  jitterBufferAvgMs: avgDelay,
                  packetsLost: audioStats['packetsLost'],
                  packetsReceived: audioStats['packetsReceived'],
                  estimatedPlayoutTimestamp: audioStats['estimatedPlayoutTimestamp'],
                  totalSamplesDuration: audioStats['totalSamplesDuration'],
                  totalSamplesReceived: audioStats['totalSamplesReceived'],
                  concealedSamples: audioStats['concealedSamples'],
                }));
              }
              if (videoStats) {
                const avgDelay = toAvgDelayMs(videoStats['jitterBufferDelay'], videoStats['jitterBufferEmittedCount']);
                console.log('[STATS-DIAG]', JSON.stringify({
                  kind: 'video',
                  jitterBufferAvgMs: avgDelay,
                  packetsLost: videoStats['packetsLost'],
                  packetsReceived: videoStats['packetsReceived'],
                  estimatedPlayoutTimestamp: videoStats['estimatedPlayoutTimestamp'],
                  framesDecoded: videoStats['framesDecoded'],
                  framesDropped: videoStats['framesDropped'],
                  framesPerSecond: videoStats['framesPerSecond'],
                  frameWidth: videoStats['frameWidth'],
                  frameHeight: videoStats['frameHeight'],
                }));
              }

              if (audioStats && videoStats) {
                const aTs = audioStats['estimatedPlayoutTimestamp'];
                const vTs = videoStats['estimatedPlayoutTimestamp'];
                if (typeof aTs === 'number' && typeof vTs === 'number') {
                  console.log('[STATS-DIAG]', JSON.stringify({
                    kind: 'av_drift',
                    av_playout_diff_ms: +(aTs - vTs).toFixed(2),
                  }));
                }
              }
            } catch {

            }
          }, 1000);
        }
      }
    } catch (e) {
      try {
        pc.close();
      } catch {

      }
      if (pcRef.current === pc) pcRef.current = null;
      if (!alive()) return;
      setError(e as Error);
      setState('error');
    }
  }, [accessToken, cloneId, deps]);

  useEffect(() => {
    return () => {
      void stop();
    };

  }, []);

  const subscribeSpeechEnd = useCallback(() => () => {}, []);

  return { state, remoteStream, error, start, stop, phase, say, notifySpeechEnd, getStatsReport, subscribeSpeechEnd };
}
