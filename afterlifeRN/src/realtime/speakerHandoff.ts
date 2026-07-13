

export interface KnownSpeaker { personId: number; name: string }
export interface SpeakerHandoffState {
  lastKnownSpeaker: KnownSpeaker | null;
  naming: boolean;
}
export type SpeakerHandoffEvent =
  | { type: 'SPEAKER_CONFIRMED'; personId: number; name: string }
  | { type: 'UNKNOWN_FACE' }
  | { type: 'NAME_ENROLLED'; personId?: number; name?: string }
  | { type: 'NAMING_TIMEOUT' };
export type SpeakerHandoffAction =
  | { type: 'SAY'; text: string }
  | { type: 'BEGIN_NAMING' }
  | { type: 'END_NAMING' }
  | { type: 'DISCARD_RECOGNITION' };

export function initSpeakerHandoffState(): SpeakerHandoffState {
  return { lastKnownSpeaker: null, naming: false };
}

export function promptFor(prev: KnownSpeaker | null): string {
  return prev
    ? `누구시죠? ${prev.name}님이 아니네요, 성함을 알려주세요`
    : `누구시죠? 성함을 알려주세요`;
}

export function speakerHandoffReducer(
  state: SpeakerHandoffState,
  event: SpeakerHandoffEvent,
): { state: SpeakerHandoffState; actions: SpeakerHandoffAction[] } {
  switch (event.type) {
    case 'UNKNOWN_FACE': {
      if (state.naming) return { state, actions: [] }; 
      return {
        state: { ...state, naming: true },
        actions: [{ type: 'SAY', text: promptFor(state.lastKnownSpeaker) }, { type: 'BEGIN_NAMING' }],
      };
    }
    case 'SPEAKER_CONFIRMED': {
      const known: KnownSpeaker = { personId: event.personId, name: event.name };
      if (state.naming) {
        return {
          state: { lastKnownSpeaker: known, naming: false },
          actions: [{ type: 'SAY', text: `${event.name}님 다시 오셨네요` }, { type: 'END_NAMING' }],
        };
      }
      return { state: { ...state, lastKnownSpeaker: known }, actions: [] };
    }
    case 'NAME_ENROLLED': {
      if (!state.naming) return { state, actions: [] };
      const next = event.personId != null && event.name != null
        ? { lastKnownSpeaker: { personId: event.personId, name: event.name }, naming: false }
        : { ...state, naming: false };
      return { state: next, actions: [{ type: 'END_NAMING' }] };
    }
    case 'NAMING_TIMEOUT': {
      if (!state.naming) return { state, actions: [] };
      return {
        state: { ...state, naming: false },
        actions: [{ type: 'END_NAMING' }, { type: 'DISCARD_RECOGNITION' }],
      };
    }
    default:
      return { state, actions: [] };
  }
}
