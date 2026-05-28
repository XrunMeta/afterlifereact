import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openDb, insertCall, endCall } from './db.js';
import { allocatePort } from './portPool.js';

function ins(db, callId, port) {
  insertCall(db, { callId, cloneId: '1', userId: '2', port, trackVideo: 'v', trackAudio: 'a', idleVideo: null, subscribeToken: 'tk', now: 1 });
}

test('빈 레지스트리는 base 포트 할당', () => {
  const db = openDb(':memory:');
  assert.equal(allocatePort(db, 8410, 30), 8410);
});

test('사용 중 포트는 건너뛰고 최소 빈 포트', () => {
  const db = openDb(':memory:');
  ins(db, 'a', 8410);
  assert.equal(allocatePort(db, 8410, 30), 8411);
});

test('종료된 통화 포트는 재사용', () => {
  const db = openDb(':memory:');
  ins(db, 'a', 8410);
  endCall(db, 'a', 'done', 2);
  assert.equal(allocatePort(db, 8410, 30), 8410);
});

test('가용 포트 없으면 null', () => {
  const db = openDb(':memory:');
  ins(db, 'a', 8410);
  ins(db, 'b', 8411);
  assert.equal(allocatePort(db, 8410, 2), null);
});
