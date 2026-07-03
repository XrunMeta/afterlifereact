import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writeFile, mkdtemp, rm } from 'node:fs/promises';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createAssetJobRunner, FILLER_TEXTS, defaultEnsureVoiceWav, defaultFifthRender, _MAX_VOICE_WAV_BYTES } from './assetJobRunner.js';

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

function makeFetchFiller({ srcOk = true, callbackCalls = [], fillerCallbackCalls = [] } = {}) {
  return async (url, opts) => {
    if (url.startsWith(`${API_BASE}/oth-path`)) {
      if (!srcOk) {
        return { ok: false, status: 500, arrayBuffer: async () => new ArrayBuffer(0), text: async () => '' };
      }
      return { ok: true, status: 200, arrayBuffer: async () => new Uint8Array(20).buffer };
    }
    if (url === `${API_BASE}/oth-path`) {
      callbackCalls.push({ url, method: opts?.method, body: opts?.body });
      return { ok: true, status: 200 };
    }
    if (url === `${API_BASE}/oth-path`) {
      fillerCallbackCalls.push({ url, method: opts?.method, body: opts?.body });
      return { ok: true, status: 200 };
    }
    throw new Error(`unexpected fetch (filler mock): ${url}`);
  };
}

function makeQwenTts({ failOnIndex = -1 } = {}) {
  let callCount = 0;
  return async (text, cloneId) => {
    const i = callCount++;
    if (i === failOnIndex) throw new Error(`qwen3tts 503 voice.wav missing for index ${i}`);
    return Buffer.from(`wav_${i}_${text.slice(0, 5)}`);
  };
}

function makeFifthRender({ framesCount = 3, failOnIndex = -1 } = {}) {
  let callCount = 0;
  return async (wavPath, facePath) => {
    const i = callCount++;
    if (i === failOnIndex) throw new Error(`fifth /render HTTP 500`);
    const frames = [];
    for (let f = 0; f < framesCount; f++) frames.push(Buffer.from(`jpeg_${i}_${f}`));
    return frames;
  };
}

function fillerFfmpegCmd(framesDir, wavPath, outPath) {
  return { bin: 'echo', args: [outPath] };
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

test('filler 3종 모두 성공 → /oth-path 1회, file0/file1/file2 포함', async () => {
  const callbackCalls = [];
  const fillerCallbackCalls = [];

  const runner = createAssetJobRunner({
    apiBaseUrl: API_BASE,
    fetchImpl: makeFetchFiller({ callbackCalls, fillerCallbackCalls }),
    spawnImpl: makeSpawn(0),
    _qwenTtsFn: makeQwenTts(),
    _fifthRenderFn: makeFifthRender({ framesCount: 3 }),
    ffmpegMuxCmd: fillerFfmpegCmd,
    _ensureVoiceWavFn: makeEnsureVoiceWav(),
  });

  runner.enqueue({
    job_id: 'fj_ok',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${API_BASE}/oth-path`,
    voice_raw_url: `${API_BASE}/oth-path`,
    callback_token: 'tok_fj_ok',
  });

  await waitDrain(runner, 4000);

  assert.equal(fillerCallbackCalls.length, 1, '/oth-path 1회 호출 필요');

  assert.equal(callbackCalls.length, 0, 'asset-job-done 호출 없어야 함');

  const fd = fillerCallbackCalls[0].body;
  assert.ok(fd instanceof FormData, 'body는 FormData이어야 함');
  assert.equal(fd.get('job_id'), 'fj_ok');
  assert.equal(fd.get('status'), 'done', 'status=done 필드 필요 (el I-1 대칭)');
  assert.equal(fd.get('callback_token'), 'tok_fj_ok');

  assert.ok(fd.get('file0'), 'file0 필드 필요');
  assert.ok(fd.get('file1'), 'file1 필드 필요');
  assert.ok(fd.get('file2'), 'file2 필드 필요');
});

test('filler FILLER_TEXTS 상수 — 3종 정의 확인', () => {
  assert.equal(FILLER_TEXTS.length, 3, '필러 텍스트 3종 필요');
  assert.ok(FILLER_TEXTS[0].includes('음'), '첫 번째 필러에 "음" 포함');
  assert.ok(FILLER_TEXTS[1].includes('잠깐'), '두 번째 필러에 "잠깐" 포함');
  assert.ok(FILLER_TEXTS[2].includes('말이죠'), '세 번째 필러에 "말이죠" 포함');
});

test('filler qwen3tts 2번째(index 1) 실패 → 전부-or-전무: filler-job-done 0회, asset-job-done failed 1회', async () => {
  const callbackCalls = [];
  const fillerCallbackCalls = [];

  const runner = createAssetJobRunner({
    apiBaseUrl: API_BASE,
    fetchImpl: makeFetchFiller({ callbackCalls, fillerCallbackCalls }),
    spawnImpl: makeSpawn(0),
    _qwenTtsFn: makeQwenTts({ failOnIndex: 1 }),
    _fifthRenderFn: makeFifthRender({ framesCount: 3 }),
    ffmpegMuxCmd: fillerFfmpegCmd,
    _ensureVoiceWavFn: makeEnsureVoiceWav(),
  });

  runner.enqueue({
    job_id: 'fj_qwen_fail',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${API_BASE}/oth-path`,
    voice_raw_url: `${API_BASE}/oth-path`,
    callback_token: 'tok_fj_qf',
  });

  await waitDrain(runner, 4000);

  assert.equal(fillerCallbackCalls.length, 0, 'filler-job-done 호출 없어야 함 (전부-or-전무)');

  assert.equal(callbackCalls.length, 1, 'asset-job-done(failed) 1회 필요');
  const fd = callbackCalls[0].body;
  assert.equal(fd.get('job_id'), 'fj_qwen_fail');
  assert.equal(fd.get('status'), 'failed');
  assert.ok(fd.get('error'), 'error 필드 필요');
});

test('filler voice.wav 없음 (qwen3tts 503 시뮬) → callbackFailed, filler-job-done 0회', async () => {
  const callbackCalls = [];
  const fillerCallbackCalls = [];

  const qwenFn = async () => { throw new Error('qwen3tts 503 voice.wav missing'); };

  const runner = createAssetJobRunner({
    apiBaseUrl: API_BASE,
    fetchImpl: makeFetchFiller({ callbackCalls, fillerCallbackCalls }),
    spawnImpl: makeSpawn(0),
    _qwenTtsFn: qwenFn,
    _fifthRenderFn: makeFifthRender({ framesCount: 3 }),
    ffmpegMuxCmd: fillerFfmpegCmd,
    _ensureVoiceWavFn: makeEnsureVoiceWav(), 
  });

  runner.enqueue({
    job_id: 'fj_novox',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${API_BASE}/oth-path`,
    voice_raw_url: `${API_BASE}/oth-path`,
    callback_token: 'tok_fj_nv',
  });

  await waitDrain(runner, 3000);

  assert.equal(fillerCallbackCalls.length, 0, 'filler-job-done 호출 없어야 함');
  assert.equal(callbackCalls.length, 1, 'asset-job-done(failed) 1회 필요');
  const fd = callbackCalls[0].body;
  assert.equal(fd.get('status'), 'failed');

  assert.match(fd.get('error') ?? '', /voice\.wav|503/);
});

test('filler fifth 0 프레임 (소스 부적합) → callbackFailed, filler-job-done 0회', async () => {
  const callbackCalls = [];
  const fillerCallbackCalls = [];

  const runner = createAssetJobRunner({
    apiBaseUrl: API_BASE,
    fetchImpl: makeFetchFiller({ callbackCalls, fillerCallbackCalls }),
    spawnImpl: makeSpawn(0),
    _qwenTtsFn: makeQwenTts(),
    _fifthRenderFn: makeFifthRender({ framesCount: 0 }), 
    ffmpegMuxCmd: fillerFfmpegCmd,
    _ensureVoiceWavFn: makeEnsureVoiceWav(),
  });

  runner.enqueue({
    job_id: 'fj_noframe',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${API_BASE}/oth-path`,
    voice_raw_url: `${API_BASE}/oth-path`,
    callback_token: 'tok_fj_nf',
  });

  await waitDrain(runner, 3000);

  assert.equal(fillerCallbackCalls.length, 0, 'filler-job-done 호출 없어야 함');
  assert.equal(callbackCalls.length, 1, 'asset-job-done(failed) 1회 필요');
  const fd = callbackCalls[0].body;
  assert.equal(fd.get('status'), 'failed');
  assert.match(fd.get('error') ?? '', /0 frames|unsuitable/);
});

test('filler face_url 누락 → callbackFailed', async () => {
  const callbackCalls = [];
  const fillerCallbackCalls = [];

  const runner = createAssetJobRunner({
    apiBaseUrl: API_BASE,
    fetchImpl: makeFetchFiller({ callbackCalls, fillerCallbackCalls }),
    spawnImpl: makeSpawn(0),
    _qwenTtsFn: makeQwenTts(),
    _fifthRenderFn: makeFifthRender({ framesCount: 3 }),
    ffmpegMuxCmd: fillerFfmpegCmd,
  });

  runner.enqueue({
    job_id: 'fj_noface',
    kind: 'filler',
    clone_id: '9055',

    callback_token: 'tok_fj_noface',
  });

  await waitDrain(runner, 2000);

  assert.equal(fillerCallbackCalls.length, 0);
  assert.equal(callbackCalls.length, 1);
  assert.equal(callbackCalls[0].body.get('status'), 'failed');
  assert.match(callbackCalls[0].body.get('error') ?? '', /face_url/);
});

test('filler face_url이 apiBaseUrl prefix 아닌 경우 → callbackFailed', async () => {
  const callbackCalls = [];
  const fillerCallbackCalls = [];

  const runner = createAssetJobRunner({
    apiBaseUrl: API_BASE,
    fetchImpl: makeFetchFiller({ callbackCalls, fillerCallbackCalls }),
    spawnImpl: makeSpawn(0),
    _qwenTtsFn: makeQwenTts(),
    _fifthRenderFn: makeFifthRender({ framesCount: 3 }),
    ffmpegMuxCmd: fillerFfmpegCmd,
  });

  runner.enqueue({
    job_id: 'fj_ssrf',
    kind: 'filler',
    clone_id: '9055',
    face_url: 'https://evil.example.com/face.jpg', 
    callback_token: 'tok_fj_ssrf',
  });

  await waitDrain(runner, 2000);

  assert.equal(fillerCallbackCalls.length, 0);
  assert.equal(callbackCalls.length, 1);
  assert.equal(callbackCalls[0].body.get('status'), 'failed');
  assert.match(callbackCalls[0].body.get('error') ?? '', /not allowed/);
});

test('직렬 큐 — filler + idle_video 혼합 → filler가 먼저 완료', async () => {
  const order = [];
  const callbackCalls = [];
  const fillerCallbackCalls = [];

  let firstCall = true;
  const qwenFn = async (text, cloneId) => {
    if (firstCall) { firstCall = false; await new Promise((r) => setTimeout(r, 50)); }
    return Buffer.from('wav');
  };

  const fetchImpl = async (url, opts) => {
    if (url.startsWith(`${API_BASE}/oth-path`)) {
      return { ok: true, status: 200, arrayBuffer: async () => new Uint8Array(10).buffer };
    }
    if (url === `${API_BASE}/oth-path`) {
      const fd = opts?.body;
      order.push(`asset_${fd?.get?.('job_id')}`);
      callbackCalls.push(fd);
      return { ok: true };
    }
    if (url === `${API_BASE}/oth-path`) {
      const fd = opts?.body;
      order.push(`filler_${fd?.get?.('job_id')}`);
      fillerCallbackCalls.push(fd);
      return { ok: true };
    }
    throw new Error(`unexpected: ${url}`);
  };

  const runner = createAssetJobRunner({
    apiBaseUrl: API_BASE,
    fetchImpl,
    spawnImpl: makeSpawn(0),
    genIdleCmd: (src, out) => ({ bin: 'echo', args: [out] }),
    extractSeCmd: (src, out) => ({ bin: 'echo', args: [out] }),
    _qwenTtsFn: qwenFn,
    _fifthRenderFn: makeFifthRender({ framesCount: 2 }),
    ffmpegMuxCmd: fillerFfmpegCmd,
    _ensureVoiceWavFn: makeEnsureVoiceWav(),
  });

  runner.enqueue({
    job_id: 'F',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${API_BASE}/oth-path`,
    voice_raw_url: `${API_BASE}/oth-path`,
    callback_token: 'tf',
  });
  runner.enqueue({
    job_id: 'I',
    kind: 'idle_video',
    src_url: `${API_BASE}/oth-path`,
    callback_token: 'ti',
  });

  await waitDrain(runner, 6000);

  assert.ok(fillerCallbackCalls.length === 1, 'filler 완료 필요');
  assert.ok(callbackCalls.length === 1, 'idle_video 완료 필요');

  const fidx = order.indexOf('filler_F');
  const iidx = order.indexOf('asset_I');
  assert.ok(fidx >= 0, 'filler callback 기록 필요');
  assert.ok(iidx >= 0, 'idle callback 기록 필요');
  assert.ok(fidx < iidx, `직렬 실패: filler(${fidx}) 이후 idle(${iidx}) 이어야 함`);
});

function makeQwenTtsTracked({ failOnIndex = -1 } = {}) {
  let calls = 0;
  const fn = async (text, _cloneId) => {
    const i = calls++;
    if (i === failOnIndex) throw new Error(`qwen3tts 503 for index ${i}`);
    return Buffer.from(`wav_${i}`);
  };
  fn.callCount = () => calls;
  return fn;
}

function makeFifthRenderTracked({ framesCount = 3, failOnIndex = -1 } = {}) {
  let calls = 0;
  const fn = async (_wavPath, _facePath) => {
    const i = calls++;
    if (i === failOnIndex) throw new Error(`fifth /render HTTP 500 at index ${i}`);
    const frames = [];
    for (let f = 0; f < framesCount; f++) frames.push(Buffer.from(`jpeg_${i}_${f}`));
    return frames;
  };
  fn.callCount = () => calls;
  return fn;
}

function makeSpawnFail(failOnIndex) {
  let callCount = 0;
  return (_bin, args, _opts) => {
    const i = callCount++;
    const shouldFail = (i === failOnIndex);
    const listeners = {};
    const stderrListeners = {};
    const proc = {
      stderr: {
        on(event, fn) { if (event === 'data') stderrListeners.data = fn; return proc.stderr; },
      },
      stdout: { on: () => proc.stdout },
      on(event, fn) { listeners[event] = fn; return proc; },
    };
    setImmediate(async () => {
      if (shouldFail) {
        if (stderrListeners.data) stderrListeners.data(Buffer.from('ffmpeg mux error'));
      } else {
        const outPath = args[args.length - 1];
        try { await writeFile(outPath, Buffer.from('dummy')); } catch {}
      }
      if (listeners['close']) listeners['close'](shouldFail ? 1 : 0);
    });
    return proc;
  };
}

test('filler 부분 실패: qwenTts index 0(첫 번째) 실패 → 전부-or-전무, 후속 index 미실행', async () => {
  const callbackCalls = [];
  const fillerCallbackCalls = [];

  const qwenFn = makeQwenTtsTracked({ failOnIndex: 0 });
  const fifthFn = makeFifthRenderTracked({ framesCount: 3 });

  const runner = createAssetJobRunner({
    apiBaseUrl: API_BASE,
    fetchImpl: makeFetchFiller({ callbackCalls, fillerCallbackCalls }),
    spawnImpl: makeSpawn(0),
    _qwenTtsFn: qwenFn,
    _fifthRenderFn: fifthFn,
    ffmpegMuxCmd: fillerFfmpegCmd,
    _ensureVoiceWavFn: makeEnsureVoiceWav(),
  });

  runner.enqueue({
    job_id: 'fj_q_idx0',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${API_BASE}/oth-path`,
    voice_raw_url: `${API_BASE}/oth-path`,
    callback_token: 'tok_q_idx0',
  });

  await waitDrain(runner, 4000);

  assert.equal(fillerCallbackCalls.length, 0, 'filler-job-done 호출 없어야 함 (전부-or-전무)');
  assert.equal(callbackCalls.length, 1, 'asset-job-done(failed) 1회 필요');
  assert.equal(callbackCalls[0].body.get('status'), 'failed');

  assert.equal(qwenFn.callCount(), 1, 'qwenTts index 0만 호출 (1회)');
  assert.equal(fifthFn.callCount(), 0, 'fifth 호출 없어야 함 (qwen 실패 후 중단)');
});

test('filler 부분 실패: qwenTts index 2(마지막) 실패 → 전부-or-전무, qwen 3회·fifth 2회', async () => {
  const callbackCalls = [];
  const fillerCallbackCalls = [];

  const qwenFn = makeQwenTtsTracked({ failOnIndex: 2 });
  const fifthFn = makeFifthRenderTracked({ framesCount: 2 });

  const runner = createAssetJobRunner({
    apiBaseUrl: API_BASE,
    fetchImpl: makeFetchFiller({ callbackCalls, fillerCallbackCalls }),
    spawnImpl: makeSpawn(0),
    _qwenTtsFn: qwenFn,
    _fifthRenderFn: fifthFn,
    ffmpegMuxCmd: fillerFfmpegCmd,
    _ensureVoiceWavFn: makeEnsureVoiceWav(),
  });

  runner.enqueue({
    job_id: 'fj_q_idx2',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${API_BASE}/oth-path`,
    voice_raw_url: `${API_BASE}/oth-path`,
    callback_token: 'tok_q_idx2',
  });

  await waitDrain(runner, 4000);

  assert.equal(fillerCallbackCalls.length, 0, 'filler-job-done 호출 없어야 함 (전부-or-전무)');
  assert.equal(callbackCalls.length, 1, 'asset-job-done(failed) 1회 필요');
  assert.equal(callbackCalls[0].body.get('status'), 'failed');

  assert.equal(qwenFn.callCount(), 3, 'qwenTts 3회 호출 (0·1 성공, 2 실패)');
  assert.equal(fifthFn.callCount(), 2, 'fifth 2회 호출 (index 0·1 처리 후 중단)');
});

test('filler 부분 실패: fifth render index 0(첫 번째) 실패 → 전부-or-전무, qwen 1회·fifth 1회', async () => {
  const callbackCalls = [];
  const fillerCallbackCalls = [];

  const qwenFn = makeQwenTtsTracked();
  const fifthFn = makeFifthRenderTracked({ framesCount: 3, failOnIndex: 0 });

  const runner = createAssetJobRunner({
    apiBaseUrl: API_BASE,
    fetchImpl: makeFetchFiller({ callbackCalls, fillerCallbackCalls }),
    spawnImpl: makeSpawn(0),
    _qwenTtsFn: qwenFn,
    _fifthRenderFn: fifthFn,
    ffmpegMuxCmd: fillerFfmpegCmd,
    _ensureVoiceWavFn: makeEnsureVoiceWav(),
  });

  runner.enqueue({
    job_id: 'fj_f_idx0',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${API_BASE}/oth-path`,
    voice_raw_url: `${API_BASE}/oth-path`,
    callback_token: 'tok_f_idx0',
  });

  await waitDrain(runner, 4000);

  assert.equal(fillerCallbackCalls.length, 0, 'filler-job-done 호출 없어야 함');
  assert.equal(callbackCalls.length, 1, 'asset-job-done(failed) 1회 필요');
  assert.equal(callbackCalls[0].body.get('status'), 'failed');
  assert.equal(qwenFn.callCount(), 1, 'qwenTts 1회 호출 (index 0만)');
  assert.equal(fifthFn.callCount(), 1, 'fifth 1회 호출 (index 0에서 실패 후 중단)');
});

test('filler 부분 실패: fifth render index 2(마지막) 실패 → 전부-or-전무, qwen 3회·fifth 3회', async () => {
  const callbackCalls = [];
  const fillerCallbackCalls = [];

  const qwenFn = makeQwenTtsTracked();
  const fifthFn = makeFifthRenderTracked({ framesCount: 3, failOnIndex: 2 });

  const runner = createAssetJobRunner({
    apiBaseUrl: API_BASE,
    fetchImpl: makeFetchFiller({ callbackCalls, fillerCallbackCalls }),
    spawnImpl: makeSpawn(0),
    _qwenTtsFn: qwenFn,
    _fifthRenderFn: fifthFn,
    ffmpegMuxCmd: fillerFfmpegCmd,
    _ensureVoiceWavFn: makeEnsureVoiceWav(),
  });

  runner.enqueue({
    job_id: 'fj_f_idx2',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${API_BASE}/oth-path`,
    voice_raw_url: `${API_BASE}/oth-path`,
    callback_token: 'tok_f_idx2',
  });

  await waitDrain(runner, 4000);

  assert.equal(fillerCallbackCalls.length, 0, 'filler-job-done 호출 없어야 함');
  assert.equal(callbackCalls.length, 1, 'asset-job-done(failed) 1회 필요');
  assert.equal(callbackCalls[0].body.get('status'), 'failed');

  assert.equal(qwenFn.callCount(), 3, 'qwenTts 3회 호출 (전부 성공)');
  assert.equal(fifthFn.callCount(), 3, 'fifth 3회 호출 (index 2에서 실패)');
});

test('filler ffmpeg mux 실패 (첫 번째 exit ≠ 0) → callbackFailed, filler-job-done 미호출', async () => {
  const callbackCalls = [];
  const fillerCallbackCalls = [];

  const qwenFn = makeQwenTtsTracked();
  const fifthFn = makeFifthRenderTracked({ framesCount: 3 });

  const runner = createAssetJobRunner({
    apiBaseUrl: API_BASE,
    fetchImpl: makeFetchFiller({ callbackCalls, fillerCallbackCalls }),
    spawnImpl: makeSpawnFail(0), 
    _qwenTtsFn: qwenFn,
    _fifthRenderFn: fifthFn,
    ffmpegMuxCmd: fillerFfmpegCmd,
    _ensureVoiceWavFn: makeEnsureVoiceWav(),
  });

  runner.enqueue({
    job_id: 'fj_mux_fail',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${API_BASE}/oth-path`,
    voice_raw_url: `${API_BASE}/oth-path`,
    callback_token: 'tok_mux_fail',
  });

  await waitDrain(runner, 4000);

  assert.equal(fillerCallbackCalls.length, 0, 'filler-job-done 호출 없어야 함');
  assert.equal(callbackCalls.length, 1, 'asset-job-done(failed) 1회 필요');
  assert.equal(callbackCalls[0].body.get('status'), 'failed');
  assert.match(callbackCalls[0].body.get('error') ?? '', /gen exit/);

  assert.equal(qwenFn.callCount(), 1, 'qwenTts 1회 호출 (index 0만)');
  assert.equal(fifthFn.callCount(), 1, 'fifth 1회 호출 (index 0만)');
});

test('filler clone_id 누락 → callbackFailed (L275 가드)', async () => {
  const callbackCalls = [];
  const fillerCallbackCalls = [];

  const runner = createAssetJobRunner({
    apiBaseUrl: API_BASE,
    fetchImpl: makeFetchFiller({ callbackCalls, fillerCallbackCalls }),
    spawnImpl: makeSpawn(0),
    _qwenTtsFn: makeQwenTts(),
    _fifthRenderFn: makeFifthRender({ framesCount: 3 }),
    ffmpegMuxCmd: fillerFfmpegCmd,
  });

  runner.enqueue({
    job_id: 'fj_noclone',
    kind: 'filler',
    face_url: `${API_BASE}/oth-path`,

    callback_token: 'tok_noclone',
  });

  await waitDrain(runner, 2000);

  assert.equal(fillerCallbackCalls.length, 0);
  assert.equal(callbackCalls.length, 1);
  assert.equal(callbackCalls[0].body.get('status'), 'failed');
  assert.match(callbackCalls[0].body.get('error') ?? '', /clone_id/);
});

test('filler fifth malformed 스트림: 종료마커 없음 → callbackFailed, 무한대기 없음', async () => {
  const callbackCalls = [];
  const fillerCallbackCalls = [];

  const malformedFifth = async () => {
    throw new Error('fifth render stream ended without terminator');
  };

  const runner = createAssetJobRunner({
    apiBaseUrl: API_BASE,
    fetchImpl: makeFetchFiller({ callbackCalls, fillerCallbackCalls }),
    spawnImpl: makeSpawn(0),
    _qwenTtsFn: makeQwenTts(),
    _fifthRenderFn: malformedFifth,
    ffmpegMuxCmd: fillerFfmpegCmd,
    _ensureVoiceWavFn: makeEnsureVoiceWav(),
  });

  runner.enqueue({
    job_id: 'fj_malformed_term',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${API_BASE}/oth-path`,
    voice_raw_url: `${API_BASE}/oth-path`,
    callback_token: 'tok_malformed_term',
  });

  await waitDrain(runner, 3000);

  assert.equal(fillerCallbackCalls.length, 0, 'filler-job-done 호출 없어야 함');
  assert.equal(callbackCalls.length, 1, 'asset-job-done(failed) 1회 필요');
  assert.equal(callbackCalls[0].body.get('status'), 'failed');
  assert.match(callbackCalls[0].body.get('error') ?? '', /terminator/);
});

test('filler fifth malformed 스트림: 길이필드 오버런 → callbackFailed', async () => {
  const callbackCalls = [];
  const fillerCallbackCalls = [];

  const malformedFifthLen = async () => {
    throw new Error('fifth render stream ended with 3 bytes residual (incomplete frame)');
  };

  const runner = createAssetJobRunner({
    apiBaseUrl: API_BASE,
    fetchImpl: makeFetchFiller({ callbackCalls, fillerCallbackCalls }),
    spawnImpl: makeSpawn(0),
    _qwenTtsFn: makeQwenTts(),
    _fifthRenderFn: malformedFifthLen,
    ffmpegMuxCmd: fillerFfmpegCmd,
    _ensureVoiceWavFn: makeEnsureVoiceWav(),
  });

  runner.enqueue({
    job_id: 'fj_malformed_len',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${API_BASE}/oth-path`,
    voice_raw_url: `${API_BASE}/oth-path`,
    callback_token: 'tok_malformed_len',
  });

  await waitDrain(runner, 3000);

  assert.equal(fillerCallbackCalls.length, 0);
  assert.equal(callbackCalls.length, 1);
  assert.equal(callbackCalls[0].body.get('status'), 'failed');
  assert.match(callbackCalls[0].body.get('error') ?? '', /residual|incomplete/);
});

test('filler 콜백 5xx: filler-job-done 500 반환 → drain 완료, 재시도 없음 (fire-and-forget)', async () => {

  let fillerDoneCalls = 0;

  const fetchImpl = async (url, opts) => {
    if (url.startsWith(`${API_BASE}/oth-path`)) {
      return { ok: true, status: 200, arrayBuffer: async () => new Uint8Array(20).buffer };
    }
    if (url === `${API_BASE}/oth-path`) {
      return { ok: true, status: 200 };
    }
    if (url === `${API_BASE}/oth-path`) {
      fillerDoneCalls++;
      return { ok: false, status: 500 }; 
    }
    throw new Error(`unexpected: ${url}`);
  };

  const runner = createAssetJobRunner({
    apiBaseUrl: API_BASE,
    fetchImpl,
    spawnImpl: makeSpawn(0),
    _qwenTtsFn: makeQwenTts(),
    _fifthRenderFn: makeFifthRender({ framesCount: 2 }),
    ffmpegMuxCmd: fillerFfmpegCmd,
    _ensureVoiceWavFn: makeEnsureVoiceWav(),
  });

  runner.enqueue({
    job_id: 'fj_5xx',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${API_BASE}/oth-path`,
    voice_raw_url: `${API_BASE}/oth-path`,
    callback_token: 'tok_5xx',
  });

  await waitDrain(runner, 4000);

  assert.equal(fillerDoneCalls, 1, 'filler-job-done 1회 호출 (5xx여도 fire-and-forget)');

  assert.equal(runner._size(), 0, '큐 비어있어야 함');
  assert.equal(runner._running(), false, 'running=false 이어야 함');
});

test('filler fifth 1프레임 반환 (경계값) → mux 성공, filler-job-done 호출', async () => {
  const callbackCalls = [];
  const fillerCallbackCalls = [];

  const runner = createAssetJobRunner({
    apiBaseUrl: API_BASE,
    fetchImpl: makeFetchFiller({ callbackCalls, fillerCallbackCalls }),
    spawnImpl: makeSpawn(0),
    _qwenTtsFn: makeQwenTts(),
    _fifthRenderFn: makeFifthRender({ framesCount: 1 }), 
    ffmpegMuxCmd: fillerFfmpegCmd,
    _ensureVoiceWavFn: makeEnsureVoiceWav(),
  });

  runner.enqueue({
    job_id: 'fj_1frame',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${API_BASE}/oth-path`,
    voice_raw_url: `${API_BASE}/oth-path`,
    callback_token: 'tok_1frame',
  });

  await waitDrain(runner, 4000);

  assert.equal(fillerCallbackCalls.length, 1, 'filler-job-done 1회 호출 필요');
  assert.equal(callbackCalls.length, 0, 'asset-job-done 호출 없어야 함 (성공)');
  const fd = fillerCallbackCalls[0].body;
  assert.equal(fd.get('status'), 'done');
  assert.ok(fd.get('file0'), 'file0 필드 필요');
  assert.ok(fd.get('file1'), 'file1 필드 필요');
  assert.ok(fd.get('file2'), 'file2 필드 필요');
});

function makeEnsureVoiceWav({ failWith = null, callLog = [] } = {}) {
  return async (cloneId, voiceRawUrl, refRoot, fetchFn, spawnFn) => {
    callLog.push({ cloneId, voiceRawUrl, refRoot });
    if (failWith) throw new Error(failWith);
  };
}

test('F4b: voice_raw_url 없음 → callbackFailed (SSRF 가드)', async () => {
  const callbackCalls = [];
  const fillerCallbackCalls = [];
  const ensureLog = [];

  const runner = createAssetJobRunner({
    apiBaseUrl: API_BASE,
    fetchImpl: makeFetchFiller({ callbackCalls, fillerCallbackCalls }),
    spawnImpl: makeSpawn(0),
    _qwenTtsFn: makeQwenTts(),
    _fifthRenderFn: makeFifthRender({ framesCount: 3 }),
    ffmpegMuxCmd: fillerFfmpegCmd,
    _ensureVoiceWavFn: makeEnsureVoiceWav({ callLog: ensureLog }),
  });

  runner.enqueue({
    job_id: 'fj_no_vraw',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${API_BASE}/oth-path`,

    callback_token: 'tok_no_vraw',
  });

  await waitDrain(runner, 3000);

  assert.equal(fillerCallbackCalls.length, 0, 'filler-job-done 호출 없어야 함');
  assert.equal(callbackCalls.length, 1, 'asset-job-done(failed) 1회 필요');
  assert.equal(callbackCalls[0].body.get('status'), 'failed');
  assert.match(callbackCalls[0].body.get('error') ?? '', /voice_raw_url/);
  assert.equal(ensureLog.length, 0, 'ensure 호출 없어야 함 (SSRF 가드 선검사)');
});

test('F4b: voice_raw_url SSRF (apiBaseUrl 외부) → callbackFailed', async () => {
  const callbackCalls = [];
  const fillerCallbackCalls = [];
  const ensureLog = [];

  const runner = createAssetJobRunner({
    apiBaseUrl: API_BASE,
    fetchImpl: makeFetchFiller({ callbackCalls, fillerCallbackCalls }),
    spawnImpl: makeSpawn(0),
    _qwenTtsFn: makeQwenTts(),
    _fifthRenderFn: makeFifthRender({ framesCount: 3 }),
    ffmpegMuxCmd: fillerFfmpegCmd,
    _ensureVoiceWavFn: makeEnsureVoiceWav({ callLog: ensureLog }),
  });

  runner.enqueue({
    job_id: 'fj_ssrf_vraw',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${API_BASE}/oth-path`,
    voice_raw_url: 'https://evil.example.com/voice.mp3', 
    callback_token: 'tok_ssrf_vraw',
  });

  await waitDrain(runner, 2000);

  assert.equal(fillerCallbackCalls.length, 0);
  assert.equal(callbackCalls.length, 1);
  assert.equal(callbackCalls[0].body.get('status'), 'failed');
  assert.match(callbackCalls[0].body.get('error') ?? '', /voice_raw_url.*not allowed|not allowed.*voice_raw_url/);
  assert.equal(ensureLog.length, 0, 'ensure 호출 없어야 함');
});

test('F4b: voice.wav ensure 실패(다운로드 오류) → callbackFailed, filler-job-done 미호출', async () => {
  const callbackCalls = [];
  const fillerCallbackCalls = [];

  const runner = createAssetJobRunner({
    apiBaseUrl: API_BASE,
    fetchImpl: makeFetchFiller({ callbackCalls, fillerCallbackCalls }),
    spawnImpl: makeSpawn(0),
    _qwenTtsFn: makeQwenTts(),
    _fifthRenderFn: makeFifthRender({ framesCount: 3 }),
    ffmpegMuxCmd: fillerFfmpegCmd,
    _ensureVoiceWavFn: makeEnsureVoiceWav({ failWith: 'voice_raw_url fetch failed: HTTP 503' }),
  });

  runner.enqueue({
    job_id: 'fj_ensure_fail',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${API_BASE}/oth-path`,
    voice_raw_url: `${API_BASE}/oth-path`,
    callback_token: 'tok_ensure_fail',
  });

  await waitDrain(runner, 3000);

  assert.equal(fillerCallbackCalls.length, 0, 'filler-job-done 호출 없어야 함');
  assert.equal(callbackCalls.length, 1, 'asset-job-done(failed) 1회 필요');
  assert.equal(callbackCalls[0].body.get('status'), 'failed');
  assert.match(callbackCalls[0].body.get('error') ?? '', /503|fetch failed/);
});

test('F4b: voice.wav ensure 성공 → qwen3tts 호출, filler-job-done 1회', async () => {
  const callbackCalls = [];
  const fillerCallbackCalls = [];
  const ensureLog = [];

  const runner = createAssetJobRunner({
    apiBaseUrl: API_BASE,
    fetchImpl: makeFetchFiller({ callbackCalls, fillerCallbackCalls }),
    spawnImpl: makeSpawn(0),
    _qwenTtsFn: makeQwenTts(),
    _fifthRenderFn: makeFifthRender({ framesCount: 2 }),
    ffmpegMuxCmd: fillerFfmpegCmd,
    _ensureVoiceWavFn: makeEnsureVoiceWav({ callLog: ensureLog }),
  });

  runner.enqueue({
    job_id: 'fj_ensure_ok',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${API_BASE}/oth-path`,
    voice_raw_url: `${API_BASE}/oth-path`,
    callback_token: 'tok_ensure_ok',
  });

  await waitDrain(runner, 4000);

  assert.equal(fillerCallbackCalls.length, 1, 'filler-job-done 1회 호출 필요');
  assert.equal(callbackCalls.length, 0, 'asset-job-done 호출 없어야 함 (성공)');

  assert.equal(ensureLog.length, 1, 'ensureVoiceWav 1회 호출 필요');
  assert.equal(ensureLog[0].cloneId, '9055');
  assert.equal(ensureLog[0].voiceRawUrl, `${API_BASE}/oth-path`);
  const fd = fillerCallbackCalls[0].body;
  assert.equal(fd.get('status'), 'done');
});

test('F4b: voice.wav already exists → ensure 호출됐지만 skip(멱등), filler-job-done 1회', async () => {

  const callbackCalls = [];
  const fillerCallbackCalls = [];
  const ensureLog = [];

  const skipEnsure = async (cloneId, voiceRawUrl, refRoot) => {
    ensureLog.push({ cloneId, voiceRawUrl, refRoot, skipped: true });

  };

  const runner = createAssetJobRunner({
    apiBaseUrl: API_BASE,
    fetchImpl: makeFetchFiller({ callbackCalls, fillerCallbackCalls }),
    spawnImpl: makeSpawn(0),
    _qwenTtsFn: makeQwenTts(),
    _fifthRenderFn: makeFifthRender({ framesCount: 2 }),
    ffmpegMuxCmd: fillerFfmpegCmd,
    _ensureVoiceWavFn: skipEnsure,
  });

  runner.enqueue({
    job_id: 'fj_skip_ensure',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${API_BASE}/oth-path`,
    voice_raw_url: `${API_BASE}/oth-path`,
    callback_token: 'tok_skip_ensure',
  });

  await waitDrain(runner, 4000);

  assert.equal(fillerCallbackCalls.length, 1, 'filler-job-done 1회 호출 필요 (skip 후에도 계속)');
  assert.equal(callbackCalls.length, 0, 'asset-job-done 호출 없어야 함');
  assert.equal(ensureLog.length, 1, 'ensure 1회 호출 (skip)');
  assert.equal(ensureLog[0].skipped, true);
});

test('F4b: 기존 filler 테스트 회귀 — voice_raw_url 추가 후 기존 실패 케이스(voice_raw_url 없음) → failed', async () => {

  const callbackCalls = [];
  const fillerCallbackCalls = [];

  const runner = createAssetJobRunner({
    apiBaseUrl: API_BASE,
    fetchImpl: makeFetchFiller({ callbackCalls, fillerCallbackCalls }),
    spawnImpl: makeSpawn(0),
    _qwenTtsFn: makeQwenTts(),
    _fifthRenderFn: makeFifthRender({ framesCount: 3 }),
    ffmpegMuxCmd: fillerFfmpegCmd,
    _ensureVoiceWavFn: makeEnsureVoiceWav(),
  });

  runner.enqueue({
    job_id: 'fj_regr_novraw',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${API_BASE}/oth-path`,

    callback_token: 'tok_regr_novraw',
  });

  await waitDrain(runner, 2000);

  assert.equal(fillerCallbackCalls.length, 0);
  assert.equal(callbackCalls.length, 1);
  assert.equal(callbackCalls[0].body.get('status'), 'failed');
});

test('H-1: apiBaseUrl 빈 문자열 → processFillerJob SSRF 방어 불가 즉시 거부 → callbackFailed', async () => {
  const callbackCalls = [];

  const fetchImpl = async (url, opts) => {
    if (url.includes('/oth-path')) {
      callbackCalls.push({ url, body: opts?.body });
      return { ok: true };
    }
    return { ok: true };
  };

  const runner = createAssetJobRunner({
    apiBaseUrl: '', 
    fetchImpl,
    spawnImpl: makeSpawn(0),
    _qwenTtsFn: makeQwenTts(),
    _fifthRenderFn: makeFifthRender({ framesCount: 2 }),
    ffmpegMuxCmd: fillerFfmpegCmd,
    _ensureVoiceWavFn: makeEnsureVoiceWav(),
  });

  runner.enqueue({
    job_id: 'h1_empty',
    kind: 'filler',
    clone_id: '9055',
    face_url: 'https://evil.example.com/face.jpg', 
    voice_raw_url: 'https://evil.example.com/voice.mp3',
    callback_token: 'tok_h1',
  });

  await waitDrain(runner, 3000);

  assert.ok(callbackCalls.length >= 1, 'callbackFailed 호출 필요');
  const fd = callbackCalls[0].body;
  assert.equal(fd.get('status'), 'failed');
  assert.match(fd.get('error') ?? '', /oth-pathBaseUrl/);
});

test('M-1: face_url SSRF prefix 우회 시도 (apiBaseUrl.evil.com) → callbackFailed', async () => {
  const callbackCalls = [];
  const fillerCallbackCalls = [];

  const runner = createAssetJobRunner({
    apiBaseUrl: API_BASE,
    fetchImpl: makeFetchFiller({ callbackCalls, fillerCallbackCalls }),
    spawnImpl: makeSpawn(0),
    _qwenTtsFn: makeQwenTts(),
    _fifthRenderFn: makeFifthRender({ framesCount: 3 }),
    ffmpegMuxCmd: fillerFfmpegCmd,
    _ensureVoiceWavFn: makeEnsureVoiceWav(),
  });

  runner.enqueue({
    job_id: 'm1_face_pfx',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${API_BASE}.evil.com/face.jpg`,
    voice_raw_url: `${API_BASE}/oth-path`,
    callback_token: 'tok_m1_face',
  });

  await waitDrain(runner, 2000);

  assert.equal(fillerCallbackCalls.length, 0, 'filler-job-done 호출 없어야 함');
  assert.equal(callbackCalls.length, 1, 'callbackFailed 1회 필요');
  assert.equal(callbackCalls[0].body.get('status'), 'failed');
  assert.match(callbackCalls[0].body.get('error') ?? '', /not allowed/);
});

test('M-1: voice_raw_url SSRF prefix 우회 시도 (apiBaseUrl.evil.com) → callbackFailed', async () => {
  const callbackCalls = [];
  const fillerCallbackCalls = [];

  const runner = createAssetJobRunner({
    apiBaseUrl: API_BASE,
    fetchImpl: makeFetchFiller({ callbackCalls, fillerCallbackCalls }),
    spawnImpl: makeSpawn(0),
    _qwenTtsFn: makeQwenTts(),
    _fifthRenderFn: makeFifthRender({ framesCount: 3 }),
    ffmpegMuxCmd: fillerFfmpegCmd,
    _ensureVoiceWavFn: makeEnsureVoiceWav(),
  });

  runner.enqueue({
    job_id: 'm1_vraw_pfx',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${API_BASE}/oth-path`,
    voice_raw_url: `${API_BASE}.evil.com/voice.mp3`, 
    callback_token: 'tok_m1_vraw',
  });

  await waitDrain(runner, 2000);

  assert.equal(fillerCallbackCalls.length, 0);
  assert.equal(callbackCalls.length, 1);
  assert.equal(callbackCalls[0].body.get('status'), 'failed');
  assert.match(callbackCalls[0].body.get('error') ?? '', /voice_raw_url.*not allowed|not allowed.*voice_raw_url/);
});

test('M-2: defaultEnsureVoiceWav — clone_id="../evil" → throws (path traversal 방지)', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'test-m2-'));
  try {
    const fetchFn = async () => ({
      ok: true, status: 200,
      arrayBuffer: async () => new ArrayBuffer(0),
      headers: { get: () => null },
    });
    await assert.rejects(
      () => defaultEnsureVoiceWav('../evil', 'http://example.com/v.wav', dir, fetchFn, makeSpawn(0)),
      /양의 정수|clone_id/
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('M-2: defaultEnsureVoiceWav — clone_id 숫자(9055) → 양의 정수 검증 통과 (skip 경로)', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'test-m2-num-'));
  try {

    mkdirSync(join(dir, '9055'), { recursive: true });
    writeFileSync(join(dir, '9055', 'voice.wav'), Buffer.alloc(2000));

    const noFetch = async () => { throw new Error('fetch should not be called'); };
    await defaultEnsureVoiceWav(9055, 'http://example.com/v.wav', dir, noFetch, makeSpawn(0));

  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('M-3: defaultEnsureVoiceWav — Content-Length > 50MB → throws (OOM 방지)', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'test-m3-'));
  try {
    const bigCl = String(_MAX_VOICE_WAV_BYTES + 1);
    const fetchFn = async () => ({
      ok: true, status: 200,
      arrayBuffer: async () => new ArrayBuffer(0),
      headers: { get: (k) => (k === 'content-length' ? bigCl : null) },
    });

    await assert.rejects(
      () => defaultEnsureVoiceWav('9055', 'http://example.com/v.wav', dir, fetchFn, makeSpawn(0)),
      /Content-Length|초과|OOM/
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('M-3: Content-Length 헤더 없음 → OOM 체크 스킵 (보수적 기본값)', async () => {

  const dir = await mkdtemp(join(tmpdir(), 'test-m3-nohdr-'));
  try {
    const fetchFn = async () => ({
      ok: true, status: 200,
      arrayBuffer: async () => new Uint8Array(20).buffer,
      headers: { get: () => null }, 
    });
    const spawnFn = (_bin, args, _opts) => {
      const outPath = args[args.length - 1];
      const listeners = {};
      const proc = {
        stderr: { on: () => proc.stderr },
        stdout: { on: () => proc.stdout },
        on(event, fn) { listeners[event] = fn; return proc; },
      };
      setImmediate(async () => {
        await writeFile(outPath, Buffer.alloc(2000)); 
        if (listeners['close']) listeners['close'](0);
      });
      return proc;
    };

    await defaultEnsureVoiceWav('9055', 'http://example.com/v.wav', dir, fetchFn, spawnFn);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('B-1: defaultEnsureVoiceWav — ffmpeg 결과 wav < 1024B → throws (손상 wav 방지)', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'test-b1-'));
  try {
    const fetchFn = async () => ({
      ok: true, status: 200,
      arrayBuffer: async () => new Uint8Array(20).buffer,
      headers: { get: () => null },
    });

    const spawnFn = (_bin, args, _opts) => {
      const outPath = args[args.length - 1];
      const listeners = {};
      const proc = {
        stderr: { on: () => proc.stderr },
        stdout: { on: () => proc.stdout },
        on(event, fn) { listeners[event] = fn; return proc; },
      };
      setImmediate(async () => {
        await writeFile(outPath, Buffer.alloc(50)); 
        if (listeners['close']) listeners['close'](0);
      });
      return proc;
    };

    await assert.rejects(
      () => defaultEnsureVoiceWav('9055', 'http://example.com/v.wav', dir, fetchFn, spawnFn),
      /너무 작음|1024/
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('B-2: defaultEnsureVoiceWav — ffmpeg exit ≠ 0 → throws', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'test-b2-'));
  try {
    const fetchFn = async () => ({
      ok: true, status: 200,
      arrayBuffer: async () => new Uint8Array(20).buffer,
      headers: { get: () => null },
    });
    const spawnFn = (_bin, _args, _opts) => {
      const listeners = {};
      const stderrListeners = {};
      const proc = {
        stderr: {
          on(ev, fn) { if (ev === 'data') stderrListeners.data = fn; return proc.stderr; },
        },
        stdout: { on: () => proc.stdout },
        on(event, fn) { listeners[event] = fn; return proc; },
      };
      setImmediate(() => {
        if (stderrListeners.data) stderrListeners.data(Buffer.from('ffmpeg error: bad input'));
        if (listeners['close']) listeners['close'](1); 
      });
      return proc;
    };

    await assert.rejects(
      () => defaultEnsureVoiceWav('9055', 'http://example.com/v.wav', dir, fetchFn, spawnFn),
      /ffmpeg|rc=1/
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('MAJOR: defaultEnsureVoiceWav — HTTP200 빈 body → ffmpeg 출력 50B → 1024B 가드 → throws', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'test-0byte-'));
  try {
    const fetchFn = async () => ({
      ok: true, status: 200,
      arrayBuffer: async () => new ArrayBuffer(0), 
      headers: { get: () => null },
    });

    const spawnFn = (_bin, args, _opts) => {
      const outPath = args[args.length - 1];
      const listeners = {};
      const proc = {
        stderr: { on: () => proc.stderr },
        stdout: { on: () => proc.stdout },
        on(event, fn) { listeners[event] = fn; return proc; },
      };
      setImmediate(async () => {
        await writeFile(outPath, Buffer.alloc(50));
        if (listeners['close']) listeners['close'](0);
      });
      return proc;
    };

    await assert.rejects(
      () => defaultEnsureVoiceWav('9055', 'http://example.com/v.wav', dir, fetchFn, spawnFn),
      /너무 작음|1024/
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('MAJOR: filler clone_id 숫자 타입(9055) → 정상 처리 (String 변환 통과)', async () => {
  const callbackCalls = [];
  const fillerCallbackCalls = [];

  const runner = createAssetJobRunner({
    apiBaseUrl: API_BASE,
    fetchImpl: makeFetchFiller({ callbackCalls, fillerCallbackCalls }),
    spawnImpl: makeSpawn(0),
    _qwenTtsFn: makeQwenTts(),
    _fifthRenderFn: makeFifthRender({ framesCount: 2 }),
    ffmpegMuxCmd: fillerFfmpegCmd,
    _ensureVoiceWavFn: makeEnsureVoiceWav(),
  });

  runner.enqueue({
    job_id: 'fj_num_clone',
    kind: 'filler',
    clone_id: 9055, 
    face_url: `${API_BASE}/oth-path`,
    voice_raw_url: `${API_BASE}/oth-path`,
    callback_token: 'tok_num_clone',
  });

  await waitDrain(runner, 4000);

  assert.equal(fillerCallbackCalls.length, 1, 'filler-job-done 1회 호출 (숫자 clone_id 통과)');
  assert.equal(callbackCalls.length, 0, 'asset-job-done 호출 없어야 함 (성공)');
});

test('MAJOR: 부분실패(qwen index 0 fail) 시에도 ensure 루프 이전 1회 선행 호출', async () => {
  const callbackCalls = [];
  const fillerCallbackCalls = [];
  const ensureLog = [];

  const qwenFn = makeQwenTtsTracked({ failOnIndex: 0 });
  const fifthFn = makeFifthRenderTracked({ framesCount: 3 });

  const runner = createAssetJobRunner({
    apiBaseUrl: API_BASE,
    fetchImpl: makeFetchFiller({ callbackCalls, fillerCallbackCalls }),
    spawnImpl: makeSpawn(0),
    _qwenTtsFn: qwenFn,
    _fifthRenderFn: fifthFn,
    ffmpegMuxCmd: fillerFfmpegCmd,
    _ensureVoiceWavFn: makeEnsureVoiceWav({ callLog: ensureLog }),
  });

  runner.enqueue({
    job_id: 'fj_ensure_order',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${API_BASE}/oth-path`,
    voice_raw_url: `${API_BASE}/oth-path`,
    callback_token: 'tok_ensure_order',
  });

  await waitDrain(runner, 4000);

  assert.equal(callbackCalls.length, 1, '실패 콜백 1회');
  assert.equal(callbackCalls[0].body.get('status'), 'failed');

  assert.equal(ensureLog.length, 1, 'ensure 1회 선행 호출');
  assert.equal(ensureLog[0].cloneId, '9055', 'ensure clone_id 정확히 전달');
  assert.equal(ensureLog[0].voiceRawUrl, `${API_BASE}/oth-path`, 'ensure voiceRawUrl 정확히 전달');

  assert.equal(qwenFn.callCount(), 1, 'qwen 1회 호출 (index 0만)');
  assert.equal(fifthFn.callCount(), 0, 'fifth 0회 (qwen 실패 후 중단)');
});

test('MAJOR: 부분실패(fifth index 1 fail) — ensure 1회 + 호출 순서 qwen2·fifth2 확인', async () => {
  const callbackCalls = [];
  const fillerCallbackCalls = [];
  const ensureLog = [];

  const qwenFn = makeQwenTtsTracked();
  const fifthFn = makeFifthRenderTracked({ framesCount: 3, failOnIndex: 1 });

  const runner = createAssetJobRunner({
    apiBaseUrl: API_BASE,
    fetchImpl: makeFetchFiller({ callbackCalls, fillerCallbackCalls }),
    spawnImpl: makeSpawn(0),
    _qwenTtsFn: qwenFn,
    _fifthRenderFn: fifthFn,
    ffmpegMuxCmd: fillerFfmpegCmd,
    _ensureVoiceWavFn: makeEnsureVoiceWav({ callLog: ensureLog }),
  });

  runner.enqueue({
    job_id: 'fj_fifth_idx1',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${API_BASE}/oth-path`,
    voice_raw_url: `${API_BASE}/oth-path`,
    callback_token: 'tok_fifth_idx1',
  });

  await waitDrain(runner, 4000);

  assert.equal(fillerCallbackCalls.length, 0, 'filler-job-done 0회 (전부-or-전무)');
  assert.equal(callbackCalls.length, 1, 'callbackFailed 1회');

  assert.equal(ensureLog.length, 1, 'ensure 1회 선행 호출');

  assert.equal(qwenFn.callCount(), 2, 'qwen 2회 (0·1)');
  assert.equal(fifthFn.callCount(), 2, 'fifth 2회 (0 성공·1 실패)');
});

async function serveRenderStream(bodyChunks) {
  const { createServer } = await import('node:http');
  const srv = createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
    for (const c of bodyChunks) res.write(c);
    res.end();
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  return { srv, url: `http://127.0.0.1:${srv.address().port}` };
}

function frame(payload) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(payload.length, 0);
  return Buffer.concat([len, payload]);
}

const TERMINATOR = Buffer.alloc(4); 

test('defaultFifthRender: 정상 스트림(프레임 2 + 터미네이터) → 프레임 배열 resolve', async () => {
  const f1 = Buffer.from('jpeg-one');
  const f2 = Buffer.from('jpeg-two-larger');
  const { srv, url } = await serveRenderStream([frame(f1), frame(f2), TERMINATOR]);
  try {
    const frames = await defaultFifthRender('/tmp/x.wav', '/tmp/face.jpg', url);
    assert.equal(frames.length, 2, '프레임 2개');
    assert.deepEqual(frames[0], f1);
    assert.deepEqual(frames[1], f2);
  } finally {
    srv.close();
  }
});

test('defaultFifthRender: 터미네이터가 프레임과 같은 chunk 로 붙어 와도 resolve', async () => {
  const f1 = Buffer.from('jpeg-only');

  const { srv, url } = await serveRenderStream([Buffer.concat([frame(f1), TERMINATOR])]);
  try {
    const frames = await defaultFifthRender('/tmp/x.wav', '/tmp/face.jpg', url);
    assert.equal(frames.length, 1);
    assert.deepEqual(frames[0], f1);
  } finally {
    srv.close();
  }
});

test('defaultFifthRender: 터미네이터 뒤 잔여 바이트 → residual reject 유지', async () => {
  const { srv, url } = await serveRenderStream([
    frame(Buffer.from('jpeg-one')), TERMINATOR, Buffer.from('garbage'),
  ]);
  try {
    await assert.rejects(
      () => defaultFifthRender('/tmp/x.wav', '/tmp/face.jpg', url),
      /residual/,
    );
  } finally {
    srv.close();
  }
});

test('defaultFifthRender: 터미네이터 없이 종료 → terminator reject 유지', async () => {
  const { srv, url } = await serveRenderStream([frame(Buffer.from('jpeg-one'))]);
  try {
    await assert.rejects(
      () => defaultFifthRender('/tmp/x.wav', '/tmp/face.jpg', url),
      /terminator/,
    );
  } finally {
    srv.close();
  }
});
