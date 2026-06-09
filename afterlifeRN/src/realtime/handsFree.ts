

export type HandsFreePhase =
  | 'idle' | 'listening' | 'confirming' | 'sending' | 'speaking' | 'paused';

export interface HandsFreeState {
  phase: HandsFreePhase;
  micOn: boolean;

  pendingText: string;
}

export type HandsFreeEvent =
  | { type: 'CALL_LIVE' }
  | { type: 'FINAL_RESULT'; text: string }
  | { type: 'CONFIRM_SEND' }
  | { type: 'CANCEL_SEND' }
  | { type: 'CLONE_SPEAKING' }
  | { type: 'RESPONSE_END' }
  | { type: 'MIC_OFF' }
  | { type: 'MIC_ON' }
  | { type: 'CALL_ENDED' };

export type HandsFreeEffect =
  | 'START_STT' | 'STOP_STT' | 'SAY' | 'START_DETECTOR' | 'STOP_DETECTOR';

export interface HandsFreeResult {
  state: HandsFreeState;
  effects: HandsFreeEffect[];
  sayText?: string;
}

export const initHandsFreeState = (): HandsFreeState => ({
  phase: 'idle', micOn: true, pendingText: '',
});

export function handsFreeReducer(state: HandsFreeState, ev: HandsFreeEvent): HandsFreeResult {
  switch (ev.type) {
    case 'CALL_LIVE':
      if (!state.micOn) return { state: { ...state, phase: 'paused' }, effects: [] };
      if (state.phase !== 'idle') return { state, effects: [] };
      return { state: { ...state, phase: 'listening' }, effects: ['START_STT'] };

    case 'FINAL_RESULT': {

      if (state.phase !== 'listening' && state.phase !== 'confirming') {
        return { state, effects: [] };
      }
      const text = ev.text.trim();
      if (!text) return { state, effects: [] };
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

      if (state.phase !== 'speaking' && state.phase !== 'sending') return { state, effects: [] };
      if (!state.micOn) return { state: { ...state, phase: 'paused' }, effects: ['STOP_DETECTOR'] };
      return { state: { ...state, phase: 'listening' }, effects: ['STOP_DETECTOR', 'START_STT'] };

    case 'MIC_OFF':
      if (!state.micOn) return { state, effects: [] };
      return { state: { phase: 'paused', micOn: false, pendingText: '' }, effects: ['STOP_STT', 'STOP_DETECTOR'] };

    case 'MIC_ON':
      if (state.micOn) return { state, effects: [] };
      return { state: { phase: 'listening', micOn: true, pendingText: '' }, effects: ['START_STT'] };

    case 'CALL_ENDED':
      return { state: { phase: 'idle', micOn: true, pendingText: '' }, effects: ['STOP_STT', 'STOP_DETECTOR'] };

    default:
      return { state, effects: [] };
  }
}
