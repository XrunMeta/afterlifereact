
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildIntroMessages, suggestIntro } from './introSuggest.js';

test('buildIntroMessages — 프로필을 system/user 2메시지로', () => {
  const msgs = buildIntroMessages({
    profile: { name: '할배', relation: 'grandfather', personaAnswers: { personality_core: '정 많음', tone: '정겨운 사투리', first_meeting: '어릴 적 시골집' } },
  });
  assert.equal(msgs.length, 2);
  assert.ok(msgs[1].content.includes('할배'));
  assert.ok(msgs[1].content.includes('정겨운 사투리'));
});

test('suggestIntro — chatOnce 주입, 소개글+해시태그 텍스트 반환', async () => {
  const fakeChatOnce = async ({ messages }) => {
    assert.equal(messages.length, 2);
    return '정 많고 느긋한 할아버지예요. 늘 밥은 먹었냐 물어보셨죠. #추모 #할아버지 #사투리';
  };
  const intro = await suggestIntro({ profile: { name: '할배' } }, fakeChatOnce);
  assert.ok(intro.includes('#추모'));
  assert.ok(intro.length > 0 && intro.length <= 300);
});

test('suggestIntro — 빈/실패 응답이면 빈 문자열(throw 안 함)', async () => {
  const fail = async () => { throw new Error('ollama down'); };
  assert.equal(await suggestIntro({ profile: {} }, fail), '');
  const empty = async () => '   ';
  assert.equal(await suggestIntro({ profile: {} }, empty), '');
});

test('suggestIntro — 300자 초과 시 마지막 완전 토큰까지만(해시태그 중간 잘림 없음)', async () => {

  const body = '가'.repeat(280);
  const tag = '#해시태그가잘릴수있는긴단어';
  const longRaw = `${body} ${tag}`; 
  const fakeLong = async () => longRaw;
  const intro = await suggestIntro({ profile: {} }, fakeLong);

  assert.ok(intro.length <= 300, `길이 초과: ${intro.length}`);

  const tokens = intro.split(' ');
  const last = tokens[tokens.length - 1];

  assert.ok(last !== '#', `마지막 토큰이 '#' 단독: "${last}"`);

  if (last.startsWith('#')) {
    assert.equal(last, tag, `불완전 해시태그 잔존: "${last}"`);
  }
});
