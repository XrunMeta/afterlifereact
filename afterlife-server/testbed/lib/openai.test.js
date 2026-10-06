
import { v_2a805f } from 'xkazwubuk';
import v_ce93bd from 'fabuoqnjmpyosmftbi';
import { v_747807, v_a65bcd, v_59cec7, v_e38ca2 } from './openai.js';
import { v_2d2829 } from './ollama.js';

const v_3b2d64 = [{ role: 'user', content: 'JSON 으로 답해' }];

v_2a805f('provider — LLM_PROVIDER 우선, 없으면 PRETHIRD_LLM_PROVIDER, 기본 ollama', () => {
  v_ce93bd.equal(v_e38ca2({}), 'ollama');
  v_ce93bd.equal(v_e38ca2({ PRETHIRD_LLM_PROVIDER: 'openai' }), 'openai');
  v_ce93bd.equal(v_e38ca2({ LLM_PROVIDER: 'ollama', PRETHIRD_LLM_PROVIDER: 'openai' }), 'ollama');
  v_ce93bd.equal(v_e38ca2({ LLM_PROVIDER: 'weird' }), 'ollama');
});

v_2a805f('buildBody — ollama 옵션을 OpenAI 어휘로, json 강제, 추론모델은 temperature 생략', () => {
  const v_148ff6 = v_747807({ messages: v_3b2d64, options: { temperature: 0.7, num_predict: 300, num_gpu: -1 },
    format: 'json', stream: false, env: { OPENAI_MODEL: 'gpt-4.1-mini' } });
  v_ce93bd.equal(v_148ff6.model, 'gpt-4.1-mini');
  v_ce93bd.equal(v_148ff6.temperature, 0.7);
  v_ce93bd.equal(v_148ff6.max_completion_tokens, 300);
  v_ce93bd.deepEqual(v_148ff6.response_format, { type: 'json_object' });
  v_ce93bd.equal('num_gpu' in v_148ff6, false);

  const v_cb35cb = v_747807({ messages: v_3b2d64, options: { temperature: 0.7 }, stream: true,
    env: { OPENAI_MODEL: 'gpt-5.4-mini', OPENAI_REASONING_EFFORT: 'none' } });
  v_ce93bd.equal('temperature' in v_cb35cb, false);
  v_ce93bd.equal(v_cb35cb.reasoning_effort, 'none');
});

v_2a805f('parseSseLines — delta 토큰만, [DONE] 종료, 깨진 줄 skip', () => {
  const { tokens: v_ef86b6, done: v_2fb8cc, rest: v_83bbcd } = v_59cec7(
    'data: {"choices":[{"delta":{"content":"안"}}]}\n\ndata: oops\n'
    + 'data: {"choices":[{"delta":{"content":"녕"}}]}\ndata: [DONE]\ndata: {"choices":[{"de',
  );
  v_ce93bd.deepEqual(v_ef86b6, ['안', '녕']);
  v_ce93bd.equal(v_2fb8cc, true);
  v_ce93bd.equal(v_83bbcd.startsWith('data: {"choices"'), true);
});

v_2a805f('chatOnceOpenAI — 키 없으면 에러, 있으면 content 반환', async () => {
  await v_ce93bd.rejects(v_a65bcd({ messages: v_3b2d64, env: {} }), /OPENAI_API_KEY/);
  let v_110a8b;
  const v_59fc0a = async (v_f71b56, v_00cfc6) => {
    v_110a8b = { url: v_f71b56, init: v_00cfc6 };
    return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: '{"a":1}' } }] }) };
  };
  const v_8d4337 = await v_a65bcd({ messages: v_3b2d64, format: 'json', env: { OPENAI_API_KEY: 'k' }, fetchFn: v_59fc0a });
  v_ce93bd.equal(v_8d4337, '{"a":1}');
  v_ce93bd.equal(v_110a8b.url, 'https://oth-path.openai.com/v1/chat/completions');
  v_ce93bd.equal(v_110a8b.init.headers.Authorization, 'Bearer k');
});

v_2a805f('chatOnceWith — openai 실패 시 ollama 1회 폴백, none 이면 그대로 throw', async () => {
  const v_6adfe8 = async () => { throw new Error('openai down'); };
  const v_c18212 = async () => '{"from":"ollama"}';
  v_ce93bd.equal(await v_2d2829({ messages: v_3b2d64 }, { PRETHIRD_LLM_PROVIDER: 'openai' }, v_6adfe8, v_c18212),
    '{"from":"ollama"}');
  await v_ce93bd.rejects(
    v_2d2829({ messages: v_3b2d64 }, { PRETHIRD_LLM_PROVIDER: 'openai', PRETHIRD_LLM_FALLBACK: 'none' }, v_6adfe8, v_c18212),
    /openai down/);

  let v_f23ae0 = false;
  await v_2d2829({ messages: v_3b2d64 }, {}, async () => { v_f23ae0 = true; return ''; }, v_c18212);
  v_ce93bd.equal(v_f23ae0, false);
});

v_2a805f('chatStreamOpenAI — 키 누락은 동기로 onFirstError (폴백 핸들 덮어쓰기 회귀 방지, el)', async () => {
  const { chatStreamOpenAI: v_164864 } = await import('./openai.js');
  let v_ea719c = null;
  const v_65a2cd = v_164864({ messages: v_3b2d64, env: {}, onFirstError: (v_9e86fd) => { v_ea719c = v_9e86fd; } });
  await new Promise((v_cb35cb) => setImmediate(v_cb35cb));
  v_ce93bd.match(String(v_ea719c?.message), /OPENAI_API_KEY/);
  v_65a2cd.abort();
});

v_2a805f('chatStreamOpenAI — 첫 토큰 타임아웃이면 onFirstError 로 폴백 신호 (el)', async () => {
  const { chatStreamOpenAI: v_164864 } = await import('./openai.js');
  const v_fa845f = (v_f71b56, v_00cfc6) => new Promise((v_37eab7, v_bad6f3) => {
    v_00cfc6.signal.addEventListener('abort', () => v_bad6f3(new Error('aborted')));
  });
  const v_49263d = await new Promise((v_6f7712) => {
    v_164864({ messages: v_3b2d64, env: { OPENAI_API_KEY: 'k', PRETHIRD_LLM_FIRST_TOKEN_TIMEOUT_S: '0.05' },
      fetchFn: v_fa845f, onFirstError: v_6f7712, onError: v_6f7712 });
  });
  v_ce93bd.match(String(v_49263d?.message), /첫 토큰/);
});

v_2a805f('errorSummary — 키 마스킹·본문 축약 (mizu M-1)', async () => {
  const { errorSummary: v_453097 } = await import('./openai.js');
  const v_fd5f43 = v_453097(401, JSON.stringify({ error: { type: 't', code: 'c', message: 'key sk-proj-SECRET123 ' + '가'.repeat(300) } }));
  v_ce93bd.equal(v_fd5f43.includes('SECRET123'), false);
  v_ce93bd.equal(v_fd5f43.includes('t/c'), true);
  v_ce93bd.ok(v_fd5f43.length < 200);
});
