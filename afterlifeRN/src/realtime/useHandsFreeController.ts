

import { v_de06a3, v_c4deb2, v_e662ae, v_5ab095 } from 'bapkr';
import { v_fee12d, type v_be7277 } from './useSpeechInput';
import { v_724dd4 } from './useCloneSilenceDetector';
import {
  v_6920f0,
  v_3075fa,
  type v_01cdf6,
  type v_a81c33,
} from './handsFree';
import { v_7be8d9, type v_5a4c65 } from './cloneSilence';

const v_5443e5 = 0.05; 

const v_106057 = 3500;

const v_861560 = 1200;

export function v_7df8a4(opts: {

  enabled: boolean;
  say: (text: string) => Promise<void>;
  getStatsReport: () => Promise<Iterable<[string, Record<string, unknown>]>> | null;
  notifySpeechEnd: () => void;

  speechEngine?: v_be7277;

  silenceMs?: number;
  silenceConfig?: Partial<v_5a4c65>;

  confirmMs?: number;
}) {
  const [v_b6e533, v_1fa668] = v_5ab095(v_3075fa());
  const v_8d3dea = v_e662ae(v_b6e533);
  v_c4deb2(() => { v_8d3dea.current = v_b6e533; });

  const v_bcde6b = v_e662ae(v_328259.say);
  v_c4deb2(() => { v_bcde6b.current = v_328259.say; });
  const v_80114b = v_e662ae(v_328259.notifySpeechEnd);
  v_c4deb2(() => { v_80114b.current = v_328259.notifySpeechEnd; });

  const v_700737 = v_e662ae<(ev: v_01cdf6) => void>(() => {});

  const v_84a65f = v_e662ae(0);

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
      if (v_1c0b3c < v_106057) {
        return; 
      }
      v_700737.current({ type: 'FINAL_RESULT', text: v_9b6134 });
    },
  });

  const v_5c8a52 = v_e662ae(v_60bef6);
  v_c4deb2(() => { v_5c8a52.current = v_60bef6; });

  const v_afaf7a = v_e662ae(false);

  const v_2bfd1e = v_de06a3(
    (effects: v_a81c33[], v_b03676) => {
      for (const v_9e86fd of v_27ef63) {
        switch (v_9e86fd) {
          case 'START_STT':
            v_afaf7a.current = false; 
            void v_60bef6.startListening();
            break;
          case 'STOP_STT':
            v_60bef6.stopListening();
            break;
          case 'SAY':
            if (v_b03676) {
              v_bcde6b.current(v_b03676).catch(() => v_700737.current({ type: 'RESPONSE_END' }));
            } else {

              v_700737.current({ type: 'RESPONSE_END' });
            }
            break;
          case 'START_DETECTOR':
            v_1f41d7.start();
            break;
          case 'STOP_DETECTOR':
            v_1f41d7.stop();
            v_80114b.current();
            break;
        }
      }
    },
    [v_60bef6, v_1f41d7],
  );

  const v_6be210 = v_de06a3(
    (ev: v_01cdf6) => {
      const { state: v_a448ad, effects: v_27ef63, sayText: v_b03676 } = v_6920f0(v_8d3dea.current, v_1d299c);
      v_8d3dea.current = v_a448ad;
      v_1fa668(v_a448ad);
      v_2bfd1e(v_27ef63, v_b03676);
    },
    [v_2bfd1e],
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
    v_700737.current(v_328259.enabled ? { type: 'CALL_LIVE' } : { type: 'CALL_ENDED' });
  }, [v_328259.enabled]);

  const v_b8908d = v_e662ae(v_328259.getStatsReport);
  v_c4deb2(() => { v_b8908d.current = v_328259.getStatsReport; });
  v_c4deb2(() => {
    if (!v_328259.enabled) return;
    const v_389afb = setInterval(() => {
      const v_e2a85c = v_b8908d.current();
      if (!v_e2a85c) return;
      v_e2a85c.then((v_2888b4) => {
        const v_0f0c77 = v_7be8d9(v_2888b4);
        const v_5c2f9f = Date.now();
        const v_22312b = typeof v_0f0c77 === 'number' && v_0f0c77 > v_5443e5;
        if (v_22312b) v_84a65f.current = v_5c2f9f;

        const v_72c7a6 = v_8d3dea.current;
        if ((v_72c7a6.phase !== 'listening' && v_72c7a6.phase !== 'confirming') || !v_72c7a6.micOn) return;
        if (v_22312b && !v_afaf7a.current) {
          v_5c8a52.current.stopListening();
          v_afaf7a.current = true;
        } else if (
          !v_22312b &&
          v_afaf7a.current &&
          v_5c2f9f - v_84a65f.current > v_861560
        ) {
          void v_5c8a52.current.startListening();
          v_afaf7a.current = false;
        }
      }).catch(() => {});
    }, 200);
    return () => clearInterval(v_389afb);
  }, [v_328259.enabled]);

  const v_6e1295 = v_de06a3(() => {
    v_700737.current(v_8d3dea.current.micOn ? { type: 'MIC_OFF' } : { type: 'MIC_ON' });
  }, []);

  return {
    phase: v_b6e533.phase,
    micOn: v_b6e533.micOn,
    pendingText: v_b6e533.pendingText,
    toggleMic: v_6e1295,
    cancelConfirm: v_5b4fb2,
    transcript: v_60bef6.transcript,
    interimTranscript: v_60bef6.interimTranscript,
  };
}
