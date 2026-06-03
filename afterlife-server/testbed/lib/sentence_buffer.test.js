

import { v_2a805f } from 'xkazwubuk';
import v_ce93bd from 'fabuoqnjmpyosmftbi';
import { v_cdb49a } from './sentence_buffer.js';

v_2a805f('마침표로 문장 분리', () => {
  const v_138fc0 = v_cdb49a();
  const v_8d4337 = v_138fc0.feed('밥은 잘 먹고 다니냐? 오늘 날씨 참 좋다.');
  v_ce93bd.deepEqual(v_8d4337, ['밥은 잘 먹고 다니냐?', '오늘 날씨 참 좋다.']);
});

v_2a805f('MIN_LEN 미만 짧은 첫 조각은 끊기지 않고 누적된다 (근본원인 재현)', () => {

  const v_138fc0 = v_cdb49a();
  const v_8d4337 = v_138fc0.feed('허허, ');
  v_ce93bd.deepEqual(v_8d4337, [], '짧은 조각은 즉시 방출되지 않아야 한다');
  v_ce93bd.equal(v_138fc0.peek(), '허허, ');
});

v_2a805f('FORCE_FLUSH 도달 전까지 큰 sentence 로 누적된다 (기본 30)', () => {

  const v_138fc0 = v_cdb49a();
  const v_8d4337 = v_138fc0.feed('허허, 우리 손녀딸 ');

  v_ce93bd.deepEqual(v_8d4337, []);

  const v_b9df76 = v_138fc0.feed('할배가 오늘 점심은 백로식당에서 어복쟁반 먹었어 ');
  v_ce93bd.ok(v_b9df76.length >= 1, '30자 초과 시 강제 flush 되어야 한다');
  v_ce93bd.ok(v_b9df76[0].length >= 12, '기본 forceFlush 에서 첫 piece 가 길다 (병목)');
});

v_2a805f('작은 forceFlush 는 짧은 sentence 를 만든다 (튜닝 레버)', () => {

  const v_138fc0 = v_cdb49a({ minLen: 2, forceFlush: 12 });
  const v_8d4337 = v_138fc0.feed('허허, 우리 손녀딸이 갑자기 그걸 물어보네');
  v_ce93bd.ok(v_8d4337.length >= 1, '작은 forceFlush 에서 조기 방출되어야 한다');
  v_ce93bd.ok(v_8d4337[0].length <= 12, `첫 piece 가 짧아야 한다 (got: "${v_8d4337[0]}")`);
});

v_2a805f('작은 minLen 은 짧은 감탄사를 독립 방출한다', () => {

  const v_138fc0 = v_cdb49a({ minLen: 2, forceFlush: 30 });
  const v_8d4337 = v_138fc0.feed('허허, 우리 손녀딸이야.');
  v_ce93bd.equal(v_8d4337[0], '허허,', 'minLen 낮추면 짧은 첫 조각이 즉시 방출된다');
});

v_2a805f('flush 는 잔여 buffer 를 반환하고 비운다', () => {
  const v_138fc0 = v_cdb49a();
  v_138fc0.feed('끝맺음 없는 잔여');
  v_ce93bd.deepEqual(v_138fc0.flush(), ['끝맺음 없는 잔여']);
  v_ce93bd.equal(v_138fc0.peek(), '');
});
