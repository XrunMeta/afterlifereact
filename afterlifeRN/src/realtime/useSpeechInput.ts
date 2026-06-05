

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface SpeechEngine {
  requestPermissionsAsync(): Promise<{ granted: boolean }>;
  start(opts?: { lang?: string; interimResults?: boolean; continuous?: boolean }): void;
  stop(): void;
  addListener(event: string, cb: (payload: any) => void): { remove: () => void };
}

export const DEFAULT_SILENCE_MS = 1500;

export function useSpeechInput(opts?: {
  engine?: SpeechEngine;
  lang?: string;

  onFinalResult?: (text: string) => void;

  silenceMs?: number;
}) {

  const engine = useMemo(() => opts?.engine ?? getDefaultEngine(), [opts?.engine]);
  const lang = opts?.lang ?? 'ko-KR';
  const silenceMs = opts?.silenceMs ?? DEFAULT_SILENCE_MS;

  const onFinalResultRef = useRef(opts?.onFinalResult);
  useEffect(() => {
    onFinalResultRef.current = opts?.onFinalResult;
  });
  const silenceMsRef = useRef(silenceMs);
  useEffect(() => {
    silenceMsRef.current = silenceMs;
  });

  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const subs = useRef<Array<{ remove: () => void }>>([]);

  const wantListeningRef = useRef(false);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const segmentsRef = useRef<string[]>([]);
  const interimRef = useRef('');
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetBuffer = useCallback(() => {
    segmentsRef.current = [];
    interimRef.current = '';
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const flush = useCallback(() => {
    const combined = [...segmentsRef.current, interimRef.current]
      .map((s) => s.trim())
      .filter(Boolean)
      .join(' ')
      .trim();
    resetBuffer();
    if (combined) {
      setTranscript(combined);
      setInterimTranscript('');
      onFinalResultRef.current?.(combined);
    }
  }, [resetBuffer]);

  const armSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      silenceTimerRef.current = null;
      flush();
    }, silenceMsRef.current);
  }, [flush]);

  useEffect(() => {
    subs.current.push(

      engine.addListener('result', (p: any) => {
        const t: string = p?.results?.[0]?.transcript ?? '';
        const isFinal: boolean = p?.isFinal === true;

        console.log('[STT-DIAG] event=result', 'isFinal=' + String(isFinal), 'transcript=' + JSON.stringify(t));
        if (isFinal) {

          const seg = t.trim();
          if (seg) {
            const last = segmentsRef.current[segmentsRef.current.length - 1];
            if (seg !== last) segmentsRef.current.push(seg);
          }
          interimRef.current = '';

          setInterimTranscript('');
          setTranscript(segmentsRef.current.join(' '));
        } else {

          interimRef.current = t;
          if (t) setInterimTranscript(t);
        }

        armSilenceTimer();
      }),

      engine.addListener('error', (p: any) => {

        console.log('[STT-DIAG] event=error', 'code=' + String(p?.code ?? 'n/a'), 'error=' + String(p?.error ?? 'n/a'), 'message=' + String(p?.message ?? 'n/a'));
        const msg = p?.message ?? p?.error ?? 'stt_error';
        setError(new Error(msg));
      }),
      engine.addListener('end', () => {

        console.log('[STT-DIAG] event=end');
        setListening(false);

        if (wantListeningRef.current) {
          if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
          restartTimerRef.current = setTimeout(() => {
            if (!wantListeningRef.current) return;
            try {

              engine.start({ lang, interimResults: true, continuous: true });
              setListening(true);
            } catch {

            }
          }, 400);
        }
      }),
      engine.addListener('start', (_p: any) => {

        console.log('[STT-DIAG] event=start');
      }),
      engine.addListener('speechstart', (_p: any) => {

        console.log('[STT-DIAG] event=speechstart');
      }),
      engine.addListener('speechend', (_p: any) => {

        console.log('[STT-DIAG] event=speechend');
      }),
      engine.addListener('audiostart', (p: any) => {

        console.log('[STT-DIAG] event=audiostart', 'uri=' + String(p?.uri ?? 'null'));
      }),
      engine.addListener('audioend', (p: any) => {

        console.log('[STT-DIAG] event=audioend', 'uri=' + String(p?.uri ?? 'null'));
      }),
      engine.addListener('soundstart', (_p: any) => {

        console.log('[STT-DIAG] event=soundstart');
      }),
      engine.addListener('soundend', (_p: any) => {

        console.log('[STT-DIAG] event=soundend');
      }),
      engine.addListener('nomatch', (_p: any) => {

        console.log('[STT-DIAG] event=nomatch');
      }),
    );
    return () => {
      subs.current.forEach((s) => s.remove());
      subs.current = [];
    };
  }, [engine]);

  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
      }
    };
  }, []);

  const startListening = useCallback(async () => {

    console.log('[STT-DIAG] startListening entered', 'lang=' + lang);
    wantListeningRef.current = true; 

    try {

      const { ExpoSpeechRecognitionModule: _diagMod } = require('expo-speech-recognition');
      const available: boolean = _diagMod.isRecognitionAvailable();
      const supportsOnDevice: boolean = _diagMod.supportsOnDeviceRecognition();
      const supportsRec: boolean = _diagMod.supportsRecording();

      let services: string[] = [];
      try { services = _diagMod.getSpeechRecognitionServices(); } catch (_e) {  }
      const defaultSvc: { packageName: string } = _diagMod.getDefaultRecognitionService?.() ?? { packageName: 'n/a' };
      const state: string = await _diagMod.getStateAsync();
      console.log(
        '[STT-DIAG] available=' + String(available),
        'supportsOnDevice=' + String(supportsOnDevice),
        'supportsRecording=' + String(supportsRec),
        'state=' + state,
        'defaultService=' + defaultSvc.packageName,
        'services=' + JSON.stringify(services),
      );
    } catch (diagErr: unknown) {
      console.log('[STT-DIAG] diag-check failed:', String(diagErr));
    }
    setError(null);
    setTranscript('');
    setInterimTranscript('');
    resetBuffer(); 
    const perm = await engine.requestPermissionsAsync();

    console.log('[STT-DIAG] requestPermissionsAsync granted=' + String(perm.granted), JSON.stringify(perm));
    if (!perm.granted) {
      setError(new Error('permission_denied'));
      return;
    }
    setListening(true);
    try {

      engine.start({ lang, interimResults: true, continuous: true });

      console.log('[STT-DIAG] engine.start() returned without throw');
    } catch (startErr: unknown) {

      const e = startErr instanceof Error ? startErr : new Error(String(startErr));
      console.log('[STT-DIAG] engine.start() THREW', 'name=' + e.name, 'message=' + e.message, String(startErr));
      setListening(false);
      setError(e);
    }
  }, [engine, lang]);

  const stopListening = useCallback(() => {

    console.log('[STT-DIAG] stopListening entered');

    wantListeningRef.current = false; 
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }

    resetBuffer();
    engine.stop();
    setListening(false);
  }, [engine, resetBuffer]);

  return { transcript, interimTranscript, listening, error, startListening, stopListening };
}

function getDefaultEngine(): SpeechEngine {

  const { ExpoSpeechRecognitionModule } = require('expo-speech-recognition');
  return {
    requestPermissionsAsync: () => ExpoSpeechRecognitionModule.requestPermissionsAsync(),

    start: (o) =>
      ExpoSpeechRecognitionModule.start({
        lang: o?.lang,
        interimResults: o?.interimResults,
        continuous: o?.continuous,
      }),
    stop: () => ExpoSpeechRecognitionModule.stop(),

    addListener: (ev, cb) => ExpoSpeechRecognitionModule.addListener(ev, cb),
  };
}
