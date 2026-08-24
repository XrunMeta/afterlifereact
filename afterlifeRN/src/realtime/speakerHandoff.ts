

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

export function v_047711(): SpeakerHandoffState {
  return { lastKnownSpeaker: null, naming: false };
}

export function v_5ecb22(
  v_b6e533,
  v_d48baf,
): { state: SpeakerHandoffState; actions: SpeakerHandoffAction[] } {
  switch (v_d48baf.type) {
    case 'UNKNOWN_FACE': {
      if (v_b6e533.naming) return { state: v_b6e533, actions: [] }; 

      return {
        state: { ...v_b6e533, naming: true },
        actions: [{ type: 'BEGIN_NAMING' }],
      };
    }
    case 'SPEAKER_CONFIRMED': {

      const v_d81543 = { personId: v_d48baf.personId, name: v_d48baf.name };
      return {
        state: { lastKnownSpeaker: v_d81543, naming: false },
        actions: v_b6e533.naming ? [{ type: 'END_NAMING' }] : [],
      };
    }
    case 'NAME_ENROLLED': {
      if (!v_b6e533.naming) return { state: v_b6e533, actions: [] };
      const v_a448ad = v_d48baf.personId != null && v_d48baf.name != null
        ? { lastKnownSpeaker: { personId: v_d48baf.personId, name: v_d48baf.name }, naming: false }
        : { ...v_b6e533, naming: false };
      return { state: v_a448ad, actions: [{ type: 'END_NAMING' }] };
    }
    case 'NAMING_TIMEOUT': {
      if (!v_b6e533.naming) return { state: v_b6e533, actions: [] };
      return {
        state: { ...v_b6e533, naming: false },
        actions: [{ type: 'END_NAMING' }, { type: 'DISCARD_RECOGNITION' }],
      };
    }
    default:
      return { state: v_b6e533, actions: [] };
  }
}
