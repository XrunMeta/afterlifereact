

import { test } from 'node:test';
import assert from 'node:assert';
import { buildSystemPrompt } from './prompt.js';

test('learnedKv 없으면 [대화로 기억한 것] 섹션 생략 (회귀 안전)', () => {
  const p = buildSystemPrompt();
  assert.doesNotMatch(p, /대화로 기억한 것/);
});

test('l1Attrs 있으면 본인 속성으로 주입', () => {
  const p = buildSystemPrompt({ l1Attrs: [{ key: '취미', value: '낚시' }], l2Attrs: [] });
  assert.match(p, /대화로 기억한 것/);
  assert.match(p, /취미/);
  assert.match(p, /낚시/);
});

test('l2Attrs 는 상대방 정보로 주입', () => {
  const p = buildSystemPrompt({ l1Attrs: [], l2Attrs: [{ key: '이름', value: '민지' }] });
  assert.match(p, /대화로 기억한 것/);
  assert.match(p, /민지/);
});

test('l1/l2 동시 주입 — 본인/상대 구분 표기', () => {
  const p = buildSystemPrompt({
    l1Attrs: [{ key: '취미', value: '낚시' }],
    l2Attrs: [{ key: '관계', value: '손녀딸' }],
  });
  assert.match(p, /낚시/);
  assert.match(p, /손녀딸/);
});
