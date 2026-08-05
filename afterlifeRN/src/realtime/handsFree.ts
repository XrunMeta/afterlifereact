

export type HandsFreePhase =
  | 'idle' | 'greeting' | 'listening' | 'confirming' | 'sending' | 'speaking' | 'paused'
  | 'interrupting';

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
  | { type: 'FACE_INTERRUPT'; text: string; faceKey: string };

export type HandsFreeEffect =
  | 'START_STT' | 'STOP_STT' | 'SAY' | 'GREET' | 'SPEAK_FALLBACK'
  | 'START_DETECTOR' | 'STOP_DETECTOR' | 'SAY_INTERRUPT';

export interface HandsFreeResult {
  state: HandsFreeState;
  effects: HandsFreeEffect[];
  sayText?: string;

  saySeq?: number;
}

export const v_3075fa = (): HandsFreeState => ({
  phase: 'idle', micOn: true, pendingText: '', confirmGate: false, signalGating: false,
  activeSeq: null, nextSeq: 1, userSpeaking: false, pendingInterrupt: null,
});

export function v_6920f0(v_b6e533, v_1d299c): HandsFreeResult {
  switch (v_1d299c.type) {
    case 'CALL_LIVE': {

      const v_c6928f = v_1d299c.confirmGate ?? v_b6e533.confirmGate;
      const v_34f505 = v_1d299c.signalGating ?? v_b6e533.signalGating;
      if (!v_b6e533.micOn) return { state: { ...v_b6e533, phase: 'paused', confirmGate: v_c6928f, signalGating: v_34f505 }, effects: [] };
      if (v_b6e533.phase !== 'idle') return { state: { ...v_b6e533, confirmGate: v_c6928f, signalGating: v_34f505 }, effects: [] };

      if (v_1d299c.greeting) return { state: { ...v_b6e533, phase: 'greeting', confirmGate: v_c6928f, signalGating: v_34f505 }, effects: ['GREET'] };
      return { state: { ...v_b6e533, phase: 'listening', confirmGate: v_c6928f, signalGating: v_34f505 }, effects: ['START_STT'] };
    }

    case 'USER_SPEECH_START':

      if (v_b6e533.phase !== 'listening' && v_b6e533.phase !== 'confirming') return { state: v_b6e533, effects: [] };
      if (v_b6e533.userSpeaking) return { state: v_b6e533, effects: [] };
      return { state: { ...v_b6e533, userSpeaking: true }, effects: [] };

    case 'USER_SPEECH_IDLE':
      if (!v_b6e533.userSpeaking) return { state: v_b6e533, effects: [] };
      return { state: { ...v_b6e533, userSpeaking: false }, effects: [] };

    case 'SPEECH_START':

      if (v_b6e533.phase !== 'greeting' && v_b6e533.phase !== 'sending' && v_b6e533.phase !== 'interrupting') {
        return { state: v_b6e533, effects: [] };
      }

      if (v_1d299c.seq != null && v_b6e533.activeSeq != null && v_1d299c.seq !== v_b6e533.activeSeq) {
        return { state: v_b6e533, effects: [] };
      }

      if (v_b6e533.phase === 'interrupting') return { state: v_b6e533, effects: [] };
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

        const v_1923e2 = v_b6e533.nextSeq;
        return {
          state: { ...v_b6e533, phase: 'sending', pendingText: v_9b6134, activeSeq: v_1923e2, nextSeq: v_1923e2 + 1, userSpeaking: false },
          effects: ['STOP_STT', 'SAY', 'START_DETECTOR'],
          sayText: v_9b6134,
          saySeq: v_1923e2,
        };
      }
      const v_def12c =
        v_b6e533.phase === 'confirming' && v_b6e533.pendingText
          ? `${v_b6e533.pendingText} ${v_9b6134}`.trim()
          : v_9b6134;
      return { state: { ...v_b6e533, phase: 'confirming', pendingText: v_def12c, userSpeaking: false }, effects: [] };
    }

    case 'CONFIRM_SEND': {
      if (v_b6e533.phase !== 'confirming') return { state: v_b6e533, effects: [] };
      const v_9b6134 = v_b6e533.pendingText.trim();

      if (!v_9b6134) return { state: { ...v_b6e533, phase: 'listening', pendingText: '', userSpeaking: false }, effects: [] };
      const v_1923e2 = v_b6e533.nextSeq;
      return {
        state: { ...v_b6e533, phase: 'sending', pendingText: '', activeSeq: v_1923e2, nextSeq: v_1923e2 + 1, userSpeaking: false },
        effects: ['STOP_STT', 'SAY', 'START_DETECTOR'],
        sayText: v_9b6134,
        saySeq: v_1923e2,
      };
    }

    case 'CANCEL_SEND':
      if (v_b6e533.phase !== 'confirming') return { state: v_b6e533, effects: [] };

      return { state: { ...v_b6e533, phase: 'listening', pendingText: '', userSpeaking: false }, effects: [] };

    case 'CLONE_SPEAKING':
      if (v_b6e533.phase !== 'sending') return { state: v_b6e533, effects: [] };
      return { state: { ...v_b6e533, phase: 'speaking' }, effects: [] };

    case 'RESPONSE_END':

      if (v_b6e533.signalGating) return { state: v_b6e533, effects: [] };

      if (v_b6e533.phase !== 'speaking' && v_b6e533.phase !== 'sending' && v_b6e533.phase !== 'greeting'
        && v_b6e533.phase !== 'interrupting') {
        return { state: v_b6e533, effects: [] };
      }

      if (!v_b6e533.micOn) return { state: { ...v_b6e533, phase: 'paused', pendingText: '', activeSeq: null, userSpeaking: false }, effects: ['STOP_DETECTOR'] };
      return {
        state: { ...v_b6e533, phase: 'listening', pendingText: '', activeSeq: null, userSpeaking: false },
        effects: ['STOP_DETECTOR', 'START_STT'],
      };

    case 'RESPONSE_DONE':

      if (v_b6e533.phase !== 'speaking' && v_b6e533.phase !== 'sending' && v_b6e533.phase !== 'greeting'
        && v_b6e533.phase !== 'interrupting') {
        return { state: v_b6e533, effects: [] };
      }

      if (v_1d299c.seq != null && v_b6e533.activeSeq != null && v_1d299c.seq !== v_b6e533.activeSeq) {
        return { state: v_b6e533, effects: [] };
      }
      if (!v_b6e533.micOn) return { state: { ...v_b6e533, phase: 'paused', pendingText: '', activeSeq: null, userSpeaking: false }, effects: ['STOP_DETECTOR'] };
      return {
        state: { ...v_b6e533, phase: 'listening', pendingText: '', activeSeq: null, userSpeaking: false },
        effects: ['STOP_DETECTOR', 'START_STT'],
      };

    case 'MIC_OFF':
      if (!v_b6e533.micOn) return { state: v_b6e533, effects: [] };
      return {
        state: { phase: 'paused', micOn: false, pendingText: '', confirmGate: v_b6e533.confirmGate, signalGating: v_b6e533.signalGating, activeSeq: null, nextSeq: v_b6e533.nextSeq, userSpeaking: false, pendingInterrupt: null },
        effects: ['STOP_STT', 'STOP_DETECTOR'],
      };

    case 'MIC_ON':
      if (v_b6e533.micOn) return { state: v_b6e533, effects: [] };
      return {
        state: { phase: 'listening', micOn: true, pendingText: '', confirmGate: v_b6e533.confirmGate, signalGating: v_b6e533.signalGating, activeSeq: null, nextSeq: v_b6e533.nextSeq, userSpeaking: false, pendingInterrupt: null },
        effects: ['START_STT'],
      };

    case 'FACE_INTERRUPT': {

      if (v_b6e533.phase === 'idle' || v_b6e533.phase === 'paused') return { state: v_b6e533, effects: [] };
      const v_61998a = v_b6e533.phase === 'listening' && !v_b6e533.userSpeaking;
      if (!v_61998a) {

        if (v_b6e533.pendingInterrupt?.faceKey === v_1d299c.faceKey) return { state: v_b6e533, effects: [] };
        return {
          state: { ...v_b6e533, pendingInterrupt: { text: v_1d299c.text, faceKey: v_1d299c.faceKey, deferredTurns: 0 } },
          effects: [],
        };
      }
      const v_1923e2 = v_b6e533.nextSeq;
      return {
        state: {
          ...v_b6e533, phase: 'interrupting', pendingText: '', userSpeaking: false,
          activeSeq: v_1923e2, nextSeq: v_1923e2 + 1, pendingInterrupt: null,
        },
        effects: ['STOP_STT', 'SAY_INTERRUPT', 'START_DETECTOR'],
        sayText: v_1d299c.text,
        saySeq: v_1923e2,
      };
    }

    case 'CALL_ENDED':
      return {
        state: { ...v_3075fa(), nextSeq: v_b6e533.nextSeq },
        effects: ['STOP_STT', 'STOP_DETECTOR'],
      };

    default:
      return { state: v_b6e533, effects: [] };
  }
}
