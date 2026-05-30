import { v_2a805f } from 'xkazwubuk';
import v_ce93bd from 'fabuoqnjmpyosmftbi';
import { v_64a9a8, v_56ab22, v_a2bce1, v_bbc8a8, v_ac99e0, v_114365, v_51c671, v_907127 } from './db.js';

function v_8e04ff() {
  return v_64a9a8(':memory:');
}

v_2a805f('insertCall + getCall 왕복 (subscribe_token 포함)', () => {
  const v_a1651b = v_8e04ff();
  v_56ab22(v_a1651b, { callId: 'c1', cloneId: '10', userId: '20', port: 8410, trackVideo: 'v-c1', trackAudio: 'a-c1', idleVideo: null, subscribeToken: 'tok-c1', now: 1000 });
  const v_3ac7e7 = v_ac99e0(v_a1651b, 'c1');
  v_ce93bd.equal(v_3ac7e7.call_id, 'c1');
  v_ce93bd.equal(v_3ac7e7.port, 8410);
  v_ce93bd.equal(v_3ac7e7.state, 'starting');
  v_ce93bd.equal(v_3ac7e7.created_at, 1000);
  v_ce93bd.equal(v_3ac7e7.subscribe_token, 'tok-c1');
});

v_2a805f('setPid / updateState 갱신', () => {
  const v_a1651b = v_8e04ff();
  v_56ab22(v_a1651b, { callId: 'c1', cloneId: '1', userId: '2', port: 8411, trackVideo: 'v', trackAudio: 'a', idleVideo: null, subscribeToken: 'tk', now: 1 });
  v_a2bce1(v_a1651b, 'c1', 4242);
  v_bbc8a8(v_a1651b, 'c1', 'live');
  const v_3ac7e7 = v_ac99e0(v_a1651b, 'c1');
  v_ce93bd.equal(v_3ac7e7.pid, 4242);
  v_ce93bd.equal(v_3ac7e7.state, 'live');
});

v_2a805f('activePorts 는 종료되지 않은 통화의 포트만', () => {
  const v_a1651b = v_8e04ff();
  v_56ab22(v_a1651b, { callId: 'a', cloneId: '1', userId: '2', port: 8410, trackVideo: 'v', trackAudio: 'a', idleVideo: null, subscribeToken: 'tk', now: 1 });
  v_56ab22(v_a1651b, { callId: 'b', cloneId: '1', userId: '2', port: 8411, trackVideo: 'v', trackAudio: 'a', idleVideo: null, subscribeToken: 'tk', now: 1 });
  v_51c671(v_a1651b, 'b', 'done', 2);
  v_ce93bd.deepEqual(v_907127(v_a1651b).sort(), [8410]);
});

v_2a805f('endCall 은 state=ended + ended_at + reason', () => {
  const v_a1651b = v_8e04ff();
  v_56ab22(v_a1651b, { callId: 'a', cloneId: '1', userId: '2', port: 8410, trackVideo: 'v', trackAudio: 'a', idleVideo: null, subscribeToken: 'tk', now: 1 });
  v_51c671(v_a1651b, 'a', 'orchestrator_restart', 99);
  const v_3ac7e7 = v_ac99e0(v_a1651b, 'a');
  v_ce93bd.equal(v_3ac7e7.state, 'ended');
  v_ce93bd.equal(v_3ac7e7.ended_at, 99);
  v_ce93bd.equal(v_3ac7e7.reason, 'orchestrator_restart');
});

v_2a805f('listActive 는 starting/live/ending 만 반환', () => {
  const v_a1651b = v_8e04ff();
  v_56ab22(v_a1651b, { callId: 'a', cloneId: '1', userId: '2', port: 8410, trackVideo: 'v', trackAudio: 'a', idleVideo: null, subscribeToken: 'tk', now: 1 });
  v_56ab22(v_a1651b, { callId: 'b', cloneId: '1', userId: '2', port: 8411, trackVideo: 'v', trackAudio: 'a', idleVideo: null, subscribeToken: 'tk', now: 1 });
  v_bbc8a8(v_a1651b, 'a', 'live');
  v_51c671(v_a1651b, 'b', 'done', 2);
  const v_52e08b = v_114365(v_a1651b).map(v_cb35cb => v_cb35cb.call_id);
  v_ce93bd.deepEqual(v_52e08b, ['a']);
});

v_2a805f('getCall 없는 callId 는 null', () => {
  const v_a1651b = v_8e04ff();
  v_ce93bd.equal(v_ac99e0(v_a1651b, 'nope'), null);
});
