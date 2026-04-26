import { v_556c5b, v_d6d0ff } from '../../src/lib/personaPrompt';
import type { v_c2a674 } from '../../src/types/clone';

describe('draftToL1Profile', () => {
  test('returns undefined when nothing entered', () => {
    expect(v_556c5b({} as v_c2a674)).toBeUndefined();
  });

  test('omits empty keys (PRD: 키 부재 = 미선택)', () => {
    const v_8d4337 = v_556c5b({
      personaAge: '30대',
      personaGender: '여성',
    } as v_c2a674);
    expect(v_8d4337).toEqual({ attrs: { age: '30대', gender: '여성' }, notes: '' });
  });

  test('joins personalities as CSV', () => {
    const v_8d4337 = v_556c5b({
      personaTypes: ['extrovert', 'passionate'],
    } as v_c2a674);
    expect(v_8d4337?.attrs.personalities).toBe('extrovert,passionate');
  });

  test('passes notes trimmed', () => {
    const v_8d4337 = v_556c5b({
      personaNotes: '  자유로운 사람  ',
    } as v_c2a674);
    expect(v_8d4337).toEqual({ attrs: {}, notes: '자유로운 사람' });
  });
});

describe('formatPersonaPrompt', () => {
  test('empty snapshot → placeholder', () => {
    expect(v_d6d0ff({})).toBe('(페르소나 정보가 비어 있음)');
  });

  test('renders name + meta + personalities + interests', () => {
    const v_c70495 = v_d6d0ff({
      name: '할머니',
      l1: { attrs: { age: '60대 이상', gender: '여성', mbti: 'ENFP', personalities: 'extrovert,calm' } },
      interests: ['요리', '텃밭'],
    });
    expect(v_c70495).toContain('할머니 (60대 이상, 여성, ENFP)');
    expect(v_c70495).toContain('성격: 외향적인, 평온한');
    expect(v_c70495).toContain('관심사: 요리, 텃밭');
  });

  test('mbti 모름 is omitted from header', () => {
    const v_c70495 = v_d6d0ff({
      name: '루나',
      l1: { attrs: { age: '20대', mbti: '모름' } },
    });
    expect(v_c70495).toContain('루나 (20대)');
    expect(v_c70495).not.toContain('모름');
  });

  test('relation label maps korean', () => {
    const v_c70495 = v_d6d0ff({ name: '엄마', relation: 'mother' });
    expect(v_c70495).toContain('고인과의 관계: 어머니');
  });

  test('notes appears as own paragraph', () => {
    const v_c70495 = v_d6d0ff({
      name: 'A',
      l1: { attrs: {}, notes: '말끝에 "아이고" 자주 붙임' },
    });
    expect(v_c70495).toMatch(/A\n\n말끝에/);
  });
});
