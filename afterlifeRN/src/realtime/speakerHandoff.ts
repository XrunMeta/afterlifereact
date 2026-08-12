

export interface KnownSpeaker { personId: number; name: string }
export interface SpeakerHandoffState {
  lastKnownSpeaker: KnownSpeaker | null;
  naming: boolean;
}
export type SpeakerHandoffEvent =
  | { type: 'SPEAKER_CONFIRMED'; personId: number; name: string }

  | { type: 'UNKNOWN_FACE'; ownerName?: string; isFirstTime?: boolean }
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

export function v_8405b2(
  v_ba2215,
  v_328259,
): string {
  if (v_328259?.isFirstTime && v_328259.ownerName && v_328259.ownerName.trim()) {
    return `너 이름이 ${v_328259.ownerName.trim()} 맞지?`;
  }
  return v_ba2215
    ? `누구시죠? ${v_ba2215.name}님이 아니네요, 성함을 알려주세요`
    : `누구시죠? 성함을 알려주세요`;
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
        actions: [
          {
            type: 'SAY',
            text: v_8405b2(v_b6e533.lastKnownSpeaker, {
              ownerName: v_d48baf.ownerName,
              isFirstTime: v_d48baf.isFirstTime,
            }),
          },
          { type: 'BEGIN_NAMING' },
        ],
      };
    }
    case 'SPEAKER_CONFIRMED': {
      const v_d81543 = { personId: v_d48baf.personId, name: v_d48baf.name };
      if (v_b6e533.naming) {
        return {
          state: { lastKnownSpeaker: v_d81543, naming: false },
          actions: [{ type: 'SAY', text: `${v_d48baf.name}님 다시 오셨네요` }, { type: 'END_NAMING' }],
        };
      }
      return { state: { ...v_b6e533, lastKnownSpeaker: v_d81543 }, actions: [] };
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
