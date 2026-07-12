import {
  v_5ecb22, v_047711, v_8405b2,
} from '../speakerHandoff';

const v_d81543 = { personId: 9, name: '주인' };

describe('promptFor', () => {
  it('이전화자 있으면 이름 포함, 없으면 폴백', () => {
    expect(v_8405b2(v_d81543)).toBe('누구시죠? 주인님이 아니네요, 성함을 알려주세요');
    expect(v_8405b2(null)).toBe('누구시죠? 성함을 알려주세요');
  });
});

describe('speakerHandoffReducer', () => {
  it('UNKNOWN_FACE(첫) → 프롬프트 SAY + BEGIN_NAMING, naming=true', () => {
    const v_ca01e0 = { ...v_047711(), lastKnownSpeaker: v_d81543 };
    const { state: v_b6e533, actions: v_dd943a } = v_5ecb22(v_ca01e0, { type: 'UNKNOWN_FACE' });
    expect(v_b6e533.naming).toBe(true);
    expect(v_dd943a).toEqual([
      { type: 'SAY', text: '누구시죠? 주인님이 아니네요, 성함을 알려주세요' },
      { type: 'BEGIN_NAMING' },
    ]);
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
