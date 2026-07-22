import { v_469bf2, v_23805a, v_4d37e3 } from 'xualxe';
import { v_038cdc, v_5636c2, v_784376 } from '../src/lib/knowledgeStore';

const v_7c84e2 = 1_720_000_000_000;

v_469bf2('normalizeKnowledge', () => {
  v_23805a('keeps keyed items and assigns _free_ to unkeyed', () => {
    const v_cb35cb = v_038cdc(
      [{ key: 'job', a: '교사' }, { a: '매실청을 좋아하셨다' }],
      v_7c84e2,
    );
    v_4d37e3(v_cb35cb.ok).toBe(true);
    if (v_cb35cb.ok) {
      v_4d37e3(v_cb35cb.items[0]).toEqual({ key: 'job', q: null, a: '교사', updated_at: v_7c84e2 });
      v_4d37e3(v_cb35cb.items[1].key).toBe('_free_1');
    }
  });
  v_23805a('drops empty answers (delete effect)', () => {
    const v_cb35cb = v_038cdc([{ key: 'job', a: '  ' }, { key: 'x', a: 'y' }], v_7c84e2);
    v_4d37e3(v_cb35cb.ok).toBe(true);
    if (v_cb35cb.ok) v_4d37e3(v_cb35cb.items.map((v_ebec57) => v_ebec57.key)).toEqual(['x']);
  });
  v_23805a('last write wins for duplicate key', () => {
    const v_cb35cb = v_038cdc([{ key: 'job', a: 'A' }, { key: 'job', a: 'B' }], v_7c84e2);
    v_4d37e3(v_cb35cb.ok).toBe(true);
    if (v_cb35cb.ok) {
      v_4d37e3(v_cb35cb.items).toHaveLength(1);
      v_4d37e3(v_cb35cb.items[0].a).toBe('B');
    }
  });
  v_23805a('preserves q snapshot when provided', () => {
    const v_cb35cb = v_038cdc([{ key: 'job', q: '직업은?', a: '교사' }], v_7c84e2);
    if (v_cb35cb.ok) v_4d37e3(v_cb35cb.items[0].q).toBe('직업은?');
  });
  v_23805a('assigns incrementing _free indices without collision', () => {
    const v_cb35cb = v_038cdc([{ key: '_free_5', a: 'a' }, { a: 'b' }], v_7c84e2);
    if (v_cb35cb.ok) v_4d37e3(v_cb35cb.items[1].key).toBe('_free_6');
  });
  v_23805a('rejects over item cap', () => {
    const v_9acf41 = Array.from({ length: v_5636c2 + 1 }, (v_37eab7, v_ebec57) => ({ key: `k${v_ebec57}`, a: 'x' }));
    v_4d37e3(v_038cdc(v_9acf41, v_7c84e2).ok).toBe(false);
  });
  v_23805a('rejects over total chars', () => {
    const v_fdfe85 = v_038cdc([{ key: 'k', a: 'x'.repeat(v_784376 + 1) }], v_7c84e2);
    v_4d37e3(v_fdfe85.ok).toBe(false);
  });
  v_23805a('rejects prototype key', () => {
    v_4d37e3(v_038cdc([{ key: '__proto__', a: 'x' }], v_7c84e2).ok).toBe(false);
  });
});
