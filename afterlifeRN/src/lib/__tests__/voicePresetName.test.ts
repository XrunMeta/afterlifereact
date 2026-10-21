import { v_d7b329 } from '../voicePresetName';

const v_324e3c = {
  name: '고민주',
  nameEn: 'Minju',
  nameJa: 'ミンジュ',
  nameZhCn: '敏珠',
  nameId: 'Minju ID',
};

const v_d81b36 = {
  'create.voice.presetNames.씩씩한 여학생': 'Energetic schoolgirl',
  'create.voice.presetNames.차분한 청년남성': 'Calm young man',
  'create.voice.presetNames.영지': 'Yeongji',
};

const v_8d41d7 = (v_b24339, v_b36f96) =>
  v_d81b36[v_b24339] ?? v_b36f96?.defaultValue ?? '';

describe('resolveVoicePresetName', () => {
  test('한국어(ko) — 항상 name(정본)', () => {
    expect(v_d7b329(v_324e3c, 'ko')).toBe('고민주');
    expect(v_d7b329(v_324e3c, 'ko-KR')).toBe('고민주');
  });
  test('영어(en) — nameEn', () => {
    expect(v_d7b329(v_324e3c, 'en')).toBe('Minju');
    expect(v_d7b329(v_324e3c, 'en-US')).toBe('Minju');
  });
  test('일본어(ja) — nameJa', () => {
    expect(v_d7b329(v_324e3c, 'ja')).toBe('ミンジュ');
  });
  test('중국어(zh-CN) — nameZhCn', () => {
    expect(v_d7b329(v_324e3c, 'zh-CN')).toBe('敏珠');
    expect(v_d7b329(v_324e3c, 'zh-Hans')).toBe('敏珠');
    expect(v_d7b329(v_324e3c, 'zh')).toBe('敏珠');
  });
  test('인도네시아어(id) — nameId', () => {
    expect(v_d7b329(v_324e3c, 'id')).toBe('Minju ID');
    expect(v_d7b329(v_324e3c, 'id-ID')).toBe('Minju ID');
  });

  test('언어별 필드 null 이면 한국어 name 으로 폴백', () => {
    const v_4628fe = { name: '고민주', nameEn: null, nameJa: null, nameZhCn: null, nameId: null };
    expect(v_d7b329(v_4628fe, 'en')).toBe('고민주');
    expect(v_d7b329(v_4628fe, 'ja')).toBe('고민주');
    expect(v_d7b329(v_4628fe, 'zh-CN')).toBe('고민주');
    expect(v_d7b329(v_4628fe, 'id')).toBe('고민주');
  });

  test('언어별 필드 빈 문자열(공백)도 폴백', () => {
    const v_4628fe = { name: '고민주', nameEn: '   ', nameJa: '', nameZhCn: null, nameId: null };
    expect(v_d7b329(v_4628fe, 'en')).toBe('고민주');
    expect(v_d7b329(v_4628fe, 'ja')).toBe('고민주');
  });

  test('알 수 없는 언어 코드는 name 폴백', () => {
    expect(v_d7b329(v_324e3c, 'fr')).toBe('고민주');
    expect(v_d7b329(v_324e3c, '')).toBe('고민주');
    expect(v_d7b329(v_324e3c, undefined)).toBe('고민주');
  });

  test('preset 자체가 null 이면 빈 문자열', () => {
    expect(v_d7b329(null, 'en')).toBe('');
    expect(v_d7b329(undefined, 'ko')).toBe('');
  });

  test('API i18n 비어 있으면 locale presetNames 폴백', () => {
    const v_8aa332 = {
      name: '씩씩한 여학생',
      nameEn: null,
      nameJa: null,
      nameZhCn: null,
      nameId: null,
    };
    expect(v_d7b329(v_8aa332, 'en', v_8d41d7)).toBe('Energetic schoolgirl');
    expect(v_d7b329({ ...v_8aa332, name: '차분한 청년남성' }, 'en', v_8d41d7)).toBe(
      'Calm young man',
    );
    expect(v_d7b329({ ...v_8aa332, name: '영지' }, 'en', v_8d41d7)).toBe('Yeongji');
  });

  test('API i18n 이 있으면 locale 보다 API 우선', () => {
    const v_63db2f = {
      name: '씩씩한 여학생',
      nameEn: 'From API',
      nameJa: null,
      nameZhCn: null,
      nameId: null,
    };
    expect(v_d7b329(v_63db2f, 'en', v_8d41d7)).toBe('From API');
  });
});
