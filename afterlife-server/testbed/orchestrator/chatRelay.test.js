import { test } from 'node:test';
import assert from 'node:assert/strict';
import { consumeSseFinalText, runChatRelay } from './chatRelay.js';

test('consumeSseFinalText: chunk 누적 → done 시 최종 텍스트', () => {
  const sse = ['event: chunk', 'data: {"text":"안"}', '', 'event: chunk', 'data: {"text":"녕"}', '', 'event: done', 'data: {"done_reason":"stop"}', ''].join('\n');
  assert.equal(consumeSseFinalText(sse), '안녕');
});

test('runChatRelay: testbed 호출(인자 전달) → 콜백으로 최종텍스트 전달', async () => {
  const calls = { chat: null, callback: null };
  const deps = {
    fetchChat: async (body) => { calls.chat = body; return 'event: chunk\ndata: {"text":"왔는가"}\n\nevent: done\ndata: {"done_reason":"stop"}\n\n'; },
    postTurnCallback: async (callId, payload) => { calls.callback = { callId, payload }; },
  };
  await runChatRelay(deps, { callId: 'c1', publisherPort: 8412, personaSlug: 'halbae', history: [{ role: 'user', content: '안녕' }], text: '안녕' });
  assert.equal(calls.chat.publisherPort, 8412);
  assert.equal(calls.chat.message, '안녕');
  assert.equal(calls.chat.persona_slug, 'halbae');
  assert.deepEqual(calls.callback, { callId: 'c1', payload: { role: 'clone', text: '왔는가' } });
});

test('runChatRelay: 콜백 실패는 best-effort(throw 안 함)', async () => {
  const deps = { fetchChat: async () => 'event: done\ndata: {"done_reason":"stop"}\n\n', postTurnCallback: async () => { throw new Error('api down'); } };
  await assert.doesNotReject(() => runChatRelay(deps, { callId: 'c1', publisherPort: 8412, personaSlug: 'halbae', history: [], text: 'x' }));
});
