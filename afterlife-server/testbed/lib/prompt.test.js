

import { v_2a805f } from 'xkazwubuk';
import v_ce93bd from 'qsfgtyjdckh';
import { v_841e05, v_ea9c84 } from './prompt.js';

v_2a805f('learnedKv 없으면 [대화로 기억한 것] 섹션 생략 (회귀 안전)', () => {
  const v_e2a85c = v_841e05();
  v_ce93bd.doesNotMatch(v_e2a85c, /대화로 기억한 것/);
});

v_2a805f('l1Attrs 있으면 본인 속성으로 주입', () => {
  const v_e2a85c = v_841e05({ l1Attrs: [{ key: '취미', value: '낚시' }], l2Attrs: [] });
  v_ce93bd.match(v_e2a85c, /대화로 기억한 것/);
  v_ce93bd.match(v_e2a85c, /취미/);
  v_ce93bd.match(v_e2a85c, /낚시/);
});

v_2a805f('l2Attrs 는 상대방 정보로 주입', () => {
  const v_e2a85c = v_841e05({ l1Attrs: [], l2Attrs: [{ key: '이름', value: '민지' }] });
  v_ce93bd.match(v_e2a85c, /대화로 기억한 것/);
  v_ce93bd.match(v_e2a85c, /민지/);
});

v_2a805f('l1/l2 동시 주입 — 본인/상대 구분 표기', () => {
  const v_e2a85c = v_841e05({
    l1Attrs: [{ key: '취미', value: '낚시' }],
    l2Attrs: [{ key: '관계', value: '손녀딸' }],
  });
  v_ce93bd.match(v_e2a85c, /낚시/);
  v_ce93bd.match(v_e2a85c, /손녀딸/);
});

v_2a805f('personaToAttrs converts PersonaDict to [{key,value}] skipping empties', () => {
  const v_3555ae = v_ea9c84({ tone: '다정', personality_core: '낙천', mood_overrides: null, context: '' });
  const v_fa53ec = v_3555ae.map((v_779914) => v_779914.key);
  v_ce93bd.ok(v_fa53ec.includes('tone'));
  v_ce93bd.ok(v_fa53ec.includes('personality_core'));
  v_ce93bd.ok(!v_fa53ec.includes('mood_overrides')); 
  v_ce93bd.ok(!v_fa53ec.includes('context'));         
});

v_2a805f('buildSystemPrompt places l0 rules at the very top', () => {
  const v_8d4337 = v_841e05({ l0: { rules_text: '금칙규칙ABC' }, l1Attrs: [{ key: 'tone', value: '다정' }] });
  v_ce93bd.ok(v_8d4337.indexOf('금칙규칙ABC') >= 0);
  v_ce93bd.ok(v_8d4337.indexOf('금칙규칙ABC') < v_8d4337.indexOf('다정')); 
});

v_2a805f('buildSystemPrompt without l0 still works (backward compat)', () => {
  const v_8d4337 = v_841e05({ l1Attrs: [{ key: 'tone', value: '다정' }] });
  v_ce93bd.ok(typeof v_8d4337 === 'string' && v_8d4337.length > 0);
  v_ce93bd.ok(v_8d4337.indexOf('다정') >= 0);
});

v_2a805f('personaToAttrs — 사투리 메타를 tone 문장으로 합성', () => {
  const v_3555ae = v_ea9c84({
    tone: '정겨운 말투',
    dialect_region: '경상도',
    dialect_intensity: '심함',
    personality_core: '정 많음',
  });
  const v_e34f57 = v_3555ae.find((v_779914) => v_779914.key === 'tone');
  v_ce93bd.ok(v_e34f57.value.includes('경상도'));
  v_ce93bd.ok(v_e34f57.value.includes('심함') || v_e34f57.value.includes('심한'));

  v_ce93bd.equal(v_3555ae.find((v_779914) => v_779914.key === 'dialect_region'), undefined);
});

v_2a805f('personaToAttrs — 사투리 메타 없으면 tone 원문 유지', () => {
  const v_3555ae = v_ea9c84({ tone: '차분한 말투', personality_core: '조용함' });
  v_ce93bd.equal(v_3555ae.find((v_779914) => v_779914.key === 'tone').value, '차분한 말투');
});

v_2a805f('usedBundle=true 경로 — 동적 본문에 displayName 포함, 할배 고정 문구 없음', () => {
  const v_55a58f = [
    { key: 'displayName', value: '엄마' },
    { key: 'relation', value: '딸 (사용자)' },
    { key: 'personality_core', value: '다정하고 따뜻한' },
    { key: 'tone', value: '부드러운 중년 여성 말투' },
  ];
  const v_8d4337 = v_841e05({ l1Attrs: v_55a58f, l2Attrs: [], usedBundle: true });
  v_ce93bd.match(v_8d4337, /엄마/);
  v_ce93bd.match(v_8d4337, /다정하고 따뜻한/);
  v_ce93bd.match(v_8d4337, /부드러운 중년 여성 말투/);

  v_ce93bd.doesNotMatch(v_8d4337, /어복쟁반/);
  v_ce93bd.doesNotMatch(v_8d4337, /1인칭은 "할배"/);
  v_ce93bd.doesNotMatch(v_8d4337, /손녀딸/);
});

v_2a805f('usedBundle=true + l0 rules_text — l0가 본문 앞에', () => {
  const v_55a58f = [{ key: 'displayName', value: '아빠' }, { key: 'tone', value: '차분함' }];
  const v_8d4337 = v_841e05({ l0: { rules_text: '금칙RULE' }, l1Attrs: v_55a58f, usedBundle: true });
  v_ce93bd.ok(v_8d4337.indexOf('금칙RULE') < v_8d4337.indexOf('아빠'));
  v_ce93bd.doesNotMatch(v_8d4337, /어복쟁반/);
});

v_2a805f('usedBundle=true + l1Attrs 비어있음 — 최소 중립 본문, 할배 fallback 없음', () => {
  const v_8d4337 = v_841e05({ l0: { rules_text: 'RULE' }, l1Attrs: [], usedBundle: true });
  v_ce93bd.doesNotMatch(v_8d4337, /어복쟁반/);
  v_ce93bd.doesNotMatch(v_8d4337, /1인칭은 "할배"/);
  v_ce93bd.ok(v_8d4337.length > 0);
});

v_2a805f('usedBundle=false — 기존 buildLegacyBody 경로(회귀 안전)', () => {
  const v_8d4337 = v_841e05({ l1Attrs: [], usedBundle: false });

  v_ce93bd.match(v_8d4337, /할배/);
});
