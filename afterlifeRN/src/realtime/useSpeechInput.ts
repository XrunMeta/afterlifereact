

import { v_de06a3, v_c4deb2, v_df9f57, v_e662ae, v_5ab095 } from 'bapkr';
import { v_d08429, v_3032b0 } from './voiceBall';
import { v_d7f7b1 } from './timingEvents';
import { v_8fae09 } from './utteranceEnd';

const v_f47f7d = new Set(['not-allowed', 'service-not-allowed', 'language-not-supported']);
export const v_b90ee2 = 5;
export const v_1d6b6a = 800;

export const v_7f5942 = [1000, 2000, 4000, 8000];

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

export const v_3937db = 3;

export const v_4811dd = 3000;

export const v_1be526 = 1800;

export function v_fee12d(v_328259) {

  const v_1e3df0 = v_df9f57(() => v_328259?.engine ?? v_0fc68d(), [v_328259?.engine]);
  const v_5254bf = v_328259?.lang ?? 'ko-KR';
  const v_05b2f6 = v_328259?.silenceMs ?? v_c45689;

  const v_a4265b = v_e662ae(v_328259?.contextualStrings);
  v_c4deb2(() => {
    v_a4265b.current = v_328259?.contextualStrings;
  });

  const v_dcd851 = v_e662ae(v_328259?.onFinalResult);
  v_c4deb2(() => {
    v_dcd851.current = v_328259?.onFinalResult;
  });
  const v_2c309a = v_e662ae(v_328259?.onUnrecoverable);
  v_c4deb2(() => {
    v_2c309a.current = v_328259?.onUnrecoverable;
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

  const [v_a39069, v_1a3c56] = v_5ab095(false);
  const [v_5e9bfe, v_3a7d09] = v_5ab095<Error | null>(null);
  const v_ab371b = v_e662ae<Array<{ remove: () => void }>>([]);

  const v_fe2b35 = v_e662ae(false);
  const v_6e2738 = v_e662ae<ReturnType<typeof setTimeout> | null>(null);

  const v_b3ab0e = v_e662ae(0);

  const v_130126 = v_e662ae(0);

  const v_13d028 = v_e662ae(false);

  const v_a39a3e = v_e662ae(false);

  const v_168497 = v_e662ae<ReturnType<typeof setTimeout> | null>(null);

  const v_b5958d = v_e662ae(false);

  const v_3dd9b4 = v_e662ae<ReturnType<typeof setTimeout> | null>(null);

  const v_c4dfc6 = v_e662ae<string[]>([]);
  const v_5484ad = v_e662ae('');
  const v_e2c189 = v_e662ae<ReturnType<typeof setTimeout> | null>(null);

  const v_5a468c = v_e662ae(0);

  const v_33d425 = v_e662ae(0);

  const v_5a6c41 = v_e662ae(0);
  const v_de1c15 = v_e662ae(v_328259?.incompleteHoldMs ?? v_1be526);
  v_de1c15.current = v_328259?.incompleteHoldMs ?? v_1be526;

  const v_f59c40 = v_de06a3(() => {
    v_c4dfc6.current = [];
    v_5484ad.current = '';
    v_5a468c.current = 0;
    v_33d425.current = 0;
    v_5a6c41.current = 0;
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

  const v_70e4e3 = v_de06a3(() => {
    v_e2c189.current = null;
    const v_5c2f9f = Date.now();
    const v_6393fb = v_5c2f9f - v_5a468c.current;
    if (v_5a468c.current > 0 && v_6393fb < v_9a5dc9.current) {
      if (v_33d425.current === 0) v_33d425.current = v_5c2f9f;
      if (v_5c2f9f - v_33d425.current < v_4811dd) {
        v_e2c189.current = setTimeout(v_f641ee.current, v_9a5dc9.current - v_6393fb);
        return;
      }
    }

    const v_def12c = [...v_c4dfc6.current, v_5484ad.current].join(' ').trim();
    const v_d812bd = v_5c2f9f - v_5a6c41.current;
    const v_354244 = v_de1c15.current;
    if (v_5a6c41.current > 0 && v_d812bd < v_354244 && v_8fae09(v_def12c)) {
      v_d7f7b1('stt_engine', { ev: 'hold_incomplete', ms: v_354244 - v_d812bd, tail: v_def12c.slice(-8) });
      v_e2c189.current = setTimeout(v_f641ee.current, v_354244 - v_d812bd);
      return;
    }
    v_b6e358();
  }, [v_b6e358]);
  const v_f641ee = v_e662ae(v_70e4e3);
  v_f641ee.current = v_70e4e3;

  const v_aa432e = v_de06a3(() => {
    if (v_e2c189.current) clearTimeout(v_e2c189.current);
    v_33d425.current = 0; 
    v_5a6c41.current = Date.now();
    v_e2c189.current = setTimeout(() => v_f641ee.current(), v_9a5dc9.current);
  }, []);

  const v_13effb = v_de06a3((v_3325c8, v_336f81) => {
    if (v_6e2738.current) clearTimeout(v_6e2738.current);
    v_6e2738.current = setTimeout(() => {
      v_6e2738.current = null;
      v_13d028.current = false;
      v_a39a3e.current = false;
      v_d7f7b1('stt_engine', { ev: 'restart', why: v_3325c8 });
      if (!v_fe2b35.current) return;

      if (v_b5958d.current) return;
      try {

        v_b5958d.current = true; 
        const v_427ca2 = v_a4265b.current;
        v_1e3df0.start({
          lang: v_5254bf,
          interimResults: true,
          continuous: true,
          volumeChangeEventOptions: { enabled: true, intervalMillis: 100 },
          ...(v_427ca2 && v_427ca2.length > 0 ? { contextualStrings: v_427ca2 } : {}),
        } as any);

        if (v_168497.current) clearTimeout(v_168497.current);
        v_168497.current = setTimeout(() => {
          v_168497.current = null;

          v_b5958d.current = false;
        }, v_74fd06);
      } catch {

        v_b5958d.current = false;
      }
    }, v_336f81);
  }, [v_1e3df0, v_5254bf]);
  const v_b68c2b = v_e662ae(v_13effb);
  v_b68c2b.current = v_13effb;

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
    v_1a3c56(false);
  }, []);

  v_c4deb2(() => {
    v_ab371b.current.push(

      v_1e3df0.addListener('result', (v_e2a85c) => {

        if (!v_fe2b35.current) return;
        v_b3ab0e.current = 0;
        v_130126.current = 0;
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
        const v_c99bd2 = v_e2a85c?.error ?? '';
        v_d7f7b1('stt_engine', { ev: 'error', code: v_c99bd2, msg: String(v_badeaf).slice(0, 80), want: v_fe2b35.current });

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
        if (v_c99bd2 === 'no-speech') v_130126.current = 0; 
        if (v_fe2b35.current) v_1a3c56(true);
        if (v_fe2b35.current && v_c99bd2 === 'network') {
          const v_f4e98d = v_130126.current;
          v_13d028.current = true;
          if (v_f4e98d >= v_7f5942.length) {
            v_d7f7b1('stt_engine', { ev: 'give_up', why: 'network', fails: v_f4e98d + 1 });
            v_a39a3e.current = false;
            v_fe2b35.current = false;
            if (v_6e2738.current) {
              clearTimeout(v_6e2738.current);
              v_6e2738.current = null;
            }
            v_2c309a.current?.('network');
          } else {
            v_130126.current = v_f4e98d + 1;
            v_a39a3e.current = true;
            v_d7f7b1('stt_engine', { ev: 'backoff', ms: v_7f5942[v_f4e98d] });
            v_b68c2b.current('network', v_7f5942[v_f4e98d]);
          }
        } else if (v_fe2b35.current) {
          v_13d028.current = true;
          if (v_f47f7d.has(v_c99bd2)) {
            v_d7f7b1('stt_engine', { ev: 'restart_skip', why: 'fatal', code: v_c99bd2 });
          } else if (v_b3ab0e.current >= v_b90ee2) {
            v_d7f7b1('stt_engine', { ev: 'restart_skip', why: 'max', code: v_c99bd2 });
          } else {
            v_b3ab0e.current += 1;
            v_b68c2b.current('error', v_1d6b6a);
          }
        }
      }),
      v_1e3df0.addListener('end', () => {
        v_d7f7b1('stt_engine', { ev: 'end', want: v_fe2b35.current });
        v_b680bc(false);
        v_23245d.current = 0;
        v_d404a7(0); 

        if (v_3dd9b4.current) clearTimeout(v_3dd9b4.current);
        v_3dd9b4.current = setTimeout(() => {
          v_3dd9b4.current = null;
          v_17e228(false);
        }, v_4c6a50);

        if (v_13d028.current) {
          v_13d028.current = false; 
        } else if (v_fe2b35.current) {
          v_b68c2b.current('end', 400);
        }
      }),

      v_1e3df0.addListener('start', (v_2d3e87) => {
        v_d7f7b1('stt_engine', { ev: 'start', want: v_fe2b35.current });

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
        if (v_479f05 >= v_3937db) v_5a468c.current = Date.now();
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

    if (v_a39a3e.current) {
      v_fe2b35.current = true;
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

      const v_427ca2 = v_a4265b.current;
      v_1e3df0.start({
        lang: v_5254bf,
        interimResults: true,
        continuous: true,
        volumeChangeEventOptions: { enabled: true, intervalMillis: 100 },
        ...(v_427ca2 && v_427ca2.length > 0 ? { contextualStrings: v_427ca2 } : {}),
      } as any);
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

    v_130126.current = 0;
    v_a39a3e.current = false;
    v_13d028.current = false;
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
    v_1a3c56(false);
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

    recovering: v_a39069,
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
