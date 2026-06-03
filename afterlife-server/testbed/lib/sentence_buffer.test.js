

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSentenceBuffer } from './sentence_buffer.js';

test('마침표로 문장 분리', () => {
  const sb = createSentenceBuffer();
  const out = sb.feed('밥은 잘 먹고 다니냐? 오늘 날씨 참 좋다.');
  assert.deepEqual(out, ['밥은 잘 먹고 다니냐?', '오늘 날씨 참 좋다.']);
});

test('MIN_LEN 미만 짧은 첫 조각은 끊기지 않고 누적된다 (근본원인 재현)', () => {

  const sb = createSentenceBuffer();
  const out = sb.feed('허허, ');
  assert.deepEqual(out, [], '짧은 조각은 즉시 방출되지 않아야 한다');
  assert.equal(sb.peek(), '허허, ');
});

test('FORCE_FLUSH 도달 전까지 큰 sentence 로 누적된다 (기본 30)', () => {

  const sb = createSentenceBuffer();
  const out = sb.feed('허허, 우리 손녀딸 ');

  assert.deepEqual(out, []);

  const out2 = sb.feed('할배가 오늘 점심은 백로식당에서 어복쟁반 먹었어 ');
  assert.ok(out2.length >= 1, '30자 초과 시 강제 flush 되어야 한다');
  assert.ok(out2[0].length >= 12, '기본 forceFlush 에서 첫 piece 가 길다 (병목)');
});

test('작은 forceFlush 는 짧은 sentence 를 만든다 (튜닝 레버)', () => {

  const sb = createSentenceBuffer({ minLen: 2, forceFlush: 12 });
  const out = sb.feed('허허, 우리 손녀딸이 갑자기 그걸 물어보네');
  assert.ok(out.length >= 1, '작은 forceFlush 에서 조기 방출되어야 한다');
  assert.ok(out[0].length <= 12, `첫 piece 가 짧아야 한다 (got: "${out[0]}")`);
});

test('작은 minLen 은 짧은 감탄사를 독립 방출한다', () => {

  const sb = createSentenceBuffer({ minLen: 2, forceFlush: 30 });
  const out = sb.feed('허허, 우리 손녀딸이야.');
  assert.equal(out[0], '허허,', 'minLen 낮추면 짧은 첫 조각이 즉시 방출된다');
});

test('flush 는 잔여 buffer 를 반환하고 비운다', () => {
  const sb = createSentenceBuffer();
  sb.feed('끝맺음 없는 잔여');
  assert.deepEqual(sb.flush(), ['끝맺음 없는 잔여']);
  assert.equal(sb.peek(), '');
});
