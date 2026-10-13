
import { v_8e0f80, v_25c9bd, v_1c04ac, v_7841ab } from '../../src/screens/clone-interaction/afl971Ad';

describe('afl971ShouldShowAd', () => {
  it('기본(11/5): 11, 16, 21, 26 라운드에 true', () => {
    for (const v_cb35cb of [11, 16, 21, 26, 31]) expect(v_8e0f80(v_cb35cb)).toBe(true);
  });
  it('기본(11/5): 첫 10라운드(1~10)는 광고 없음', () => {
    for (let v_cb35cb = 1; v_cb35cb <= 10; v_cb35cb++) expect(v_8e0f80(v_cb35cb)).toBe(false);
  });
  it('기본(11/5): 12~15·17~20 은 false', () => {
    for (const v_cb35cb of [12, 13, 14, 15, 17, 18, 19, 20]) expect(v_8e0f80(v_cb35cb)).toBe(false);
  });
  it('서버 cadence 커스텀(2/1): 2부터 매 라운드', () => {
    const v_3f4e2e = { firstRound: 2, interval: 1 };
    expect(v_8e0f80(1, v_3f4e2e)).toBe(false);
    for (const v_cb35cb of [2, 3, 4, 5, 20]) expect(v_8e0f80(v_cb35cb, v_3f4e2e)).toBe(true);
  });
  it('서버 cadence 커스텀(10/5): 10·15·20 true, 11~14 false', () => {
    const v_3f4e2e = { firstRound: 10, interval: 5 };
    for (const v_cb35cb of [10, 15, 20]) expect(v_8e0f80(v_cb35cb, v_3f4e2e)).toBe(true);
    for (const v_cb35cb of [9, 11, 12, 13, 14]) expect(v_8e0f80(v_cb35cb, v_3f4e2e)).toBe(false);
  });
  it('비정상 cadence(0·음수·NaN)는 광고 안 뜸(false)', () => {
    for (const v_0af197 of [{ firstRound: 0, interval: 5 }, { firstRound: 11, interval: 0 }, { firstRound: NaN, interval: 5 }]) {
      for (const v_cb35cb of [11, 16, 21]) expect(v_8e0f80(v_cb35cb, v_0af197)).toBe(false);
    }
  });
  it('0·음수·비정상 라운드는 광고 안 뜸(false)', () => {
    for (const v_cb35cb of [0, -1, NaN, Infinity]) expect(v_8e0f80(v_cb35cb)).toBe(false);
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

describe('afl971CallInteractive', () => {
  it('포그라운드 + 라이브 → true', () => {
    expect(v_7841ab({ appActive: true, live: true })).toBe(true);
  });
  it('백그라운드면 false(라이브여도)', () => {
    expect(v_7841ab({ appActive: false, live: true })).toBe(false);
  });
  it('라이브 아니면 false(포그라운드여도)', () => {
    expect(v_7841ab({ appActive: true, live: false })).toBe(false);
  });
  it('둘 다 아니면 false', () => {
    expect(v_7841ab({ appActive: false, live: false })).toBe(false);
  });
});
