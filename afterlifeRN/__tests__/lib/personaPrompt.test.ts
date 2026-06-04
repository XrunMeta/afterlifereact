import { draftToL1Profile, formatPersonaPrompt } from '../../src/lib/personaPrompt';
import type { CloneCreationDraft } from '../../src/types/clone';

describe('draftToL1Profile', () => {
  test('returns undefined when nothing entered', () => {
    expect(draftToL1Profile({} as CloneCreationDraft)).toBeUndefined();
  });

  test('omits empty keys (PRD: 키 부재 = 미선택)', () => {
    const out = draftToL1Profile({
      personaAge: '30대',
      personaGender: '여성',
    } as CloneCreationDraft);
    expect(out).toEqual({ attrs: { age: '30대', gender: '여성' }, notes: '' });
  });

  test('joins personalities as CSV', () => {
    const out = draftToL1Profile({
      personaTypes: ['extrovert', 'passionate'],
    } as CloneCreationDraft);
    expect(out?.attrs.personalities).toBe('extrovert,passionate');
  });

  test('passes notes trimmed', () => {
    const out = draftToL1Profile({
      personaNotes: '  자유로운 사람  ',
    } as CloneCreationDraft);
    expect(out).toEqual({ attrs: {}, notes: '자유로운 사람' });
  });
});

describe('formatPersonaPrompt', () => {
  test('empty snapshot → placeholder', () => {
    expect(formatPersonaPrompt({})).toBe('(클론 정보가 비어 있음)');
  });

  test('renders name + meta + personalities + interests', () => {
    const txt = formatPersonaPrompt({
      name: '할머니',
      l1: { attrs: { age: '60대 이상', gender: '여성', mbti: 'ENFP', personalities: 'extrovert,calm' } },
      interests: ['요리', '텃밭'],
    });
    expect(txt).toContain('할머니 (60대 이상, 여성, ENFP)');
    expect(txt).toContain('성격: 외향적인, 평온한');
    expect(txt).toContain('관심사: 요리, 텃밭');
  });

  test('mbti 모름 is omitted from header', () => {
    const txt = formatPersonaPrompt({
      name: '루나',
      l1: { attrs: { age: '20대', mbti: '모름' } },
    });
    expect(txt).toContain('루나 (20대)');
    expect(txt).not.toContain('모름');
  });

  test('relation label maps korean', () => {
    const txt = formatPersonaPrompt({ name: '엄마', relation: 'mother' });
    expect(txt).toContain('고인과의 관계: 어머니');
  });

  test('notes appears as own paragraph', () => {
    const txt = formatPersonaPrompt({
      name: 'A',
      l1: { attrs: {}, notes: '말끝에 "아이고" 자주 붙임' },
    });
    expect(txt).toMatch(/A\n\n말끝에/);
  });
});
