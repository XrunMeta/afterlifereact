
import { v_8e0f80, v_25c9bd } from '../../src/screens/clone-interaction/afl971Ad';

describe('afl971ShouldShowAd', () => {
  it('일반 계정: 10, 15, 20 번째 라운드에 true', () => {
    for (const v_cb35cb of [10, 15, 20, 25]) expect(v_8e0f80(v_cb35cb, false)).toBe(true);
  });
  it('일반 계정: 9, 11, 14 번째 라운드는 false', () => {
    for (const v_cb35cb of [1, 9, 11, 14, 16]) expect(v_8e0f80(v_cb35cb, false)).toBe(false);
  });
  it('테스트 계정: 2, 3, 4 번째 라운드에 true', () => {
    for (const v_cb35cb of [2, 3, 4, 5]) expect(v_8e0f80(v_cb35cb, true)).toBe(true);
  });
  it('테스트 계정: 1 번째 라운드는 false', () => {
    expect(v_8e0f80(1, true)).toBe(false);
  });
  it('테스트 계정: 6 이상도 매 라운드 true', () => {
    for (const v_cb35cb of [6, 7, 20]) expect(v_8e0f80(v_cb35cb, true)).toBe(true);
  });
  it('일반 계정: 12·13·19 는 false, 30 은 true', () => {
    for (const v_cb35cb of [12, 13, 19]) expect(v_8e0f80(v_cb35cb, false)).toBe(false);
    expect(v_8e0f80(30, false)).toBe(true);
  });
  it('0·음수·비정상 라운드는 광고 안 뜸(false)', () => {
    for (const v_cb35cb of [0, -1, NaN, Infinity]) expect(v_8e0f80(v_cb35cb, false)).toBe(false);
  });
});

describe('isAfl971AdTestAccount', () => {
  it('테스트 계정 목록(happyluck0426·oth-test@example.invalid)은 true', () => {
    expect(v_25c9bd('oth-user@example.invalid')).toBe(true);
    expect(v_25c9bd('oth-test@example.invalid')).toBe(true);
  });
  it('대소문자·앞뒤 공백 정규화', () => {
    expect(v_25c9bd('GGG@HHH.com')).toBe(true);
    expect(v_25c9bd('  oth-test@example.invalid  ')).toBe(true);
  });
  it('그 외 계정·null·undefined 는 false', () => {
    expect(v_25c9bd('someone@example.com')).toBe(false);
    expect(v_25c9bd('oth-staff@example.invalid')).toBe(false);
    expect(v_25c9bd(null)).toBe(false);
    expect(v_25c9bd(undefined)).toBe(false);
  });
});
