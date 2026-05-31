import { v_2a805f } from 'xkazwubuk';
import v_ce93bd from 'fabuoqnjmpyosmftbi';
import { v_472dcb, v_3a60ca } from './chatRelay.js';

v_2a805f('consumeSseFinalText: chunk 누적 → done 시 최종 텍스트', () => {
  const v_bb2632 = ['event: chunk', 'data: {"text":"안"}', '', 'event: chunk', 'data: {"text":"녕"}', '', 'event: done', 'data: {"done_reason":"stop"}', ''].join('\n');
  v_ce93bd.equal(v_472dcb(v_bb2632), '안녕');
});

v_2a805f('runChatRelay: testbed 호출(인자 전달) → 콜백으로 최종텍스트 전달', async () => {
  const v_20e160 = { chat: null, callback: null };
  const v_84b93d = {
    fetchChat: async (v_4d33b2) => { v_20e160.chat = v_4d33b2; return 'event: chunk\ndata: {"text":"왔는가"}\n\nevent: done\ndata: {"done_reason":"stop"}\n\n'; },
    postTurnCallback: async (v_be62d3, v_931bf0) => { v_20e160.callback = { callId: v_be62d3, payload: v_931bf0 }; },
  };
  await v_3a60ca(v_84b93d, { callId: 'c1', publisherPort: 8412, personaSlug: 'halbae', history: [{ role: 'user', content: '안녕' }], text: '안녕' });
  v_ce93bd.equal(v_20e160.chat.publisherPort, 8412);
  v_ce93bd.equal(v_20e160.chat.message, '안녕');
  v_ce93bd.equal(v_20e160.chat.persona_slug, 'halbae');
  v_ce93bd.deepEqual(v_20e160.callback, { callId: 'c1', payload: { role: 'clone', text: '왔는가' } });
});

v_2a805f('runChatRelay: 콜백 실패는 best-effort(throw 안 함)', async () => {
  const v_84b93d = { fetchChat: async () => 'event: done\ndata: {"done_reason":"stop"}\n\n', postTurnCallback: async () => { throw new Error('api down'); } };
  await v_ce93bd.doesNotReject(() => v_3a60ca(v_84b93d, { callId: 'c1', publisherPort: 8412, personaSlug: 'halbae', history: [], text: 'x' }));
});
