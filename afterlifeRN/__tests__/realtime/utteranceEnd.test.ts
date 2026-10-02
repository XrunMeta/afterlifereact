import { v_8fae09 } from '../../src/realtime/utteranceEnd';

describe('looksIncomplete — 말이 이어질 모양인가', () => {
  it('2026-10-02 실통화에서 800ms 에 끊겨 나간 문장들은 이어질 모양이다', () => {
    for (const v_8d41d7 of [
      '특별한 일은',
      '내가 아까 아침에 특별한 일한 거 있잖아 그게',
      '안녕이다 아침에 내가 뭐',
      '어 지금은 좀',
    ]) expect([v_8d41d7, v_8fae09(v_8d41d7)]).toEqual([v_8d41d7, true]);
  });

  it('같은 날 끝까지 간 문장들은 끝난 모양이다(기존처럼 짧게 보낸다)', () => {
    for (const v_8d41d7 of [
      '그래 그러는게 좋겠다',
      '어 지금은 좀 그냥 쉬고 있는 중이야',
      '모르겠다 저녁에는 오이도 따야 돼',
      '맞아 우리서 있었으니 피곤하지 지금은 앉아 있어',
      '그러게 말이다 어쨌든 오늘 날씨가 되게 좋네 너는 날씨가 어때',
      '중요한 건 말이 있지 내가 하고 싶은 말에 끝에가 좀 잘리는 거 같아',
      '그래 알았다',
      '응 그래 오랜만이네',
    ]) expect([v_8d41d7, v_8fae09(v_8d41d7)]).toEqual([v_8d41d7, false]);
  });

  it('조사·연결 어미로 끝나면 이어질 모양', () => {
    for (const v_8d41d7 of ['오늘 아침에', '밥 먹고', '비가 오는데', '시간 되면', '친구랑', '학교에서']) {
      expect([v_8d41d7, v_8fae09(v_8d41d7)]).toEqual([v_8d41d7, true]);
    }
  });

  it('한 글자 어절은 조사로 보지 않는다(단어 목록에 있는 것만)', () => {
    expect(v_8fae09('가')).toBe(false);
    expect(v_8fae09('나')).toBe(false);
    expect(v_8fae09('뭐')).toBe(true);
    expect(v_8fae09('좀')).toBe(true);
  });

  it('빈 값·부호만은 끝난 것으로 본다(기다리지 않는다)', () => {
    for (const v_8d41d7 of ['', '   ', '?', '...']) expect(v_8fae09(v_8d41d7)).toBe(false);
  });
});
