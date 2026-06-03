import { test } from 'node:test';
import assert from 'node:assert';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const TMP = path.join(os.tmpdir(), `turns-test-${process.pid}-${Date.now()}.db`);
process.env.TURNS_DB_PATH = TMP;
const { recordTurn, recentTurns, getTurn } = await import('./logger.js');

test.after(() => {
  for (const ext of ['', '-wal', '-shm']) {
    try { fs.unlinkSync(TMP + ext); } catch {}
  }
});

test('recordTurn → recentTurns 라운드트립', () => {
  const id = recordTurn({
    session_id: 'abc', mode: 'stream', user_text: 'hi', llm_text: 'yo',
    e2e_ms: 1234, mt_whisper_ms: 40, raw_json: '{"x":1}',
  });
  assert.ok(typeof id === 'number' && id > 0);
  const rows = recentTurns({ limit: 10 });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].session_id, 'abc');
  assert.equal(rows[0].e2e_ms, 1234);
  assert.equal(rows[0].mt_whisper_ms, 40);
});

test('sinceId 커서 — 그 이후 행만', () => {
  const id1 = recordTurn({ session_id: 's1' });
  recordTurn({ session_id: 's2' });
  const rows = recentTurns({ sinceId: id1 });
  assert.ok(rows.length >= 1);
  assert.ok(rows.every((r) => r.id > id1));
});

test('recentTurns 는 raw_json 미포함, getTurn 은 포함', () => {
  const id = recordTurn({ session_id: 'r', raw_json: '{"k":9}' });
  const listRow = recentTurns({ limit: 50 }).find((r) => r.id === id);
  assert.equal(listRow.raw_json, undefined);
  const full = getTurn(id);
  assert.equal(full.raw_json, '{"k":9}');
});

test('누락 필드는 null, throw 안 함', () => {
  const id = recordTurn({ session_id: 'partial' });
  assert.ok(id > 0);
  assert.equal(getTurn(id).mt_unet_ms, null);
});

test('getTurn 없는 id → null', () => {
  assert.equal(getTurn(999999), null);
});

test('신규 컬럼 source/speaker_role/user_label/persona_slug 라운드트립', () => {
  const id = recordTurn({ session_id: 'kv1', source: 'agent', speaker_role: 'visitor',
    user_label: 'visB', persona_slug: 'halbae' });
  const full = getTurn(id);
  assert.equal(full.source, 'agent');
  assert.equal(full.speaker_role, 'visitor');
  assert.equal(full.user_label, 'visB');
  assert.equal(full.persona_slug, 'halbae');
});
