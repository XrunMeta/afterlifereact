

import { useCallback, useEffect, useRef, useState } from 'react';
import { RTCPeerConnection, RTCSessionDescription, MediaStream } from 'react-native-webrtc';
import { PRETHIRD_BASE } from '../config/apiBase';
import { type AudioSessionControl, defaultAudioSessionControl } from './useAudioSession';
import { type AvatarCall, type LiveAvatarState, type CallPhase, classifyTrack } from './avatarCall';

export const ICE_SERVERS = [
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:stun.l.google.com:19302' },
];

export interface PrethirdPeerConnection {
  connectionState?: string;
  iceConnectionState?: string;
  iceGatheringState?: string;
  localDescription?: { type?: string; sdp?: string } | null;
  addEventListener(type: string, listener: (ev: any) => void): void;
  removeEventListener?(type: string, listener: (ev: any) => void): void;
  addTransceiver(kind: string, init?: { direction?: string }): void;
  createDataChannel(label: string): any;
  createOffer(): Promise<{ type?: string; sdp?: string }>;
  setLocalDescription(desc: { type?: string; sdp?: string }): Promise<void>;
  setRemoteDescription(desc: RTCSessionDescription): Promise<void>;
  getStats?: () => Promise<Iterable<[string, Record<string, unknown>]>>;
  close(): void;
}

export interface PrethirdAvatarDeps {
  createPeerConnection: (config: { iceServers: typeof ICE_SERVERS }) => PrethirdPeerConnection;
  audioSession: AudioSessionControl;
}

const defaultDeps: PrethirdAvatarDeps = {
  createPeerConnection: (config) =>
    new RTCPeerConnection(config) as unknown as PrethirdPeerConnection,
  audioSession: defaultAudioSessionControl,
};

async function waitForIceGatheringComplete(pc: PrethirdPeerConnection): Promise<void> {
  if (pc.iceGatheringState === 'complete') return;
  await new Promise<void>((resolve) => {
    let t: ReturnType<typeof setTimeout>;
    const handler = () => {
      if (pc.iceGatheringState === 'complete') { cleanup(); resolve(); }
    };
    const cleanup = () => {
      clearTimeout(t);
      pc.removeEventListener?.('icegatheringstatechange', handler);
    };
    t = setTimeout(() => { cleanup(); resolve(); }, 3000); 
    pc.addEventListener('icegatheringstatechange', handler);
  });
}

export function usePrethirdAvatar(opts: {
  cloneId: number;
  accessToken: string; 
  deps?: PrethirdAvatarDeps;
}): AvatarCall {
  const { cloneId, accessToken } = opts;
  const deps = opts.deps ?? defaultDeps;
  const [state, setState] = useState<LiveAvatarState>('idle');
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [phase, setPhase] = useState<CallPhase>('idle');
  const pcRef = useRef<PrethirdPeerConnection | null>(null);
  const dcRef = useRef<any>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const speakTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const genRef = useRef(0);

  const applyingRemoteRef = useRef(false);
  const pendingCloseRef = useRef<PrethirdPeerConnection | null>(null);
  const SPEAK_SOFT_TIMEOUT_MS = 30_000;

  const safeClosePc = useCallback((pc: PrethirdPeerConnection) => {
    if (applyingRemoteRef.current) { pendingCloseRef.current = pc; return; }
    try { pc.close(); } catch {  }
  }, []);

  const say = useCallback(async (text: string) => {
    const dc = dcRef.current;
    if (!pcRef.current || !dc) return;
    if (phase === 'sending' || phase === 'speaking') return;
    const t = text.trim();
    if (!t) return;
    if (dc.readyState !== 'open') { setError(new Error('datachannel_not_open')); return; }
    setPhase('sending');
    try {
      dc.send(JSON.stringify({ type: 'say', text: t }));
      setPhase('speaking');
      if (speakTimer.current) clearTimeout(speakTimer.current);

      speakTimer.current = setTimeout(() => setPhase('idle'), SPEAK_SOFT_TIMEOUT_MS);
    } catch (e) {
      setError(e as Error);
      setPhase('idle');
    }
  }, [phase]);

  const notifySpeechEnd = useCallback(() => {
    if (speakTimer.current) { clearTimeout(speakTimer.current); speakTimer.current = null; }
    setPhase('idle');
  }, []);

  const getStatsReport = useCallback(() => {
    const pc = pcRef.current;
    if (!pc || typeof pc.getStats !== 'function') return null;
    return pc.getStats();
  }, []);

  const stop = useCallback(async () => {
    genRef.current += 1;
    if (speakTimer.current) clearTimeout(speakTimer.current);
    setPhase('idle');
    const pc = pcRef.current;
    pcRef.current = null;
    dcRef.current = null;
    if (pc) safeClosePc(pc); 
    setRemoteStream(null);
    audioStreamRef.current = null;
    try { deps.audioSession.deactivate(); } catch {  }

    setState('ended');
  }, [deps]);

  const start = useCallback(async () => {
    if (pcRef.current) return;
    const myGen = (genRef.current += 1);
    const alive = () => genRef.current === myGen;
    setError(null);
    setState('requesting');

    const pc = deps.createPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;
    pc.addEventListener('track', (ev: { streams?: MediaStream[]; track: any }) => {
      if (!alive()) return;
      const stream = ev.streams && ev.streams[0]
        ? ev.streams[0]
        : new MediaStream([ev.track as never]);
      const kind = classifyTrack(ev.track ?? {}, stream as any);
      if (kind === 'video') setRemoteStream(stream);
      else audioStreamRef.current = stream;
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

    pc.addTransceiver('video', { direction: 'recvonly' });
    pc.addTransceiver('audio', { direction: 'recvonly' });
    dcRef.current = pc.createDataChannel('control');

    setState('connecting');
    try {
      await pc.setLocalDescription(await pc.createOffer());
      await waitForIceGatheringComplete(pc);
      if (!alive()) { pc.close(); return; }
      const offerSdp = pc.localDescription?.sdp;
      const url = `${PRETHIRD_BASE}/offer`;
      if (__DEV__) console.log(`[CALL-ROUTE] route=prethird base=${PRETHIRD_BASE} clone_id=${cloneId}`);
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'offer', sdp: offerSdp, clone_id: cloneId, access_token: accessToken }),
      });
      const text = await r.text();
      if (!r.ok) throw new Error(`prethird_offer_http_${r.status}`);
      const data = text ? JSON.parse(text) : {};
      const answerSdp = data.sdp as string | undefined;
      if (!answerSdp) throw new Error('prethird_offer_no_answer');
      if (__DEV__) console.log(`[CALL-ROUTE] prethird /offer ok session_id=${data.session_id}`);

      if (!alive()) { safeClosePc(pc); return; }
      applyingRemoteRef.current = true;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: answerSdp }));
      } finally {
        applyingRemoteRef.current = false;

        if (pendingCloseRef.current) {
          const p = pendingCloseRef.current; pendingCloseRef.current = null;
          try { p.close(); } catch {  }
        }
      }
      if (!alive()) { safeClosePc(pc); return; }
      try { deps.audioSession.activate(); } catch {  }
    } catch (e) {
      try { pc.close(); } catch {  }
      if (pcRef.current === pc) pcRef.current = null;
      if (!alive()) return;
      setError(e as Error);
      setState('error');
    }
  }, [cloneId, accessToken, deps]);

  useEffect(() => () => { void stop();  }, []);

  return { state, remoteStream, error, start, stop, phase, say, notifySpeechEnd, getStatsReport };
}
