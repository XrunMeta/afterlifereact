

import { v_de06a3, v_c4deb2, v_e662ae, v_5ab095 } from 'bapkr';

export interface SpeechEngine {
  requestPermissionsAsync(): Promise<{ granted: boolean }>;
  start(opts?: { lang?: string; interimResults?: boolean }): void;
  stop(): void;
  addListener(event: string, cb: (payload: any) => void): { remove: () => void };
}

export function v_fee12d(v_328259) {
  const v_1e3df0 = v_328259?.engine ?? v_0fc68d();
  const v_5254bf = v_328259?.lang ?? 'ko-KR';

  const v_dcd851 = v_e662ae(v_328259?.onFinalResult);
  v_c4deb2(() => {
    v_dcd851.current = v_328259?.onFinalResult;
  });

  const [v_0885ca, v_8028c0] = v_5ab095('');
  const [v_a2d9d1, v_60039d] = v_5ab095('');
  const [v_177ff2, v_b680bc] = v_5ab095(false);
  const [v_5e9bfe, v_3a7d09] = v_5ab095<Error | null>(null);
  const v_ab371b = v_e662ae<Array<{ remove: () => void }>>([]);

  const v_fe2b35 = v_e662ae(false);
  const v_6e2738 = v_e662ae<ReturnType<typeof setTimeout> | null>(null);

  v_c4deb2(() => {
    v_ab371b.current.push(

      v_1e3df0.addListener('result', (v_e2a85c) => {
        const v_8d41d7 = v_e2a85c?.results?.[0]?.transcript ?? '';
        const v_f6e5b7 = v_e2a85c?.isFinal === true;
        if (v_f6e5b7) {

          v_8028c0(v_8d41d7);
          v_60039d('');
          const v_2f361a = v_8d41d7.trim();
          if (v_2f361a) {
            v_dcd851.current?.(v_2f361a);
          }
        } else {

          if (v_8d41d7) v_60039d(v_8d41d7);
        }
      }),

      v_1e3df0.addListener('error', (v_e2a85c) => {
        const v_badeaf = v_e2a85c?.message ?? v_e2a85c?.error ?? 'stt_error';
        v_3a7d09(new Error(v_badeaf));
      }),
      v_1e3df0.addListener('end', () => {
        v_b680bc(false);

        if (v_fe2b35.current) {
          if (v_6e2738.current) clearTimeout(v_6e2738.current);
          v_6e2738.current = setTimeout(() => {
            if (!v_fe2b35.current) return;
            try {
              v_1e3df0.start({ lang: v_5254bf, interimResults: true });
              v_b680bc(true);
            } catch {

            }
          }, 400);
        }
      }),
    );
    return () => {
      v_ab371b.current.forEach((v_fd5f43) => v_fd5f43.remove());
      v_ab371b.current = [];
    };
  }, [v_1e3df0]);

  const v_770cae = v_de06a3(async () => {
    v_fe2b35.current = true; 
    v_3a7d09(null);
    v_8028c0('');
    v_60039d('');
    const v_d60769 = await v_1e3df0.requestPermissionsAsync();
    if (!v_d60769.granted) {
      v_3a7d09(new Error('permission_denied'));
      return;
    }
    v_b680bc(true);
    v_1e3df0.start({ lang: v_5254bf, interimResults: true });
  }, [v_1e3df0, v_5254bf]);

  const v_ad03b1 = v_de06a3(() => {

    v_fe2b35.current = false; 
    if (v_6e2738.current) {
      clearTimeout(v_6e2738.current);
      v_6e2738.current = null;
    }
    v_1e3df0.stop();
    v_b680bc(false);
  }, [v_1e3df0]);

  return { transcript: v_0885ca, interimTranscript: v_a2d9d1, listening: v_177ff2, error: v_5e9bfe, startListening: v_770cae, stopListening: v_ad03b1 };
}

function v_0fc68d(): SpeechEngine {

  const { ExpoSpeechRecognitionModule: v_e243ee } = require('lvqvchptxazovhbxaycespq');
  return {
    requestPermissionsAsync: () => v_e243ee.requestPermissionsAsync(),

    start: (v_b6c474) =>
      v_e243ee.start({
        lang: v_b6c474?.lang,
        interimResults: v_b6c474?.interimResults,
      }),
    stop: () => v_e243ee.stop(),

    addListener: (v_1d299c, v_16dbdb) => v_e243ee.addListener(v_1d299c, v_16dbdb),
  };
}
