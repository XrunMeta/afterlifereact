import { v_2a805f } from 'xkazwubuk';
import v_ce93bd from 'fabuoqnjmpyosmftbi';
import { v_64a9a8, v_56ab22, v_51c671 } from './db.js';
import { v_6f976d } from './portPool.js';

function v_43af15(v_a1651b, v_be62d3, v_f31c63) {
  v_56ab22(v_a1651b, { callId: v_be62d3, cloneId: '1', userId: '2', port: v_f31c63, trackVideo: 'v', trackAudio: 'a', idleVideo: null, subscribeToken: 'tk', now: 1 });
}

v_2a805f('빈 레지스트리는 base 포트 할당', () => {
  const v_a1651b = v_64a9a8(':memory:');
  v_ce93bd.equal(v_6f976d(v_a1651b, 8410, 30), 8410);
});

v_2a805f('사용 중 포트는 건너뛰고 최소 빈 포트', () => {
  const v_a1651b = v_64a9a8(':memory:');
  v_43af15(v_a1651b, 'a', 8410);
  v_ce93bd.equal(v_6f976d(v_a1651b, 8410, 30), 8411);
});

v_2a805f('종료된 통화 포트는 재사용', () => {
  const v_a1651b = v_64a9a8(':memory:');
  v_43af15(v_a1651b, 'a', 8410);
  v_51c671(v_a1651b, 'a', 'done', 2);
  v_ce93bd.equal(v_6f976d(v_a1651b, 8410, 30), 8410);
});

v_2a805f('가용 포트 없으면 null', () => {
  const v_a1651b = v_64a9a8(':memory:');
  v_43af15(v_a1651b, 'a', 8410);
  v_43af15(v_a1651b, 'b', 8411);
  v_ce93bd.equal(v_6f976d(v_a1651b, 8410, 2), null);
});
