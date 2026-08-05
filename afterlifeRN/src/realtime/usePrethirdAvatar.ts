

import { useCallback, useEffect, useRef, useState } from 'react';
import { RTCPeerConnection, RTCSessionDescription, MediaStream } from 'react-native-webrtc';
import { PRETHIRD_BASE } from '../config/apiBase';
import { useCallConfigStore } from '../stores/callConfigStore';
import { ensureFreshAccessToken } from '../lib/authFetch';
import { type AudioSessionControl, defaultAudioSessionControl } from './useAudioSession';
import { type AvatarCall, type LiveAvatarState, type CallPhase, type SpeechSignal, type FaceEvent, classifyTrack } from './avatarCall';

const nowMs = () => Date.now();

const REMAINING_MS_MAX = 30000;

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

function waitDcOpen(dc: any, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    if (dc.readyState === 'open') { resolve(true); return; }
    let done = false;
    const finish = (v: boolean) => {
      if (done) return; done = true;
      try { dc.removeEventListener?.('open', onOpen); } catch {  }
      resolve(v);
    };
    const onOpen = () => finish(dc.readyState === 'open');
    dc.addEventListener?.('open', onOpen);
    setTimeout(() => finish(dc.readyState === 'open'), timeoutMs);
  });
}

export function usePrethirdAvatar(opts: {
  cloneId: number;
  accessToken: string; 
  deps?: PrethirdAvatarDeps;

  onEnrollSuggest?: (name: string, personId?: number) => void;
}): AvatarCall {
  const { cloneId, accessToken, onEnrollSuggest } = opts;
  const deps = opts.deps ?? defaultDeps;
  const [state, setState] = useState<LiveAvatarState>('idle');
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [phase, setPhase] = useState<CallPhase>('idle');
  const [lastSignal, setLastSignal] = useState<SpeechSignal | null>(null);
  const seqRef = useRef(0);
  const pcRef = useRef<PrethirdPeerConnection | null>(null);
  const dcRef = useRef<any>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const speakTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const genRef = useRef(0);

  const applyingRemoteRef = useRef(false);
  const pendingCloseRef = useRef<PrethirdPeerConnection | null>(null);
  const SPEAK_SOFT_TIMEOUT_MS = 30_000;

  const onEnrollSuggestRef = useRef(onEnrollSuggest);
  useEffect(() => { onEnrollSuggestRef.current = onEnrollSuggest; }, [onEnrollSuggest]);

  const safeClosePc = useCallback((pc: PrethirdPeerConnection) => {
    if (applyingRemoteRef.current) { pendingCloseRef.current = pc; return; }
    try { pc.close(); } catch {  }
  }, []);

  const say = useCallback(async (text: string) => {
    const dc = dcRef.current;
    if (!pcRef.current || !dc) return;
    if (phase === 'sending' || phase === 'speaking') {

      throw new Error('prethird: busy');
    }
    const t = text.trim();
    if (!t) return;
    if (dc.readyState !== 'open') { setError(new Error('datachannel_not_open')); return; }
    setPhase('sending');
    try {
      const seq = (seqRef.current += 1);
      dc.send(JSON.stringify({ type: 'say', text: t, seq }));
      setPhase('speaking');
      if (speakTimer.current) clearTimeout(speakTimer.current);

      speakTimer.current = setTimeout(() => setPhase('idle'), SPEAK_SOFT_TIMEOUT_MS);
    } catch (e) {
      setError(e as Error);
      setPhase('idle');
    }
  }, [phase]);

  const greet = useCallback(async () => {
    const dc = dcRef.current;
    if (!pcRef.current || !dc) return;
    if (dc.readyState !== 'open') {
      const ok = await waitDcOpen(dc, 3000);
      if (!ok || dcRef.current !== dc || !pcRef.current) return;
    }
    const seq = (seqRef.current += 1);
    try {
      dc.send(JSON.stringify({ type: 'greet', seq }));
    } catch (e) {
      setError(e as Error);
    }
  }, []);

  const speak = useCallback(async (text: string) => {
    const dc = dcRef.current;
    const t = text.trim();
    if (!pcRef.current || !dc || !t) return;
    if (dc.readyState !== 'open') {
      const ok = await waitDcOpen(dc, 3000);
      if (!ok || dcRef.current !== dc || !pcRef.current) return;
    }
    const seq = (seqRef.current += 1);
    try {
      dc.send(JSON.stringify({ type: 'speak', text: t, seq }));
    } catch (e) {
      setError(e as Error);
    }
  }, []);

  const sendFaceEvent = useCallback((evt: FaceEvent) => {
    const dc = dcRef.current;
    if (!pcRef.current || !dc || dc.readyState !== 'open') return;
    try {
      const seq = (seqRef.current += 1);
      dc.send(JSON.stringify({ type: 'face_event', ...evt, seq }));
    } catch {

    }
  }, []);

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
    setLastSignal(null);   
    seqRef.current = 0;    

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
    const dc = pc.createDataChannel('control');
    dcRef.current = dc;
    const onControl = (ev: { data?: string }) => {
      if (!alive()) return;
      try {
        const m = JSON.parse(ev?.data ?? '');
        if (m.type === 'speech_start' || m.type === 'speech_end') {

          const remainingMs =
            m.type === 'speech_end' && typeof m.remaining_ms === 'number' && m.remaining_ms >= 0
              ? Math.min(m.remaining_ms, REMAINING_MS_MAX)
              : undefined;
          setLastSignal({ type: m.type, seq: m.seq, ts: nowMs(), remainingMs });
          if (m.type === 'speech_end') notifySpeechEnd();
        } else if (m.type === 'speech_text') {

          if (typeof m.text === 'string' && m.text) {
            setLastSignal({ type: 'speech_text', seq: m.seq, ts: nowMs(), text: m.text });
          }
        } else if (m.type === 'enroll_suggest') {

          const personId = typeof m.personId === 'number' ? m.personId : undefined;
          onEnrollSuggestRef.current?.(typeof m.name === 'string' ? m.name : '', personId);
        }
      } catch {  }
    };

    dc.addEventListener?.('message', (ev: any) => onControl(ev));

    setState('connecting');
    try {
      await pc.setLocalDescription(await pc.createOffer());
      await waitForIceGatheringComplete(pc);
      if (!alive()) { pc.close(); return; }
      const offerSdp = pc.localDescription?.sdp;

      const freshToken = await ensureFreshAccessToken(accessToken);
      if (!alive()) { pc.close(); return; } 

      const base = useCallConfigStore.getState().prethirdBase;
      const url = `${base}/offer`;
      if (__DEV__) console.log(`[CALL-ROUTE] route=prethird base=${base} clone_id=${cloneId}`);
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'offer', sdp: offerSdp, clone_id: cloneId, access_token: freshToken }),
      });
      const text = await r.text();
      if (r.status === 424) {

        throw new Error('clone_bundle_unavailable');
      }
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

  return { state, remoteStream, error, start, stop, phase, say, notifySpeechEnd, getStatsReport, greet, speak, lastSignal, sendFaceEvent };
}
