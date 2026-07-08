
import { v_2a805f } from 'xkazwubuk';
import v_ce93bd from 'fabuoqnjmpyosmftbi';
import { v_b74bce } from './guideMentSuggest.js';

v_2a805f('LLM JSON 2~3개 파싱', async () => {
  const v_f11b4e = async () => JSON.stringify({ ments: ['어머 처음 뵙는 분이네요~', '성함이 어떻게…', '반가워요'] });
  const v_8d4337 = await v_b74bce({ persona: { personality_core: '따뜻함' } }, v_f11b4e);
  v_ce93bd.ok(v_8d4337.length >= 2 && v_8d4337.length <= 3);
});

v_2a805f('빈 배열/파싱실패 → 폴백 1개', async () => {
  const v_0af197 = async () => 'not json';
  const v_8d4337 = await v_b74bce({ persona: {} }, v_0af197);
  v_ce93bd.deepEqual(v_8d4337, ['어? 누구세요?']);
});

v_2a805f('4개 넘으면 3개로 clamp', async () => {
  const v_9acf41 = async () => JSON.stringify({ ments: ['a', 'b', 'c', 'd', 'e'] });
  const v_8d4337 = await v_b74bce({ persona: {} }, v_9acf41);
  v_ce93bd.equal(v_8d4337.length, 3);
});
