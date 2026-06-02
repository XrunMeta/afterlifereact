

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSpeechInput, type SpeechEngine } from './useSpeechInput';
import { useCloneSilenceDetector } from './useCloneSilenceDetector';
import {
  handsFreeReducer,
  initHandsFreeState,
  type HandsFreeEvent,
  type HandsFreeEffect,
} from './handsFree';
import { type CloneSilenceConfig } from './cloneSilence';

export function useHandsFreeController(opts: {

  enabled: boolean;
  say: (text: string) => Promise<void>;
  getStatsReport: () => Promise<Iterable<[string, Record<string, unknown>]>> | null;
  notifySpeechEnd: () => void;

  speechEngine?: SpeechEngine;
  silenceConfig?: Partial<CloneSilenceConfig>;
}) {
  const [state, setState] = useState(initHandsFreeState());
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; });

  const sayRef = useRef(opts.say);
  useEffect(() => { sayRef.current = opts.say; });
  const notifyRef = useRef(opts.notifySpeechEnd);
  useEffect(() => { notifyRef.current = opts.notifySpeechEnd; });

  const dispatchRef = useRef<(ev: HandsFreeEvent) => void>(() => {});

  const detector = useCloneSilenceDetector({
    getStatsReport: opts.getStatsReport,
    onResponseEnd: () => dispatchRef.current({ type: 'RESPONSE_END' }),
    config: opts.silenceConfig,
  });
  const speech = useSpeechInput({
    engine: opts.speechEngine,
    onFinalResult: (text) => dispatchRef.current({ type: 'FINAL_RESULT', text }),
  });

  const runEffects = useCallback(
    (effects: HandsFreeEffect[], sayText?: string) => {
      for (const e of effects) {
        switch (e) {
          case 'START_STT':
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

  useEffect(() => {
    dispatchRef.current(opts.enabled ? { type: 'CALL_LIVE' } : { type: 'CALL_ENDED' });
  }, [opts.enabled]);

  const toggleMic = useCallback(() => {
    dispatchRef.current(stateRef.current.micOn ? { type: 'MIC_OFF' } : { type: 'MIC_ON' });
  }, []);

  return {
    phase: state.phase,
    micOn: state.micOn,
    toggleMic,
    transcript: speech.transcript,
    interimTranscript: speech.interimTranscript,
  };
}
