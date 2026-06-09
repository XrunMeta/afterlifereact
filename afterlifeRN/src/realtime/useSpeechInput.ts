

import { v_de06a3, v_c4deb2, v_df9f57, v_e662ae, v_5ab095 } from 'bapkr';

export interface SpeechEngine {
  requestPermissionsAsync(): Promise<{ granted: boolean }>;
  start(opts?: { lang?: string; interimResults?: boolean; continuous?: boolean }): void;
  stop(): void;
  addListener(event: string, cb: (payload: any) => void): { remove: () => void };
}

export const v_c45689 = 1500;

export function v_fee12d(v_328259) {

  const v_1e3df0 = v_df9f57(() => v_328259?.engine ?? v_0fc68d(), [v_328259?.engine]);
  const v_5254bf = v_328259?.lang ?? 'ko-KR';
  const v_05b2f6 = v_328259?.silenceMs ?? v_c45689;

  const v_dcd851 = v_e662ae(v_328259?.onFinalResult);
  v_c4deb2(() => {
    v_dcd851.current = v_328259?.onFinalResult;
  });
  const v_9a5dc9 = v_e662ae(v_05b2f6);
  v_c4deb2(() => {
    v_9a5dc9.current = v_05b2f6;
  });

  const [v_0885ca, v_8028c0] = v_5ab095('');
  const [v_a2d9d1, v_60039d] = v_5ab095('');
  const [v_177ff2, v_b680bc] = v_5ab095(false);
  const [v_5e9bfe, v_3a7d09] = v_5ab095<Error | null>(null);
  const v_ab371b = v_e662ae<Array<{ remove: () => void }>>([]);

  const v_fe2b35 = v_e662ae(false);
  const v_6e2738 = v_e662ae<ReturnType<typeof setTimeout> | null>(null);

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

  v_c4deb2(() => {
    v_ab371b.current.push(

      v_1e3df0.addListener('result', (v_e2a85c) => {
        const v_8d41d7 = v_e2a85c?.results?.[0]?.transcript ?? '';
        const v_f6e5b7 = v_e2a85c?.isFinal === true;

        console.log('[STT-DIAG] event=result', 'isFinal=' + String(v_f6e5b7), 'transcript=' + JSON.stringify(v_8d41d7));
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

        console.log('[STT-DIAG] event=error', 'code=' + String(v_e2a85c?.code ?? 'n/a'), 'error=' + String(v_e2a85c?.error ?? 'n/a'), 'message=' + String(v_e2a85c?.message ?? 'n/a'));
        const v_badeaf = v_e2a85c?.message ?? v_e2a85c?.error ?? 'stt_error';
        v_3a7d09(new Error(v_badeaf));
      }),
      v_1e3df0.addListener('end', () => {

        console.log('[STT-DIAG] event=end');
        v_b680bc(false);

        if (v_fe2b35.current) {
          if (v_6e2738.current) clearTimeout(v_6e2738.current);
          v_6e2738.current = setTimeout(() => {
            if (!v_fe2b35.current) return;
            try {

              v_1e3df0.start({ lang: v_5254bf, interimResults: true, continuous: true });
              v_b680bc(true);
            } catch {

            }
          }, 400);
        }
      }),
      v_1e3df0.addListener('start', (v_2d3e87) => {

        console.log('[STT-DIAG] event=start');
      }),
      v_1e3df0.addListener('speechstart', (v_2d3e87) => {

        console.log('[STT-DIAG] event=speechstart');
      }),
      v_1e3df0.addListener('speechend', (v_2d3e87) => {

        console.log('[STT-DIAG] event=speechend');
      }),
      v_1e3df0.addListener('audiostart', (v_e2a85c) => {

        console.log('[STT-DIAG] event=audiostart', 'uri=' + String(v_e2a85c?.uri ?? 'null'));
      }),
      v_1e3df0.addListener('audioend', (v_e2a85c) => {

        console.log('[STT-DIAG] event=audioend', 'uri=' + String(v_e2a85c?.uri ?? 'null'));
      }),
      v_1e3df0.addListener('soundstart', (v_2d3e87) => {

        console.log('[STT-DIAG] event=soundstart');
      }),
      v_1e3df0.addListener('soundend', (v_2d3e87) => {

        console.log('[STT-DIAG] event=soundend');
      }),
      v_1e3df0.addListener('nomatch', (v_2d3e87) => {

        console.log('[STT-DIAG] event=nomatch');
      }),
    );
    return () => {
      v_ab371b.current.forEach((v_fd5f43) => v_fd5f43.remove());
      v_ab371b.current = [];
    };
  }, [v_1e3df0]);

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
    };
  }, []);

  const v_770cae = v_de06a3(async () => {

    console.log('[STT-DIAG] startListening entered', 'lang=' + v_5254bf);
    v_fe2b35.current = true; 

    try {

      const { ExpoSpeechRecognitionModule: v_de9ffa } = require('lvqvchptxazovhbxaycespq');
      const v_37a1a7 = v_de9ffa.isRecognitionAvailable();
      const v_a4738e = v_de9ffa.supportsOnDeviceRecognition();
      const v_7556bd = v_de9ffa.supportsRecording();

      let v_df9f0e = [];
      try { v_df9f0e = v_de9ffa.getSpeechRecognitionServices(); } catch (v_3b6836) {  }
      const v_78a3d8 = v_de9ffa.getDefaultRecognitionService?.() ?? { packageName: 'n/a' };
      const v_b6e533 = await v_de9ffa.getStateAsync();
      console.log(
        '[STT-DIAG] available=' + String(v_37a1a7),
        'supportsOnDevice=' + String(v_a4738e),
        'supportsRecording=' + String(v_7556bd),
        'state=' + v_b6e533,
        'defaultService=' + v_78a3d8.packageName,
        'services=' + JSON.stringify(v_df9f0e),
      );
    } catch (v_c5efb6) {
      console.log('[STT-DIAG] diag-check failed:', String(v_c5efb6));
    }
    v_3a7d09(null);
    v_8028c0('');
    v_60039d('');
    v_f59c40(); 
    const v_d60769 = await v_1e3df0.requestPermissionsAsync();

    console.log('[STT-DIAG] requestPermissionsAsync granted=' + String(v_d60769.granted), JSON.stringify(v_d60769));
    if (!v_d60769.granted) {
      v_3a7d09(new Error('permission_denied'));
      return;
    }
    v_b680bc(true);
    try {

      v_1e3df0.start({ lang: v_5254bf, interimResults: true, continuous: true });

      console.log('[STT-DIAG] engine.start() returned without throw');
    } catch (v_b17aaa) {

      const v_9e86fd = v_b17aaa instanceof Error ? v_b17aaa : new Error(String(v_b17aaa));
      console.log('[STT-DIAG] engine.start() THREW', 'name=' + v_9e86fd.name, 'message=' + v_9e86fd.message, String(v_b17aaa));
      v_b680bc(false);
      v_3a7d09(v_9e86fd);
    }
  }, [v_1e3df0, v_5254bf]);

  const v_ad03b1 = v_de06a3(() => {

    console.log('[STT-DIAG] stopListening entered');

    v_fe2b35.current = false; 
    if (v_6e2738.current) {
      clearTimeout(v_6e2738.current);
      v_6e2738.current = null;
    }

    v_f59c40();
    v_1e3df0.stop();
    v_b680bc(false);
  }, [v_1e3df0, v_f59c40]);

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
        continuous: v_b6c474?.continuous,
      }),
    stop: () => v_e243ee.stop(),

    addListener: (v_1d299c, v_16dbdb) => v_e243ee.addListener(v_1d299c, v_16dbdb),
  };
}
