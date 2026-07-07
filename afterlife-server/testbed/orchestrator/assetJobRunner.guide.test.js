

import { v_2a805f } from 'xkazwubuk';
import v_ce93bd from 'fabuoqnjmpyosmftbi';
import { v_354e0a } from 'fnffflguqbrqugbi';
import { v_47bade } from './assetJobRunner.js';

const v_cc9198 = 'https://oth-path.example.com';

function v_89faa2({ srcOk: v_c3f70d = true, callbackCalls: v_0a664b = [], guideCallbackCalls: v_ed0369 = [] } = {}) {
  return async (v_f71b56, v_328259) => {
    if (v_f71b56.startsWith(`${v_cc9198}/oth-path`)) {
      if (!v_c3f70d) {
        return { ok: false, status: 500, arrayBuffer: async () => new ArrayBuffer(0), text: async () => '' };
      }
      return { ok: true, status: 200, arrayBuffer: async () => new Uint8Array(20).buffer };
    }
    if (v_f71b56 === `${v_cc9198}/oth-path`) {
      v_0a664b.push({ url: v_f71b56, method: v_328259?.method, body: v_328259?.body });
      return { ok: true, status: 200 };
    }
    if (v_f71b56 === `${v_cc9198}/oth-path`) {
      v_ed0369.push({ url: v_f71b56, method: v_328259?.method, body: v_328259?.body });
      return { ok: true, status: 200 };
    }
    throw new Error(`unexpected fetch (guide mock): ${v_f71b56}`);
  };
}

function v_142ee6(v_6051a4 = 0) {
  return (v_99e186, v_4317d1, v_931fee) => {
    const v_9fde29 = {};
    const v_adaede = {
      stderr: { on: () => v_adaede.stderr },
      stdout: { on: () => v_adaede.stdout },
      on(v_d48baf, v_f80480) { v_9fde29[v_d48baf] = v_f80480; return v_adaede; },
    };
    setImmediate(async () => {
      if (v_6051a4 === 0) {
        const v_dc7792 = v_4317d1[v_4317d1.length - 1];
        try { await v_354e0a(v_dc7792, Buffer.from('dummy')); } catch {}
      }
      if (v_9fde29['close']) v_9fde29['close'](v_6051a4);
    });
    return v_adaede;
  };
}

function v_c4fa09(v_7746b5, v_f2bb81, v_dc7792) {
  return { bin: 'echo', args: [v_dc7792] };
}

function v_096d67({ failWith: v_9f01ae = null, callLog: v_551d50 = [] } = {}) {
  return async (v_6e0fd3, v_35d74b, v_6c4613, v_9718cb, v_80b7f4) => {
    v_551d50.push({ cloneId: v_6e0fd3, voiceRawUrl: v_35d74b, refRoot: v_6c4613 });
    if (v_9f01ae) throw new Error(v_9f01ae);
  };
}

function v_b41a6d({ failOnIndex: v_89531a = -1 } = {}) {
  let v_aff40c = 0;
  return async (v_9b6134, v_6e0fd3) => {
    const v_ebec57 = v_aff40c++;
    if (v_ebec57 === v_89531a) throw new Error(`qwen3tts 503 voice.wav missing for index ${v_ebec57}`);
    return Buffer.from(`wav_${v_ebec57}_${v_9b6134.slice(0, 5)}`);
  };
}

function v_1fb003({ framesCount: v_9f98c3 = 3, failOnIndex: v_89531a = -1 } = {}) {
  let v_aff40c = 0;
  return async (v_f2bb81, v_f37742) => {
    const v_ebec57 = v_aff40c++;
    if (v_ebec57 === v_89531a) throw new Error(`fifth /render HTTP 500`);
    const v_3b40dd = [];
    for (let v_8b5cd8 = 0; v_8b5cd8 < v_9f98c3; v_8b5cd8++) v_3b40dd.push(Buffer.from(`jpeg_${v_ebec57}_${v_8b5cd8}`));
    return v_3b40dd;
  };
}

async function v_26eff3(v_eedf31, v_ea0359 = 3000) {
  const v_b66f2c = Date.now();
  while (v_eedf31._size() > 0 || v_eedf31._running()) {
    if (Date.now() - v_b66f2c > v_ea0359) throw new Error('waitDrain timeout');
    await new Promise((v_cb35cb) => setTimeout(v_cb35cb, 10));
  }
  await new Promise((v_cb35cb) => setTimeout(v_cb35cb, 20));
}

v_2a805f('guide 잡: suggestGuideMentsFn 멘트 2개 → mp4 2개로 /oth-path 1회 호출', async () => {
  const v_0a664b = [];
  const v_ed0369 = [];
  const v_e8de8d = [];

  const v_eedf31 = v_47bade({
    apiBaseUrl: v_cc9198,
    fetchImpl: v_89faa2({ callbackCalls: v_0a664b, guideCallbackCalls: v_ed0369 }),
    spawnImpl: v_142ee6(0),
    _qwenTtsFn: v_b41a6d(),
    _fifthRenderFn: v_1fb003({ framesCount: 3 }),
    ffmpegMuxCmd: v_c4fa09,
    _ensureVoiceWavFn: v_096d67(),
    suggestGuideMentsFn: async (v_183f55) => {
      v_e8de8d.push(v_183f55);
      return ['인사1', '인사2'];
    },
  });

  v_eedf31.enqueue({
    job_id: 'gj_ok',
    kind: 'guide',
    clone_id: '9055',
    face_url: `${v_cc9198}/oth-path`,
    voice_raw_url: `${v_cc9198}/oth-path`,
    callback_token: 'tok_gj_ok',
    persona: { l0: { tone: 'warm' }, l1: { personality_core: '따뜻함' } },
  });

  await v_26eff3(v_eedf31);

  v_ce93bd.equal(v_ed0369.length, 1, '/oth-path 1회 호출 필요');
  v_ce93bd.equal(v_0a664b.length, 0, 'asset-job-done 호출 없어야 함 (성공)');

  const v_23563e = v_ed0369[0].body;
  v_ce93bd.ok(v_23563e instanceof FormData, 'body는 FormData이어야 함');
  v_ce93bd.equal(v_23563e.get('job_id'), 'gj_ok');
  v_ce93bd.equal(v_23563e.get('status'), 'done');
  v_ce93bd.equal(v_23563e.get('callback_token'), 'tok_gj_ok');
  v_ce93bd.ok(v_23563e.get('file0'), 'file0 필드 필요');
  v_ce93bd.ok(v_23563e.get('file1'), 'file1 필드 필요');
  v_ce93bd.equal(v_23563e.get('file2'), null, '멘트 개수(2) 초과 필드 없음');

  v_ce93bd.equal(v_e8de8d.length, 1, 'suggestGuideMentsFn 1회 호출');
  v_ce93bd.deepEqual(v_e8de8d[0], { persona: { personality_core: '따뜻함' } });
});

v_2a805f('guide 잡: persona null → suggestGuideMentsFn에 빈 persona({}) 전달 (안전 폴백)', async () => {
  const v_0a664b = [];
  const v_ed0369 = [];
  const v_e8de8d = [];

  const v_eedf31 = v_47bade({
    apiBaseUrl: v_cc9198,
    fetchImpl: v_89faa2({ callbackCalls: v_0a664b, guideCallbackCalls: v_ed0369 }),
    spawnImpl: v_142ee6(0),
    _qwenTtsFn: v_b41a6d(),
    _fifthRenderFn: v_1fb003({ framesCount: 2 }),
    ffmpegMuxCmd: v_c4fa09,
    _ensureVoiceWavFn: v_096d67(),
    suggestGuideMentsFn: async (v_183f55) => {
      v_e8de8d.push(v_183f55);
      return ['어? 누구세요?'];
    },
  });

  v_eedf31.enqueue({
    job_id: 'gj_nopersona',
    kind: 'guide',
    clone_id: '9055',
    face_url: `${v_cc9198}/oth-path`,
    voice_raw_url: `${v_cc9198}/oth-path`,
    callback_token: 'tok_gj_np',
    persona: null,
  });

  await v_26eff3(v_eedf31);

  v_ce93bd.equal(v_ed0369.length, 1, 'guide-job-done 1회 호출 필요');
  v_ce93bd.equal(v_e8de8d.length, 1);
  v_ce93bd.deepEqual(v_e8de8d[0], { persona: {} }, 'persona null → {} 폴백');
});

v_2a805f('guide 잡: persona.l1 없음(undefined) → {} 폴백', async () => {
  const v_ed0369 = [];
  const v_e8de8d = [];

  const v_eedf31 = v_47bade({
    apiBaseUrl: v_cc9198,
    fetchImpl: v_89faa2({ guideCallbackCalls: v_ed0369 }),
    spawnImpl: v_142ee6(0),
    _qwenTtsFn: v_b41a6d(),
    _fifthRenderFn: v_1fb003({ framesCount: 2 }),
    ffmpegMuxCmd: v_c4fa09,
    _ensureVoiceWavFn: v_096d67(),
    suggestGuideMentsFn: async (v_183f55) => {
      v_e8de8d.push(v_183f55);
      return ['어? 누구세요?'];
    },
  });

  v_eedf31.enqueue({
    job_id: 'gj_nol1',
    kind: 'guide',
    clone_id: '9055',
    face_url: `${v_cc9198}/oth-path`,
    voice_raw_url: `${v_cc9198}/oth-path`,
    callback_token: 'tok_gj_nol1',
    persona: { l0: { tone: 'warm' } }, 
  });

  await v_26eff3(v_eedf31);

  v_ce93bd.equal(v_ed0369.length, 1);
  v_ce93bd.deepEqual(v_e8de8d[0], { persona: {} }, 'l1 없음 → {} 폴백');
});

v_2a805f('guide 잡: qwenTts 2번째(index 1) 실패 → guide-job-done 0회, asset-job-done failed 1회', async () => {
  const v_0a664b = [];
  const v_ed0369 = [];

  const v_eedf31 = v_47bade({
    apiBaseUrl: v_cc9198,
    fetchImpl: v_89faa2({ callbackCalls: v_0a664b, guideCallbackCalls: v_ed0369 }),
    spawnImpl: v_142ee6(0),
    _qwenTtsFn: v_b41a6d({ failOnIndex: 1 }),
    _fifthRenderFn: v_1fb003({ framesCount: 3 }),
    ffmpegMuxCmd: v_c4fa09,
    _ensureVoiceWavFn: v_096d67(),
    suggestGuideMentsFn: async () => ['인사1', '인사2', '인사3'],
  });

  v_eedf31.enqueue({
    job_id: 'gj_qwen_fail',
    kind: 'guide',
    clone_id: '9055',
    face_url: `${v_cc9198}/oth-path`,
    voice_raw_url: `${v_cc9198}/oth-path`,
    callback_token: 'tok_gj_qf',
    persona: null,
  });

  await v_26eff3(v_eedf31);

  v_ce93bd.equal(v_ed0369.length, 0, 'guide-job-done 호출 없어야 함 (전부-or-전무)');
  v_ce93bd.equal(v_0a664b.length, 1, 'asset-job-done(failed) 1회 필요');
  const v_23563e = v_0a664b[0].body;
  v_ce93bd.equal(v_23563e.get('job_id'), 'gj_qwen_fail');
  v_ce93bd.equal(v_23563e.get('status'), 'failed');
  v_ce93bd.ok(v_23563e.get('error'));
});

v_2a805f('guide 잡: fifth 0 프레임(소스 부적합) → callbackFailed, guide-job-done 0회', async () => {
  const v_0a664b = [];
  const v_ed0369 = [];

  const v_eedf31 = v_47bade({
    apiBaseUrl: v_cc9198,
    fetchImpl: v_89faa2({ callbackCalls: v_0a664b, guideCallbackCalls: v_ed0369 }),
    spawnImpl: v_142ee6(0),
    _qwenTtsFn: v_b41a6d(),
    _fifthRenderFn: v_1fb003({ framesCount: 0 }),
    ffmpegMuxCmd: v_c4fa09,
    _ensureVoiceWavFn: v_096d67(),
    suggestGuideMentsFn: async () => ['인사1', '인사2'],
  });

  v_eedf31.enqueue({
    job_id: 'gj_noframe',
    kind: 'guide',
    clone_id: '9055',
    face_url: `${v_cc9198}/oth-path`,
    voice_raw_url: `${v_cc9198}/oth-path`,
    callback_token: 'tok_gj_nf',
    persona: null,
  });

  await v_26eff3(v_eedf31);

  v_ce93bd.equal(v_ed0369.length, 0);
  v_ce93bd.equal(v_0a664b.length, 1);
  const v_23563e = v_0a664b[0].body;
  v_ce93bd.equal(v_23563e.get('status'), 'failed');
  v_ce93bd.match(v_23563e.get('error') ?? '', /0 frames|unsuitable/);
});

v_2a805f('guide 잡: clone_id 누락 → callbackFailed', async () => {
  const v_0a664b = [];
  const v_ed0369 = [];

  const v_eedf31 = v_47bade({
    apiBaseUrl: v_cc9198,
    fetchImpl: v_89faa2({ callbackCalls: v_0a664b, guideCallbackCalls: v_ed0369 }),
    spawnImpl: v_142ee6(0),
    _qwenTtsFn: v_b41a6d(),
    _fifthRenderFn: v_1fb003({ framesCount: 3 }),
    ffmpegMuxCmd: v_c4fa09,
    suggestGuideMentsFn: async () => ['인사1'],
  });

  v_eedf31.enqueue({
    job_id: 'gj_noclone',
    kind: 'guide',
    face_url: `${v_cc9198}/oth-path`,

    callback_token: 'tok_gj_noclone',
    persona: null,
  });

  await v_26eff3(v_eedf31, 2000);

  v_ce93bd.equal(v_ed0369.length, 0);
  v_ce93bd.equal(v_0a664b.length, 1);
  v_ce93bd.equal(v_0a664b[0].body.get('status'), 'failed');
  v_ce93bd.match(v_0a664b[0].body.get('error') ?? '', /clone_id/);
});

v_2a805f('guide 잡: face_url이 apiBaseUrl prefix 아닌 경우(SSRF) → callbackFailed', async () => {
  const v_0a664b = [];
  const v_ed0369 = [];

  const v_eedf31 = v_47bade({
    apiBaseUrl: v_cc9198,
    fetchImpl: v_89faa2({ callbackCalls: v_0a664b, guideCallbackCalls: v_ed0369 }),
    spawnImpl: v_142ee6(0),
    _qwenTtsFn: v_b41a6d(),
    _fifthRenderFn: v_1fb003({ framesCount: 3 }),
    ffmpegMuxCmd: v_c4fa09,
    suggestGuideMentsFn: async () => ['인사1'],
  });

  v_eedf31.enqueue({
    job_id: 'gj_ssrf',
    kind: 'guide',
    clone_id: '9055',
    face_url: 'https://evil.example.com/face.jpg',
    callback_token: 'tok_gj_ssrf',
    persona: null,
  });

  await v_26eff3(v_eedf31, 2000);

  v_ce93bd.equal(v_ed0369.length, 0);
  v_ce93bd.equal(v_0a664b.length, 1);
  v_ce93bd.equal(v_0a664b[0].body.get('status'), 'failed');
  v_ce93bd.match(v_0a664b[0].body.get('error') ?? '', /not allowed/);
});

v_2a805f('guide 잡: voice_raw_url 누락(SSRF 가드) → callbackFailed, ensure 미호출', async () => {
  const v_0a664b = [];
  const v_ed0369 = [];
  const v_0398e0 = [];

  const v_eedf31 = v_47bade({
    apiBaseUrl: v_cc9198,
    fetchImpl: v_89faa2({ callbackCalls: v_0a664b, guideCallbackCalls: v_ed0369 }),
    spawnImpl: v_142ee6(0),
    _qwenTtsFn: v_b41a6d(),
    _fifthRenderFn: v_1fb003({ framesCount: 3 }),
    ffmpegMuxCmd: v_c4fa09,
    _ensureVoiceWavFn: v_096d67({ callLog: v_0398e0 }),
    suggestGuideMentsFn: async () => ['인사1'],
  });

  v_eedf31.enqueue({
    job_id: 'gj_no_vraw',
    kind: 'guide',
    clone_id: '9055',
    face_url: `${v_cc9198}/oth-path`,

    callback_token: 'tok_gj_no_vraw',
    persona: null,
  });

  await v_26eff3(v_eedf31);

  v_ce93bd.equal(v_ed0369.length, 0);
  v_ce93bd.equal(v_0a664b.length, 1);
  v_ce93bd.equal(v_0a664b[0].body.get('status'), 'failed');
  v_ce93bd.match(v_0a664b[0].body.get('error') ?? '', /voice_raw_url/);
  v_ce93bd.equal(v_0398e0.length, 0, 'ensure 호출 없어야 함 (SSRF 가드 선검사)');
});

v_2a805f('직렬 큐 — filler + guide 혼합 시 순서대로 처리 (회귀 확인)', async () => {
  const v_5e4f30 = [];
  const v_0a664b = [];
  const v_7eab3e = [];
  const v_ed0369 = [];

  const v_d10060 = async (v_f71b56, v_328259) => {
    if (v_f71b56.startsWith(`${v_cc9198}/oth-path`)) {
      return { ok: true, status: 200, arrayBuffer: async () => new Uint8Array(10).buffer };
    }
    if (v_f71b56 === `${v_cc9198}/oth-path`) {
      const v_23563e = v_328259?.body;
      v_5e4f30.push(`asset_${v_23563e?.get?.('job_id')}`);
      v_0a664b.push(v_23563e);
      return { ok: true };
    }
    if (v_f71b56 === `${v_cc9198}/oth-path`) {
      const v_23563e = v_328259?.body;
      v_5e4f30.push(`filler_${v_23563e?.get?.('job_id')}`);
      v_7eab3e.push(v_23563e);
      return { ok: true };
    }
    if (v_f71b56 === `${v_cc9198}/oth-path`) {
      const v_23563e = v_328259?.body;
      v_5e4f30.push(`guide_${v_23563e?.get?.('job_id')}`);
      v_ed0369.push(v_23563e);
      return { ok: true };
    }
    throw new Error(`unexpected: ${v_f71b56}`);
  };

  const v_eedf31 = v_47bade({
    apiBaseUrl: v_cc9198,
    fetchImpl: v_d10060,
    spawnImpl: v_142ee6(0),
    _qwenTtsFn: v_b41a6d(),
    _fifthRenderFn: v_1fb003({ framesCount: 2 }),
    ffmpegMuxCmd: v_c4fa09,
    _ensureVoiceWavFn: v_096d67(),
    suggestGuideMentsFn: async () => ['인사1', '인사2'],
  });

  v_eedf31.enqueue({
    job_id: 'F',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${v_cc9198}/oth-path`,
    voice_raw_url: `${v_cc9198}/oth-path`,
    callback_token: 'tf',
  });
  v_eedf31.enqueue({
    job_id: 'G',
    kind: 'guide',
    clone_id: '9055',
    face_url: `${v_cc9198}/oth-path`,
    voice_raw_url: `${v_cc9198}/oth-path`,
    callback_token: 'tg',
    persona: null,
  });

  await v_26eff3(v_eedf31, 6000);

  v_ce93bd.equal(v_7eab3e.length, 1, 'filler 완료 필요');
  v_ce93bd.equal(v_ed0369.length, 1, 'guide 완료 필요');

  const v_959aaf = v_5e4f30.indexOf('filler_F');
  const v_9b4259 = v_5e4f30.indexOf('guide_G');
  v_ce93bd.ok(v_959aaf >= 0 && v_9b4259 >= 0);
  v_ce93bd.ok(v_959aaf < v_9b4259, `직렬 실패: filler(${v_959aaf}) 이후 guide(${v_9b4259}) 이어야 함`);
});
