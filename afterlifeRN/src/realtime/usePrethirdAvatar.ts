

import { v_de06a3, v_c4deb2, v_e662ae, v_5ab095 } from 'bapkr';
import { v_c1a793, v_d904b7, v_802da4 } from 'rthlnescfffbyxfmhgq';
import { v_e0051d } from '../config/apiBase';
import { v_5b540b } from '../stores/callConfigStore';
import { v_335e37 } from '../lib/authFetch';
import { type v_30869c, v_2f41d8 } from './useAudioSession';
import { type v_b01667, type v_d20273, type v_b190e4, type v_9d43cd, type v_14f245, v_d8a22b } from './avatarCall';
import { v_d7f7b1 } from './timingEvents';
import { v_1fcb40 } from '../services/userLocation';

const v_67e77e = () => Date.now();

const v_6e8ef7 = 30000;

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
  removeEventListener?(type: string, listener: (ev: any) => void): void;
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
    let v_8d41d7;
    const v_689657 = () => {
      if (v_12cd99.iceGatheringState === 'complete') { v_a983d4(); v_6f7712(); }
    };
    const v_a983d4 = () => {
      clearTimeout(v_8d41d7);
      v_12cd99.removeEventListener?.('icegatheringstatechange', v_689657);
    };
    v_8d41d7 = setTimeout(() => { v_a983d4(); v_6f7712(); }, 3000); 
    v_12cd99.addEventListener('icegatheringstatechange', v_689657);
  });
}

function v_9d05cd(v_32dc97, v_11bcf9): Promise<boolean> {
  return new Promise((v_6f7712) => {
    if (v_32dc97.readyState === 'open') { v_6f7712(true); return; }
    let v_2fb8cc = false;
    const v_de1394 = (v_81e2ef) => {
      if (v_2fb8cc) return; v_2fb8cc = true;
      try { v_32dc97.removeEventListener?.('open', v_569475); } catch {  }
      v_6f7712(v_81e2ef);
    };
    const v_569475 = () => v_de1394(v_32dc97.readyState === 'open');
    v_32dc97.addEventListener?.('open', v_569475);
    setTimeout(() => v_de1394(v_32dc97.readyState === 'open'), v_11bcf9);
  });
}

export function v_3d8d48(v_328259): v_b01667 {
  const { cloneId: v_6e0fd3, accessToken: v_2ca7e0, onEnrollSuggest: v_46947d, onRememberMe: v_b94db0, pipeline: v_883ce9 } = v_328259;

  const v_84b93d = v_328259.deps ?? v_17f880;
  const [v_b6e533, v_1fa668] = v_5ab095<v_d20273>('idle');
  const [v_b4d824, v_b944e3] = v_5ab095<v_802da4 | null>(null);
  const [v_5e9bfe, v_3a7d09] = v_5ab095<Error | null>(null);
  const [v_ab4803, v_ae4844] = v_5ab095<v_b190e4>('idle');
  const [v_88c591, v_8c8005] = v_5ab095<v_9d43cd | null>(null);
  const v_2d5539 = v_e662ae(0);
  const v_f98743 = v_e662ae<PrethirdPeerConnection | null>(null);
  const v_fa9144 = v_e662ae<any>(null);
  const v_9998ac = v_e662ae<v_802da4 | null>(null);
  const v_6b43e5 = v_e662ae<ReturnType<typeof setTimeout> | null>(null);
  const v_bba900 = v_e662ae(0);

  const v_48ccb1 = v_e662ae(false);
  const v_9fc078 = v_e662ae<PrethirdPeerConnection | null>(null);
  const v_bf15a0 = 30_000;

  const v_de567c = v_e662ae(v_46947d);
  v_c4deb2(() => { v_de567c.current = v_46947d; }, [v_46947d]);
  const v_d5b6bb = v_e662ae(v_b94db0);
  v_c4deb2(() => { v_d5b6bb.current = v_b94db0; }, [v_b94db0]);

  const v_1402c0 = v_e662ae(v_883ce9);
  v_c4deb2(() => { v_1402c0.current = v_883ce9; }, [v_883ce9]);

  v_c4deb2(() => { v_d7f7b1('avatar', { phase: v_ab4803 }); }, [v_ab4803]);

  const v_3c664f = v_de06a3((v_12cd99) => {
    if (v_48ccb1.current) { v_9fc078.current = v_12cd99; return; }
    try { v_12cd99.close(); } catch {  }
  }, []);

  const v_3e2c87 = v_de06a3(async (v_9b6134) => {
    const v_32dc97 = v_fa9144.current;
    if (!v_f98743.current || !v_32dc97) return;
    if (v_ab4803 === 'sending' || v_ab4803 === 'speaking') {

      v_d7f7b1('avatar', { phase: v_ab4803, act: 'busy_throw' }); 
      throw new Error('prethird: busy');
    }
    const v_8d41d7 = v_9b6134.trim();
    if (!v_8d41d7) return;
    if (v_32dc97.readyState !== 'open') { v_3a7d09(new Error('datachannel_not_open')); return; }
    v_ae4844('sending');
    try {
      const v_1923e2 = (v_2d5539.current += 1);
      v_32dc97.send(JSON.stringify({ type: 'say', text: v_8d41d7, seq: v_1923e2 }));
      v_ae4844('speaking');
      if (v_6b43e5.current) clearTimeout(v_6b43e5.current);

      v_6b43e5.current = setTimeout(() => v_ae4844('idle'), v_bf15a0);
    } catch (v_9e86fd) {
      v_3a7d09(v_9e86fd as Error);
      v_ae4844('idle');
    }
  }, [v_ab4803]);

  const v_009e58 = v_de06a3(async () => {
    const v_32dc97 = v_fa9144.current;
    if (!v_f98743.current || !v_32dc97) return;
    if (v_32dc97.readyState !== 'open') {
      const v_3ed4c3 = await v_9d05cd(v_32dc97, 3000);
      if (!v_3ed4c3 || v_fa9144.current !== v_32dc97 || !v_f98743.current) return;
    }
    const v_1923e2 = (v_2d5539.current += 1);
    try {
      v_32dc97.send(JSON.stringify({ type: 'greet', seq: v_1923e2 }));
    } catch (v_9e86fd) {
      v_3a7d09(v_9e86fd as Error);
    }
  }, []);

  const v_a1d9db = v_de06a3(async (v_9b6134) => {
    const v_32dc97 = v_fa9144.current;
    const v_8d41d7 = v_9b6134.trim();
    if (!v_f98743.current || !v_32dc97 || !v_8d41d7) return;
    if (v_32dc97.readyState !== 'open') {
      const v_3ed4c3 = await v_9d05cd(v_32dc97, 3000);
      if (!v_3ed4c3 || v_fa9144.current !== v_32dc97 || !v_f98743.current) return;
    }
    const v_1923e2 = (v_2d5539.current += 1);
    try {
      v_32dc97.send(JSON.stringify({ type: 'speak', text: v_8d41d7, seq: v_1923e2 }));
    } catch (v_9e86fd) {
      v_3a7d09(v_9e86fd as Error);
    }
  }, []);

  const v_11f4a1 = v_de06a3((evt: v_14f245) => {
    const v_32dc97 = v_fa9144.current;
    if (!v_f98743.current || !v_32dc97 || v_32dc97.readyState !== 'open') return;
    try {
      const v_1923e2 = (v_2d5539.current += 1);
      v_32dc97.send(JSON.stringify({ type: 'face_event', ...v_9e6ec9, seq: v_1923e2 }));
    } catch {

    }
  }, []);

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
    if (v_12cd99) v_3c664f(v_12cd99); 
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
    v_8c8005(null);   
    v_2d5539.current = 0;    

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
    const v_32dc97 = v_12cd99.createDataChannel('control');
    v_fa9144.current = v_32dc97;
    const v_0db134 = (v_1d299c) => {
      if (!v_759436()) return;
      try {
        const v_35f85c = JSON.parse(v_1d299c?.data ?? '');
        if (v_35f85c.type === 'speech_start' || v_35f85c.type === 'speech_end') {

          const v_2d99a5 =
            v_35f85c.type === 'speech_end' && typeof v_35f85c.remaining_ms === 'number' && v_35f85c.remaining_ms >= 0
              ? Math.min(v_35f85c.remaining_ms, v_6e8ef7)
              : undefined;
          v_8c8005({ type: v_35f85c.type, seq: v_35f85c.seq, ts: v_67e77e(), remainingMs: v_2d99a5 });
          if (v_35f85c.type === 'speech_end') v_811f30();
        } else if (v_35f85c.type === 'speech_text') {

          if (typeof v_35f85c.text === 'string' && v_35f85c.text) {
            v_8c8005({ type: 'speech_text', seq: v_35f85c.seq, ts: v_67e77e(), text: v_35f85c.text });
          }
        } else if (v_35f85c.type === 'enroll_suggest') {

          const v_ca1ec5 = typeof v_35f85c.personId === 'number' ? v_35f85c.personId : undefined;
          v_de567c.current?.(typeof v_35f85c.name === 'string' ? v_35f85c.name : '', v_ca1ec5);
        } else if (v_35f85c.type === 'remember_me') {

          v_d5b6bb.current?.();
        }
      } catch {  }
    };

    v_32dc97.addEventListener?.('message', (v_1d299c) => v_0db134(v_1d299c));

    v_1fa668('connecting');
    try {
      await v_12cd99.setLocalDescription(await v_12cd99.createOffer());
      await v_956147(v_12cd99);
      if (!v_759436()) { v_12cd99.close(); return; }
      const v_582c5e = v_12cd99.localDescription?.sdp;

      const v_f915d0 = await v_335e37(v_2ca7e0);
      if (!v_759436()) { v_12cd99.close(); return; } 

      const v_da7dc4 = v_1402c0.current;
      const v_01dcf5 = v_5b540b.getState();
      const v_dbf208 = v_da7dc4 === 'echomimic_v3' && !!v_01dcf5.experimentalBase;
      const v_694b25 = v_dbf208 ? v_01dcf5.experimentalBase! : v_01dcf5.prethirdBase;
      const v_f71b56 = `${v_694b25}/offer`;
      if (__DEV__) console.log(`[CALL-ROUTE] route=prethird base=${v_694b25} pipeline=${v_da7dc4 ?? 'default'} experimental=${v_dbf208} clone_id=${v_6e0fd3}`);

      const v_146d3d = await v_1fcb40();
      const v_7524b9 = { type: 'offer', sdp: v_582c5e, clone_id: v_6e0fd3, access_token: v_f915d0 };
      if (v_146d3d) v_7524b9.user_location = v_146d3d;
      const v_cb35cb = await fetch(v_f71b56, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(v_7524b9),
      });
      const v_9b6134 = await v_cb35cb.text();
      if (v_cb35cb.status === 424) {

        throw new Error('clone_bundle_unavailable');
      }
      if (!v_cb35cb.ok) throw new Error(`prethird_offer_http_${v_cb35cb.status}`);
      const v_9390e8 = v_9b6134 ? JSON.parse(v_9b6134) : {};
      const v_3f08aa = v_9390e8.sdp as string | undefined;
      if (!v_3f08aa) throw new Error('prethird_offer_no_answer');
      if (__DEV__) console.log(`[CALL-ROUTE] prethird /offer ok session_id=${v_9390e8.session_id}`);

      if (!v_759436()) { v_3c664f(v_12cd99); return; }
      v_48ccb1.current = true;
      try {
        await v_12cd99.setRemoteDescription(new v_d904b7({ type: 'answer', sdp: v_3f08aa }));
      } finally {
        v_48ccb1.current = false;

        if (v_9fc078.current) {
          const v_e2a85c = v_9fc078.current; v_9fc078.current = null;
          try { v_e2a85c.close(); } catch {  }
        }
      }
      if (!v_759436()) { v_3c664f(v_12cd99); return; }
      try { v_84b93d.audioSession.activate(); } catch {  }
    } catch (v_9e86fd) {
      try { v_12cd99.close(); } catch {  }
      if (v_f98743.current === v_12cd99) v_f98743.current = null;
      if (!v_759436()) return;
      v_3a7d09(v_9e86fd as Error);
      v_1fa668('error');
    }
  }, [v_6e0fd3, v_2ca7e0, v_84b93d]);

  v_c4deb2(() => () => { void v_3e54f8();  }, []);

  return { state: v_b6e533, remoteStream: v_b4d824, error: v_5e9bfe, start: v_965edf, stop: v_3e54f8, phase: v_ab4803, say: v_3e2c87, notifySpeechEnd: v_811f30, getStatsReport: v_791152, greet: v_009e58, speak: v_a1d9db, lastSignal: v_88c591, sendFaceEvent: v_11f4a1 };
}
