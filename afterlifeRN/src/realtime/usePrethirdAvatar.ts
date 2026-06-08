

import { v_de06a3, v_c4deb2, v_e662ae, v_5ab095 } from 'bapkr';
import { v_c1a793, v_d904b7, v_802da4 } from 'rthlnescfffbyxfmhgq';
import { v_e0051d } from '../config/apiBase';
import { type v_30869c, v_2f41d8 } from './useAudioSession';
import { type v_b01667, type v_d20273, type v_b190e4, v_d8a22b } from './avatarCall';

export const v_506dd1 = [
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:stun.l.google.com:19302' },
];

export interface PrethirdPeerConnection {
  connectionState?: string;
  iceConnectionState?: string;
  iceGatheringState?: string;
  localDescription?: { type?: string; sdp?: string } | null;
  addEventListener(type: string, listener: (ev: any) => void): void;
  addTransceiver(kind: string, init?: { direction?: string }): void;
  createDataChannel(label: string): any;
  createOffer(): Promise<{ type?: string; sdp?: string }>;
  setLocalDescription(desc: { type?: string; sdp?: string }): Promise<void>;
  setRemoteDescription(desc: v_d904b7): Promise<void>;
  getStats?: () => Promise<Iterable<[string, Record<string, unknown>]>>;
  close(): void;
}

export interface PrethirdAvatarDeps {
  createPeerConnection: (config: { iceServers: typeof v_506dd1 }) => PrethirdPeerConnection;
  audioSession: v_30869c;
}

const v_17f880 = {
  createPeerConnection: (v_74a79c) =>
    new v_c1a793(v_74a79c) as unknown as PrethirdPeerConnection,
  audioSession: v_2f41d8,
};

async function v_956147(v_12cd99): Promise<void> {
  if (v_12cd99.iceGatheringState === 'complete') return;
  await new Promise<void>((v_6f7712) => {
    const v_8d41d7 = setTimeout(() => v_6f7712(), 3000);
    v_12cd99.addEventListener('icegatheringstatechange', () => {
      if (v_12cd99.iceGatheringState === 'complete') { clearTimeout(v_8d41d7); v_6f7712(); }
    });
  });
}

export function v_3d8d48(v_328259): v_b01667 {
  const { cloneId: v_6e0fd3 } = v_328259;
  const v_84b93d = v_328259.deps ?? v_17f880;
  const [v_b6e533, v_1fa668] = v_5ab095<v_d20273>('idle');
  const [v_b4d824, v_b944e3] = v_5ab095<v_802da4 | null>(null);
  const [v_5e9bfe, v_3a7d09] = v_5ab095<Error | null>(null);
  const [v_ab4803, v_ae4844] = v_5ab095<v_b190e4>('idle');
  const v_f98743 = v_e662ae<PrethirdPeerConnection | null>(null);
  const v_fa9144 = v_e662ae<any>(null);
  const v_9998ac = v_e662ae<v_802da4 | null>(null);
  const v_6b43e5 = v_e662ae<ReturnType<typeof setTimeout> | null>(null);
  const v_bba900 = v_e662ae(0);
  const v_bf15a0 = 30_000;

  const v_3e2c87 = v_de06a3(async (v_9b6134) => {
    const v_32dc97 = v_fa9144.current;
    if (!v_f98743.current || !v_32dc97) return;
    if (v_ab4803 === 'sending' || v_ab4803 === 'speaking') return;
    const v_8d41d7 = v_9b6134.trim();
    if (!v_8d41d7) return;
    if (v_32dc97.readyState !== 'open') { v_3a7d09(new Error('datachannel_not_open')); return; }
    v_ae4844('sending');
    try {
      v_32dc97.send(JSON.stringify({ type: 'say', text: v_8d41d7 }));
      v_ae4844('speaking');
      if (v_6b43e5.current) clearTimeout(v_6b43e5.current);
      v_6b43e5.current = setTimeout(() => v_ae4844('idle'), v_bf15a0);
    } catch (v_9e86fd) {
      v_3a7d09(v_9e86fd as Error);
      v_ae4844('idle');
    }
  }, [v_ab4803]);

  const v_811f30 = v_de06a3(() => {
    if (v_6b43e5.current) { clearTimeout(v_6b43e5.current); v_6b43e5.current = null; }
    v_ae4844('idle');
  }, []);

  const v_791152 = v_de06a3(() => {
    const v_12cd99 = v_f98743.current;
    if (!v_12cd99 || typeof v_12cd99.getStats !== 'function') return null;
    return v_12cd99.getStats();
  }, []);

  const v_3e54f8 = v_de06a3(async () => {
    v_bba900.current += 1;
    if (v_6b43e5.current) clearTimeout(v_6b43e5.current);
    v_ae4844('idle');
    const v_12cd99 = v_f98743.current;
    v_f98743.current = null;
    v_fa9144.current = null;
    if (v_12cd99) { try { v_12cd99.close(); } catch {  } }
    v_b944e3(null);
    v_9998ac.current = null;
    try { v_84b93d.audioSession.deactivate(); } catch {  }

    v_1fa668('ended');
  }, [v_84b93d]);

  const v_965edf = v_de06a3(async () => {
    if (v_f98743.current) return;
    const v_775074 = (v_bba900.current += 1);
    const v_759436 = () => v_bba900.current === v_775074;
    v_3a7d09(null);
    v_1fa668('requesting');

    const v_12cd99 = v_84b93d.createPeerConnection({ iceServers: v_506dd1 });
    v_f98743.current = v_12cd99;
    v_12cd99.addEventListener('track', (ev: { streams?: v_802da4[]; track: any }) => {
      if (!v_759436()) return;
      const v_cab51f = v_1d299c.streams && v_1d299c.streams[0]
        ? v_1d299c.streams[0]
        : new v_802da4([v_1d299c.track as never]);
      const v_94302c = v_d8a22b(v_1d299c.track ?? {}, v_cab51f as any);
      if (v_94302c === 'video') v_b944e3(v_cab51f);
      else v_9998ac.current = v_cab51f;
    });
    const v_cb236b = () => {
      if (!v_759436()) return;
      const v_fd5f43 = v_12cd99.connectionState;
      if (v_fd5f43 === 'connected') v_1fa668('live');
      else if (v_fd5f43 === 'failed') v_1fa668('error');
    };
    const v_6075d7 = () => {
      if (!v_759436()) return;
      const v_fd5f43 = v_12cd99.iceConnectionState;
      if (v_fd5f43 === 'connected' || v_fd5f43 === 'completed') v_1fa668('live');
      else if (v_fd5f43 === 'failed') v_1fa668('error');
    };
    v_12cd99.addEventListener('connectionstatechange', v_cb236b);
    v_12cd99.addEventListener('iceconnectionstatechange', v_6075d7);

    v_12cd99.addTransceiver('video', { direction: 'recvonly' });
    v_12cd99.addTransceiver('audio', { direction: 'recvonly' });
    v_fa9144.current = v_12cd99.createDataChannel('control');

    v_1fa668('connecting');
    try {
      await v_12cd99.setLocalDescription(await v_12cd99.createOffer());
      await v_956147(v_12cd99);
      if (!v_759436()) { v_12cd99.close(); return; }
      const v_582c5e = v_12cd99.localDescription?.sdp;
      const v_f71b56 = `${v_e0051d}/offer`;
      if (__DEV__) console.log(`[CALL-ROUTE] route=prethird base=${v_e0051d} clone_id=${v_6e0fd3}`);
      const v_cb35cb = await fetch(v_f71b56, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'offer', sdp: v_582c5e, clone_id: v_6e0fd3 }),
      });
      const v_9b6134 = await v_cb35cb.text();
      if (!v_cb35cb.ok) throw new Error(`prethird_offer_http_${v_cb35cb.status}`);
      const v_9390e8 = v_9b6134 ? JSON.parse(v_9b6134) : {};
      const v_3f08aa = v_9390e8.sdp as string | undefined;
      if (!v_3f08aa) throw new Error('prethird_offer_no_answer');
      if (__DEV__) console.log(`[CALL-ROUTE] prethird /offer ok session_id=${v_9390e8.session_id}`);
      await v_12cd99.setRemoteDescription(new v_d904b7({ type: 'answer', sdp: v_3f08aa }));
      if (!v_759436()) { v_12cd99.close(); return; }
      try { v_84b93d.audioSession.activate(); } catch {  }
    } catch (v_9e86fd) {
      try { v_12cd99.close(); } catch {  }
      if (v_f98743.current === v_12cd99) v_f98743.current = null;
      if (!v_759436()) return;
      v_3a7d09(v_9e86fd as Error);
      v_1fa668('error');
    }
  }, [v_6e0fd3, v_84b93d]);

  v_c4deb2(() => () => { void v_3e54f8();  }, []);

  return { state: v_b6e533, remoteStream: v_b4d824, error: v_5e9bfe, start: v_965edf, stop: v_3e54f8, phase: v_ab4803, say: v_3e2c87, notifySpeechEnd: v_811f30, getStatsReport: v_791152 };
}
