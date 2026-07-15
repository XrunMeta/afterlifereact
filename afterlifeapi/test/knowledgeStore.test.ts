import { describe, it, expect } from 'vitest';
import { normalizeKnowledge, KNOWLEDGE_MAX_ITEMS } from '../src/lib/knowledgeStore';

const NOW = 1_720_000_000_000;

describe('normalizeKnowledge', () => {
  it('keeps keyed items and assigns _free_ to unkeyed', () => {
    const r = normalizeKnowledge(
      [{ key: 'job', a: '교사' }, { a: '매실청을 좋아하셨다' }],
      NOW,
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.items[0]).toEqual({ key: 'job', q: null, a: '교사', updated_at: NOW });
      expect(r.items[1].key).toBe('_free_1');
    }
  });
  it('drops empty answers (delete effect)', () => {
    const r = normalizeKnowledge([{ key: 'job', a: '  ' }, { key: 'x', a: 'y' }], NOW);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.items.map((i) => i.key)).toEqual(['x']);
  });
  it('last write wins for duplicate key', () => {
    const r = normalizeKnowledge([{ key: 'job', a: 'A' }, { key: 'job', a: 'B' }], NOW);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.items).toHaveLength(1);
      expect(r.items[0].a).toBe('B');
    }
  });
  it('preserves q snapshot when provided', () => {
    const r = normalizeKnowledge([{ key: 'job', q: '직업은?', a: '교사' }], NOW);
    if (r.ok) expect(r.items[0].q).toBe('직업은?');
  });
  it('assigns incrementing _free indices without collision', () => {
    const r = normalizeKnowledge([{ key: '_free_5', a: 'a' }, { a: 'b' }], NOW);
    if (r.ok) expect(r.items[1].key).toBe('_free_6');
  });
  it('rejects over item cap', () => {
    const many = Array.from({ length: KNOWLEDGE_MAX_ITEMS + 1 }, (_, i) => ({ key: `k${i}`, a: 'x' }));
    expect(normalizeKnowledge(many, NOW).ok).toBe(false);
  });
  it('rejects over total chars', () => {
    const big = normalizeKnowledge([{ key: 'k', a: 'x'.repeat(3001) }], NOW);
    expect(big.ok).toBe(false);
  });
  it('rejects prototype key', () => {
    expect(normalizeKnowledge([{ key: '__proto__', a: 'x' }], NOW).ok).toBe(false);
  });
});
