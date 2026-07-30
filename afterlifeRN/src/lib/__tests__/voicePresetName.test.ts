import { resolveVoicePresetName } from '../voicePresetName';

const preset = {
  name: '고민주',
  nameEn: 'Minju',
  nameJa: 'ミンジュ',
  nameZhCn: '敏珠',
  nameId: 'Minju ID',
};

describe('resolveVoicePresetName', () => {
  test('한국어(ko) — 항상 name(정본)', () => {
    expect(resolveVoicePresetName(preset, 'ko')).toBe('고민주');
    expect(resolveVoicePresetName(preset, 'ko-KR')).toBe('고민주');
  });
  test('영어(en) — nameEn', () => {
    expect(resolveVoicePresetName(preset, 'en')).toBe('Minju');
    expect(resolveVoicePresetName(preset, 'en-US')).toBe('Minju');
  });
  test('일본어(ja) — nameJa', () => {
    expect(resolveVoicePresetName(preset, 'ja')).toBe('ミンジュ');
  });
  test('중국어(zh-CN) — nameZhCn', () => {
    expect(resolveVoicePresetName(preset, 'zh-CN')).toBe('敏珠');
    expect(resolveVoicePresetName(preset, 'zh-Hans')).toBe('敏珠');
    expect(resolveVoicePresetName(preset, 'zh')).toBe('敏珠');
  });
  test('인도네시아어(id) — nameId', () => {
    expect(resolveVoicePresetName(preset, 'id')).toBe('Minju ID');
    expect(resolveVoicePresetName(preset, 'id-ID')).toBe('Minju ID');
  });

  test('언어별 필드 null 이면 한국어 name 으로 폴백', () => {
    const partial = { name: '고민주', nameEn: null, nameJa: null, nameZhCn: null, nameId: null };
    expect(resolveVoicePresetName(partial, 'en')).toBe('고민주');
    expect(resolveVoicePresetName(partial, 'ja')).toBe('고민주');
    expect(resolveVoicePresetName(partial, 'zh-CN')).toBe('고민주');
    expect(resolveVoicePresetName(partial, 'id')).toBe('고민주');
  });

  test('언어별 필드 빈 문자열(공백)도 폴백', () => {
    const partial = { name: '고민주', nameEn: '   ', nameJa: '', nameZhCn: null, nameId: null };
    expect(resolveVoicePresetName(partial, 'en')).toBe('고민주');
    expect(resolveVoicePresetName(partial, 'ja')).toBe('고민주');
  });

  test('알 수 없는 언어 코드는 name 폴백', () => {
    expect(resolveVoicePresetName(preset, 'fr')).toBe('고민주');
    expect(resolveVoicePresetName(preset, '')).toBe('고민주');
    expect(resolveVoicePresetName(preset, undefined)).toBe('고민주');
  });

  test('preset 자체가 null 이면 빈 문자열', () => {
    expect(resolveVoicePresetName(null, 'en')).toBe('');
    expect(resolveVoicePresetName(undefined, 'ko')).toBe('');
  });
});
