

export type HandsFreePhase =
  | 'idle' | 'greeting' | 'listening' | 'confirming' | 'sending' | 'speaking' | 'paused';

export interface HandsFreeState {
  phase: HandsFreePhase;
  micOn: boolean;

  pendingText: string;

  confirmGate: boolean;
}

export type HandsFreeEvent =
  | { type: 'CALL_LIVE'; greeting?: boolean; confirmGate?: boolean }
  | { type: 'SPEECH_START' }
  | { type: 'GREET_TIMEOUT' }
  | { type: 'FINAL_RESULT'; text: string }
  | { type: 'CONFIRM_SEND' }
  | { type: 'CANCEL_SEND' }
  | { type: 'CLONE_SPEAKING' }
  | { type: 'RESPONSE_END' }
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

export const v_3075fa = (): HandsFreeState => ({
  phase: 'idle', micOn: true, pendingText: '', confirmGate: false,
});

export function v_6920f0(v_b6e533, v_1d299c): HandsFreeResult {
  switch (v_1d299c.type) {
    case 'CALL_LIVE': {

      const v_c6928f = v_1d299c.confirmGate ?? v_b6e533.confirmGate;
      if (!v_b6e533.micOn) return { state: { ...v_b6e533, phase: 'paused', confirmGate: v_c6928f }, effects: [] };
      if (v_b6e533.phase !== 'idle') return { state: { ...v_b6e533, confirmGate: v_c6928f }, effects: [] };

      if (v_1d299c.greeting) return { state: { ...v_b6e533, phase: 'greeting', confirmGate: v_c6928f }, effects: ['GREET'] };
      return { state: { ...v_b6e533, phase: 'listening', confirmGate: v_c6928f }, effects: ['START_STT'] };
    }

    case 'SPEECH_START':

      if (v_b6e533.phase !== 'greeting') return { state: v_b6e533, effects: [] };
      return { state: { ...v_b6e533, phase: 'speaking' }, effects: [] };

    case 'GREET_TIMEOUT':

      if (v_b6e533.phase !== 'greeting') return { state: v_b6e533, effects: [] };
      return { state: v_b6e533, effects: ['SPEAK_FALLBACK'] };

    case 'FINAL_RESULT': {

      if (v_b6e533.phase !== 'listening' && v_b6e533.phase !== 'confirming') {
        return { state: v_b6e533, effects: [] };
      }
      const v_9b6134 = v_1d299c.text.trim();
      if (!v_9b6134) return { state: v_b6e533, effects: [] };
      if (!v_b6e533.confirmGate) {

        return {
          state: { ...v_b6e533, phase: 'sending', pendingText: v_9b6134 },
          effects: ['STOP_STT', 'SAY', 'START_DETECTOR'],
          sayText: v_9b6134,
        };
      }
      const v_def12c =
        v_b6e533.phase === 'confirming' && v_b6e533.pendingText
          ? `${v_b6e533.pendingText} ${v_9b6134}`.trim()
          : v_9b6134;
      return { state: { ...v_b6e533, phase: 'confirming', pendingText: v_def12c }, effects: [] };
    }

    case 'CONFIRM_SEND': {
      if (v_b6e533.phase !== 'confirming') return { state: v_b6e533, effects: [] };
      const v_9b6134 = v_b6e533.pendingText.trim();

      if (!v_9b6134) return { state: { ...v_b6e533, phase: 'listening', pendingText: '' }, effects: [] };
      return {
        state: { ...v_b6e533, phase: 'sending', pendingText: '' },
        effects: ['STOP_STT', 'SAY', 'START_DETECTOR'],
        sayText: v_9b6134,
      };
    }

    case 'CANCEL_SEND':
      if (v_b6e533.phase !== 'confirming') return { state: v_b6e533, effects: [] };

      return { state: { ...v_b6e533, phase: 'listening', pendingText: '' }, effects: [] };

    case 'CLONE_SPEAKING':
      if (v_b6e533.phase !== 'sending') return { state: v_b6e533, effects: [] };
      return { state: { ...v_b6e533, phase: 'speaking' }, effects: [] };

    case 'RESPONSE_END':

      if (v_b6e533.phase !== 'speaking' && v_b6e533.phase !== 'sending' && v_b6e533.phase !== 'greeting') {
        return { state: v_b6e533, effects: [] };
      }

      if (!v_b6e533.micOn) return { state: { ...v_b6e533, phase: 'paused', pendingText: '' }, effects: ['STOP_DETECTOR'] };
      return { state: { ...v_b6e533, phase: 'listening', pendingText: '' }, effects: ['STOP_DETECTOR', 'START_STT'] };

    case 'MIC_OFF':
      if (!v_b6e533.micOn) return { state: v_b6e533, effects: [] };
      return { state: { phase: 'paused', micOn: false, pendingText: '', confirmGate: v_b6e533.confirmGate }, effects: ['STOP_STT', 'STOP_DETECTOR'] };

    case 'MIC_ON':
      if (v_b6e533.micOn) return { state: v_b6e533, effects: [] };
      return { state: { phase: 'listening', micOn: true, pendingText: '', confirmGate: v_b6e533.confirmGate }, effects: ['START_STT'] };

    case 'CALL_ENDED':
      return { state: { phase: 'idle', micOn: true, pendingText: '', confirmGate: false }, effects: ['STOP_STT', 'STOP_DETECTOR'] };

    default:
      return { state: v_b6e533, effects: [] };
  }
}
