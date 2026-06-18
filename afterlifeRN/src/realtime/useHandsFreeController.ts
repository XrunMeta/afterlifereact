

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSpeechInput, type SpeechEngine } from './useSpeechInput';
import { useCloneSilenceDetector } from './useCloneSilenceDetector';
import {
  handsFreeReducer,
  initHandsFreeState,
  type HandsFreeEvent,
  type HandsFreeEffect,
} from './handsFree';
import { extractCloneAudioLevel, type CloneSilenceConfig } from './cloneSilence';

const CLONE_GATE_LEVEL = 0.05; 

const GREET_TIMEOUT_MS_DEFAULT = 3000;
const GREETING_FALLBACK_TEXT_DEFAULT = '여보세요?';

const CLONE_GATE_MS = 3500;

const CLONE_RESUME_MS = 1200;

const CLONE_TAIL_GRACE_MS = 1000;

export function useHandsFreeController(opts: {

  enabled: boolean;
  say: (text: string) => Promise<void>;
  getStatsReport: () => Promise<Iterable<[string, Record<string, unknown>]>> | null;
  notifySpeechEnd: () => void;

  speechEngine?: SpeechEngine;

  silenceMs?: number;
  silenceConfig?: Partial<CloneSilenceConfig>;

  confirmMs?: number;

  greeting?: boolean;

  greet?: () => Promise<void>;

  speak?: (text: string) => Promise<void>;

  lastSignal?: import('./avatarCall').SpeechSignal | null;

  greetTimeoutMs?: number;

  fallbackText?: string;
}) {
  const [state, setState] = useState(initHandsFreeState());
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; });

  const sayRef = useRef(opts.say);
  useEffect(() => { sayRef.current = opts.say; });
  const notifyRef = useRef(opts.notifySpeechEnd);
  useEffect(() => { notifyRef.current = opts.notifySpeechEnd; });

  const greetRef = useRef(opts.greet);
  useEffect(() => { greetRef.current = opts.greet; });
  const speakRef = useRef(opts.speak);
  useEffect(() => { speakRef.current = opts.speak; });
  const greetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const greetTimeoutMs = opts.greetTimeoutMs ?? GREET_TIMEOUT_MS_DEFAULT;
  const fallbackText = opts.fallbackText ?? GREETING_FALLBACK_TEXT_DEFAULT;

  const dispatchRef = useRef<(ev: HandsFreeEvent) => void>(() => {});

  const cloneSpokeAtRef = useRef(0);

  const detector = useCloneSilenceDetector({
    getStatsReport: opts.getStatsReport,
    onResponseStart: () => dispatchRef.current({ type: 'CLONE_SPEAKING' }),
    onResponseEnd: () => dispatchRef.current({ type: 'RESPONSE_END' }),
    config: opts.silenceConfig,
  });
  const speech = useSpeechInput({
    engine: opts.speechEngine,

    silenceMs: opts.silenceMs ?? 1500,
    onFinalResult: (text) => {

      const sinceClone = Date.now() - cloneSpokeAtRef.current;
      if (sinceClone < CLONE_GATE_MS) {
        return; 
      }
      dispatchRef.current({ type: 'FINAL_RESULT', text });
    },
  });

  const speechRef = useRef(speech);
  useEffect(() => { speechRef.current = speech; });

  const [sttSuppressed, setSttSuppressed] = useState(false);
  const sttSuppressedRef = useRef(false);

  const cloneTailGraceUntilRef = useRef(0);

  const runEffects = useCallback(
    (effects: HandsFreeEffect[], sayText?: string) => {
      for (const e of effects) {
        switch (e) {
          case 'START_STT':
            sttSuppressedRef.current = false; 
            setSttSuppressed(false);
            void speech.startListening();
            break;
          case 'STOP_STT':
            sttSuppressedRef.current = false;
            setSttSuppressed(false);
            speech.stopListening();
            break;
          case 'SAY':
            if (sayText) {
              sayRef.current(sayText).catch(() => dispatchRef.current({ type: 'RESPONSE_END' }));
            } else {

              dispatchRef.current({ type: 'RESPONSE_END' });
            }
            break;
          case 'START_DETECTOR':
            detector.start();
            break;
          case 'STOP_DETECTOR':
            detector.stop();
            notifyRef.current();
            break;

          case 'GREET':

            if (greetRef.current) {
              greetRef.current().catch(() => dispatchRef.current({ type: 'GREET_TIMEOUT' }));
            } else {
              dispatchRef.current({ type: 'GREET_TIMEOUT' }); 
            }
            if (greetTimerRef.current) clearTimeout(greetTimerRef.current);
            greetTimerRef.current = setTimeout(
              () => dispatchRef.current({ type: 'GREET_TIMEOUT' }), greetTimeoutMs);
            break;
          case 'SPEAK_FALLBACK':

            if (speakRef.current) {
              speakRef.current(fallbackText).catch(() => dispatchRef.current({ type: 'RESPONSE_END' }));
            } else {
              dispatchRef.current({ type: 'RESPONSE_END' });
            }

            if (greetTimerRef.current) clearTimeout(greetTimerRef.current);
            greetTimerRef.current = setTimeout(
              () => dispatchRef.current({ type: 'RESPONSE_END' }), greetTimeoutMs);
            break;
        }
      }
    },
    [speech, detector, greetTimeoutMs, fallbackText],
  );

  const dispatch = useCallback(
    (ev: HandsFreeEvent) => {
      const prev = stateRef.current;
      const { state: next, effects, sayText } = handsFreeReducer(prev, ev);

      const fromSpeakingOrSending =
        prev.phase === 'speaking' || prev.phase === 'sending';
      if (fromSpeakingOrSending && next.phase === 'listening') {
        cloneTailGraceUntilRef.current = Date.now() + CLONE_TAIL_GRACE_MS;
      }

      if (prev.phase === 'greeting' && next.phase === 'speaking') {
        if (greetTimerRef.current) { clearTimeout(greetTimerRef.current); greetTimerRef.current = null; }
      }
      stateRef.current = next;
      setState(next);
      runEffects(effects, sayText);
    },
    [runEffects],
  );

  dispatchRef.current = dispatch;

  const confirmMs = opts.confirmMs ?? 2000;
  useEffect(() => {
    if (state.phase !== 'confirming') return;
    const id = setTimeout(() => dispatchRef.current({ type: 'CONFIRM_SEND' }), confirmMs);
    return () => clearTimeout(id);
  }, [state.phase, state.pendingText, confirmMs]);

  const cancelConfirm = useCallback(() => {
    dispatchRef.current({ type: 'CANCEL_SEND' });
  }, []);

  useEffect(() => {
    dispatchRef.current(
      opts.enabled ? { type: 'CALL_LIVE', greeting: opts.greeting } : { type: 'CALL_ENDED' });
  }, [opts.enabled]); 

  useEffect(() => {
    const sig = opts.lastSignal;
    if (!sig) return;
    if (sig.type === 'speech_start') dispatchRef.current({ type: 'SPEECH_START' });
    else if (sig.type === 'speech_end') dispatchRef.current({ type: 'RESPONSE_END' });
  }, [opts.lastSignal]);

  const getStatsRef = useRef(opts.getStatsReport);
  useEffect(() => { getStatsRef.current = opts.getStatsReport; });
  useEffect(() => {
    if (!opts.enabled) return;
    const id = setInterval(() => {
      const p = getStatsRef.current();
      if (!p) return;
      p.then((report) => {
        const lv = extractCloneAudioLevel(report);
        const now = Date.now();
        const cloneSpeaking = typeof lv === 'number' && lv > CLONE_GATE_LEVEL;
        if (cloneSpeaking) cloneSpokeAtRef.current = now;

        const st = stateRef.current;
        if ((st.phase !== 'listening' && st.phase !== 'confirming') || !st.micOn) return;
        if (cloneSpeaking && !sttSuppressedRef.current) {

          if (now < cloneTailGraceUntilRef.current) {

          } else {
            speechRef.current.stopListening();
            sttSuppressedRef.current = true;
            setSttSuppressed(true); 
          }
        } else if (
          !cloneSpeaking &&
          sttSuppressedRef.current &&
          now - cloneSpokeAtRef.current > CLONE_RESUME_MS
        ) {
          void speechRef.current.startListening();
          sttSuppressedRef.current = false;
          setSttSuppressed(false); 
        }
      }).catch(() => {});
    }, 200);
    return () => clearInterval(id);
  }, [opts.enabled]);

  useEffect(() => {
    if (!opts.enabled) return;
    const id = setInterval(() => {
      const st = stateRef.current;
      if ((st.phase !== 'listening' && st.phase !== 'confirming') || !st.micOn) return;
      if (sttSuppressedRef.current) return; 

      if (!speechRef.current.listening) {
        void speechRef.current.startListening();
      }
    }, 200);
    return () => clearInterval(id);
  }, [opts.enabled]);

  useEffect(() => () => {
    if (greetTimerRef.current) clearTimeout(greetTimerRef.current);
  }, []);

  const toggleMic = useCallback(() => {
    dispatchRef.current(stateRef.current.micOn ? { type: 'MIC_OFF' } : { type: 'MIC_ON' });
  }, []);

  const sttActive = speech.listeningDebounced || sttSuppressed;

  return {
    phase: state.phase,
    micOn: state.micOn,
    pendingText: state.pendingText,
    toggleMic,
    cancelConfirm,
    transcript: speech.transcript,
    interimTranscript: speech.interimTranscript,

    sttActive,
  };
}
