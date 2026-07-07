
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { suggestGuideMents } from './guideMentSuggest.js';

test('LLM JSON 2~3개 파싱', async () => {
  const fakeChat = async () => JSON.stringify({ ments: ['어머 처음 뵙는 분이네요~', '성함이 어떻게…', '반가워요'] });
  const out = await suggestGuideMents({ persona: { personality_core: '따뜻함' } }, fakeChat);
  assert.ok(out.length >= 2 && out.length <= 3);
});

test('빈 배열/파싱실패 → 폴백 1개', async () => {
  const bad = async () => 'not json';
  const out = await suggestGuideMents({ persona: {} }, bad);
  assert.deepEqual(out, ['어? 누구세요?']);
});

test('4개 넘으면 3개로 clamp', async () => {
  const many = async () => JSON.stringify({ ments: ['a', 'b', 'c', 'd', 'e'] });
  const out = await suggestGuideMents({ persona: {} }, many);
  assert.equal(out.length, 3);
});
