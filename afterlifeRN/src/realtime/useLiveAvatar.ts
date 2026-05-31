

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  RTCPeerConnection,
  RTCSessionDescription,
  MediaStream,
} from 'react-native-webrtc';
import { startCall as defaultStartCall, endCall as defaultEndCall } from '../api/calls';

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
  createPeerConnection: (config: { iceServers: typeof ICE_SERVERS }) => LivePeerConnection;
}

const defaultDeps: LiveAvatarDeps = {
  startCall: defaultStartCall,
  endCall: defaultEndCall,
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
  const pcRef = useRef<LivePeerConnection | null>(null);
  const callIdRef = useRef<string | null>(null);

  const genRef = useRef(0);

  const stop = useCallback(async () => {
    console.warn(`[Live] stop() 호출 — gen ${genRef.current}→${genRef.current + 1} (진행 중 start 무효화)`);
    genRef.current += 1; 
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
    console.log(`[Live] start cloneId=${cloneId} token=${accessToken ? 'set' : 'EMPTY'}`);
    let ticket;
    try {
      ticket = await deps.startCall(accessToken, cloneId);
    } catch (e) {
      if (!alive()) return;
      console.warn('[Live] startCall FAIL —', (e as Error)?.message);
      setError(e as Error);
      setState('error');
      return;
    }
    if (!alive()) return; 
    console.log(`[Live] ticket callId=${ticket.callId} subscribeUrl=${ticket.subscribeUrl}`);
    callIdRef.current = ticket.callId;

    const pc = deps.createPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;
    pc.addEventListener('track', (ev: { streams?: MediaStream[]; track: unknown }) => {
      if (!alive()) return;
      console.log('[Live] ontrack ← 원격 스트림 수신');
      const stream =
        ev.streams && ev.streams[0]
          ? ev.streams[0]
          : new MediaStream([ev.track as never]);
      setRemoteStream(stream);
    });
    const onConn = () => {
      if (!alive()) return;
      const s = pc.connectionState;
      console.log(`[Live] connectionState=${s}`);
      if (s === 'connected') setState('live');
      else if (s === 'failed') setState('error');
    };
    const onIce = () => {
      if (!alive()) return;
      const s = pc.iceConnectionState;
      console.log(`[Live] iceConnectionState=${s}`);
      if (s === 'connected' || s === 'completed') setState('live');
      else if (s === 'failed') setState('error');
    };
    pc.addEventListener('connectionstatechange', onConn);
    pc.addEventListener('iceconnectionstatechange', onIce);

    setState('connecting');
    try {
      console.log('[Live] subscribe pull 요청…');
      const pull = await postSignal(ticket.subscribeUrl, ticket.subscribeToken, {});
      if (!alive()) {
        pc.close();
        return;
      }
      const subscriberSessionId = pull.subscriber_session_id as string | undefined;
      const offerSdp = pull.offer_sdp as string | undefined;
      console.log(`[Live] subscribe ← sid=${subscriberSessionId} offer_len=${offerSdp?.length ?? 0}`);
      if (!subscriberSessionId || !offerSdp) throw new Error('subscribe_pull_incomplete');
      await pc.setRemoteDescription(
        new RTCSessionDescription({ type: 'offer', sdp: offerSdp }),
      );
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log(`[Live] before renegotiate — alive=${alive()} gen=${genRef.current} myGen=${myGen}`);
      if (!alive()) {
        console.warn('[Live] ⚠️ CANCELLED before renegotiate (gen mismatch) — answer 미전송');
        pc.close();
        return;
      }
      console.log('[Live] renegotiate 전송 시작…');
      await postSignal(ticket.renegotiateUrl, ticket.subscribeToken, {
        subscriber_session_id: subscriberSessionId,
        answer_sdp: answer.sdp,
      });
      console.log('[Live] renegotiate ← ok (핸드셰이크 완료, ICE/ontrack 대기)');
    } catch (e) {
      console.warn('[Live] 핸드셰이크 FAIL —', (e as Error)?.message);
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

  return { state, remoteStream, error, start, stop };
}
