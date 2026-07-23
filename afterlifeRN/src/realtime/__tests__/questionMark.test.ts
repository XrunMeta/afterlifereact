import { ensureQuestionMark } from '../questionMark';

describe('ensureQuestionMark', () => {
  describe('의문 어미 — ? 부착', () => {
    it.each([
      ['밥 먹었니', '밥 먹었니?'],
      ['뭐 할까요', '뭐 할까요?'],
      ['어디 가나요', '어디 가나요?'],
      ['그게 맞는가', '그게 맞는가?'],
      ['너도 먹을래', '너도 먹을래?'],
      ['그거 맞죠', '그거 맞죠?'],
      ['너도 먹을래요', '너도 먹을래요?'],
      ['이게 뭔지 아는지', '이게 뭔지 아는지?'],
    ])('%s -> %s', (input, expected) => {
      expect(ensureQuestionMark(input)).toBe(expected);
    });
  });

  describe('평서문 — 미부착', () => {
    it.each([
      '밥 먹었어',
      '고마워',
      '거기 갔다',
      '알겠습니다',
      '오늘 날씨 좋네',
    ])('%s -> 그대로', (input) => {
      expect(ensureQuestionMark(input)).toBe(input);
    });
  });

  describe('기존 종결부호 — 중복 미부착', () => {
    it('이미 ?로 끝나면 그대로', () => {
      expect(ensureQuestionMark('밥 먹었니?')).toBe('밥 먹었니?');
    });
    it('이미 !로 끝나면 그대로(의문 어미 매치되어도)', () => {
      expect(ensureQuestionMark('빨리 갈래!')).toBe('빨리 갈래!');
    });
    it('이미 .로 끝나면 그대로', () => {
      expect(ensureQuestionMark('알겠습니다.')).toBe('알겠습니다.');
    });
  });

  describe('빈 문자열 / 공백', () => {
    it('빈 문자열은 그대로', () => {
      expect(ensureQuestionMark('')).toBe('');
    });
    it('공백만 있으면 trim된 빈 문자열', () => {
      expect(ensureQuestionMark('   ')).toBe('');
    });
    it('앞뒤 공백은 trim되어 반환', () => {
      expect(ensureQuestionMark('  밥 먹었니  ')).toBe('밥 먹었니?');
    });
  });
});
