

import { v_de06a3, v_c4deb2, v_df9f57, v_e662ae, v_5ab095 } from 'bapkr';
import { v_d08429, v_3032b0 } from './voiceBall';

export interface SpeechEngine {

  getPermissionsAsync?(): Promise<{ granted: boolean }>;
  requestPermissionsAsync(): Promise<{ granted: boolean }>;
  start(opts?: {
    lang?: string;
    interimResults?: boolean;
    continuous?: boolean;
    volumeChangeEventOptions?: { enabled?: boolean; intervalMillis?: number };
  }): void;
  stop(): void;
  addListener(event: string, cb: (payload: any) => void): { remove: () => void };
}

export const v_c45689 = 1500;

export const v_74fd06 = 1500;

export const v_4c6a50 = 2000;

export function v_fee12d(v_328259) {

  const v_1e3df0 = v_df9f57(() => v_328259?.engine ?? v_0fc68d(), [v_328259?.engine]);
  const v_5254bf = v_328259?.lang ?? 'ko-KR';
  const v_05b2f6 = v_328259?.silenceMs ?? v_c45689;

  const v_dcd851 = v_e662ae(v_328259?.onFinalResult);
  v_c4deb2(() => {
    v_dcd851.current = v_328259?.onFinalResult;
  });

  const v_3dfa34 = v_e662ae(v_328259?.onSpeechActivity);
  v_c4deb2(() => {
    v_3dfa34.current = v_328259?.onSpeechActivity;
  });
  const v_9a5dc9 = v_e662ae(v_05b2f6);
  v_c4deb2(() => {
    v_9a5dc9.current = v_05b2f6;
  });

  const [v_0885ca, v_8028c0] = v_5ab095('');
  const [v_a2d9d1, v_60039d] = v_5ab095('');
  const [v_177ff2, v_b680bc] = v_5ab095(false);

  const [v_9afd2d, v_d404a7] = v_5ab095(0);

  const v_23245d = v_e662ae(0);

  const [v_23db84, v_17e228] = v_5ab095(false);
  const [v_5e9bfe, v_3a7d09] = v_5ab095<Error | null>(null);
  const v_ab371b = v_e662ae<Array<{ remove: () => void }>>([]);

  const v_fe2b35 = v_e662ae(false);
  const v_6e2738 = v_e662ae<ReturnType<typeof setTimeout> | null>(null);

  const v_168497 = v_e662ae<ReturnType<typeof setTimeout> | null>(null);

  const v_b5958d = v_e662ae(false);

  const v_3dd9b4 = v_e662ae<ReturnType<typeof setTimeout> | null>(null);

  const v_c4dfc6 = v_e662ae<string[]>([]);
  const v_5484ad = v_e662ae('');
  const v_e2c189 = v_e662ae<ReturnType<typeof setTimeout> | null>(null);

  const v_f59c40 = v_de06a3(() => {
    v_c4dfc6.current = [];
    v_5484ad.current = '';
    if (v_e2c189.current) {
      clearTimeout(v_e2c189.current);
      v_e2c189.current = null;
    }
  }, []);

  const v_b6e358 = v_de06a3(() => {
    const v_e75c90 = [...v_c4dfc6.current, v_5484ad.current]
      .map((v_fd5f43) => v_fd5f43.trim())
      .filter(Boolean)
      .join(' ')
      .trim();
    v_f59c40();
    if (v_e75c90) {
      v_8028c0(v_e75c90);
      v_60039d('');
      v_dcd851.current?.(v_e75c90);
    }
  }, [v_f59c40]);

  const v_aa432e = v_de06a3(() => {
    if (v_e2c189.current) clearTimeout(v_e2c189.current);
    v_e2c189.current = setTimeout(() => {
      v_e2c189.current = null;
      v_b6e358();
    }, v_9a5dc9.current);
  }, [v_b6e358]);

  const v_9061f1 = v_de06a3(() => {
    if (v_168497.current) {
      clearTimeout(v_168497.current);
      v_168497.current = null;
    }

    v_b5958d.current = false;

    if (v_3dd9b4.current) {
      clearTimeout(v_3dd9b4.current);
      v_3dd9b4.current = null;
    }
    v_17e228(true);
    v_b680bc(true);
  }, []);

  v_c4deb2(() => {
    v_ab371b.current.push(

      v_1e3df0.addListener('result', (v_e2a85c) => {

        if (!v_fe2b35.current) return;
        const v_8d41d7 = v_e2a85c?.results?.[0]?.transcript ?? '';
        const v_f6e5b7 = v_e2a85c?.isFinal === true;

        v_3dfa34.current?.();

        v_9061f1();
        if (v_f6e5b7) {

          const v_267ca3 = v_8d41d7.trim();
          if (v_267ca3) {
            const v_506e86 = v_c4dfc6.current[v_c4dfc6.current.length - 1];
            if (v_267ca3 !== v_506e86) v_c4dfc6.current.push(v_267ca3);
          }
          v_5484ad.current = '';

          v_60039d('');
          v_8028c0(v_c4dfc6.current.join(' '));
        } else {

          v_5484ad.current = v_8d41d7;
          if (v_8d41d7) v_60039d(v_8d41d7);
        }

        v_aa432e();
      }),

      v_1e3df0.addListener('error', (v_e2a85c) => {
        const v_badeaf = v_e2a85c?.message ?? v_e2a85c?.error ?? 'stt_error';

        if (v_168497.current) {
          clearTimeout(v_168497.current);
          v_168497.current = null;
        }
        v_b5958d.current = false;
        v_b680bc(false);
        v_23245d.current = 0;
        v_d404a7(0); 

        if (v_3dd9b4.current) clearTimeout(v_3dd9b4.current);
        v_3dd9b4.current = setTimeout(() => {
          v_3dd9b4.current = null;
          v_17e228(false);
        }, v_4c6a50);
        v_3a7d09(new Error(v_badeaf));
      }),
      v_1e3df0.addListener('end', () => {
        v_b680bc(false);
        v_23245d.current = 0;
        v_d404a7(0); 

        if (v_3dd9b4.current) clearTimeout(v_3dd9b4.current);
        v_3dd9b4.current = setTimeout(() => {
          v_3dd9b4.current = null;
          v_17e228(false);
        }, v_4c6a50);

        if (v_fe2b35.current) {
          if (v_6e2738.current) clearTimeout(v_6e2738.current);
          v_6e2738.current = setTimeout(() => {
            if (!v_fe2b35.current) return;

            if (v_b5958d.current) return;
            try {

              v_b5958d.current = true; 
              v_1e3df0.start({
                lang: v_5254bf,
                interimResults: true,
                continuous: true,
                volumeChangeEventOptions: { enabled: true, intervalMillis: 100 },
              });

              if (v_168497.current) clearTimeout(v_168497.current);
              v_168497.current = setTimeout(() => {
                v_168497.current = null;

                v_b5958d.current = false;
              }, v_74fd06);
            } catch {

              v_b5958d.current = false;
            }
          }, 400);
        }
      }),

      v_1e3df0.addListener('start', (v_2d3e87) => {

        if (!v_fe2b35.current) return;
        v_9061f1();
      }),
      v_1e3df0.addListener('speechstart', (v_2d3e87) => {}),
      v_1e3df0.addListener('speechend', (v_2d3e87) => {}),
      v_1e3df0.addListener('audiostart', (v_2d3e87) => {}),
      v_1e3df0.addListener('audioend', (v_2d3e87) => {}),
      v_1e3df0.addListener('soundstart', (v_2d3e87) => {}),
      v_1e3df0.addListener('soundend', (v_2d3e87) => {}),
      v_1e3df0.addListener('nomatch', (v_2d3e87) => {}),

      v_1e3df0.addListener('volumechange', (v_e2a85c) => {
        if (!v_fe2b35.current) return;
        const v_479f05 = typeof v_e2a85c?.value === 'number' && !Number.isNaN(v_e2a85c.value) ? v_e2a85c.value : undefined;
        if (v_479f05 === undefined) return;
        const v_a448ad = v_d08429(v_479f05);
        if (v_3032b0(v_23245d.current, v_a448ad)) {
          v_23245d.current = v_a448ad;
          v_d404a7(v_a448ad);
        }
      }),
    );
    return () => {
      v_ab371b.current.forEach((v_fd5f43) => v_fd5f43.remove());
      v_ab371b.current = [];
    };
  }, [v_1e3df0, v_9061f1]);

  v_c4deb2(() => {
    return () => {
      if (v_e2c189.current) {
        clearTimeout(v_e2c189.current);
        v_e2c189.current = null;
      }
      if (v_6e2738.current) {
        clearTimeout(v_6e2738.current);
        v_6e2738.current = null;
      }
      if (v_168497.current) {
        clearTimeout(v_168497.current);
        v_168497.current = null;
      }
      if (v_3dd9b4.current) {
        clearTimeout(v_3dd9b4.current);
        v_3dd9b4.current = null;
      }
    };
  }, []);

  const v_770cae = v_de06a3(async () => {

    if (v_b5958d.current) {
      return;
    }
    v_fe2b35.current = true; 
    v_3a7d09(null);
    v_8028c0('');
    v_60039d('');
    v_f59c40(); 

    const v_275ccd = await v_1e3df0.getPermissionsAsync?.();
    const v_b6d66b = v_275ccd?.granted === true ? true : (await v_1e3df0.requestPermissionsAsync()).granted;
    if (!v_b6d66b) {
      v_3a7d09(new Error('permission_denied'));
      return;
    }

    v_b5958d.current = true; 
    if (v_168497.current) clearTimeout(v_168497.current);
    v_168497.current = setTimeout(() => {
      v_168497.current = null;

      v_b5958d.current = false;
    }, v_74fd06);
    try {

      v_1e3df0.start({
        lang: v_5254bf,
        interimResults: true,
        continuous: true,
        volumeChangeEventOptions: { enabled: true, intervalMillis: 100 },
      });
    } catch (v_b17aaa) {
      const v_9e86fd = v_b17aaa instanceof Error ? v_b17aaa : new Error(String(v_b17aaa));
      if (v_168497.current) {
        clearTimeout(v_168497.current);
        v_168497.current = null;
      }
      v_b5958d.current = false; 
      v_b680bc(false);
      v_3a7d09(v_9e86fd);
    }
  }, [v_1e3df0, v_5254bf]);

  const v_ad03b1 = v_de06a3(() => {

    v_fe2b35.current = false; 
    v_b5958d.current = false; 
    if (v_6e2738.current) {
      clearTimeout(v_6e2738.current);
      v_6e2738.current = null;
    }
    if (v_168497.current) {
      clearTimeout(v_168497.current);
      v_168497.current = null;
    }

    v_f59c40();
    v_1e3df0.stop();
    v_b680bc(false);
    v_17e228(false);
    v_23245d.current = 0;
    v_d404a7(0); 

    if (v_3dd9b4.current) {
      clearTimeout(v_3dd9b4.current);
      v_3dd9b4.current = null;
    }
  }, [v_1e3df0, v_f59c40]);

  return {
    transcript: v_0885ca,
    interimTranscript: v_a2d9d1,
    listening: v_177ff2,
    listeningDebounced: v_23db84,
    error: v_5e9bfe,
    startListening: v_770cae,
    stopListening: v_ad03b1,

    micLevel: v_9afd2d,
  };
}

function v_0fc68d(): SpeechEngine {

  const { ExpoSpeechRecognitionModule: v_e243ee } = require('lvqvchptxazovhbxaycespq');
  return {

    getPermissionsAsync: () => v_e243ee.getPermissionsAsync(),
    requestPermissionsAsync: () => v_e243ee.requestPermissionsAsync(),

    start: (v_b6c474) =>
      v_e243ee.start({
        lang: v_b6c474?.lang,
        volumeChangeEventOptions: v_b6c474?.volumeChangeEventOptions,
        interimResults: v_b6c474?.interimResults,
        continuous: v_b6c474?.continuous,
      }),
    stop: () => v_e243ee.stop(),

    addListener: (v_1d299c, v_16dbdb) => v_e243ee.addListener(v_1d299c, v_16dbdb),
  };
}
