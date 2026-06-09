

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

const CLONE_GATE_MS = 3500;

const CLONE_RESUME_MS = 1200;

export function useHandsFreeController(opts: {

  enabled: boolean;
  say: (text: string) => Promise<void>;
  getStatsReport: () => Promise<Iterable<[string, Record<string, unknown>]>> | null;
  notifySpeechEnd: () => void;

  speechEngine?: SpeechEngine;

  silenceMs?: number;
  silenceConfig?: Partial<CloneSilenceConfig>;

  confirmMs?: number;
}) {
  const [state, setState] = useState(initHandsFreeState());
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; });

  const sayRef = useRef(opts.say);
  useEffect(() => { sayRef.current = opts.say; });
  const notifyRef = useRef(opts.notifySpeechEnd);
  useEffect(() => { notifyRef.current = opts.notifySpeechEnd; });

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

  const sttSuppressedRef = useRef(false);

  const runEffects = useCallback(
    (effects: HandsFreeEffect[], sayText?: string) => {
      for (const e of effects) {
        switch (e) {
          case 'START_STT':
            sttSuppressedRef.current = false; 
            void speech.startListening();
            break;
          case 'STOP_STT':
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
        }
      }
    },
    [speech, detector],
  );

  const dispatch = useCallback(
    (ev: HandsFreeEvent) => {
      const { state: next, effects, sayText } = handsFreeReducer(stateRef.current, ev);
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
    dispatchRef.current(opts.enabled ? { type: 'CALL_LIVE' } : { type: 'CALL_ENDED' });
  }, [opts.enabled]);

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
          speechRef.current.stopListening();
          sttSuppressedRef.current = true;
        } else if (
          !cloneSpeaking &&
          sttSuppressedRef.current &&
          now - cloneSpokeAtRef.current > CLONE_RESUME_MS
        ) {
          void speechRef.current.startListening();
          sttSuppressedRef.current = false;
        }
      }).catch(() => {});
    }, 200);
    return () => clearInterval(id);
  }, [opts.enabled]);

  const toggleMic = useCallback(() => {
    dispatchRef.current(stateRef.current.micOn ? { type: 'MIC_OFF' } : { type: 'MIC_ON' });
  }, []);

  return {
    phase: state.phase,
    micOn: state.micOn,
    pendingText: state.pendingText,
    toggleMic,
    cancelConfirm,
    transcript: speech.transcript,
    interimTranscript: speech.interimTranscript,
  };
}
