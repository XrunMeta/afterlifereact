import { v_469bf2, v_23805a, v_4d37e3 } from 'xualxe';
import { v_4db5dd } from '../src/lib/knowledgeQuestions';

v_469bf2('validateKnowledgeQuestions', () => {
  v_23805a('accepts valid question list', () => {
    const v_cb35cb = v_4db5dd([
      { key: 'job', label: '생전 직업은?' },
      { key: 'family', label: '가족 관계는?', hint: '예: 2남 1녀', optional: true },
    ]);
    v_4d37e3(v_cb35cb.ok).toBe(true);
    if (v_cb35cb.ok) v_4d37e3(v_cb35cb.questions).toHaveLength(2);
  });
  v_23805a('rejects non-array', () => {
    v_4d37e3(v_4db5dd({}).ok).toBe(false);
  });
  v_23805a('rejects duplicate key', () => {
    const v_cb35cb = v_4db5dd([
      { key: 'job', label: 'A' }, { key: 'job', label: 'B' },
    ]);
    v_4d37e3(v_cb35cb.ok).toBe(false);
  });
  v_23805a('rejects bad key format', () => {
    v_4d37e3(v_4db5dd([{ key: 'a b', label: 'X' }]).ok).toBe(false);
  });
  v_23805a('rejects prototype-polluting key', () => {
    v_4d37e3(v_4db5dd([{ key: '__proto__', label: 'X' }]).ok).toBe(false);
  });
  v_23805a('rejects missing label', () => {
    v_4d37e3(v_4db5dd([{ key: 'job' }]).ok).toBe(false);
  });
  v_23805a('rejects too many questions', () => {
    const v_9acf41 = Array.from({ length: 51 }, (v_37eab7, v_ebec57) => ({ key: `k${v_ebec57}`, label: 'L' }));
    v_4d37e3(v_4db5dd(v_9acf41).ok).toBe(false);
  });
});
