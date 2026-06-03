import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSayStore } from './sayStore.js';

test('history append/get — callId별 격리', () => {
  const s = createSayStore();
  s.appendTurn('c1', { role: 'user', content: '안녕' });
  s.appendTurn('c1', { role: 'assistant', content: '왔는가' });
  s.appendTurn('c2', { role: 'user', content: 'hi' });
  assert.deepEqual(s.getHistory('c1'), [
    { role: 'user', content: '안녕' }, { role: 'assistant', content: '왔는가' },
  ]);
  assert.deepEqual(s.getHistory('c2'), [{ role: 'user', content: 'hi' }]);
  assert.deepEqual(s.getHistory('none'), []);
});

test('turn-in-progress 가드: begin 성공 1회, 진행 중 재진입 실패', () => {
  const s = createSayStore();
  assert.equal(s.beginTurn('c1'), true);
  assert.equal(s.beginTurn('c1'), false);
  s.endTurn('c1');
  assert.equal(s.beginTurn('c1'), true);
});

test('clear: 통화 종료 시 history+상태 폐기', () => {
  const s = createSayStore();
  s.appendTurn('c1', { role: 'user', content: 'x' });
  s.beginTurn('c1');
  s.clear('c1');
  assert.deepEqual(s.getHistory('c1'), []);
  assert.equal(s.beginTurn('c1'), true);
});

test('seq: appendTurn 단조증가 seq 반환', () => {
  const s = createSayStore();
  assert.equal(s.appendTurn('c1', { role: 'user', content: 'a' }), 1);
  assert.equal(s.appendTurn('c1', { role: 'assistant', content: 'b' }), 2);
});
