import { v_2a805f } from 'xkazwubuk';
import v_ce93bd from 'fabuoqnjmpyosmftbi';
import { v_64a9a8, v_ac99e0, v_114365 } from './db.js';
import { v_3df644 } from './calls.js';

function v_1ff424(v_11ea7b = {}) {
  const v_20e160 = { spawn: 0, started: 0, stopped: 0, killed: [] };
  let v_7d3634 = 0;
  let v_9994c6 = 0;
  return {
    calls: v_20e160,
    deps: {
      spawnPublisher: () => { v_20e160.spawn++; return { pid: 1000 + v_20e160.spawn }; },
      waitHealthz: async () => { v_20e160.started++; return { state: 'idle' }; },
      publishStart: async () => ({ state: 'publishing' }),
      publishStop: async () => { v_20e160.stopped++; },
      killProc: async (v_d4923e) => { v_20e160.killed.push(v_d4923e); },
      now: () => 12345,
      randomUUID: () => `uuid-${++v_7d3634}`,
      randomToken: () => `tok-${++v_9994c6}`,
      ...v_11ea7b,
    },
  };
}

const v_74a79c = { python: 'python', script: '/x/publisher.py', idleMp4Default: '/x/idle.mp4', portBase: 8410, portCount: 3, cfEnv: {} };

v_2a805f('allocate 성공 시 live + 티켓(subscribeToken 포함) 반환', async () => {
  const v_a1651b = v_64a9a8(':memory:');
  const { deps: v_84b93d } = v_1ff424();
  const v_38a552 = v_3df644({ db: v_a1651b, config: v_74a79c, deps: v_84b93d });
  const v_8d41d7 = await v_38a552.allocate({ cloneId: '10', userId: '20', idleVideoUrl: null });
  v_ce93bd.match(v_8d41d7.callId, /^uuid-/);
  v_ce93bd.equal(v_8d41d7.state, 'live');
  v_ce93bd.equal(v_8d41d7.tracks.video, `v-${v_8d41d7.callId.slice(0, 8)}`);
  v_ce93bd.equal(v_8d41d7.subscribeToken, 'tok-1');
  const v_3ac7e7 = v_ac99e0(v_a1651b, v_8d41d7.callId);
  v_ce93bd.equal(v_3ac7e7.state, 'live');
  v_ce93bd.equal(v_3ac7e7.port, 8410);
  v_ce93bd.equal(v_3ac7e7.pid, 1001);
  v_ce93bd.equal(v_3ac7e7.subscribe_token, 'tok-1');
});

v_2a805f('동시 2건은 다른 포트', async () => {
  const v_a1651b = v_64a9a8(':memory:');
  const { deps: v_84b93d } = v_1ff424();
  const v_38a552 = v_3df644({ db: v_a1651b, config: v_74a79c, deps: v_84b93d });
  const v_779914 = await v_38a552.allocate({ cloneId: '1', userId: '2', idleVideoUrl: null });
  const v_148ff6 = await v_38a552.allocate({ cloneId: '1', userId: '3', idleVideoUrl: null });
  v_ce93bd.notEqual(v_ac99e0(v_a1651b, v_779914.callId).port, v_ac99e0(v_a1651b, v_148ff6.callId).port);
  v_ce93bd.equal(v_114365(v_a1651b).length, 2);
});

v_2a805f('포트 고갈 시 no_capacity', async () => {
  const v_a1651b = v_64a9a8(':memory:');
  const { deps: v_84b93d } = v_1ff424();
  const v_38a552 = v_3df644({ db: v_a1651b, config: { ...v_74a79c, portCount: 1 }, deps: v_84b93d });
  await v_38a552.allocate({ cloneId: '1', userId: '2', idleVideoUrl: null });
  await v_ce93bd.rejects(() => v_38a552.allocate({ cloneId: '1', userId: '3', idleVideoUrl: null }), /no_capacity/);
});

v_2a805f('healthz 실패 시 kill + state=failed + throw', async () => {
  const v_a1651b = v_64a9a8(':memory:');
  const { deps: v_84b93d, calls: v_20e160 } = v_1ff424({ waitHealthz: async () => { throw new Error('health_timeout'); } });
  const v_38a552 = v_3df644({ db: v_a1651b, config: v_74a79c, deps: v_84b93d });
  await v_ce93bd.rejects(() => v_38a552.allocate({ cloneId: '1', userId: '2', idleVideoUrl: null }), /spawn_failed/);
  v_ce93bd.equal(v_20e160.killed.length, 1);
  v_ce93bd.equal(v_114365(v_a1651b).length, 0);
});

v_2a805f('end 는 publishStop+kill+ended, 멱등', async () => {
  const v_a1651b = v_64a9a8(':memory:');
  const { deps: v_84b93d, calls: v_20e160 } = v_1ff424();
  const v_38a552 = v_3df644({ db: v_a1651b, config: v_74a79c, deps: v_84b93d });
  const v_8d41d7 = await v_38a552.allocate({ cloneId: '1', userId: '2', idleVideoUrl: null });
  const v_2d1eeb = await v_38a552.end(v_8d41d7.callId, '2');
  v_ce93bd.deepEqual(v_2d1eeb, { ok: true });
  v_ce93bd.equal(v_ac99e0(v_a1651b, v_8d41d7.callId).state, 'ended');
  v_ce93bd.equal(v_20e160.stopped, 1);
  v_ce93bd.equal(v_20e160.killed.length, 1);
  const v_b96973 = await v_38a552.end(v_8d41d7.callId, '2');
  v_ce93bd.deepEqual(v_b96973, { ok: true });
  v_ce93bd.equal(v_20e160.killed.length, 1);
});

v_2a805f('end 알 수 없는 callId 도 멱등 200', async () => {
  const v_a1651b = v_64a9a8(':memory:');
  const { deps: v_84b93d } = v_1ff424();
  const v_38a552 = v_3df644({ db: v_a1651b, config: v_74a79c, deps: v_84b93d });
  v_ce93bd.deepEqual(await v_38a552.end('nope', '2'), { ok: true });
});

v_2a805f('end 는 다른 userId 면 no-op(소유권 검증)', async () => {
  const v_a1651b = v_64a9a8(':memory:');
  const { deps: v_84b93d, calls: v_20e160 } = v_1ff424();
  const v_38a552 = v_3df644({ db: v_a1651b, config: v_74a79c, deps: v_84b93d });
  const v_8d41d7 = await v_38a552.allocate({ cloneId: '1', userId: '2', idleVideoUrl: null });
  const v_cb35cb = await v_38a552.end(v_8d41d7.callId, '999');
  v_ce93bd.deepEqual(v_cb35cb, { ok: true });
  v_ce93bd.equal(v_ac99e0(v_a1651b, v_8d41d7.callId).state, 'live');
  v_ce93bd.equal(v_20e160.killed.length, 0);
});

v_2a805f('reconcile 는 active 통화를 kill + ended(clean-slate)', async () => {
  const v_a1651b = v_64a9a8(':memory:');
  const { deps: v_84b93d, calls: v_20e160 } = v_1ff424();
  const v_38a552 = v_3df644({ db: v_a1651b, config: v_74a79c, deps: v_84b93d });
  const v_8d41d7 = await v_38a552.allocate({ cloneId: '1', userId: '2', idleVideoUrl: null });
  await v_38a552.reconcile();
  v_ce93bd.equal(v_ac99e0(v_a1651b, v_8d41d7.callId).state, 'ended');
  v_ce93bd.equal(v_ac99e0(v_a1651b, v_8d41d7.callId).reason, 'orchestrator_restart');
  v_ce93bd.ok(v_20e160.killed.includes(1001));
});

v_2a805f('idleVideoUrl null 이면 기본 idle 사용', async () => {
  const v_a1651b = v_64a9a8(':memory:');
  let v_1ec516 = null;
  const { deps: v_84b93d } = v_1ff424({ spawnPublisher: (v_779914) => { v_1ec516 = v_779914; return { pid: 1 }; } });
  const v_38a552 = v_3df644({ db: v_a1651b, config: v_74a79c, deps: v_84b93d });
  await v_38a552.allocate({ cloneId: '1', userId: '2', idleVideoUrl: null });
  v_ce93bd.equal(v_1ec516.idleMp4, '/x/idle.mp4');
});
