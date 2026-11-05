
const v_ce9e6e = jest.fn();
jest.mock('xhvnyifvzueidzwls', () => ({ getLocales: () => v_ce9e6e() }));

type I18n = typeof import('i18next').default;

async function v_576c6d(v_9d7f42, v_39de0e): Promise<I18n> {
  jest.resetModules();
  v_ce9e6e.mockReturnValue(v_9d7f42.map((v_451fa3) => ({ languageCode: v_451fa3 })));
  const v_e84827 = require('bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv').default;
  await v_e84827.clear();
  if (v_39de0e) await v_e84827.setItem('afterlife_app_language', v_39de0e);
  const v_9c213b = require('../index').default;
  for (let v_ebec57 = 0; v_ebec57 < 50 && !v_9c213b.isInitialized; v_ebec57++) {
    await new Promise((v_cb35cb) => setTimeout(v_cb35cb, 0));
  }
  return v_9c213b;
}

describe('앱 언어 자동 결정', () => {
  test('지원 안 하는 언어 폰 → 영어', async () => {
    expect((await v_576c6d(['fr'])).language).toBe('en');
    expect((await v_576c6d(['vi'])).language).toBe('en');
  });

  test('선호 언어 목록에서 지원 언어 첫 번째', async () => {
    expect((await v_576c6d(['fr', 'ja', 'ko'])).language).toBe('ja');
  });

  test('한국어 폰 → 한국어', async () => {
    expect((await v_576c6d(['ko'])).language).toBe('ko');
  });

  test('중국어 변종 → zh-CN, 안드로이드 옛 인도네시아어 코드 in → id', async () => {
    expect((await v_576c6d(['zh'])).language).toBe('zh-CN');
    expect((await v_576c6d(['in'])).language).toBe('id');
  });

  test('기기 언어 없음 → 영어', async () => {
    expect((await v_576c6d([])).language).toBe('en');
    expect((await v_576c6d([null])).language).toBe('en');
  });

  test('직접 고른 언어가 우선, 지원 안 하는 저장값은 무시', async () => {
    expect((await v_576c6d(['ko'], 'ja')).language).toBe('ja');
    expect((await v_576c6d(['ko'], 'vi')).language).toBe('ko');
  });

  test('번역 빠진 문구: 한국어는 한국어만, 그 외는 영어 → 한국어', async () => {
    expect((await v_576c6d(['ko'])).languages).toEqual(['ko']);
    expect((await v_576c6d(['ja'])).languages).toEqual(['ja', 'en', 'ko']);
  });
});
