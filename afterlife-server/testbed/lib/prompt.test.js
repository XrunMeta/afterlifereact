

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
