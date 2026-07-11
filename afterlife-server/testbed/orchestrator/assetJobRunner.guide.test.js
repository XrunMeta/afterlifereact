

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { createAssetJobRunner } from './assetJobRunner.js';

const API_BASE = 'https://oth-path.example.com';

function makeFetchGuide({ srcOk = true, callbackCalls = [], guideCallbackCalls = [] } = {}) {
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
      guideCallbackCalls.push({ url, method: opts?.method, body: opts?.body });
      return { ok: true, status: 200 };
    }
    throw new Error(`unexpected fetch (guide mock): ${url}`);
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

function guideFfmpegCmd(framesDir, wavPath, outPath) {
  return { bin: 'echo', args: [outPath] };
}

function makeEnsureVoiceWav({ failWith = null, callLog = [] } = {}) {
  return async (cloneId, voiceRawUrl, refRoot, fetchFn, spawnFn) => {
    callLog.push({ cloneId, voiceRawUrl, refRoot });
    if (failWith) throw new Error(failWith);
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

async function waitDrain(runner, timeout = 3000) {
  const t0 = Date.now();
  while (runner._size() > 0 || runner._running()) {
    if (Date.now() - t0 > timeout) throw new Error('waitDrain timeout');
    await new Promise((r) => setTimeout(r, 10));
  }
  await new Promise((r) => setTimeout(r, 20));
}

test('guide 잡: suggestGuideMentsFn 멘트 2개 → mp4 2개로 /oth-path 1회 호출', async () => {
  const callbackCalls = [];
  const guideCallbackCalls = [];
  const suggestLog = [];

  const runner = createAssetJobRunner({
    apiBaseUrl: API_BASE,
    fetchImpl: makeFetchGuide({ callbackCalls, guideCallbackCalls }),
    spawnImpl: makeSpawn(0),
    _qwenTtsFn: makeQwenTts(),
    _fifthRenderFn: makeFifthRender({ framesCount: 3 }),
    ffmpegMuxCmd: guideFfmpegCmd,
    _ensureVoiceWavFn: makeEnsureVoiceWav(),
    suggestGuideMentsFn: async (arg) => {
      suggestLog.push(arg);
      return ['인사1', '인사2'];
    },
  });

  runner.enqueue({
    job_id: 'gj_ok',
    kind: 'guide',
    clone_id: '9055',
    face_url: `${API_BASE}/oth-path`,
    voice_raw_url: `${API_BASE}/oth-path`,
    callback_token: 'tok_gj_ok',
    persona: { l0: { tone: 'warm' }, l1: { personality_core: '따뜻함' } },
  });

  await waitDrain(runner);

  assert.equal(guideCallbackCalls.length, 1, '/oth-path 1회 호출 필요');
  assert.equal(callbackCalls.length, 0, 'asset-job-done 호출 없어야 함 (성공)');

  const fd = guideCallbackCalls[0].body;
  assert.ok(fd instanceof FormData, 'body는 FormData이어야 함');
  assert.equal(fd.get('job_id'), 'gj_ok');
  assert.equal(fd.get('status'), 'done');
  assert.equal(fd.get('callback_token'), 'tok_gj_ok');
  assert.ok(fd.get('file0'), 'file0 필드 필요');
  assert.ok(fd.get('file1'), 'file1 필드 필요');
  assert.equal(fd.get('file2'), null, '멘트 개수(2) 초과 필드 없음');

  assert.equal(suggestLog.length, 1, 'suggestGuideMentsFn 1회 호출');
  assert.deepEqual(suggestLog[0], { persona: { personality_core: '따뜻함' } });
});

test('guide 잡: persona null → suggestGuideMentsFn에 빈 persona({}) 전달 (안전 폴백)', async () => {
  const callbackCalls = [];
  const guideCallbackCalls = [];
  const suggestLog = [];

  const runner = createAssetJobRunner({
    apiBaseUrl: API_BASE,
    fetchImpl: makeFetchGuide({ callbackCalls, guideCallbackCalls }),
    spawnImpl: makeSpawn(0),
    _qwenTtsFn: makeQwenTts(),
    _fifthRenderFn: makeFifthRender({ framesCount: 2 }),
    ffmpegMuxCmd: guideFfmpegCmd,
    _ensureVoiceWavFn: makeEnsureVoiceWav(),
    suggestGuideMentsFn: async (arg) => {
      suggestLog.push(arg);
      return ['어? 누구세요?'];
    },
  });

  runner.enqueue({
    job_id: 'gj_nopersona',
    kind: 'guide',
    clone_id: '9055',
    face_url: `${API_BASE}/oth-path`,
    voice_raw_url: `${API_BASE}/oth-path`,
    callback_token: 'tok_gj_np',
    persona: null,
  });

  await waitDrain(runner);

  assert.equal(guideCallbackCalls.length, 1, 'guide-job-done 1회 호출 필요');
  assert.equal(suggestLog.length, 1);
  assert.deepEqual(suggestLog[0], { persona: {} }, 'persona null → {} 폴백');
});

test('guide 잡: persona.l1 없음(undefined) → {} 폴백', async () => {
  const guideCallbackCalls = [];
  const suggestLog = [];

  const runner = createAssetJobRunner({
    apiBaseUrl: API_BASE,
    fetchImpl: makeFetchGuide({ guideCallbackCalls }),
    spawnImpl: makeSpawn(0),
    _qwenTtsFn: makeQwenTts(),
    _fifthRenderFn: makeFifthRender({ framesCount: 2 }),
    ffmpegMuxCmd: guideFfmpegCmd,
    _ensureVoiceWavFn: makeEnsureVoiceWav(),
    suggestGuideMentsFn: async (arg) => {
      suggestLog.push(arg);
      return ['어? 누구세요?'];
    },
  });

  runner.enqueue({
    job_id: 'gj_nol1',
    kind: 'guide',
    clone_id: '9055',
    face_url: `${API_BASE}/oth-path`,
    voice_raw_url: `${API_BASE}/oth-path`,
    callback_token: 'tok_gj_nol1',
    persona: { l0: { tone: 'warm' } }, 
  });

  await waitDrain(runner);

  assert.equal(guideCallbackCalls.length, 1);
  assert.deepEqual(suggestLog[0], { persona: {} }, 'l1 없음 → {} 폴백');
});

test('guide 잡: qwenTts 2번째(index 1) 실패 → guide-job-done 0회, asset-job-done failed 1회', async () => {
  const callbackCalls = [];
  const guideCallbackCalls = [];

  const runner = createAssetJobRunner({
    apiBaseUrl: API_BASE,
    fetchImpl: makeFetchGuide({ callbackCalls, guideCallbackCalls }),
    spawnImpl: makeSpawn(0),
    _qwenTtsFn: makeQwenTts({ failOnIndex: 1 }),
    _fifthRenderFn: makeFifthRender({ framesCount: 3 }),
    ffmpegMuxCmd: guideFfmpegCmd,
    _ensureVoiceWavFn: makeEnsureVoiceWav(),
    suggestGuideMentsFn: async () => ['인사1', '인사2', '인사3'],
  });

  runner.enqueue({
    job_id: 'gj_qwen_fail',
    kind: 'guide',
    clone_id: '9055',
    face_url: `${API_BASE}/oth-path`,
    voice_raw_url: `${API_BASE}/oth-path`,
    callback_token: 'tok_gj_qf',
    persona: null,
  });

  await waitDrain(runner);

  assert.equal(guideCallbackCalls.length, 0, 'guide-job-done 호출 없어야 함 (전부-or-전무)');
  assert.equal(callbackCalls.length, 1, 'asset-job-done(failed) 1회 필요');
  const fd = callbackCalls[0].body;
  assert.equal(fd.get('job_id'), 'gj_qwen_fail');
  assert.equal(fd.get('status'), 'failed');
  assert.ok(fd.get('error'));
});

test('guide 잡: fifth 0 프레임(소스 부적합) → callbackFailed, guide-job-done 0회', async () => {
  const callbackCalls = [];
  const guideCallbackCalls = [];

  const runner = createAssetJobRunner({
    apiBaseUrl: API_BASE,
    fetchImpl: makeFetchGuide({ callbackCalls, guideCallbackCalls }),
    spawnImpl: makeSpawn(0),
    _qwenTtsFn: makeQwenTts(),
    _fifthRenderFn: makeFifthRender({ framesCount: 0 }),
    ffmpegMuxCmd: guideFfmpegCmd,
    _ensureVoiceWavFn: makeEnsureVoiceWav(),
    suggestGuideMentsFn: async () => ['인사1', '인사2'],
  });

  runner.enqueue({
    job_id: 'gj_noframe',
    kind: 'guide',
    clone_id: '9055',
    face_url: `${API_BASE}/oth-path`,
    voice_raw_url: `${API_BASE}/oth-path`,
    callback_token: 'tok_gj_nf',
    persona: null,
  });

  await waitDrain(runner);

  assert.equal(guideCallbackCalls.length, 0);
  assert.equal(callbackCalls.length, 1);
  const fd = callbackCalls[0].body;
  assert.equal(fd.get('status'), 'failed');
  assert.match(fd.get('error') ?? '', /0 frames|unsuitable/);
});

test('guide 잡: clone_id 누락 → callbackFailed', async () => {
  const callbackCalls = [];
  const guideCallbackCalls = [];

  const runner = createAssetJobRunner({
    apiBaseUrl: API_BASE,
    fetchImpl: makeFetchGuide({ callbackCalls, guideCallbackCalls }),
    spawnImpl: makeSpawn(0),
    _qwenTtsFn: makeQwenTts(),
    _fifthRenderFn: makeFifthRender({ framesCount: 3 }),
    ffmpegMuxCmd: guideFfmpegCmd,
    suggestGuideMentsFn: async () => ['인사1'],
  });

  runner.enqueue({
    job_id: 'gj_noclone',
    kind: 'guide',
    face_url: `${API_BASE}/oth-path`,

    callback_token: 'tok_gj_noclone',
    persona: null,
  });

  await waitDrain(runner, 2000);

  assert.equal(guideCallbackCalls.length, 0);
  assert.equal(callbackCalls.length, 1);
  assert.equal(callbackCalls[0].body.get('status'), 'failed');
  assert.match(callbackCalls[0].body.get('error') ?? '', /clone_id/);
});

test('guide 잡: face_url이 apiBaseUrl prefix 아닌 경우(SSRF) → callbackFailed', async () => {
  const callbackCalls = [];
  const guideCallbackCalls = [];

  const runner = createAssetJobRunner({
    apiBaseUrl: API_BASE,
    fetchImpl: makeFetchGuide({ callbackCalls, guideCallbackCalls }),
    spawnImpl: makeSpawn(0),
    _qwenTtsFn: makeQwenTts(),
    _fifthRenderFn: makeFifthRender({ framesCount: 3 }),
    ffmpegMuxCmd: guideFfmpegCmd,
    suggestGuideMentsFn: async () => ['인사1'],
  });

  runner.enqueue({
    job_id: 'gj_ssrf',
    kind: 'guide',
    clone_id: '9055',
    face_url: 'https://evil.example.com/face.jpg',
    callback_token: 'tok_gj_ssrf',
    persona: null,
  });

  await waitDrain(runner, 2000);

  assert.equal(guideCallbackCalls.length, 0);
  assert.equal(callbackCalls.length, 1);
  assert.equal(callbackCalls[0].body.get('status'), 'failed');
  assert.match(callbackCalls[0].body.get('error') ?? '', /not allowed/);
});

test('guide 잡: voice_raw_url 누락(SSRF 가드) → callbackFailed, ensure 미호출', async () => {
  const callbackCalls = [];
  const guideCallbackCalls = [];
  const ensureLog = [];

  const runner = createAssetJobRunner({
    apiBaseUrl: API_BASE,
    fetchImpl: makeFetchGuide({ callbackCalls, guideCallbackCalls }),
    spawnImpl: makeSpawn(0),
    _qwenTtsFn: makeQwenTts(),
    _fifthRenderFn: makeFifthRender({ framesCount: 3 }),
    ffmpegMuxCmd: guideFfmpegCmd,
    _ensureVoiceWavFn: makeEnsureVoiceWav({ callLog: ensureLog }),
    suggestGuideMentsFn: async () => ['인사1'],
  });

  runner.enqueue({
    job_id: 'gj_no_vraw',
    kind: 'guide',
    clone_id: '9055',
    face_url: `${API_BASE}/oth-path`,

    callback_token: 'tok_gj_no_vraw',
    persona: null,
  });

  await waitDrain(runner);

  assert.equal(guideCallbackCalls.length, 0);
  assert.equal(callbackCalls.length, 1);
  assert.equal(callbackCalls[0].body.get('status'), 'failed');
  assert.match(callbackCalls[0].body.get('error') ?? '', /voice_raw_url/);
  assert.equal(ensureLog.length, 0, 'ensure 호출 없어야 함 (SSRF 가드 선검사)');
});

test('직렬 큐 — filler + guide 혼합 시 순서대로 처리 (회귀 확인)', async () => {
  const order = [];
  const callbackCalls = [];
  const fillerCallbackCalls = [];
  const guideCallbackCalls = [];

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
    if (url === `${API_BASE}/oth-path`) {
      const fd = opts?.body;
      order.push(`guide_${fd?.get?.('job_id')}`);
      guideCallbackCalls.push(fd);
      return { ok: true };
    }
    throw new Error(`unexpected: ${url}`);
  };

  const runner = createAssetJobRunner({
    apiBaseUrl: API_BASE,
    fetchImpl,
    spawnImpl: makeSpawn(0),
    _qwenTtsFn: makeQwenTts(),
    _fifthRenderFn: makeFifthRender({ framesCount: 2 }),
    ffmpegMuxCmd: guideFfmpegCmd,
    _ensureVoiceWavFn: makeEnsureVoiceWav(),
    suggestGuideMentsFn: async () => ['인사1', '인사2'],
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
    job_id: 'G',
    kind: 'guide',
    clone_id: '9055',
    face_url: `${API_BASE}/oth-path`,
    voice_raw_url: `${API_BASE}/oth-path`,
    callback_token: 'tg',
    persona: null,
  });

  await waitDrain(runner, 6000);

  assert.equal(fillerCallbackCalls.length, 1, 'filler 완료 필요');
  assert.equal(guideCallbackCalls.length, 1, 'guide 완료 필요');

  const fidx = order.indexOf('filler_F');
  const gidx = order.indexOf('guide_G');
  assert.ok(fidx >= 0 && gidx >= 0);
  assert.ok(fidx < gidx, `직렬 실패: filler(${fidx}) 이후 guide(${gidx}) 이어야 함`);
});

test('guide mux 호출은 audioVolumeDb 를 받지 않음(4번째 인자 undefined, 필러 -20dB 감쇠 무영향)', async () => {
  const callbackCalls = [];
  const guideCallbackCalls = [];
  const muxCalls = [];

  const capturingMuxCmd = (framesDir, wavPath, outPath, audioVolumeDb) => {
    muxCalls.push(audioVolumeDb);
    return { bin: 'echo', args: [outPath] };
  };

  const runner = createAssetJobRunner({
    apiBaseUrl: API_BASE,
    fetchImpl: makeFetchGuide({ callbackCalls, guideCallbackCalls }),
    spawnImpl: makeSpawn(0),
    _qwenTtsFn: makeQwenTts(),
    _fifthRenderFn: makeFifthRender({ framesCount: 2 }),
    ffmpegMuxCmd: capturingMuxCmd,
    _ensureVoiceWavFn: makeEnsureVoiceWav(),
    suggestGuideMentsFn: async () => ['인사1', '인사2'],
  });

  runner.enqueue({
    job_id: 'gj_mux_novol',
    kind: 'guide',
    clone_id: '9055',
    face_url: `${API_BASE}/oth-path`,
    voice_raw_url: `${API_BASE}/oth-path`,
    callback_token: 'tok_gj_mux_novol',
    persona: { l0: { tone: 'warm' } },
  });

  await waitDrain(runner);

  assert.equal(guideCallbackCalls.length, 1, '전부 성공해야 함');
  assert.equal(muxCalls.length, 2, '멘트 2개 → mux 2회');
  assert.ok(muxCalls.every((db) => db === undefined), 'guide mux 는 audioVolumeDb 미전달(감쇠 없음)이어야 함');
});
