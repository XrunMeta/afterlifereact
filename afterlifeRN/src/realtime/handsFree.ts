

export type HandsFreePhase = 'idle' | 'listening' | 'speaking' | 'paused';

export interface HandsFreeState {
  phase: HandsFreePhase;
  micOn: boolean;
}

export type HandsFreeEvent =
  | { type: 'CALL_LIVE' }
  | { type: 'FINAL_RESULT'; text: string }
  | { type: 'RESPONSE_END' }
  | { type: 'MIC_OFF' }
  | { type: 'MIC_ON' }
  | { type: 'CALL_ENDED' };

export type HandsFreeEffect =
  | 'START_STT'
  | 'STOP_STT'
  | 'SAY'
  | 'START_DETECTOR'
  | 'STOP_DETECTOR';

export interface HandsFreeResult {
  state: HandsFreeState;
  effects: HandsFreeEffect[];
  sayText?: string;
}

export const initHandsFreeState = (): HandsFreeState => ({ phase: 'idle', micOn: true });

export function handsFreeReducer(state: HandsFreeState, ev: HandsFreeEvent): HandsFreeResult {
  switch (ev.type) {
    case 'CALL_LIVE':
      if (!state.micOn) return { state: { ...state, phase: 'paused' }, effects: [] };

      if (state.phase !== 'idle') return { state, effects: [] };
      return { state: { ...state, phase: 'listening' }, effects: ['START_STT'] };

    case 'FINAL_RESULT': {
      if (state.phase !== 'listening') return { state, effects: [] };
      const text = ev.text.trim();
      if (!text) return { state, effects: [] };
      return {
        state: { ...state, phase: 'speaking' },
        effects: ['STOP_STT', 'SAY', 'START_DETECTOR'],
        sayText: text,
      };
    }

    case 'RESPONSE_END':
      if (state.phase !== 'speaking') return { state, effects: [] };
      if (!state.micOn) return { state: { ...state, phase: 'paused' }, effects: ['STOP_DETECTOR'] };
      return { state: { ...state, phase: 'listening' }, effects: ['STOP_DETECTOR', 'START_STT'] };

    case 'MIC_OFF':

      if (!state.micOn) return { state, effects: [] };
      return { state: { phase: 'paused', micOn: false }, effects: ['STOP_STT', 'STOP_DETECTOR'] };

    case 'MIC_ON':
      if (state.micOn) return { state, effects: [] };
      return { state: { phase: 'listening', micOn: true }, effects: ['START_STT'] };

    case 'CALL_ENDED':

      return { state: { phase: 'idle', micOn: true }, effects: ['STOP_STT', 'STOP_DETECTOR'] };

    default:
      return { state, effects: [] };
  }
}
