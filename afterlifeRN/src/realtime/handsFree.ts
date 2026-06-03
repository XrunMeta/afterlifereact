

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

export const v_3075fa = (): HandsFreeState => ({ phase: 'idle', micOn: true });

export function v_6920f0(v_b6e533, v_1d299c): HandsFreeResult {
  switch (v_1d299c.type) {
    case 'CALL_LIVE':
      if (!v_b6e533.micOn) return { state: { ...v_b6e533, phase: 'paused' }, effects: [] };

      if (v_b6e533.phase !== 'idle') return { state: v_b6e533, effects: [] };
      return { state: { ...v_b6e533, phase: 'listening' }, effects: ['START_STT'] };

    case 'FINAL_RESULT': {
      if (v_b6e533.phase !== 'listening') return { state: v_b6e533, effects: [] };
      const v_9b6134 = v_1d299c.text.trim();
      if (!v_9b6134) return { state: v_b6e533, effects: [] };
      return {
        state: { ...v_b6e533, phase: 'speaking' },
        effects: ['STOP_STT', 'SAY', 'START_DETECTOR'],
        sayText: v_9b6134,
      };
    }

    case 'RESPONSE_END':
      if (v_b6e533.phase !== 'speaking') return { state: v_b6e533, effects: [] };
      if (!v_b6e533.micOn) return { state: { ...v_b6e533, phase: 'paused' }, effects: ['STOP_DETECTOR'] };
      return { state: { ...v_b6e533, phase: 'listening' }, effects: ['STOP_DETECTOR', 'START_STT'] };

    case 'MIC_OFF':

      if (!v_b6e533.micOn) return { state: v_b6e533, effects: [] };
      return { state: { phase: 'paused', micOn: false }, effects: ['STOP_STT', 'STOP_DETECTOR'] };

    case 'MIC_ON':
      if (v_b6e533.micOn) return { state: v_b6e533, effects: [] };
      return { state: { phase: 'listening', micOn: true }, effects: ['START_STT'] };

    case 'CALL_ENDED':

      return { state: { phase: 'idle', micOn: true }, effects: ['STOP_STT', 'STOP_DETECTOR'] };

    default:
      return { state: v_b6e533, effects: [] };
  }
}
