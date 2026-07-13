

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { normalizeMicLevel, shouldUpdateLevel } from './voiceBall';

export interface SpeechEngine {
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

export const DEFAULT_SILENCE_MS = 1500;

export const STT_WATCHDOG_MS = 1500;

export const STALLED_DEBOUNCE_MS = 2000;

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

  const [micLevel, setMicLevel] = useState(0);

  const micLevelRef = useRef(0);

  const [listeningDebounced, setListeningDebounced] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const subs = useRef<Array<{ remove: () => void }>>([]);

  const wantListeningRef = useRef(false);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pendingStartRef = useRef(false);

  const stalledTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const confirmListening = useCallback(() => {
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }

    pendingStartRef.current = false;

    if (stalledTimerRef.current) {
      clearTimeout(stalledTimerRef.current);
      stalledTimerRef.current = null;
    }
    setListeningDebounced(true);
    setListening(true);
  }, []);

  useEffect(() => {
    subs.current.push(

      engine.addListener('result', (p: any) => {

        if (!wantListeningRef.current) return;
        const t: string = p?.results?.[0]?.transcript ?? '';
        const isFinal: boolean = p?.isFinal === true;

        confirmListening();
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
        const msg = p?.message ?? p?.error ?? 'stt_error';

        if (watchdogRef.current) {
          clearTimeout(watchdogRef.current);
          watchdogRef.current = null;
        }
        pendingStartRef.current = false;
        setListening(false);
        micLevelRef.current = 0;
        setMicLevel(0); 

        if (stalledTimerRef.current) clearTimeout(stalledTimerRef.current);
        stalledTimerRef.current = setTimeout(() => {
          stalledTimerRef.current = null;
          setListeningDebounced(false);
        }, STALLED_DEBOUNCE_MS);
        setError(new Error(msg));
      }),
      engine.addListener('end', () => {
        setListening(false);
        micLevelRef.current = 0;
        setMicLevel(0); 

        if (stalledTimerRef.current) clearTimeout(stalledTimerRef.current);
        stalledTimerRef.current = setTimeout(() => {
          stalledTimerRef.current = null;
          setListeningDebounced(false);
        }, STALLED_DEBOUNCE_MS);

        if (wantListeningRef.current) {
          if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
          restartTimerRef.current = setTimeout(() => {
            if (!wantListeningRef.current) return;

            if (pendingStartRef.current) return;
            try {

              pendingStartRef.current = true; 
              engine.start({
                lang,
                interimResults: true,
                continuous: true,
                volumeChangeEventOptions: { enabled: true, intervalMillis: 100 },
              });

              if (watchdogRef.current) clearTimeout(watchdogRef.current);
              watchdogRef.current = setTimeout(() => {
                watchdogRef.current = null;

                pendingStartRef.current = false;
              }, STT_WATCHDOG_MS);
            } catch {

              pendingStartRef.current = false;
            }
          }, 400);
        }
      }),

      engine.addListener('start', (_p: any) => {

        if (!wantListeningRef.current) return;
        confirmListening();
      }),
      engine.addListener('speechstart', (_p: any) => {}),
      engine.addListener('speechend', (_p: any) => {}),
      engine.addListener('audiostart', (_p: any) => {}),
      engine.addListener('audioend', (_p: any) => {}),
      engine.addListener('soundstart', (_p: any) => {}),
      engine.addListener('soundend', (_p: any) => {}),
      engine.addListener('nomatch', (_p: any) => {}),

      engine.addListener('volumechange', (p: any) => {
        if (!wantListeningRef.current) return;
        const raw = typeof p?.value === 'number' && !Number.isNaN(p.value) ? p.value : undefined;
        if (raw === undefined) return;
        const next = normalizeMicLevel(raw);
        if (shouldUpdateLevel(micLevelRef.current, next)) {
          micLevelRef.current = next;
          setMicLevel(next);
        }
      }),
    );
    return () => {
      subs.current.forEach((s) => s.remove());
      subs.current = [];
    };
  }, [engine, confirmListening]);

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
      if (watchdogRef.current) {
        clearTimeout(watchdogRef.current);
        watchdogRef.current = null;
      }
      if (stalledTimerRef.current) {
        clearTimeout(stalledTimerRef.current);
        stalledTimerRef.current = null;
      }
    };
  }, []);

  const startListening = useCallback(async () => {

    if (pendingStartRef.current) {
      return;
    }
    wantListeningRef.current = true; 
    setError(null);
    setTranscript('');
    setInterimTranscript('');
    resetBuffer(); 
    const perm = await engine.requestPermissionsAsync();
    if (!perm.granted) {
      setError(new Error('permission_denied'));
      return;
    }

    pendingStartRef.current = true; 
    if (watchdogRef.current) clearTimeout(watchdogRef.current);
    watchdogRef.current = setTimeout(() => {
      watchdogRef.current = null;

      pendingStartRef.current = false;
    }, STT_WATCHDOG_MS);
    try {

      engine.start({
        lang,
        interimResults: true,
        continuous: true,
        volumeChangeEventOptions: { enabled: true, intervalMillis: 100 },
      });
    } catch (startErr: unknown) {
      const e = startErr instanceof Error ? startErr : new Error(String(startErr));
      if (watchdogRef.current) {
        clearTimeout(watchdogRef.current);
        watchdogRef.current = null;
      }
      pendingStartRef.current = false; 
      setListening(false);
      setError(e);
    }
  }, [engine, lang]);

  const stopListening = useCallback(() => {

    wantListeningRef.current = false; 
    pendingStartRef.current = false; 
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }

    resetBuffer();
    engine.stop();
    setListening(false);
    setListeningDebounced(false);
    micLevelRef.current = 0;
    setMicLevel(0); 

    if (stalledTimerRef.current) {
      clearTimeout(stalledTimerRef.current);
      stalledTimerRef.current = null;
    }
  }, [engine, resetBuffer]);

  return {
    transcript,
    interimTranscript,
    listening,
    listeningDebounced,
    error,
    startListening,
    stopListening,

    micLevel,
  };
}

function getDefaultEngine(): SpeechEngine {

  const { ExpoSpeechRecognitionModule } = require('expo-speech-recognition');
  return {
    requestPermissionsAsync: () => ExpoSpeechRecognitionModule.requestPermissionsAsync(),

    start: (o) =>
      ExpoSpeechRecognitionModule.start({
        lang: o?.lang,
        volumeChangeEventOptions: o?.volumeChangeEventOptions,
        interimResults: o?.interimResults,
        continuous: o?.continuous,
      }),
    stop: () => ExpoSpeechRecognitionModule.stop(),

    addListener: (ev, cb) => ExpoSpeechRecognitionModule.addListener(ev, cb),
  };
}
