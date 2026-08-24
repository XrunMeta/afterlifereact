import {
  speakerHandoffReducer, initSpeakerHandoffState,
} from '../speakerHandoff';

const known = { personId: 9, name: '주인' };

describe('speakerHandoffReducer', () => {
  it('UNKNOWN_FACE(첫) → BEGIN_NAMING 만, 음성으로 이름을 묻지 않는다', () => {

    const s0 = { ...initSpeakerHandoffState(), lastKnownSpeaker: known };
    const { state, actions } = speakerHandoffReducer(s0, { type: 'UNKNOWN_FACE' });
    expect(state.naming).toBe(true);
    expect(actions).toEqual([{ type: 'BEGIN_NAMING' }]);
    expect(actions.some((a) => a.type === 'SAY')).toBe(false);
  });

  it('UNKNOWN_FACE(naming 중) → 무시', () => {
    const s0 = { lastKnownSpeaker: known, naming: true };
    const { actions } = speakerHandoffReducer(s0, { type: 'UNKNOWN_FACE' });
    expect(actions).toEqual([]);
  });

  it('SPEAKER_CONFIRMED(naming 중) → 재인사 SAY + END_NAMING, naming=false, 이력 갱신', () => {
    const s0 = { lastKnownSpeaker: null, naming: true };
    const { state, actions } = speakerHandoffReducer(s0,
      { type: 'SPEAKER_CONFIRMED', personId: 9, name: '주인' });
    expect(state).toEqual({ lastKnownSpeaker: known, naming: false });
    expect(actions).toEqual([
      { type: 'SAY', text: '주인님 다시 오셨네요' },
      { type: 'END_NAMING' },
    ]);
  });

  it('SPEAKER_CONFIRMED(naming 아님) → 이력만 갱신, 액션 없음', () => {
    const s0 = initSpeakerHandoffState();
    const { state, actions } = speakerHandoffReducer(s0,
      { type: 'SPEAKER_CONFIRMED', personId: 9, name: '주인' });
    expect(state.lastKnownSpeaker).toEqual(known);
    expect(actions).toEqual([]);
  });

  it('T-561 · 같은 사람이 짧게 놓쳤다 돌아오면 재인사 스킵 (naming 중 + 같은 personId)', () => {

    const s0 = { lastKnownSpeaker: known, naming: true };
    const { state, actions } = speakerHandoffReducer(s0,
      { type: 'SPEAKER_CONFIRMED', personId: 9, name: '주인' });
    expect(state).toEqual({ lastKnownSpeaker: known, naming: false });
    expect(actions).toEqual([]);
  });

  it('naming 중 · 진짜 다른 사람이 오면 재인사 (기존 동작 유지)', () => {

    const s0 = { lastKnownSpeaker: known, naming: true };
    const { state, actions } = speakerHandoffReducer(s0,
      { type: 'SPEAKER_CONFIRMED', personId: 15, name: '미미' });
    expect(state).toEqual({ lastKnownSpeaker: { personId: 15, name: '미미' }, naming: false });
    expect(actions).toEqual([
      { type: 'SAY', text: '미미님 다시 오셨네요' },
      { type: 'END_NAMING' },
    ]);
  });

  it('NAME_ENROLLED(naming 중) → END_NAMING, naming=false', () => {
    const s0 = { lastKnownSpeaker: null, naming: true };
    const { state, actions } = speakerHandoffReducer(s0,
      { type: 'NAME_ENROLLED', personId: 12, name: '철수' });
    expect(state.naming).toBe(false);
    expect(actions).toEqual([{ type: 'END_NAMING' }]);
  });

  it('NAMING_TIMEOUT(naming 중) → END_NAMING + DISCARD_RECOGNITION', () => {
    const s0 = { lastKnownSpeaker: known, naming: true };
    const { state, actions } = speakerHandoffReducer(s0, { type: 'NAMING_TIMEOUT' });
    expect(state.naming).toBe(false);
    expect(actions).toEqual([{ type: 'END_NAMING' }, { type: 'DISCARD_RECOGNITION' }]);
  });

  it('NAMING_TIMEOUT(naming 아님) → 무시', () => {
    const s0 = initSpeakerHandoffState();
    const { actions } = speakerHandoffReducer(s0, { type: 'NAMING_TIMEOUT' });
    expect(actions).toEqual([]);
  });
});
