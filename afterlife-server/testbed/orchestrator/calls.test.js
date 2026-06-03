import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openDb, getCall, listActive } from './db.js';
import { createOrchestrator } from './calls.js';

function makeDeps(overrides = {}) {
  const calls = { spawn: 0, started: 0, stopped: 0, killed: [] };
  let uuidN = 0;
  let tokN = 0;
  return {
    calls,
    deps: {
      spawnPublisher: () => { calls.spawn++; return { pid: 1000 + calls.spawn }; },
      waitHealthz: async () => { calls.started++; return { state: 'idle' }; },
      publishStart: async () => ({ state: 'publishing' }),
      publishStop: async () => { calls.stopped++; },
      killProc: async (pid) => { calls.killed.push(pid); },
      now: () => 12345,
      randomUUID: () => `uuid-${++uuidN}`,
      randomToken: () => `tok-${++tokN}`,
      ...overrides,
    },
  };
}

const config = { python: 'python', script: '/x/publisher.py', idleMp4Default: '/x/idle.mp4', portBase: 8410, portCount: 3, cfEnv: {} };

test('allocate 성공 시 live + 티켓(subscribeToken 포함) 반환', async () => {
  const db = openDb(':memory:');
  const { deps } = makeDeps();
  const orch = createOrchestrator({ db, config, deps });
  const t = await orch.allocate({ cloneId: '10', userId: '20', idleVideoUrl: null });
  assert.match(t.callId, /^uuid-/);
  assert.equal(t.state, 'live');
  assert.equal(t.tracks.video, `v-${t.callId.slice(0, 8)}`);
  assert.equal(t.subscribeToken, 'tok-1');
  const row = getCall(db, t.callId);
  assert.equal(row.state, 'live');
  assert.equal(row.port, 8410);
  assert.equal(row.pid, 1001);
  assert.equal(row.subscribe_token, 'tok-1');
});

test('동시 2건은 다른 포트', async () => {
  const db = openDb(':memory:');
  const { deps } = makeDeps();
  const orch = createOrchestrator({ db, config, deps });
  const a = await orch.allocate({ cloneId: '1', userId: '2', idleVideoUrl: null });
  const b = await orch.allocate({ cloneId: '1', userId: '3', idleVideoUrl: null });
  assert.notEqual(getCall(db, a.callId).port, getCall(db, b.callId).port);
  assert.equal(listActive(db).length, 2);
});

test('포트 고갈 시 no_capacity', async () => {
  const db = openDb(':memory:');
  const { deps } = makeDeps();
  const orch = createOrchestrator({ db, config: { ...config, portCount: 1 }, deps });
  await orch.allocate({ cloneId: '1', userId: '2', idleVideoUrl: null });
  await assert.rejects(() => orch.allocate({ cloneId: '1', userId: '3', idleVideoUrl: null }), /no_capacity/);
});

test('healthz 실패 시 kill + state=failed + throw', async () => {
  const db = openDb(':memory:');
  const { deps, calls } = makeDeps({ waitHealthz: async () => { throw new Error('health_timeout'); } });
  const orch = createOrchestrator({ db, config, deps });
  await assert.rejects(() => orch.allocate({ cloneId: '1', userId: '2', idleVideoUrl: null }), /spawn_failed/);
  assert.equal(calls.killed.length, 1);
  assert.equal(listActive(db).length, 0);
});

test('end 는 publishStop+kill+ended, 멱등', async () => {
  const db = openDb(':memory:');
  const { deps, calls } = makeDeps();
  const orch = createOrchestrator({ db, config, deps });
  const t = await orch.allocate({ cloneId: '1', userId: '2', idleVideoUrl: null });
  const r1 = await orch.end(t.callId, '2');
  assert.deepEqual(r1, { ok: true });
  assert.equal(getCall(db, t.callId).state, 'ended');
  assert.equal(calls.stopped, 1);
  assert.equal(calls.killed.length, 1);
  const r2 = await orch.end(t.callId, '2');
  assert.deepEqual(r2, { ok: true });
  assert.equal(calls.killed.length, 1);
});

test('end 알 수 없는 callId 도 멱등 200', async () => {
  const db = openDb(':memory:');
  const { deps } = makeDeps();
  const orch = createOrchestrator({ db, config, deps });
  assert.deepEqual(await orch.end('nope', '2'), { ok: true });
});

test('end 는 다른 userId 면 no-op(소유권 검증)', async () => {
  const db = openDb(':memory:');
  const { deps, calls } = makeDeps();
  const orch = createOrchestrator({ db, config, deps });
  const t = await orch.allocate({ cloneId: '1', userId: '2', idleVideoUrl: null });
  const r = await orch.end(t.callId, '999');
  assert.deepEqual(r, { ok: true });
  assert.equal(getCall(db, t.callId).state, 'live');
  assert.equal(calls.killed.length, 0);
});

test('reconcile 는 active 통화를 kill + ended(clean-slate)', async () => {
  const db = openDb(':memory:');
  const { deps, calls } = makeDeps();
  const orch = createOrchestrator({ db, config, deps });
  const t = await orch.allocate({ cloneId: '1', userId: '2', idleVideoUrl: null });
  await orch.reconcile();
  assert.equal(getCall(db, t.callId).state, 'ended');
  assert.equal(getCall(db, t.callId).reason, 'orchestrator_restart');
  assert.ok(calls.killed.includes(1001));
});

test('idleVideoUrl null 이면 기본 idle 사용', async () => {
  const db = openDb(':memory:');
  let spawnArg = null;
  const { deps } = makeDeps({ spawnPublisher: (a) => { spawnArg = a; return { pid: 1 }; } });
  const orch = createOrchestrator({ db, config, deps });
  await orch.allocate({ cloneId: '1', userId: '2', idleVideoUrl: null });
  assert.equal(spawnArg.idleMp4, '/x/idle.mp4');
});
