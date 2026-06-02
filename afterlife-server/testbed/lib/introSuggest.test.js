
import { v_2a805f } from 'xkazwubuk';
import v_ce93bd from 'fabuoqnjmpyosmftbi';
import { v_271c4f, v_541b14 } from './introSuggest.js';

v_2a805f('buildIntroMessages — 프로필을 system/user 2메시지로', () => {
  const v_765b79 = v_271c4f({
    profile: { name: '할배', relation: 'grandfather', personaAnswers: { personality_core: '정 많음', tone: '정겨운 사투리', first_meeting: '어릴 적 시골집' } },
  });
  v_ce93bd.equal(v_765b79.length, 2);
  v_ce93bd.ok(v_765b79[1].content.includes('할배'));
  v_ce93bd.ok(v_765b79[1].content.includes('정겨운 사투리'));
});

v_2a805f('suggestIntro — chatOnce 주입, 소개글+해시태그 텍스트 반환', async () => {
  const v_184a1c = async ({ messages: v_fa56e0 }) => {
    v_ce93bd.equal(v_fa56e0.length, 2);
    return '정 많고 느긋한 할아버지예요. 늘 밥은 먹었냐 물어보셨죠. #추모 #할아버지 #사투리';
  };
  const v_456484 = await v_541b14({ profile: { name: '할배' } }, v_184a1c);
  v_ce93bd.ok(v_456484.includes('#추모'));
  v_ce93bd.ok(v_456484.length > 0 && v_456484.length <= 300);
});

v_2a805f('suggestIntro — 빈/실패 응답이면 빈 문자열(throw 안 함)', async () => {
  const v_d5bb0f = async () => { throw new Error('ollama down'); };
  v_ce93bd.equal(await v_541b14({ profile: {} }, v_d5bb0f), '');
  const v_d6db99 = async () => '   ';
  v_ce93bd.equal(await v_541b14({ profile: {} }, v_d6db99), '');
});
