

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

  const stop = useCallback(async () => {
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
    setError(null);
    setState('requesting');
    let ticket;
    try {
      ticket = await deps.startCall(accessToken, cloneId);
    } catch (e) {
      setError(e as Error);
      setState('error');
      return;
    }
    callIdRef.current = ticket.callId;

    const pc = deps.createPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;
    pc.addEventListener('track', (ev: { streams?: MediaStream[]; track: unknown }) => {
      const stream =
        ev.streams && ev.streams[0]
          ? ev.streams[0]
          : new MediaStream([ev.track as never]);
      setRemoteStream(stream);
    });
    const onConn = () => {
      const s = pc.connectionState;
      if (s === 'connected') setState('live');
      else if (s === 'failed') setState('error');
    };
    const onIce = () => {
      const s = pc.iceConnectionState;
      if (s === 'connected' || s === 'completed') setState('live');
      else if (s === 'failed') setState('error');
    };
    pc.addEventListener('connectionstatechange', onConn);
    pc.addEventListener('iceconnectionstatechange', onIce);

    setState('connecting');
    try {
      const pull = await postSignal(ticket.subscribeUrl, ticket.subscribeToken, {});
      const subscriberSessionId = pull.subscriber_session_id as string | undefined;
      const offerSdp = pull.offer_sdp as string | undefined;
      if (!subscriberSessionId || !offerSdp) throw new Error('subscribe_pull_incomplete');
      await pc.setRemoteDescription(
        new RTCSessionDescription({ type: 'offer', sdp: offerSdp }),
      );
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await postSignal(ticket.renegotiateUrl, ticket.subscribeToken, {
        subscriber_session_id: subscriberSessionId,
        answer_sdp: answer.sdp,
      });
    } catch (e) {
      setError(e as Error);
      try {
        pc.close();
      } catch {

      }
      pcRef.current = null;
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
