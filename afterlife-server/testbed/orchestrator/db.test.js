import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openDb, insertCall, setPid, updateState, getCall, listActive, endCall, activePorts } from './db.js';

function freshDb() {
  return openDb(':memory:');
}

test('insertCall + getCall 왕복 (subscribe_token 포함)', () => {
  const db = freshDb();
  insertCall(db, { callId: 'c1', cloneId: '10', userId: '20', port: 8410, trackVideo: 'v-c1', trackAudio: 'a-c1', idleVideo: null, subscribeToken: 'tok-c1', now: 1000 });
  const row = getCall(db, 'c1');
  assert.equal(row.call_id, 'c1');
  assert.equal(row.port, 8410);
  assert.equal(row.state, 'starting');
  assert.equal(row.created_at, 1000);
  assert.equal(row.subscribe_token, 'tok-c1');
});

test('setPid / updateState 갱신', () => {
  const db = freshDb();
  insertCall(db, { callId: 'c1', cloneId: '1', userId: '2', port: 8411, trackVideo: 'v', trackAudio: 'a', idleVideo: null, subscribeToken: 'tk', now: 1 });
  setPid(db, 'c1', 4242);
  updateState(db, 'c1', 'live');
  const row = getCall(db, 'c1');
  assert.equal(row.pid, 4242);
  assert.equal(row.state, 'live');
});

test('activePorts 는 종료되지 않은 통화의 포트만', () => {
  const db = freshDb();
  insertCall(db, { callId: 'a', cloneId: '1', userId: '2', port: 8410, trackVideo: 'v', trackAudio: 'a', idleVideo: null, subscribeToken: 'tk', now: 1 });
  insertCall(db, { callId: 'b', cloneId: '1', userId: '2', port: 8411, trackVideo: 'v', trackAudio: 'a', idleVideo: null, subscribeToken: 'tk', now: 1 });
  endCall(db, 'b', 'done', 2);
  assert.deepEqual(activePorts(db).sort(), [8410]);
});

test('endCall 은 state=ended + ended_at + reason', () => {
  const db = freshDb();
  insertCall(db, { callId: 'a', cloneId: '1', userId: '2', port: 8410, trackVideo: 'v', trackAudio: 'a', idleVideo: null, subscribeToken: 'tk', now: 1 });
  endCall(db, 'a', 'orchestrator_restart', 99);
  const row = getCall(db, 'a');
  assert.equal(row.state, 'ended');
  assert.equal(row.ended_at, 99);
  assert.equal(row.reason, 'orchestrator_restart');
});

test('listActive 는 starting/live/ending 만 반환', () => {
  const db = freshDb();
  insertCall(db, { callId: 'a', cloneId: '1', userId: '2', port: 8410, trackVideo: 'v', trackAudio: 'a', idleVideo: null, subscribeToken: 'tk', now: 1 });
  insertCall(db, { callId: 'b', cloneId: '1', userId: '2', port: 8411, trackVideo: 'v', trackAudio: 'a', idleVideo: null, subscribeToken: 'tk', now: 1 });
  updateState(db, 'a', 'live');
  endCall(db, 'b', 'done', 2);
  const ids = listActive(db).map(r => r.call_id);
  assert.deepEqual(ids, ['a']);
});

test('getCall 없는 callId 는 null', () => {
  const db = freshDb();
  assert.equal(getCall(db, 'nope'), null);
});
