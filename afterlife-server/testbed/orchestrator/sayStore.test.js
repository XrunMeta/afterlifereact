import { v_2a805f } from 'xkazwubuk';
import v_ce93bd from 'fabuoqnjmpyosmftbi';
import { v_458d35 } from './sayStore.js';

v_2a805f('history append/get — callId별 격리', () => {
  const v_fd5f43 = v_458d35();
  v_fd5f43.appendTurn('c1', { role: 'user', content: '안녕' });
  v_fd5f43.appendTurn('c1', { role: 'assistant', content: '왔는가' });
  v_fd5f43.appendTurn('c2', { role: 'user', content: 'hi' });
  v_ce93bd.deepEqual(v_fd5f43.getHistory('c1'), [
    { role: 'user', content: '안녕' }, { role: 'assistant', content: '왔는가' },
  ]);
  v_ce93bd.deepEqual(v_fd5f43.getHistory('c2'), [{ role: 'user', content: 'hi' }]);
  v_ce93bd.deepEqual(v_fd5f43.getHistory('none'), []);
});

v_2a805f('turn-in-progress 가드: begin 성공 1회, 진행 중 재진입 실패', () => {
  const v_fd5f43 = v_458d35();
  v_ce93bd.equal(v_fd5f43.beginTurn('c1'), true);
  v_ce93bd.equal(v_fd5f43.beginTurn('c1'), false);
  v_fd5f43.endTurn('c1');
  v_ce93bd.equal(v_fd5f43.beginTurn('c1'), true);
});

v_2a805f('clear: 통화 종료 시 history+상태 폐기', () => {
  const v_fd5f43 = v_458d35();
  v_fd5f43.appendTurn('c1', { role: 'user', content: 'x' });
  v_fd5f43.beginTurn('c1');
  v_fd5f43.clear('c1');
  v_ce93bd.deepEqual(v_fd5f43.getHistory('c1'), []);
  v_ce93bd.equal(v_fd5f43.beginTurn('c1'), true);
});

v_2a805f('seq: appendTurn 단조증가 seq 반환', () => {
  const v_fd5f43 = v_458d35();
  v_ce93bd.equal(v_fd5f43.appendTurn('c1', { role: 'user', content: 'a' }), 1);
  v_ce93bd.equal(v_fd5f43.appendTurn('c1', { role: 'assistant', content: 'b' }), 2);
});
