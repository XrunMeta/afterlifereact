import { test } from 'node:test';
import assert from 'node:assert';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const TMP = path.join(os.tmpdir(), `learning-test-${process.pid}-${Date.now()}.db`);
process.env.LEARNING_DB_PATH = TMP;
const kv = await import('./kvStore.js');

test.after(() => {
  for (const ext of ['', '-wal', '-shm']) { try { fs.unlinkSync(TMP + ext); } catch {} }
});

test('CATEGORIES export + 빈 조회는 빈 배열', () => {
  assert.ok(Array.isArray(kv.CATEGORIES) && kv.CATEGORIES.includes('misc'));
  const rows = kv.getAttrsFor({ persona_slug: 'halbae', level: 'l1' });
  assert.deepEqual(rows, []);
});

test('add → getAttrsFor 반영, history add 1행', () => {
  const ctx = { persona_slug: 'p1', level: 'l1', user_label: 'creator-test', source_turn_id: 10 };
  const res = kv.applyOps(ctx, [{ op: 'add', category: 'preference', key: '취미', value: '낚시', confidence: 0.9, reason: 't' }]);
  assert.equal(res.applied, 1);
  const rows = kv.getAttrsFor({ persona_slug: 'p1', level: 'l1' });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].value, '낚시');
  const hist = kv.getHistory(rows[0].id);
  assert.equal(hist.length, 1);
  assert.equal(hist[0].op, 'add');
});

test('같은 격리키 add 재호출 → update 전환(중복 없음), source_turn_id 갱신', () => {
  const ctx = { persona_slug: 'p2', level: 'l1', source_turn_id: 1 };
  kv.applyOps(ctx, [{ op: 'add', category: 'preference', key: '취미', value: '낚시' }]);
  kv.applyOps({ ...ctx, source_turn_id: 2 }, [{ op: 'add', category: 'preference', key: '취미', value: '등산' }]);
  const rows = kv.getAttrsFor({ persona_slug: 'p2', level: 'l1' });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].value, '등산');
  assert.equal(rows[0].source_turn_id, 2);
});

test('update by target_id → value 갱신 + history old/new', () => {
  const ctx = { persona_slug: 'p3', level: 'l1', source_turn_id: 1 };
  kv.applyOps(ctx, [{ op: 'add', category: 'health', key: '상태', value: '건강' }]);
  const id = kv.getAttrsFor({ persona_slug: 'p3', level: 'l1' })[0].id;
  kv.applyOps({ ...ctx, source_turn_id: 5 }, [{ op: 'update', target_id: id, value: '무릎통증', reason: '정정' }]);
  const row = kv.getAttrsFor({ persona_slug: 'p3', level: 'l1' })[0];
  assert.equal(row.value, '무릎통증');
  const hist = kv.getHistory(id);
  assert.equal(hist.at(-1).op, 'update');
  assert.equal(hist.at(-1).old_value, '건강');
  assert.equal(hist.at(-1).new_value, '무릎통증');
});

test('delete by target_id → 조회에서 사라짐(soft), history delete', () => {
  const ctx = { persona_slug: 'p4', level: 'l1', source_turn_id: 1 };
  kv.applyOps(ctx, [{ op: 'add', category: 'misc', key: 'k', value: 'v' }]);
  const id = kv.getAttrsFor({ persona_slug: 'p4', level: 'l1' })[0].id;
  kv.applyOps(ctx, [{ op: 'delete', target_id: id, reason: '부정' }]);
  assert.equal(kv.getAttrsFor({ persona_slug: 'p4', level: 'l1' }).length, 0);
  assert.equal(kv.getHistory(id).at(-1).op, 'delete');
});

test('L2 는 user_label 로 격리 — 다른 visitor 는 같은 key 공존', () => {
  const base = { persona_slug: 'p5', level: 'l2', source_turn_id: 1 };
  kv.applyOps({ ...base, user_label: 'visA' }, [{ op: 'add', category: 'relationship', key: '관계', value: '손자' }]);
  kv.applyOps({ ...base, user_label: 'visB' }, [{ op: 'add', category: 'relationship', key: '관계', value: '이웃' }]);
  assert.equal(kv.getAttrsFor({ persona_slug: 'p5', level: 'l2', user_label: 'visA' })[0].value, '손자');
  assert.equal(kv.getAttrsFor({ persona_slug: 'p5', level: 'l2', user_label: 'visB' })[0].value, '이웃');
});

test('update target_id 소유권 위반 → 거부(applied 0)', () => {
  const res = kv.applyOps({ persona_slug: 'pX', level: 'l1', source_turn_id: 1 },
    [{ op: 'update', target_id: 999999, value: 'x' }]);
  assert.equal(res.applied, 0);
  assert.equal(res.rejected, 1);
});

test('L2 격리 침범 — 다른 user_label ctx 로 update/delete 거부', () => {
  const a = { persona_slug: 'p6', level: 'l2', user_label: 'owner', source_turn_id: 1 };
  kv.applyOps(a, [{ op: 'add', category: 'relationship', key: '관계', value: '손자' }]);
  const id = kv.getAttrsFor({ persona_slug: 'p6', level: 'l2', user_label: 'owner' })[0].id;
  const other = { persona_slug: 'p6', level: 'l2', user_label: 'intruder', source_turn_id: 2 };
  const up = kv.applyOps(other, [{ op: 'update', target_id: id, value: 'x' }]);
  assert.equal(up.rejected, 1);
  const del = kv.applyOps(other, [{ op: 'delete', target_id: id }]);
  assert.equal(del.rejected, 1);

  assert.equal(kv.getAttrsFor({ persona_slug: 'p6', level: 'l2', user_label: 'owner' })[0].value, '손자');
});
