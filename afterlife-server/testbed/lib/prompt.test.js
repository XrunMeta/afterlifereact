

import { test } from 'node:test';
import assert from 'node:assert';
import { buildSystemPrompt, personaToAttrs } from './prompt.js';

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

test('personaToAttrs converts PersonaDict to [{key,value}] skipping empties', () => {
  const attrs = personaToAttrs({ tone: '다정', personality_core: '낙천', mood_overrides: null, context: '' });
  const keys = attrs.map((a) => a.key);
  assert.ok(keys.includes('tone'));
  assert.ok(keys.includes('personality_core'));
  assert.ok(!keys.includes('mood_overrides')); 
  assert.ok(!keys.includes('context'));         
});

test('buildSystemPrompt places l0 rules at the very top', () => {
  const out = buildSystemPrompt({ l0: { rules_text: '금칙규칙ABC' }, l1Attrs: [{ key: 'tone', value: '다정' }] });
  assert.ok(out.indexOf('금칙규칙ABC') >= 0);
  assert.ok(out.indexOf('금칙규칙ABC') < out.indexOf('다정')); 
});

test('buildSystemPrompt without l0 still works (backward compat)', () => {
  const out = buildSystemPrompt({ l1Attrs: [{ key: 'tone', value: '다정' }] });
  assert.ok(typeof out === 'string' && out.length > 0);
  assert.ok(out.indexOf('다정') >= 0);
});

test('personaToAttrs — 사투리 메타를 tone 문장으로 합성', () => {
  const attrs = personaToAttrs({
    tone: '정겨운 말투',
    dialect_region: '경상도',
    dialect_intensity: '심함',
    personality_core: '정 많음',
  });
  const toneAttr = attrs.find((a) => a.key === 'tone');
  assert.ok(toneAttr.value.includes('경상도'));
  assert.ok(toneAttr.value.includes('심함') || toneAttr.value.includes('심한'));

  assert.equal(attrs.find((a) => a.key === 'dialect_region'), undefined);
});

test('personaToAttrs — 사투리 메타 없으면 tone 원문 유지', () => {
  const attrs = personaToAttrs({ tone: '차분한 말투', personality_core: '조용함' });
  assert.equal(attrs.find((a) => a.key === 'tone').value, '차분한 말투');
});

test('usedBundle=true 경로 — 동적 본문에 displayName 포함, 할배 고정 문구 없음', () => {
  const l1Attrs = [
    { key: 'displayName', value: '엄마' },
    { key: 'relation', value: '딸 (사용자)' },
    { key: 'personality_core', value: '다정하고 따뜻한' },
    { key: 'tone', value: '부드러운 중년 여성 말투' },
  ];
  const out = buildSystemPrompt({ l1Attrs, l2Attrs: [], usedBundle: true });
  assert.match(out, /엄마/);
  assert.match(out, /다정하고 따뜻한/);
  assert.match(out, /부드러운 중년 여성 말투/);

  assert.doesNotMatch(out, /어복쟁반/);
  assert.doesNotMatch(out, /1인칭은 "할배"/);
  assert.doesNotMatch(out, /손녀딸/);
});

test('usedBundle=true + l0 rules_text — l0가 본문 앞에', () => {
  const l1Attrs = [{ key: 'displayName', value: '아빠' }, { key: 'tone', value: '차분함' }];
  const out = buildSystemPrompt({ l0: { rules_text: '금칙RULE' }, l1Attrs, usedBundle: true });
  assert.ok(out.indexOf('금칙RULE') < out.indexOf('아빠'));
  assert.doesNotMatch(out, /어복쟁반/);
});

test('usedBundle=true + l1Attrs 비어있음 — 최소 중립 본문, 할배 fallback 없음', () => {
  const out = buildSystemPrompt({ l0: { rules_text: 'RULE' }, l1Attrs: [], usedBundle: true });
  assert.doesNotMatch(out, /어복쟁반/);
  assert.doesNotMatch(out, /1인칭은 "할배"/);
  assert.ok(out.length > 0);
});

test('usedBundle=false — 기존 buildLegacyBody 경로(회귀 안전)', () => {
  const out = buildSystemPrompt({ l1Attrs: [], usedBundle: false });

  assert.match(out, /할배/);
});
