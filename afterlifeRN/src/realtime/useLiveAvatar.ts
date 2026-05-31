

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  RTCPeerConnection,
  RTCSessionDescription,
  MediaStream,
} from 'react-native-webrtc';
import { startCall as defaultStartCall, endCall as defaultEndCall, sayInCall as defaultSayInCall } from '../api/calls';

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
  close(): void;
}

export interface LiveAvatarDeps {
  startCall: typeof defaultStartCall;
  endCall: typeof defaultEndCall;
  sayInCall: typeof defaultSayInCall;
  createPeerConnection: (config: { iceServers: typeof ICE_SERVERS }) => LivePeerConnection;
}

const defaultDeps: LiveAvatarDeps = {
  startCall: defaultStartCall,
  endCall: defaultEndCall,
  sayInCall: defaultSayInCall,
  createPeerConnection: (config) =>
    new RTCPeerConnection(config) as unknown as LivePeerConnection,
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

  const stop = useCallback(async () => {
    genRef.current += 1; 
    if (speakTimer.current) clearTimeout(speakTimer.current);
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

      const hasVideo =
        ((stream as any).getVideoTracks?.()?.length ?? 0) > 0 || ev.track?.kind === 'video';
      if (hasVideo) setRemoteStream(stream);
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
      await pc.setRemoteDescription(
        new RTCSessionDescription({ type: 'offer', sdp: offerSdp }),
      );
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      if (!alive()) {
        pc.close();
        return;
      }
      await postSignal(ticket.renegotiateUrl, ticket.subscribeToken, {
        subscriber_session_id: subscriberSessionId,
        answer_sdp: answer.sdp,
      });
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

  return { state, remoteStream, error, start, stop, phase, say };
}
