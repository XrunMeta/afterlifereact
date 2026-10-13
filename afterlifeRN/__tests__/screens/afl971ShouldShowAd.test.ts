
import { v_8e0f80, v_25c9bd, v_1c04ac } from '../../src/screens/clone-interaction/afl971Ad';

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

describe('afl971CanFireAd', () => {
  it('예고된 광고(pendingRound!=null)·얼굴 한가·사이클 아님 → 재생(true)', () => {
    expect(v_1c04ac({ pendingRound: 3, faceBusy: false, adInProgress: false })).toBe(true);
  });
  it('예고 없음(pendingRound=null) → 광고 없음(false) — 예고 없는 광고 차단', () => {
    expect(v_1c04ac({ pendingRound: null, faceBusy: false, adInProgress: false })).toBe(false);
  });
  it('얼굴 팝업/네이밍 중(faceBusy) → 보류(false) — pending 은 호출부가 유지', () => {
    expect(v_1c04ac({ pendingRound: 3, faceBusy: true, adInProgress: false })).toBe(false);
  });
  it('이미 광고 사이클 중(adInProgress) → 중복 방지(false)', () => {
    expect(v_1c04ac({ pendingRound: 3, faceBusy: false, adInProgress: true })).toBe(false);
  });
  it('round 0 도 유효한 pending 으로 취급(null 만 skip)', () => {
    expect(v_1c04ac({ pendingRound: 0, faceBusy: false, adInProgress: false })).toBe(true);
  });
});
