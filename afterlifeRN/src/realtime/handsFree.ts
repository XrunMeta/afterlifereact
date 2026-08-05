

export type HandsFreePhase =
  | 'idle' | 'greeting' | 'listening' | 'confirming' | 'sending' | 'speaking' | 'paused'
  | 'interrupting';

export const IDLE_GREET_DELAYS_MS = [30000, 60000];

export const IDLE_GREET_TEXT = '안녕하세요, 듣고 있어요';

export interface HandsFreeState {
  phase: HandsFreePhase;
  micOn: boolean;

  pendingText: string;

  confirmGate: boolean;

  signalGating: boolean;

  activeSeq: number | null;

  nextSeq: number;

  userSpeaking: boolean;

  pendingInterrupt: { text: string; faceKey: string; deferredTurns: number } | null;

  idleGreetCount: number;
}

export type HandsFreeEvent =
  | { type: 'CALL_LIVE'; greeting?: boolean; confirmGate?: boolean; signalGating?: boolean }
  | { type: 'SPEECH_START'; seq?: number }
  | { type: 'GREET_TIMEOUT' }
  | { type: 'FINAL_RESULT'; text: string }
  | { type: 'CONFIRM_SEND' }
  | { type: 'CANCEL_SEND' }
  | { type: 'CLONE_SPEAKING' }
  | { type: 'RESPONSE_END' }
  | { type: 'RESPONSE_DONE'; seq?: number }
  | { type: 'MIC_OFF' }
  | { type: 'MIC_ON' }
  | { type: 'CALL_ENDED' }
  | { type: 'USER_SPEECH_START' }
  | { type: 'USER_SPEECH_IDLE' }
  | { type: 'FACE_INTERRUPT'; text: string; faceKey: string }
  | { type: 'IDLE_TIMEOUT' };

export type HandsFreeEffect =
  | 'START_STT' | 'STOP_STT' | 'SAY' | 'GREET' | 'SPEAK_FALLBACK'
  | 'START_DETECTOR' | 'STOP_DETECTOR' | 'SAY_INTERRUPT' | 'SAY_IDLE_GREETING';

export interface HandsFreeResult {
  state: HandsFreeState;
  effects: HandsFreeEffect[];
  sayText?: string;

  saySeq?: number;
}

export const initHandsFreeState = (): HandsFreeState => ({
  phase: 'idle', micOn: true, pendingText: '', confirmGate: false, signalGating: false,
  activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null, idleGreetCount: 0,
});

function flushOrListen(state: HandsFreeState): HandsFreeResult {
  if (!state.micOn) {

    return {
      state: { ...state, phase: 'paused', pendingText: '', activeSeq: null, userSpeaking: false, pendingInterrupt: null },
      effects: ['STOP_DETECTOR'],
    };
  }
  const pi = state.pendingInterrupt;
  if (pi) {
    const seq = state.nextSeq;
    return {
      state: {
        ...state, phase: 'interrupting', pendingText: '', userSpeaking: false,
        activeSeq: seq, nextSeq: seq + 1, pendingInterrupt: null,
      },
      effects: ['SAY_INTERRUPT', 'START_DETECTOR'],
      sayText: pi.text,
      saySeq: seq,
    };
  }
  return {
    state: { ...state, phase: 'listening', pendingText: '', activeSeq: null, userSpeaking: false },
    effects: ['STOP_DETECTOR', 'START_STT'],
  };
}

export function handsFreeReducer(state: HandsFreeState, ev: HandsFreeEvent): HandsFreeResult {
  switch (ev.type) {
    case 'CALL_LIVE': {

      const confirmGate = ev.confirmGate ?? state.confirmGate;
      const signalGating = ev.signalGating ?? state.signalGating;
      if (!state.micOn) return { state: { ...state, phase: 'paused', confirmGate, signalGating }, effects: [] };
      if (state.phase !== 'idle') return { state: { ...state, confirmGate, signalGating }, effects: [] };

      if (ev.greeting) return { state: { ...state, phase: 'greeting', confirmGate, signalGating }, effects: ['GREET'] };
      return { state: { ...state, phase: 'listening', confirmGate, signalGating }, effects: ['START_STT'] };
    }

    case 'USER_SPEECH_START':

      if (state.phase !== 'listening' && state.phase !== 'confirming') return { state, effects: [] };
      if (state.userSpeaking) return { state, effects: [] };
      return { state: { ...state, userSpeaking: true }, effects: [] };

    case 'USER_SPEECH_IDLE':
      if (!state.userSpeaking) return { state, effects: [] };
      return { state: { ...state, userSpeaking: false }, effects: [] };

    case 'SPEECH_START':

      if (state.phase !== 'greeting' && state.phase !== 'sending' && state.phase !== 'interrupting') {
        return { state, effects: [] };
      }

      if (ev.seq != null && state.activeSeq != null && ev.seq !== state.activeSeq) {
        return { state, effects: [] };
      }

      if (state.phase === 'interrupting') return { state, effects: [] };
      return { state: { ...state, phase: 'speaking' }, effects: [] };

    case 'GREET_TIMEOUT':

      if (state.phase !== 'greeting') return { state, effects: [] };
      return { state, effects: ['SPEAK_FALLBACK'] };

    case 'FINAL_RESULT': {

      if (state.phase !== 'listening' && state.phase !== 'confirming') {
        return { state, effects: [] };
      }
      const text = ev.text.trim();
      if (!text) return { state, effects: [] };

      const pi = state.pendingInterrupt;
      const nextPending =
        pi == null ? null : pi.deferredTurns + 1 >= 2 ? null : { ...pi, deferredTurns: pi.deferredTurns + 1 };
      if (!state.confirmGate) {

        const seq = state.nextSeq;
        return {
          state: {
            ...state, phase: 'sending', pendingText: text, activeSeq: seq, nextSeq: seq + 1, userSpeaking: false,
            pendingInterrupt: nextPending, idleGreetCount: 0,
          },
          effects: ['STOP_STT', 'SAY', 'START_DETECTOR'],
          sayText: text,
          saySeq: seq,
        };
      }
      const pendingText =
        state.phase === 'confirming' && state.pendingText
          ? `${state.pendingText} ${text}`.trim()
          : text;
      return {
        state: { ...state, phase: 'confirming', pendingText, userSpeaking: false, pendingInterrupt: nextPending, idleGreetCount: 0 },
        effects: [],
      };
    }

    case 'CONFIRM_SEND': {
      if (state.phase !== 'confirming') return { state, effects: [] };
      const text = state.pendingText.trim();

      if (!text) return { state: { ...state, phase: 'listening', pendingText: '', userSpeaking: false }, effects: [] };
      const seq = state.nextSeq;
      return {
        state: { ...state, phase: 'sending', pendingText: '', activeSeq: seq, nextSeq: seq + 1, userSpeaking: false },
        effects: ['STOP_STT', 'SAY', 'START_DETECTOR'],
        sayText: text,
        saySeq: seq,
      };
    }

    case 'CANCEL_SEND':
      if (state.phase !== 'confirming') return { state, effects: [] };

      return { state: { ...state, phase: 'listening', pendingText: '', userSpeaking: false }, effects: [] };

    case 'CLONE_SPEAKING':
      if (state.phase !== 'sending') return { state, effects: [] };
      return { state: { ...state, phase: 'speaking' }, effects: [] };

    case 'RESPONSE_END':

      if (state.signalGating) return { state, effects: [] };

      if (state.phase !== 'speaking' && state.phase !== 'sending' && state.phase !== 'greeting'
        && state.phase !== 'interrupting') {
        return { state, effects: [] };
      }

      return flushOrListen(state);

    case 'RESPONSE_DONE':

      if (state.phase !== 'speaking' && state.phase !== 'sending' && state.phase !== 'greeting'
        && state.phase !== 'interrupting') {
        return { state, effects: [] };
      }

      if (ev.seq != null && state.activeSeq != null && ev.seq !== state.activeSeq) {
        return { state, effects: [] };
      }

      return flushOrListen(state);

    case 'MIC_OFF':
      if (!state.micOn) return { state, effects: [] };
      return {
        state: { phase: 'paused', micOn: false, pendingText: '', confirmGate: state.confirmGate, signalGating: state.signalGating, activeSeq: null, nextSeq: state.nextSeq, userSpeaking: false, pendingInterrupt: null, idleGreetCount: state.idleGreetCount },
        effects: ['STOP_STT', 'STOP_DETECTOR'],
      };

    case 'MIC_ON':
      if (state.micOn) return { state, effects: [] };
      return {
        state: { phase: 'listening', micOn: true, pendingText: '', confirmGate: state.confirmGate, signalGating: state.signalGating, activeSeq: null, nextSeq: state.nextSeq, userSpeaking: false, pendingInterrupt: null, idleGreetCount: state.idleGreetCount },
        effects: ['START_STT'],
      };

    case 'FACE_INTERRUPT': {

      if (state.phase === 'idle' || state.phase === 'paused') return { state, effects: [] };
      const canSayNow = state.phase === 'listening' && !state.userSpeaking;
      if (!canSayNow) {

        if (state.pendingInterrupt?.faceKey === ev.faceKey) return { state, effects: [] };
        return {
          state: { ...state, pendingInterrupt: { text: ev.text, faceKey: ev.faceKey, deferredTurns: 0 } },
          effects: [],
        };
      }
      const seq = state.nextSeq;
      return {
        state: {
          ...state, phase: 'interrupting', pendingText: '', userSpeaking: false,
          activeSeq: seq, nextSeq: seq + 1, pendingInterrupt: null,
        },
        effects: ['STOP_STT', 'SAY_INTERRUPT', 'START_DETECTOR'],
        sayText: ev.text,
        saySeq: seq,
      };
    }

    case 'IDLE_TIMEOUT': {

      if (state.phase !== 'listening') return { state, effects: [] };
      if (state.activeSeq !== null) return { state, effects: [] };
      if (state.userSpeaking) return { state, effects: [] };
      if (!state.micOn) return { state, effects: [] };
      if (state.idleGreetCount >= IDLE_GREET_DELAYS_MS.length) return { state, effects: [] };
      const seq = state.nextSeq;
      return {
        state: {
          ...state, phase: 'interrupting', pendingText: '',
          activeSeq: seq, nextSeq: seq + 1, idleGreetCount: state.idleGreetCount + 1,
        },
        effects: ['STOP_STT', 'SAY_IDLE_GREETING', 'START_DETECTOR'],
        sayText: IDLE_GREET_TEXT,
        saySeq: seq,
      };
    }

    case 'CALL_ENDED':
      return {
        state: { ...initHandsFreeState(), nextSeq: state.nextSeq },
        effects: ['STOP_STT', 'STOP_DETECTOR'],
      };

    default:
      return { state, effects: [] };
  }
}
