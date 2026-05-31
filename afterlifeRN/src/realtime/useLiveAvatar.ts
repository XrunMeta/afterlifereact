

import { v_de06a3, v_c4deb2, v_e662ae, v_5ab095 } from 'bapkr';
import {
  v_c1a793,
  v_d904b7,
  v_802da4,
} from 'rthlnescfffbyxfmhgq';
import { v_53975b as v_fd7914, v_51c671 as v_999327, v_af28f9 as v_99f4f1 } from '../api/calls';
import { type v_30869c, v_2f41d8 } from './useAudioSession';

export const v_506dd1 = [
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
  setRemoteDescription(desc: v_d904b7): Promise<void>;
  createAnswer(): Promise<{ type?: string; sdp?: string }>;
  setLocalDescription(desc: { type?: string; sdp?: string }): Promise<void>;
  close(): void;
}

export interface LiveAvatarDeps {
  startCall: typeof v_fd7914;
  endCall: typeof v_999327;
  sayInCall: typeof v_99f4f1;
  createPeerConnection: (config: { iceServers: typeof v_506dd1 }) => LivePeerConnection;

  audioSession: v_30869c;
}

const v_17f880 = {
  startCall: v_fd7914,
  endCall: v_999327,
  sayInCall: v_99f4f1,
  createPeerConnection: (v_74a79c) =>
    new v_c1a793(v_74a79c) as unknown as LivePeerConnection,
  audioSession: v_2f41d8,
};

async function v_f5e41b(v_f71b56, v_21cc31, v_4d33b2): Promise<Record<string, unknown>> {
  const v_cb35cb = await fetch(v_f71b56, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${v_21cc31}` },
    body: JSON.stringify(v_4d33b2),
  });
  const v_9b6134 = await v_cb35cb.text();
  let v_9390e8 = {};
  try {
    v_9390e8 = v_9b6134 ? JSON.parse(v_9b6134) : {};
  } catch {
    v_9390e8 = {};
  }
  if (!v_cb35cb.ok) throw new Error(`subscribe_http_${v_cb35cb.status}`);
  return v_9390e8;
}

export function v_b38a7e(v_328259) {
  const { cloneId: v_6e0fd3, accessToken: v_2ca7e0 } = v_328259;
  const v_84b93d = v_328259.deps ?? v_17f880;
  const [v_b6e533, v_1fa668] = v_5ab095<LiveAvatarState>('idle');
  const [v_b4d824, v_b944e3] = v_5ab095<v_802da4 | null>(null);
  const [v_5e9bfe, v_3a7d09] = v_5ab095<Error | null>(null);
  const [v_ab4803, v_ae4844] = v_5ab095<'idle' | 'listening' | 'sending' | 'speaking'>('idle');
  const v_f98743 = v_e662ae<LivePeerConnection | null>(null);
  const v_6e83c5 = v_e662ae<string | null>(null);
  const v_6b43e5 = v_e662ae<ReturnType<typeof setTimeout> | null>(null);

  const v_9998ac = v_e662ae<v_802da4 | null>(null);

  const v_bba900 = v_e662ae(0);

  const v_bf15a0 = 30_000;

  const v_3e2c87 = v_de06a3(async (v_9b6134) => {
    if (!v_f98743.current || !v_6e83c5.current) return; 
    if (v_ab4803 === 'sending' || v_ab4803 === 'speaking') return; 
    const v_8d41d7 = v_9b6134.trim();
    if (!v_8d41d7) return;
    v_ae4844('sending');
    try {
      await v_84b93d.sayInCall(v_2ca7e0, v_6e0fd3, v_6e83c5.current, v_8d41d7);

      v_ae4844('speaking');
      if (v_6b43e5.current) clearTimeout(v_6b43e5.current);
      v_6b43e5.current = setTimeout(() => v_ae4844('idle'), v_bf15a0);
    } catch (v_9e86fd) {
      v_3a7d09(v_9e86fd as Error);
      v_ae4844('idle');
    }
  }, [v_2ca7e0, v_6e0fd3, v_84b93d, v_ab4803]);

  const v_3e54f8 = v_de06a3(async () => {
    v_bba900.current += 1; 
    if (v_6b43e5.current) clearTimeout(v_6b43e5.current);
    v_ae4844('idle');
    const v_12cd99 = v_f98743.current;
    v_f98743.current = null;
    if (v_12cd99) {
      try {
        v_12cd99.close();
      } catch {

      }
    }
    v_b944e3(null);
    v_9998ac.current = null;

    try {
      v_84b93d.audioSession.deactivate();
    } catch {

    }
    const v_be62d3 = v_6e83c5.current;
    v_6e83c5.current = null;
    if (v_be62d3) {
      try {
        await v_84b93d.endCall(v_2ca7e0, v_6e0fd3, v_be62d3);
      } catch {

      }
    }
    v_1fa668('ended');
  }, [v_2ca7e0, v_6e0fd3, v_84b93d]);

  const v_965edf = v_de06a3(async () => {
    if (v_f98743.current) return; 
    const v_775074 = (v_bba900.current += 1);
    const v_759436 = () => v_bba900.current === v_775074;

    v_3a7d09(null);
    v_1fa668('requesting');
    let v_c9c6be;
    try {
      v_c9c6be = await v_84b93d.startCall(v_2ca7e0, v_6e0fd3);
    } catch (v_9e86fd) {
      if (!v_759436()) return;
      v_3a7d09(v_9e86fd as Error);
      v_1fa668('error');
      return;
    }
    if (!v_759436()) return; 
    v_6e83c5.current = v_c9c6be.callId;

    const v_12cd99 = v_84b93d.createPeerConnection({ iceServers: v_506dd1 });
    v_f98743.current = v_12cd99;
    v_12cd99.addEventListener('track', (ev: { streams?: v_802da4[]; track: any }) => {
      if (!v_759436()) return;
      const v_cab51f =
        v_1d299c.streams && v_1d299c.streams[0]
          ? v_1d299c.streams[0]
          : new v_802da4([v_1d299c.track as never]);

      const v_281141 =
        ((v_cab51f as any).getVideoTracks?.()?.length ?? 0) > 0 || v_1d299c.track?.kind === 'video';
      if (v_281141) {
        v_b944e3(v_cab51f);
      } else {

        v_9998ac.current = v_cab51f;
      }
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

    v_1fa668('connecting');
    try {
      const v_4cb70c = await v_f5e41b(v_c9c6be.subscribeUrl, v_c9c6be.subscribeToken, {});
      if (!v_759436()) {
        v_12cd99.close();
        return;
      }
      const v_df2b5b = v_4cb70c.subscriber_session_id as string | undefined;
      const v_582c5e = v_4cb70c.offer_sdp as string | undefined;
      if (!v_df2b5b || !v_582c5e) throw new Error('subscribe_pull_incomplete');
      await v_12cd99.setRemoteDescription(
        new v_d904b7({ type: 'offer', sdp: v_582c5e }),
      );
      const v_343c90 = await v_12cd99.createAnswer();
      await v_12cd99.setLocalDescription(v_343c90);
      if (!v_759436()) {
        v_12cd99.close();
        return;
      }
      await v_f5e41b(v_c9c6be.renegotiateUrl, v_c9c6be.subscribeToken, {
        subscriber_session_id: v_df2b5b,
        answer_sdp: v_343c90.sdp,
      });
      if (!v_759436()) {
        v_12cd99.close();
        return;
      }

      try {
        v_84b93d.audioSession.activate();
      } catch {

      }
    } catch (v_9e86fd) {
      try {
        v_12cd99.close();
      } catch {

      }
      if (v_f98743.current === v_12cd99) v_f98743.current = null;
      if (!v_759436()) return;
      v_3a7d09(v_9e86fd as Error);
      v_1fa668('error');
    }
  }, [v_2ca7e0, v_6e0fd3, v_84b93d]);

  v_c4deb2(() => {
    return () => {
      void v_3e54f8();
    };

  }, []);

  return { state: v_b6e533, remoteStream: v_b4d824, error: v_5e9bfe, start: v_965edf, stop: v_3e54f8, phase: v_ab4803, say: v_3e2c87 };
}
