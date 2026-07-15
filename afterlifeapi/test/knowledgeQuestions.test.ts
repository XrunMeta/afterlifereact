import { describe, it, expect } from 'vitest';
import { validateKnowledgeQuestions } from '../src/lib/knowledgeQuestions';

describe('validateKnowledgeQuestions', () => {
  it('accepts valid question list', () => {
    const r = validateKnowledgeQuestions([
      { key: 'job', label: '생전 직업은?' },
      { key: 'family', label: '가족 관계는?', hint: '예: 2남 1녀', optional: true },
    ]);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.questions).toHaveLength(2);
  });
  it('rejects non-array', () => {
    expect(validateKnowledgeQuestions({}).ok).toBe(false);
  });
  it('rejects duplicate key', () => {
    const r = validateKnowledgeQuestions([
      { key: 'job', label: 'A' }, { key: 'job', label: 'B' },
    ]);
    expect(r.ok).toBe(false);
  });
  it('rejects bad key format', () => {
    expect(validateKnowledgeQuestions([{ key: 'a b', label: 'X' }]).ok).toBe(false);
  });
  it('rejects prototype-polluting key', () => {
    expect(validateKnowledgeQuestions([{ key: '__proto__', label: 'X' }]).ok).toBe(false);
  });
  it('rejects missing label', () => {
    expect(validateKnowledgeQuestions([{ key: 'job' }]).ok).toBe(false);
  });
  it('rejects too many questions', () => {
    const many = Array.from({ length: 51 }, (_, i) => ({ key: `k${i}`, label: 'L' }));
    expect(validateKnowledgeQuestions(many).ok).toBe(false);
  });
});
