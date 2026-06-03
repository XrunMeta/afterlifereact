

import { useCallback, useEffect, useRef, useState } from 'react';

export interface SpeechEngine {
  requestPermissionsAsync(): Promise<{ granted: boolean }>;
  start(opts?: { lang?: string; interimResults?: boolean }): void;
  stop(): void;
  addListener(event: string, cb: (payload: any) => void): { remove: () => void };
}

export function useSpeechInput(opts?: {
  engine?: SpeechEngine;
  lang?: string;

  onFinalResult?: (text: string) => void;
}) {
  const engine = opts?.engine ?? getDefaultEngine();
  const lang = opts?.lang ?? 'ko-KR';

  const onFinalResultRef = useRef(opts?.onFinalResult);
  useEffect(() => {
    onFinalResultRef.current = opts?.onFinalResult;
  });

  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const subs = useRef<Array<{ remove: () => void }>>([]);

  const wantListeningRef = useRef(false);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    subs.current.push(

      engine.addListener('result', (p: any) => {
        const t: string = p?.results?.[0]?.transcript ?? '';
        const isFinal: boolean = p?.isFinal === true;
        if (isFinal) {

          setTranscript(t);
          setInterimTranscript('');
          const trimmed = t.trim();
          if (trimmed) {
            onFinalResultRef.current?.(trimmed);
          }
        } else {

          if (t) setInterimTranscript(t);
        }
      }),

      engine.addListener('error', (p: any) => {
        const msg = p?.message ?? p?.error ?? 'stt_error';
        setError(new Error(msg));
      }),
      engine.addListener('end', () => {
        setListening(false);

        if (wantListeningRef.current) {
          if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
          restartTimerRef.current = setTimeout(() => {
            if (!wantListeningRef.current) return;
            try {
              engine.start({ lang, interimResults: true });
              setListening(true);
            } catch {

            }
          }, 400);
        }
      }),
    );
    return () => {
      subs.current.forEach((s) => s.remove());
      subs.current = [];
    };
  }, [engine]);

  const startListening = useCallback(async () => {
    wantListeningRef.current = true; 
    setError(null);
    setTranscript('');
    setInterimTranscript('');
    const perm = await engine.requestPermissionsAsync();
    if (!perm.granted) {
      setError(new Error('permission_denied'));
      return;
    }
    setListening(true);
    engine.start({ lang, interimResults: true });
  }, [engine, lang]);

  const stopListening = useCallback(() => {

    wantListeningRef.current = false; 
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    engine.stop();
    setListening(false);
  }, [engine]);

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
      }),
    stop: () => ExpoSpeechRecognitionModule.stop(),

    addListener: (ev, cb) => ExpoSpeechRecognitionModule.addListener(ev, cb),
  };
}
