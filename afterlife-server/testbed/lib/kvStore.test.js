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
