import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { createAssetJobRunner } from './assetJobRunner.js';

const API_BASE = 'https://oth-path.example.com';

function makeFetch({ srcOk = true, callbackCalls }) {
  return async (url, opts) => {
    if (url.startsWith(`${API_BASE}/oth-path`)) {
      if (!srcOk) return { ok: false, status: 500, arrayBuffer: async () => new ArrayBuffer(0) };
      return { ok: true, status: 200, arrayBuffer: async () => new Uint8Array(10).buffer };
    }
    if (url === `${API_BASE}/oth-path`) {
      callbackCalls.push({ url, method: opts?.method, body: opts?.body });
      return { ok: true, status: 200 };
    }
    throw new Error(`unexpected fetch: ${url}`);
  };
}

function makeSpawn(exitCode = 0) {
  return (_bin, args, _opts) => {
    const listeners = {};
    const proc = {
      stderr: { on: () => proc.stderr },
      stdout: { on: () => proc.stdout },
      on(event, fn) { listeners[event] = fn; return proc; },
    };
    setImmediate(async () => {
      if (exitCode === 0) {

        const outPath = args[args.length - 1];
        try { await writeFile(outPath, Buffer.from('dummy')); } catch {}
      }
      if (listeners['close']) listeners['close'](exitCode);
    });
    return proc;
  };
}

async function waitDrain(runner, timeout = 2000) {
  const t0 = Date.now();
  while (runner._size() > 0 || runner._running()) {
    if (Date.now() - t0 > timeout) throw new Error('waitDrain timeout');
    await new Promise((r) => setTimeout(r, 10));
  }

  await new Promise((r) => setTimeout(r, 20));
}

test('idle_video 잡 성공 시 callback status=done + file 페이로드', async () => {
  const callbackCalls = [];
  const fetchImpl = makeFetch({ callbackCalls });
  const spawnImpl = makeSpawn(0);

  const runner = createAssetJobRunner({
    apiBaseUrl: API_BASE,
    genIdleCmd: (src, out) => ({ bin: 'echo', args: [src, out] }),
    extractSeCmd: (src, out) => ({ bin: 'echo', args: [src, out] }),
    fetchImpl,
    spawnImpl,
  });

  runner.enqueue({
    job_id: 'job1',
    kind: 'idle_video',
    src_url: `${API_BASE}/oth-path`,
    callback_token: 'tok_abc',
  });

  await waitDrain(runner);

  assert.equal(callbackCalls.length, 1, '콜백 1회 호출 필요');
  const fd = callbackCalls[0].body;
  assert.ok(fd instanceof FormData, 'body는 FormData이어야 함');
  assert.equal(fd.get('job_id'), 'job1');
  assert.equal(fd.get('status'), 'done');
  assert.equal(fd.get('callback_token'), 'tok_abc');
  assert.ok(fd.get('file'), 'file 필드 필요');
});

test('voice_clone 잡 성공 시 callback status=done', async () => {
  const callbackCalls = [];
  const fetchImpl = makeFetch({ callbackCalls });
  const spawnImpl = makeSpawn(0);

  const runner = createAssetJobRunner({
    apiBaseUrl: API_BASE,
    genIdleCmd: (src, out) => ({ bin: 'echo', args: [src, out] }),
    extractSeCmd: (src, out) => ({ bin: 'echo', args: [src, out] }),
    fetchImpl,
    spawnImpl,
  });

  runner.enqueue({
    job_id: 'job2',
    kind: 'voice_clone',
    src_url: `${API_BASE}/oth-path`,
    callback_token: 'tok_xyz',
  });

  await waitDrain(runner);

  assert.equal(callbackCalls.length, 1);
  const fd = callbackCalls[0].body;
  assert.equal(fd.get('job_id'), 'job2');
  assert.equal(fd.get('status'), 'done');
  assert.equal(fd.get('callback_token'), 'tok_xyz');
});

test('spawn 실패(exit ≠ 0) 시 callback status=failed', async () => {
  const callbackCalls = [];
  const fetchImpl = makeFetch({ callbackCalls });
  const spawnImpl = makeSpawn(1); 

  const runner = createAssetJobRunner({
    apiBaseUrl: API_BASE,
    genIdleCmd: (src, out) => ({ bin: 'echo', args: [src, out] }),
    extractSeCmd: (src, out) => ({ bin: 'echo', args: [src, out] }),
    fetchImpl,
    spawnImpl,
  });

  runner.enqueue({
    job_id: 'job3',
    kind: 'idle_video',
    src_url: `${API_BASE}/oth-path`,
    callback_token: 'tok_fail',
  });

  await waitDrain(runner);

  assert.equal(callbackCalls.length, 1, '실패 콜백 1회 필요');
  const fd = callbackCalls[0].body;
  assert.equal(fd.get('job_id'), 'job3');
  assert.equal(fd.get('status'), 'failed');
  assert.ok(fd.get('error'), 'error 필드 필요');
});

test('src 다운로드 실패 시 callback status=failed', async () => {
  const callbackCalls = [];
  const fetchImpl = makeFetch({ srcOk: false, callbackCalls });
  const spawnImpl = makeSpawn(0);

  const runner = createAssetJobRunner({
    apiBaseUrl: API_BASE,
    genIdleCmd: (src, out) => ({ bin: 'echo', args: [src, out] }),
    extractSeCmd: (src, out) => ({ bin: 'echo', args: [src, out] }),
    fetchImpl,
    spawnImpl,
  });

  runner.enqueue({
    job_id: 'job4',
    kind: 'idle_video',
    src_url: `${API_BASE}/oth-path`,
    callback_token: 'tok_srcfail',
  });

  await waitDrain(runner);

  assert.equal(callbackCalls.length, 1);
  const fd = callbackCalls[0].body;
  assert.equal(fd.get('status'), 'failed');
});

test('큐 직렬 처리 — 2건 순서대로 완료', async () => {
  const order = [];
  const callbackCalls = [];

  let spawnCount = 0;
  const spawnImpl = (_bin, args, _opts) => {

    const idx = spawnCount++;
    const delay = idx === 0 ? 50 : 0;
    const listeners = {};
    const proc = {
      stderr: { on: () => proc.stderr },
      stdout: { on: () => proc.stdout },
      on(event, fn) { listeners[event] = fn; return proc; },
    };
    setTimeout(async () => {
      const outPath = args[args.length - 1];
      try { await writeFile(outPath, Buffer.from(`dummy_${idx}`)); } catch {}
      order.push(`spawn_close_${idx}`);
      if (listeners['close']) listeners['close'](0);
    }, delay);
    return proc;
  };

  const fetchImpl = async (url, opts) => {
    if (url.startsWith(`${API_BASE}/oth-path`)) {
      return { ok: true, status: 200, arrayBuffer: async () => new Uint8Array(10).buffer };
    }
    if (url === `${API_BASE}/oth-path`) {
      const fd = opts?.body;
      order.push(`cb_${fd?.get?.('job_id')}`);
      callbackCalls.push(fd);
      return { ok: true };
    }
    throw new Error(`unexpected: ${url}`);
  };

  const runner = createAssetJobRunner({
    apiBaseUrl: API_BASE,
    genIdleCmd: (src, out) => ({ bin: 'echo', args: [src, out] }),
    extractSeCmd: (src, out) => ({ bin: 'echo', args: [src, out] }),
    fetchImpl,
    spawnImpl,
  });

  runner.enqueue({ job_id: 'A', kind: 'idle_video', src_url: `${API_BASE}/oth-path`, callback_token: 'ta' });
  runner.enqueue({ job_id: 'B', kind: 'idle_video', src_url: `${API_BASE}/oth-path`, callback_token: 'tb' });

  await waitDrain(runner, 3000);

  assert.equal(callbackCalls.length, 2, '2건 모두 콜백 필요');

  const idxA = order.indexOf('cb_A');
  const idxB = order.indexOf('cb_B');
  assert.ok(idxA < idxB, `직렬 실패: A(${idxA}) B(${idxB}) 순서 위반`);
});

test('src_url이 apiBaseUrl prefix 아니면 failed 콜백', async () => {
  const callbackCalls = [];
  const fetchImpl = makeFetch({ callbackCalls });
  const spawnImpl = makeSpawn(0);

  const runner = createAssetJobRunner({
    apiBaseUrl: API_BASE,
    genIdleCmd: (src, out) => ({ bin: 'echo', args: [src, out] }),
    extractSeCmd: (src, out) => ({ bin: 'echo', args: [src, out] }),
    fetchImpl,
    spawnImpl,
  });

  runner.enqueue({
    job_id: 'job_ssrf',
    kind: 'idle_video',
    src_url: 'https://evil.example.com/malicious',
    callback_token: 'tok_ssrf',
  });

  await waitDrain(runner);

  assert.equal(callbackCalls.length, 1);
  const fd = callbackCalls[0].body;
  assert.equal(fd.get('status'), 'failed');
  assert.match(fd.get('error') ?? '', /not allowed/);
});
