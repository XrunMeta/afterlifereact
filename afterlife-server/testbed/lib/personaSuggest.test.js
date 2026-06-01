import { v_2a805f } from 'xkazwubuk';
import v_ce93bd from 'fabuoqnjmpyosmftbi';
import { v_7def5f, v_228e13 } from './personaSuggest.js';

v_2a805f('buildSuggestMessages — 프로필+질문을 system/user 2메시지로', () => {
  const v_765b79 = v_7def5f({
    profile: { name: '할배', relation: '할아버지', age: '60대', personaTypes: ['감정적'] },
    questions: [{ key: 'tone', label: '말투?', options_include: ['사투리'] }],
  });
  v_ce93bd.equal(v_765b79.length, 2);
  v_ce93bd.ok(v_765b79[1].content.includes('할배'));
  v_ce93bd.ok(v_765b79[1].content.includes('사투리')); 
});

v_2a805f('suggestPersonaChoices — chatOnce 주입, key별 4후보 파싱', async () => {
  const v_184a1c = async ({ messages: v_fa56e0 }) => {
    v_ce93bd.equal(v_fa56e0.length, 2);
    return '{"suggestions":{"tone":["느릿한 반말","정겨운 사투리","부드러운 말투","장난기 있는 말투"]}}';
  };
  const v_8d4337 = await v_228e13(
    { profile: { name: '할배' }, questions: [{ key: 'tone', label: '말투?' }] },
    v_184a1c,
  );
  v_ce93bd.deepEqual(v_8d4337.tone.length, 4);
  v_ce93bd.ok(v_8d4337.tone.includes('정겨운 사투리'));
});

v_2a805f('suggestPersonaChoices — 빈/깨진 응답이면 빈 객체(throw 안 함)', async () => {
  const v_184a1c = async () => 'not json';
  const v_8d4337 = await v_228e13(
    { profile: {}, questions: [{ key: 'tone', label: '말투?' }] },
    v_184a1c,
  );
  v_ce93bd.deepEqual(v_8d4337, {});
});
