import {
  v_5ecb22, v_047711,
} from '../speakerHandoff';

const v_d81543 = { personId: 9, name: '주인' };

describe('speakerHandoffReducer', () => {
  it('UNKNOWN_FACE(첫) → BEGIN_NAMING 만, 음성으로 이름을 묻지 않는다', () => {

    const v_ca01e0 = { ...v_047711(), lastKnownSpeaker: v_d81543 };
    const { state: v_b6e533, actions: v_dd943a } = v_5ecb22(v_ca01e0, { type: 'UNKNOWN_FACE' });
    expect(v_b6e533.naming).toBe(true);
    expect(v_dd943a).toEqual([{ type: 'BEGIN_NAMING' }]);
    expect(v_dd943a.some((v_779914) => v_779914.type === 'SAY')).toBe(false);
  });

  it('UNKNOWN_FACE(naming 중) → 무시', () => {
    const v_ca01e0 = { lastKnownSpeaker: v_d81543, naming: true };
    const { actions: v_dd943a } = v_5ecb22(v_ca01e0, { type: 'UNKNOWN_FACE' });
    expect(v_dd943a).toEqual([]);
  });

  it('SPEAKER_CONFIRMED(naming 중) → 재인사 SAY + END_NAMING, naming=false, 이력 갱신', () => {
    const v_ca01e0 = { lastKnownSpeaker: null, naming: true };
    const { state: v_b6e533, actions: v_dd943a } = v_5ecb22(v_ca01e0,
      { type: 'SPEAKER_CONFIRMED', personId: 9, name: '주인' });
    expect(v_b6e533).toEqual({ lastKnownSpeaker: v_d81543, naming: false });
    expect(v_dd943a).toEqual([
      { type: 'SAY', text: '주인님 다시 오셨네요' },
      { type: 'END_NAMING' },
    ]);
  });

  it('SPEAKER_CONFIRMED(naming 아님) → 이력만 갱신, 액션 없음', () => {
    const v_ca01e0 = v_047711();
    const { state: v_b6e533, actions: v_dd943a } = v_5ecb22(v_ca01e0,
      { type: 'SPEAKER_CONFIRMED', personId: 9, name: '주인' });
    expect(v_b6e533.lastKnownSpeaker).toEqual(v_d81543);
    expect(v_dd943a).toEqual([]);
  });

  it('NAME_ENROLLED(naming 중) → END_NAMING, naming=false', () => {
    const v_ca01e0 = { lastKnownSpeaker: null, naming: true };
    const { state: v_b6e533, actions: v_dd943a } = v_5ecb22(v_ca01e0,
      { type: 'NAME_ENROLLED', personId: 12, name: '철수' });
    expect(v_b6e533.naming).toBe(false);
    expect(v_dd943a).toEqual([{ type: 'END_NAMING' }]);
  });

  it('NAMING_TIMEOUT(naming 중) → END_NAMING + DISCARD_RECOGNITION', () => {
    const v_ca01e0 = { lastKnownSpeaker: v_d81543, naming: true };
    const { state: v_b6e533, actions: v_dd943a } = v_5ecb22(v_ca01e0, { type: 'NAMING_TIMEOUT' });
    expect(v_b6e533.naming).toBe(false);
    expect(v_dd943a).toEqual([{ type: 'END_NAMING' }, { type: 'DISCARD_RECOGNITION' }]);
  });

  it('NAMING_TIMEOUT(naming 아님) → 무시', () => {
    const v_ca01e0 = v_047711();
    const { actions: v_dd943a } = v_5ecb22(v_ca01e0, { type: 'NAMING_TIMEOUT' });
    expect(v_dd943a).toEqual([]);
  });
});
