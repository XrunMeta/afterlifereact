import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSuggestMessages, suggestPersonaChoices } from './personaSuggest.js';

test('buildSuggestMessages — 프로필+질문을 system/user 2메시지로', () => {
  const msgs = buildSuggestMessages({
    profile: { name: '할배', relation: '할아버지', age: '60대', personaTypes: ['감정적'] },
    questions: [{ key: 'tone', label: '말투?', options_include: ['사투리'] }],
  });
  assert.equal(msgs.length, 2);
  assert.ok(msgs[1].content.includes('할배'));
  assert.ok(msgs[1].content.includes('사투리')); 
});

test('suggestPersonaChoices — chatOnce 주입, key별 4후보 파싱', async () => {
  const fakeChatOnce = async ({ messages }) => {
    assert.equal(messages.length, 2);
    return '{"suggestions":{"tone":["느릿한 반말","정겨운 사투리","부드러운 말투","장난기 있는 말투"]}}';
  };
  const out = await suggestPersonaChoices(
    { profile: { name: '할배' }, questions: [{ key: 'tone', label: '말투?' }] },
    fakeChatOnce,
  );
  assert.deepEqual(out.tone.length, 4);
  assert.ok(out.tone.includes('정겨운 사투리'));
});

test('suggestPersonaChoices — 빈/깨진 응답이면 빈 객체(throw 안 함)', async () => {
  const fakeChatOnce = async () => 'not json';
  const out = await suggestPersonaChoices(
    { profile: {}, questions: [{ key: 'tone', label: '말투?' }] },
    fakeChatOnce,
  );
  assert.deepEqual(out, {});
});
