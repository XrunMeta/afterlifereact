

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSpeechInput, type SpeechEngine } from './useSpeechInput';
import { useCloneSilenceDetector } from './useCloneSilenceDetector';
import {
  handsFreeReducer,
  initHandsFreeState,
  IDLE_GREET_DELAYS_MS,
  PENDING_INTERRUPT_FLUSH_QUIET_MS,
  PENDING_INTERRUPT_EXPIRE_MS,
  INTERRUPT_COOLDOWN_MS,
  type HandsFreeEvent,
  type HandsFreeEffect,
} from './handsFree';
import { extractCloneAudioLevel, type CloneSilenceConfig } from './cloneSilence';
import { useTimingConfigStore } from './timingConfig';
import { emitTimingEvent } from './timingEvents';
import { traceDispatch, head20 } from './handsFreeTrace';
import { shouldUpdateLevel } from './voiceBall';
import { ensureQuestionMark } from './questionMark';

const CLONE_GATE_LEVEL = 0.05; 

const RESPONSE_DONE_TAIL_MAX_MS = 5000;

const GREET_TIMEOUT_MS_DEFAULT = 3000;
const GREETING_FALLBACK_TEXT_DEFAULT = '여보세요?';

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

  confirmGate?: boolean;

  signalGating?: boolean;
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

  const pendingDoneAtRef = useRef<number | null>(null);

  const pendingDoneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const releaseNotBeforeRef = useRef(0);

  const activeSeqRef = useRef<number | null>(null);

  const interruptCooldownUntilRef = useRef(0);

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
      if (sinceClone < useTimingConfigStore.getState().echoGateMs) {
        return; 
      }
      emitTimingEvent('vad_endpoint');

      dispatchRef.current({ type: 'FINAL_RESULT', text: ensureQuestionMark(text) });
    },

    onSpeechActivity: () => {
      dispatchRef.current({ type: 'USER_SPEECH_START' });
    },
  });

  const speechRef = useRef(speech);
  useEffect(() => { speechRef.current = speech; });

  const [sttSuppressed, setSttSuppressed] = useState(false);
  const sttSuppressedRef = useRef(false);

  const [cloneAudioLevel, setCloneAudioLevel] = useState(0);

  const cloneAudioLevelRef = useRef(0);

  const cloneTailGraceUntilRef = useRef(0);

  const runEffects = useCallback(
    (effects: HandsFreeEffect[], sayText?: string, saySeq?: number) => {
      for (const e of effects) {
        switch (e) {
          case 'START_STT':
            sttSuppressedRef.current = false; 
            setSttSuppressed(false);
            emitTimingEvent('stt_open');
            void speech.startListening();
            break;
          case 'STOP_STT':
            sttSuppressedRef.current = false;
            setSttSuppressed(false);
            emitTimingEvent('stt_close');
            speech.stopListening();
            dispatchRef.current({ type: 'USER_SPEECH_IDLE' });
            break;
          case 'SAY':

            if (saySeq != null) activeSeqRef.current = saySeq;

            emitTimingEvent('tx', {
              mode: sayText ? 'say' : 'skip', seq: saySeq ?? null, text: head20(sayText), eff: 'SAY',
            });
            if (sayText) {
              sayRef.current(sayText).catch(() => dispatchRef.current({ type: 'RESPONSE_DONE' }));
            } else {
              dispatchRef.current({ type: 'RESPONSE_DONE' });
            }
            break;
          case 'SAY_INTERRUPT':
          case 'SAY_IDLE_GREETING':

            if (saySeq != null) activeSeqRef.current = saySeq;

            interruptCooldownUntilRef.current = Date.now() + INTERRUPT_COOLDOWN_MS;
            emitTimingEvent('timer', { name: 'cooldown', action: 'set', ms: INTERRUPT_COOLDOWN_MS });

            emitTimingEvent('tx', {
              mode: sayText && speakRef.current ? 'speak' : 'skip',
              seq: saySeq ?? null, text: head20(sayText), eff: e,
            });
            if (sayText && speakRef.current) {
              speakRef.current(sayText).catch(() => dispatchRef.current({ type: 'RESPONSE_DONE' }));
            } else {
              dispatchRef.current({ type: 'RESPONSE_DONE' });
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

            emitTimingEvent('tx', {
              mode: greetRef.current ? 'greet' : 'skip', seq: saySeq ?? null, text: '', eff: 'GREET',
            });
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

            emitTimingEvent('tx', {
              mode: speakRef.current ? 'speak' : 'skip', seq: saySeq ?? null,
              text: head20(fallbackText), eff: 'SPEAK_FALLBACK',
            });
            if (speakRef.current) {
              speakRef.current(fallbackText).catch(() => dispatchRef.current({ type: 'RESPONSE_DONE' }));
            } else {
              dispatchRef.current({ type: 'RESPONSE_DONE' });
            }

            if (greetTimerRef.current) clearTimeout(greetTimerRef.current);
            greetTimerRef.current = setTimeout(
              () => dispatchRef.current({ type: 'RESPONSE_DONE' }), greetTimeoutMs);
            break;
        }
      }
    },
    [speech, detector, greetTimeoutMs, fallbackText],
  );

  const clearPendingDone = useCallback((by: 'dispatch' | 'silence' = 'dispatch') => {
    const had = pendingDoneAtRef.current !== null || pendingDoneTimerRef.current !== null;
    pendingDoneAtRef.current = null;
    releaseNotBeforeRef.current = 0;
    if (pendingDoneTimerRef.current) {
      clearTimeout(pendingDoneTimerRef.current);
      pendingDoneTimerRef.current = null;
    }
    if (had) {
      emitTimingEvent('timer', {
        name: 'pendingDone', action: by === 'silence' ? 'fire' : 'clear', by,
      });
    }
  }, []);

  const dispatch = useCallback(
    (ev: HandsFreeEvent) => {

      if (ev.type === 'RESPONSE_DONE' || ev.type === 'RESPONSE_END' || ev.type === 'CALL_ENDED') {
        clearPendingDone();
      }

      if (ev.type === 'CALL_ENDED') {
        interruptCooldownUntilRef.current = 0;
        emitTimingEvent('timer', { name: 'cooldown', action: 'clear', by: 'call_ended' });
      }
      const prev = stateRef.current;
      const { state: next, effects, sayText, saySeq } = handsFreeReducer(prev, ev);

      const fromSpeakingOrSending =
        prev.phase === 'speaking' || prev.phase === 'sending';
      if (fromSpeakingOrSending && next.phase === 'listening') {
        cloneTailGraceUntilRef.current = Date.now() + useTimingConfigStore.getState().cloneTailGraceMs;
      }

      if (prev.phase === 'greeting' && next.phase === 'speaking') {
        if (greetTimerRef.current) { clearTimeout(greetTimerRef.current); greetTimerRef.current = null; }
      }

      traceDispatch(prev, next, ev, effects);
      stateRef.current = next;
      setState(next);
      runEffects(effects, sayText, saySeq);
    },
    [runEffects, clearPendingDone],
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
    if (!opts.signalGating) return;
    if (state.phase !== 'sending' && state.phase !== 'speaking' && state.phase !== 'interrupting') return;
    const ms = useTimingConfigStore.getState().responseDoneTimeoutMs;
    emitTimingEvent('timer', { name: 'signalGatingFallback', action: 'set', ms });
    const id = setTimeout(() => {
      emitTimingEvent('timer', { name: 'signalGatingFallback', action: 'fire' });
      dispatchRef.current({ type: 'RESPONSE_DONE' });
    }, ms);
    return () => {
      clearTimeout(id);
      emitTimingEvent('timer', { name: 'signalGatingFallback', action: 'clear' });
    };
  }, [state.phase, opts.lastSignal, opts.signalGating]);

  useEffect(() => {
    dispatchRef.current(
      opts.enabled
        ? { type: 'CALL_LIVE', greeting: opts.greeting, confirmGate: opts.confirmGate, signalGating: opts.signalGating }
        : { type: 'CALL_ENDED' });
  }, [opts.enabled]); 

  const getStatsRef = useRef(opts.getStatsReport);
  useEffect(() => { getStatsRef.current = opts.getStatsReport; });

  useEffect(() => {
    const sig = opts.lastSignal;
    if (!sig) return;
    if (sig.type === 'speech_start') {
      emitTimingEvent('speech_start');

      emitTimingEvent('rx', {
        sig: 'speech_start', seq: activeSeqRef.current, srvSeq: sig.seq ?? null,
      });
      dispatchRef.current({ type: 'SPEECH_START', seq: activeSeqRef.current ?? undefined });
    }
    else if (sig.type === 'speech_end') {
      emitTimingEvent('speech_end');
      emitTimingEvent('rx', {
        sig: 'speech_end', seq: activeSeqRef.current, srvSeq: sig.seq ?? null,
        remainingMs: sig.remainingMs ?? 0,
      });

      const endSeq = activeSeqRef.current ?? undefined;

      if (getStatsRef.current() === null) {
        dispatchRef.current({ type: 'RESPONSE_DONE', seq: endSeq });
      } else {

        const remainingMs = sig.remainingMs ?? 0;
        releaseNotBeforeRef.current = Date.now() + remainingMs;
        pendingDoneAtRef.current = Date.now();
        if (pendingDoneTimerRef.current) clearTimeout(pendingDoneTimerRef.current);
        emitTimingEvent('timer', {
          name: 'pendingDone', action: 'set', ms: remainingMs + RESPONSE_DONE_TAIL_MAX_MS,
        });
        pendingDoneTimerRef.current = setTimeout(() => {
          pendingDoneTimerRef.current = null;
          pendingDoneAtRef.current = null;
          releaseNotBeforeRef.current = 0;
          emitTimingEvent('timer', { name: 'pendingDone', action: 'fire', by: 'tailMax' });
          dispatchRef.current({ type: 'RESPONSE_DONE', seq: endSeq });
        }, remainingMs + RESPONSE_DONE_TAIL_MAX_MS);
      }
    }

    else if (sig.type === 'speech_text') {
      emitTimingEvent('rx', {
        sig: 'speech_text', seq: activeSeqRef.current, srvSeq: sig.seq ?? null,
      });
    }

  }, [opts.lastSignal]);

  useEffect(() => {
    if (state.phase !== 'listening') return;
    if (state.userSpeaking) return;
    if (state.idleGreetCount >= IDLE_GREET_DELAYS_MS.length) return;
    if (pendingDoneTimerRef.current) return; 
    const wait = Math.max(0, releaseNotBeforeRef.current - Date.now()); 
    const delay = IDLE_GREET_DELAYS_MS[state.idleGreetCount] + wait;
    emitTimingEvent('timer', { name: 'watchdog', action: 'set', ms: delay });
    const id = setTimeout(() => {
      emitTimingEvent('timer', { name: 'watchdog', action: 'fire' });
      dispatchRef.current({ type: 'IDLE_TIMEOUT' });
    }, delay);
    return () => { clearTimeout(id); emitTimingEvent('timer', { name: 'watchdog', action: 'clear' }); };
  }, [state.phase, state.userSpeaking, state.idleGreetCount]);

  useEffect(() => {
    if (!state.pendingInterrupt) return;
    if (state.phase !== 'listening') return;
    if (state.userSpeaking) return;
    if (state.activeSeq !== null) return;
    if (!state.micOn) return;
    if (pendingDoneTimerRef.current) return; 
    const wait = Math.max(0, releaseNotBeforeRef.current - Date.now()); 
    emitTimingEvent('timer', {
      name: 'interruptFlush', action: 'set', ms: PENDING_INTERRUPT_FLUSH_QUIET_MS + wait,
    });
    const id = setTimeout(
      () => {
        emitTimingEvent('timer', { name: 'interruptFlush', action: 'fire' });
        dispatchRef.current({ type: 'INTERRUPT_FLUSH' });
      },
      PENDING_INTERRUPT_FLUSH_QUIET_MS + wait,
    );
    return () => {
      clearTimeout(id);
      emitTimingEvent('timer', { name: 'interruptFlush', action: 'clear' });
    };
  }, [state.pendingInterrupt, state.phase, state.userSpeaking, state.activeSeq, state.micOn]);

  useEffect(() => {
    const pi = state.pendingInterrupt;
    if (!pi) return;
    emitTimingEvent('timer', {
      name: 'interruptExpire', action: 'set', ms: PENDING_INTERRUPT_EXPIRE_MS,
    });
    const id = setTimeout(
      () => {
        emitTimingEvent('timer', { name: 'interruptExpire', action: 'fire' });
        dispatchRef.current({ type: 'INTERRUPT_EXPIRED', faceKey: pi.faceKey });
      },
      PENDING_INTERRUPT_EXPIRE_MS,
    );
    return () => {
      clearTimeout(id);
      emitTimingEvent('timer', { name: 'interruptExpire', action: 'clear' });
    };
  }, [state.pendingInterrupt]);

  useEffect(() => {
    if (!opts.enabled) {

      cloneAudioLevelRef.current = 0;
      setCloneAudioLevel(0);
      return;
    }
    const id = setInterval(() => {
      const p = getStatsRef.current();
      if (!p) return;
      p.then((report) => {
        const lv = extractCloneAudioLevel(report);

        const nextCloneLevel = typeof lv === 'number' ? Math.min(1, Math.max(0, lv)) : 0;
        if (shouldUpdateLevel(cloneAudioLevelRef.current, nextCloneLevel)) {
          cloneAudioLevelRef.current = nextCloneLevel;
          setCloneAudioLevel(nextCloneLevel);
        }
        const now = Date.now();
        const cloneSpeaking = typeof lv === 'number' && lv > CLONE_GATE_LEVEL;
        if (cloneSpeaking) cloneSpokeAtRef.current = now;

        if (
          pendingDoneAtRef.current !== null &&
          !cloneSpeaking &&
          now - cloneSpokeAtRef.current > useTimingConfigStore.getState().cloneResumeMs &&
          now >= releaseNotBeforeRef.current
        ) {
          clearPendingDone('silence');
          dispatchRef.current({ type: 'RESPONSE_DONE' });
        }

        const st = stateRef.current;
        if ((st.phase !== 'listening' && st.phase !== 'confirming') || !st.micOn) return;
        if (cloneSpeaking && !sttSuppressedRef.current) {

          if (now < cloneTailGraceUntilRef.current) {

          } else {
            speechRef.current.stopListening();
            sttSuppressedRef.current = true;
            setSttSuppressed(true); 

            dispatchRef.current({ type: 'USER_SPEECH_IDLE' });
            emitTimingEvent('suppress_on');
            emitTimingEvent('stt_close');
          }
        } else if (
          !cloneSpeaking &&
          sttSuppressedRef.current &&
          now - cloneSpokeAtRef.current > useTimingConfigStore.getState().cloneResumeMs
        ) {
          void speechRef.current.startListening();
          sttSuppressedRef.current = false;
          setSttSuppressed(false); 

          dispatchRef.current({ type: 'USER_SPEECH_IDLE' });
          emitTimingEvent('suppress_off');
          emitTimingEvent('stt_open');
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
    if (pendingDoneTimerRef.current) clearTimeout(pendingDoneTimerRef.current);
    releaseNotBeforeRef.current = 0; 
  }, []);

  const toggleMic = useCallback(() => {
    dispatchRef.current(stateRef.current.micOn ? { type: 'MIC_OFF' } : { type: 'MIC_ON' });
  }, []);

  const notifyFaceInterrupt = useCallback((text: string, faceKey: string) => {

    if (Date.now() < interruptCooldownUntilRef.current) {
      emitTimingEvent('interrupt', { act: 'cooldown_block', faceKey, deferredTurns: 0 });
      return;
    }
    dispatchRef.current({ type: 'FACE_INTERRUPT', text, faceKey });
  }, []);

  const devForceListen = useCallback(() => {
    sttSuppressedRef.current = false;
    setSttSuppressed(false);
    cloneTailGraceUntilRef.current = 0;
    emitTimingEvent('dev_listen_now');
    emitTimingEvent('stt_open');

    dispatchRef.current({ type: 'USER_SPEECH_IDLE' });
    void speechRef.current.startListening();
  }, []);

  const sttActive = speech.listeningDebounced || sttSuppressed;

  return {
    phase: state.phase,
    micOn: state.micOn,
    pendingText: state.pendingText,
    toggleMic,
    cancelConfirm,

    notifyFaceInterrupt,
    transcript: speech.transcript,
    interimTranscript: speech.interimTranscript,

    sttActive,

    cloneSuppressed: sttSuppressed,

    devForceListen,

    micLevel: speech.micLevel,

    cloneAudioLevel,
  };
}
