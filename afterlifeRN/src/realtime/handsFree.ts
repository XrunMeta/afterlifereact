

export type HandsFreePhase =
  | 'idle' | 'greeting' | 'listening' | 'confirming' | 'sending' | 'speaking' | 'paused';

export interface HandsFreeState {
  phase: HandsFreePhase;
  micOn: boolean;

  pendingText: string;

  confirmGate: boolean;

  signalGating: boolean;
}

export type HandsFreeEvent =
  | { type: 'CALL_LIVE'; greeting?: boolean; confirmGate?: boolean; signalGating?: boolean }
  | { type: 'SPEECH_START' }
  | { type: 'GREET_TIMEOUT' }
  | { type: 'FINAL_RESULT'; text: string }
  | { type: 'CONFIRM_SEND' }
  | { type: 'CANCEL_SEND' }
  | { type: 'CLONE_SPEAKING' }
  | { type: 'RESPONSE_END' }
  | { type: 'RESPONSE_DONE' }
  | { type: 'MIC_OFF' }
  | { type: 'MIC_ON' }
  | { type: 'CALL_ENDED' };

export type HandsFreeEffect =
  | 'START_STT' | 'STOP_STT' | 'SAY' | 'GREET' | 'SPEAK_FALLBACK'
  | 'START_DETECTOR' | 'STOP_DETECTOR';

export interface HandsFreeResult {
  state: HandsFreeState;
  effects: HandsFreeEffect[];
  sayText?: string;
}

export const initHandsFreeState = (): HandsFreeState => ({
  phase: 'idle', micOn: true, pendingText: '', confirmGate: false, signalGating: false,
});

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

    case 'SPEECH_START':

      if (state.phase !== 'greeting' && state.phase !== 'sending') return { state, effects: [] };
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
      if (!state.confirmGate) {

        return {
          state: { ...state, phase: 'sending', pendingText: text },
          effects: ['STOP_STT', 'SAY', 'START_DETECTOR'],
          sayText: text,
        };
      }
      const pendingText =
        state.phase === 'confirming' && state.pendingText
          ? `${state.pendingText} ${text}`.trim()
          : text;
      return { state: { ...state, phase: 'confirming', pendingText }, effects: [] };
    }

    case 'CONFIRM_SEND': {
      if (state.phase !== 'confirming') return { state, effects: [] };
      const text = state.pendingText.trim();

      if (!text) return { state: { ...state, phase: 'listening', pendingText: '' }, effects: [] };
      return {
        state: { ...state, phase: 'sending', pendingText: '' },
        effects: ['STOP_STT', 'SAY', 'START_DETECTOR'],
        sayText: text,
      };
    }

    case 'CANCEL_SEND':
      if (state.phase !== 'confirming') return { state, effects: [] };

      return { state: { ...state, phase: 'listening', pendingText: '' }, effects: [] };

    case 'CLONE_SPEAKING':
      if (state.phase !== 'sending') return { state, effects: [] };
      return { state: { ...state, phase: 'speaking' }, effects: [] };

    case 'RESPONSE_END':

      if (state.signalGating) return { state, effects: [] };

      if (state.phase !== 'speaking' && state.phase !== 'sending' && state.phase !== 'greeting') {
        return { state, effects: [] };
      }

      if (!state.micOn) return { state: { ...state, phase: 'paused', pendingText: '' }, effects: ['STOP_DETECTOR'] };
      return { state: { ...state, phase: 'listening', pendingText: '' }, effects: ['STOP_DETECTOR', 'START_STT'] };

    case 'RESPONSE_DONE':

      if (state.phase !== 'speaking' && state.phase !== 'sending' && state.phase !== 'greeting') {
        return { state, effects: [] };
      }
      if (!state.micOn) return { state: { ...state, phase: 'paused', pendingText: '' }, effects: ['STOP_DETECTOR'] };
      return { state: { ...state, phase: 'listening', pendingText: '' }, effects: ['STOP_DETECTOR', 'START_STT'] };

    case 'MIC_OFF':
      if (!state.micOn) return { state, effects: [] };
      return { state: { phase: 'paused', micOn: false, pendingText: '', confirmGate: state.confirmGate, signalGating: state.signalGating }, effects: ['STOP_STT', 'STOP_DETECTOR'] };

    case 'MIC_ON':
      if (state.micOn) return { state, effects: [] };
      return { state: { phase: 'listening', micOn: true, pendingText: '', confirmGate: state.confirmGate, signalGating: state.signalGating }, effects: ['START_STT'] };

    case 'CALL_ENDED':
      return { state: { phase: 'idle', micOn: true, pendingText: '', confirmGate: false, signalGating: false }, effects: ['STOP_STT', 'STOP_DETECTOR'] };

    default:
      return { state, effects: [] };
  }
}
