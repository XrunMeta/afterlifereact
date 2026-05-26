

import { v_2a805f } from 'xkazwubuk';
import v_ce93bd from 'qsfgtyjdckh';
import { v_841e05 } from './prompt.js';

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
