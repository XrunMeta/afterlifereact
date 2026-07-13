import {
  speakerHandoffReducer, initSpeakerHandoffState, promptFor,
} from '../speakerHandoff';

const known = { personId: 9, name: '주인' };

describe('promptFor', () => {
  it('이전화자 있으면 이름 포함, 없으면 폴백', () => {
    expect(promptFor(known)).toBe('누구시죠? 주인님이 아니네요, 성함을 알려주세요');
    expect(promptFor(null)).toBe('누구시죠? 성함을 알려주세요');
  });
});

describe('speakerHandoffReducer', () => {
  it('UNKNOWN_FACE(첫) → 프롬프트 SAY + BEGIN_NAMING, naming=true', () => {
    const s0 = { ...initSpeakerHandoffState(), lastKnownSpeaker: known };
    const { state, actions } = speakerHandoffReducer(s0, { type: 'UNKNOWN_FACE' });
    expect(state.naming).toBe(true);
    expect(actions).toEqual([
      { type: 'SAY', text: '누구시죠? 주인님이 아니네요, 성함을 알려주세요' },
      { type: 'BEGIN_NAMING' },
    ]);
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
