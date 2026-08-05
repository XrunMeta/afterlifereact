

import { v_de06a3, v_c4deb2, v_e662ae, v_5ab095 } from 'bapkr';
import { v_fee12d, type v_be7277 } from './useSpeechInput';
import { v_724dd4 } from './useCloneSilenceDetector';
import {
  v_6920f0,
  v_3075fa,
  v_6fc7ac,
  type v_01cdf6,
  type v_a81c33,
} from './handsFree';
import { v_7be8d9, type v_5a4c65 } from './cloneSilence';
import { v_7347b3 } from './timingConfig';
import { v_d7f7b1 } from './timingEvents';
import { v_3032b0 } from './voiceBall';
import { v_fb305c } from './questionMark';

const v_5443e5 = 0.05; 

const v_d641fa = 5000;

const v_d30826 = 3000;
const v_e1d3e1 = '여보세요?';

export function v_7df8a4(opts: {

  enabled: boolean;
  say: (text: string) => Promise<void>;
  getStatsReport: () => Promise<Iterable<[string, Record<string, unknown>]>> | null;
  notifySpeechEnd: () => void;

  speechEngine?: v_be7277;

  silenceMs?: number;
  silenceConfig?: Partial<v_5a4c65>;

  confirmMs?: number;

  greeting?: boolean;

  greet?: () => Promise<void>;

  speak?: (text: string) => Promise<void>;

  lastSignal?: import('./avatarCall').SpeechSignal | null;

  greetTimeoutMs?: number;

  fallbackText?: string;

  confirmGate?: boolean;

  signalGating?: boolean;
}) {
  const [v_b6e533, v_1fa668] = v_5ab095(v_3075fa());
  const v_8d3dea = v_e662ae(v_b6e533);
  v_c4deb2(() => { v_8d3dea.current = v_b6e533; });

  const v_bcde6b = v_e662ae(v_328259.say);
  v_c4deb2(() => { v_bcde6b.current = v_328259.say; });
  const v_80114b = v_e662ae(v_328259.notifySpeechEnd);
  v_c4deb2(() => { v_80114b.current = v_328259.notifySpeechEnd; });

  const v_3a7b2e = v_e662ae(v_328259.greet);
  v_c4deb2(() => { v_3a7b2e.current = v_328259.greet; });
  const v_5069ec = v_e662ae(v_328259.speak);
  v_c4deb2(() => { v_5069ec.current = v_328259.speak; });
  const v_3f36e6 = v_e662ae<ReturnType<typeof setTimeout> | null>(null);
  const v_a3a40c = v_328259.greetTimeoutMs ?? v_d30826;
  const v_c6145f = v_328259.fallbackText ?? v_e1d3e1;

  const v_700737 = v_e662ae<(ev: v_01cdf6) => void>(() => {});

  const v_84a65f = v_e662ae(0);

  const v_8a777f = v_e662ae<number | null>(null);

  const v_d65758 = v_e662ae<ReturnType<typeof setTimeout> | null>(null);

  const v_c2616d = v_e662ae(0);

  const v_d27d23 = v_e662ae<number | null>(null);

  const v_1f41d7 = v_724dd4({
    getStatsReport: v_328259.getStatsReport,
    onResponseStart: () => v_700737.current({ type: 'CLONE_SPEAKING' }),
    onResponseEnd: () => v_700737.current({ type: 'RESPONSE_END' }),
    config: v_328259.silenceConfig,
  });
  const v_60bef6 = v_fee12d({
    engine: v_328259.speechEngine,

    silenceMs: v_328259.silenceMs ?? 1500,
    onFinalResult: (v_9b6134) => {

      const v_1c0b3c = Date.now() - v_84a65f.current;
      if (v_1c0b3c < v_7347b3.getState().echoGateMs) {
        return; 
      }
      v_d7f7b1('vad_endpoint');

      v_700737.current({ type: 'FINAL_RESULT', text: v_fb305c(v_9b6134) });
    },

    onSpeechActivity: () => {
      v_700737.current({ type: 'USER_SPEECH_START' });
    },
  });

  const v_5c8a52 = v_e662ae(v_60bef6);
  v_c4deb2(() => { v_5c8a52.current = v_60bef6; });

  const [v_ea4519, v_d3b587] = v_5ab095(false);
  const v_afaf7a = v_e662ae(false);

  const [v_09b641, v_c2783a] = v_5ab095(0);

  const v_105c0b = v_e662ae(0);

  const v_246863 = v_e662ae(0);

  const v_2bfd1e = v_de06a3(
    (effects: v_a81c33[], v_b03676, v_b6611b) => {
      for (const v_9e86fd of v_27ef63) {
        switch (v_9e86fd) {
          case 'START_STT':
            v_afaf7a.current = false; 
            v_d3b587(false);
            v_d7f7b1('stt_open');
            void v_60bef6.startListening();
            break;
          case 'STOP_STT':
            v_afaf7a.current = false;
            v_d3b587(false);
            v_d7f7b1('stt_close');
            v_60bef6.stopListening();
            v_700737.current({ type: 'USER_SPEECH_IDLE' });
            break;
          case 'SAY':
          case 'SAY_INTERRUPT':
          case 'SAY_IDLE_GREETING':

            if (v_b6611b != null) v_d27d23.current = v_b6611b;
            if (v_b03676) {
              v_bcde6b.current(v_b03676).catch(() => v_700737.current({ type: 'RESPONSE_DONE' }));
            } else {
              v_700737.current({ type: 'RESPONSE_DONE' });
            }
            break;
          case 'START_DETECTOR':
            v_1f41d7.start();
            break;
          case 'STOP_DETECTOR':
            v_1f41d7.stop();
            v_80114b.current();
            break;

          case 'GREET':

            if (v_3a7b2e.current) {
              v_3a7b2e.current().catch(() => v_700737.current({ type: 'GREET_TIMEOUT' }));
            } else {
              v_700737.current({ type: 'GREET_TIMEOUT' }); 
            }
            if (v_3f36e6.current) clearTimeout(v_3f36e6.current);
            v_3f36e6.current = setTimeout(
              () => v_700737.current({ type: 'GREET_TIMEOUT' }), v_a3a40c);
            break;
          case 'SPEAK_FALLBACK':

            if (v_5069ec.current) {
              v_5069ec.current(v_c6145f).catch(() => v_700737.current({ type: 'RESPONSE_DONE' }));
            } else {
              v_700737.current({ type: 'RESPONSE_DONE' });
            }

            if (v_3f36e6.current) clearTimeout(v_3f36e6.current);
            v_3f36e6.current = setTimeout(
              () => v_700737.current({ type: 'RESPONSE_DONE' }), v_a3a40c);
            break;
        }
      }
    },
    [v_60bef6, v_1f41d7, v_a3a40c, v_c6145f],
  );

  const v_1ab00a = v_de06a3(() => {
    v_8a777f.current = null;
    v_c2616d.current = 0;
    if (v_d65758.current) {
      clearTimeout(v_d65758.current);
      v_d65758.current = null;
    }
  }, []);

  const v_6be210 = v_de06a3(
    (ev: v_01cdf6) => {

      if (v_1d299c.type === 'RESPONSE_DONE' || v_1d299c.type === 'RESPONSE_END' || v_1d299c.type === 'CALL_ENDED') {
        v_1ab00a();
      }
      const v_ba2215 = v_8d3dea.current;
      const { state: v_a448ad, effects: v_27ef63, sayText: v_b03676, saySeq: v_b6611b } = v_6920f0(v_ba2215, v_1d299c);

      const v_81b6e6 =
        v_ba2215.phase === 'speaking' || v_ba2215.phase === 'sending';
      if (v_81b6e6 && v_a448ad.phase === 'listening') {
        v_246863.current = Date.now() + v_7347b3.getState().cloneTailGraceMs;
      }

      if (v_ba2215.phase === 'greeting' && v_a448ad.phase === 'speaking') {
        if (v_3f36e6.current) { clearTimeout(v_3f36e6.current); v_3f36e6.current = null; }
      }
      v_8d3dea.current = v_a448ad;
      v_1fa668(v_a448ad);
      v_2bfd1e(v_27ef63, v_b03676, v_b6611b);
    },
    [v_2bfd1e, v_1ab00a],
  );

  v_700737.current = v_6be210;

  const v_67bca4 = v_328259.confirmMs ?? 2000;
  v_c4deb2(() => {
    if (v_b6e533.phase !== 'confirming') return;
    const v_389afb = setTimeout(() => v_700737.current({ type: 'CONFIRM_SEND' }), v_67bca4);
    return () => clearTimeout(v_389afb);
  }, [v_b6e533.phase, v_b6e533.pendingText, v_67bca4]);

  const v_5b4fb2 = v_de06a3(() => {
    v_700737.current({ type: 'CANCEL_SEND' });
  }, []);

  v_c4deb2(() => {
    if (!v_328259.signalGating) return;
    if (v_b6e533.phase !== 'sending' && v_b6e533.phase !== 'speaking' && v_b6e533.phase !== 'interrupting') return;
    const v_d799e2 = v_7347b3.getState().responseDoneTimeoutMs;
    const v_389afb = setTimeout(() => v_700737.current({ type: 'RESPONSE_DONE' }), v_d799e2);
    return () => clearTimeout(v_389afb);
  }, [v_b6e533.phase, v_328259.lastSignal, v_328259.signalGating]);

  v_c4deb2(() => {
    v_700737.current(
      v_328259.enabled
        ? { type: 'CALL_LIVE', greeting: v_328259.greeting, confirmGate: v_328259.confirmGate, signalGating: v_328259.signalGating }
        : { type: 'CALL_ENDED' });
  }, [v_328259.enabled]); 

  const v_b8908d = v_e662ae(v_328259.getStatsReport);
  v_c4deb2(() => { v_b8908d.current = v_328259.getStatsReport; });

  v_c4deb2(() => {
    const v_f2c979 = v_328259.lastSignal;
    if (!v_f2c979) return;
    if (v_f2c979.type === 'speech_start') {
      v_d7f7b1('speech_start');
      v_700737.current({ type: 'SPEECH_START', seq: v_d27d23.current ?? undefined });
    }
    else if (v_f2c979.type === 'speech_end') {
      v_d7f7b1('speech_end');

      const v_efacaa = v_d27d23.current ?? undefined;

      if (v_b8908d.current() === null) {
        v_700737.current({ type: 'RESPONSE_DONE', seq: v_efacaa });
      } else {

        const v_2d99a5 = v_f2c979.remainingMs ?? 0;
        v_c2616d.current = Date.now() + v_2d99a5;
        v_8a777f.current = Date.now();
        if (v_d65758.current) clearTimeout(v_d65758.current);
        v_d65758.current = setTimeout(() => {
          v_d65758.current = null;
          v_8a777f.current = null;
          v_c2616d.current = 0;
          v_700737.current({ type: 'RESPONSE_DONE', seq: v_efacaa });
        }, v_2d99a5 + v_d641fa);
      }
    }

  }, [v_328259.lastSignal]);

  v_c4deb2(() => {
    if (v_b6e533.phase !== 'listening') return;
    if (v_b6e533.userSpeaking) return;
    if (v_b6e533.idleGreetCount >= v_6fc7ac.length) return;
    if (v_d65758.current) return; 
    const v_aa4609 = Math.max(0, v_c2616d.current - Date.now()); 
    const v_4b24d2 = v_6fc7ac[v_b6e533.idleGreetCount] + v_aa4609;
    const v_389afb = setTimeout(() => v_700737.current({ type: 'IDLE_TIMEOUT' }), v_4b24d2);
    return () => clearTimeout(v_389afb);
  }, [v_b6e533.phase, v_b6e533.userSpeaking, v_b6e533.idleGreetCount]);

  v_c4deb2(() => {
    if (!v_328259.enabled) {

      v_105c0b.current = 0;
      v_c2783a(0);
      return;
    }
    const v_389afb = setInterval(() => {
      const v_e2a85c = v_b8908d.current();
      if (!v_e2a85c) return;
      v_e2a85c.then((v_2888b4) => {
        const v_0f0c77 = v_7be8d9(v_2888b4);

        const v_3ec588 = typeof v_0f0c77 === 'number' ? Math.min(1, Math.max(0, v_0f0c77)) : 0;
        if (v_3032b0(v_105c0b.current, v_3ec588)) {
          v_105c0b.current = v_3ec588;
          v_c2783a(v_3ec588);
        }
        const v_5c2f9f = Date.now();
        const v_22312b = typeof v_0f0c77 === 'number' && v_0f0c77 > v_5443e5;
        if (v_22312b) v_84a65f.current = v_5c2f9f;

        if (
          v_8a777f.current !== null &&
          !v_22312b &&
          v_5c2f9f - v_84a65f.current > v_7347b3.getState().cloneResumeMs &&
          v_5c2f9f >= v_c2616d.current
        ) {
          v_1ab00a();
          v_700737.current({ type: 'RESPONSE_DONE' });
        }

        const v_72c7a6 = v_8d3dea.current;
        if ((v_72c7a6.phase !== 'listening' && v_72c7a6.phase !== 'confirming') || !v_72c7a6.micOn) return;
        if (v_22312b && !v_afaf7a.current) {

          if (v_5c2f9f < v_246863.current) {

          } else {
            v_5c8a52.current.stopListening();
            v_afaf7a.current = true;
            v_d3b587(true); 
            v_d7f7b1('suppress_on');
            v_d7f7b1('stt_close');
          }
        } else if (
          !v_22312b &&
          v_afaf7a.current &&
          v_5c2f9f - v_84a65f.current > v_7347b3.getState().cloneResumeMs
        ) {
          void v_5c8a52.current.startListening();
          v_afaf7a.current = false;
          v_d3b587(false); 
          v_d7f7b1('suppress_off');
          v_d7f7b1('stt_open');
        }
      }).catch(() => {});
    }, 200);
    return () => clearInterval(v_389afb);
  }, [v_328259.enabled]);

  v_c4deb2(() => {
    if (!v_328259.enabled) return;
    const v_389afb = setInterval(() => {
      const v_72c7a6 = v_8d3dea.current;
      if ((v_72c7a6.phase !== 'listening' && v_72c7a6.phase !== 'confirming') || !v_72c7a6.micOn) return;
      if (v_afaf7a.current) return; 

      if (!v_5c8a52.current.listening) {
        void v_5c8a52.current.startListening();
      }
    }, 200);
    return () => clearInterval(v_389afb);
  }, [v_328259.enabled]);

  v_c4deb2(() => () => {
    if (v_3f36e6.current) clearTimeout(v_3f36e6.current);
    if (v_d65758.current) clearTimeout(v_d65758.current);
    v_c2616d.current = 0; 
  }, []);

  const v_6e1295 = v_de06a3(() => {
    v_700737.current(v_8d3dea.current.micOn ? { type: 'MIC_OFF' } : { type: 'MIC_ON' });
  }, []);

  const v_a8e03f = v_de06a3(() => {
    v_afaf7a.current = false;
    v_d3b587(false);
    v_246863.current = 0;
    v_d7f7b1('dev_listen_now');
    v_d7f7b1('stt_open');
    void v_5c8a52.current.startListening();
  }, []);

  const v_b3ae82 = v_60bef6.listeningDebounced || v_ea4519;

  return {
    phase: v_b6e533.phase,
    micOn: v_b6e533.micOn,
    pendingText: v_b6e533.pendingText,
    toggleMic: v_6e1295,
    cancelConfirm: v_5b4fb2,

    dispatch: v_6be210,
    transcript: v_60bef6.transcript,
    interimTranscript: v_60bef6.interimTranscript,

    sttActive: v_b3ae82,

    cloneSuppressed: v_ea4519,

    devForceListen: v_a8e03f,

    micLevel: v_60bef6.micLevel,

    cloneAudioLevel: v_09b641,
  };
}
