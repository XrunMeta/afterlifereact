import { v_2a805f } from 'xkazwubuk';
import v_ce93bd from 'fabuoqnjmpyosmftbi';
import { v_354e0a, v_f4ad91, v_cdd5c2 } from 'fnffflguqbrqugbi';
import { v_eaee41, v_086912 } from 'hbppvrg';
import { v_315113 } from 'wiosxndes';
import { v_171b31 } from 'xxkrszo';
import { v_47bade, v_ddfcca, v_9aedb6, v_7e5b4f, v_af8891, v_15296d, v_aefc06, v_7e9d02, v_6ac389, v_3a5853, v_a5c84f, v_ff5f5c } from './assetJobRunner.js';

const v_cc9198 = 'https://oth-path.example.com';

function v_4de825({ srcOk: v_c3f70d = true, callbackCalls: v_0a664b }) {
  return async (v_f71b56, v_328259) => {
    if (v_f71b56.startsWith(`${v_cc9198}/oth-path`)) {
      if (!v_c3f70d) return { ok: false, status: 500, arrayBuffer: async () => new ArrayBuffer(0) };
      return { ok: true, status: 200, arrayBuffer: async () => new Uint8Array(10).buffer };
    }
    if (v_f71b56 === `${v_cc9198}/oth-path`) {
      v_0a664b.push({ url: v_f71b56, method: v_328259?.method, body: v_328259?.body });
      return { ok: true, status: 200 };
    }
    throw new Error(`unexpected fetch: ${v_f71b56}`);
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

function v_d73cc8({ srcOk: v_c3f70d = true, callbackCalls: v_0a664b = [], fillerCallbackCalls: v_7eab3e = [] } = {}) {
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
      v_7eab3e.push({ url: v_f71b56, method: v_328259?.method, body: v_328259?.body });
      return { ok: true, status: 200 };
    }
    throw new Error(`unexpected fetch (filler mock): ${v_f71b56}`);
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

function v_4bb6fb(v_7746b5, v_f2bb81, v_dc7792) {
  return { bin: 'echo', args: [v_dc7792] };
}

async function v_26eff3(v_eedf31, v_ea0359 = 2000) {
  const v_b66f2c = Date.now();
  while (v_eedf31._size() > 0 || v_eedf31._running()) {
    if (Date.now() - v_b66f2c > v_ea0359) throw new Error('waitDrain timeout');
    await new Promise((v_cb35cb) => setTimeout(v_cb35cb, 10));
  }

  await new Promise((v_cb35cb) => setTimeout(v_cb35cb, 20));
}

v_2a805f('idle_video 잡 성공 시 callback status=done + file 페이로드', async () => {
  const v_0a664b = [];
  const v_d10060 = v_4de825({ callbackCalls: v_0a664b });
  const v_b1d1a2 = v_142ee6(0);

  const v_eedf31 = v_47bade({
    apiBaseUrl: v_cc9198,
    genIdleCmd: (v_38d084, v_8d4337) => ({ bin: 'echo', args: [v_38d084, v_8d4337] }),
    extractSeCmd: (v_38d084, v_8d4337) => ({ bin: 'echo', args: [v_38d084, v_8d4337] }),
    fetchImpl: v_d10060,
    spawnImpl: v_b1d1a2,
  });

  v_eedf31.enqueue({
    job_id: 'job1',
    kind: 'idle_video',
    src_url: `${v_cc9198}/oth-path`,
    callback_token: 'tok_abc',
  });

  await v_26eff3(v_eedf31);

  v_ce93bd.equal(v_0a664b.length, 1, '콜백 1회 호출 필요');
  const v_23563e = v_0a664b[0].body;
  v_ce93bd.ok(v_23563e instanceof FormData, 'body는 FormData이어야 함');
  v_ce93bd.equal(v_23563e.get('job_id'), 'job1');
  v_ce93bd.equal(v_23563e.get('status'), 'done');
  v_ce93bd.equal(v_23563e.get('callback_token'), 'tok_abc');
  v_ce93bd.ok(v_23563e.get('file'), 'file 필드 필요');
});

v_2a805f('voice_clone 잡 성공 시 callback status=done', async () => {
  const v_0a664b = [];
  const v_d10060 = v_4de825({ callbackCalls: v_0a664b });
  const v_b1d1a2 = v_142ee6(0);

  const v_eedf31 = v_47bade({
    apiBaseUrl: v_cc9198,
    genIdleCmd: (v_38d084, v_8d4337) => ({ bin: 'echo', args: [v_38d084, v_8d4337] }),
    extractSeCmd: (v_38d084, v_8d4337) => ({ bin: 'echo', args: [v_38d084, v_8d4337] }),
    fetchImpl: v_d10060,
    spawnImpl: v_b1d1a2,
  });

  v_eedf31.enqueue({
    job_id: 'job2',
    kind: 'voice_clone',
    src_url: `${v_cc9198}/oth-path`,
    callback_token: 'tok_xyz',
  });

  await v_26eff3(v_eedf31);

  v_ce93bd.equal(v_0a664b.length, 1);
  const v_23563e = v_0a664b[0].body;
  v_ce93bd.equal(v_23563e.get('job_id'), 'job2');
  v_ce93bd.equal(v_23563e.get('status'), 'done');
  v_ce93bd.equal(v_23563e.get('callback_token'), 'tok_xyz');
});

v_2a805f('spawn 실패(exit ≠ 0) 시 callback status=failed', async () => {
  const v_0a664b = [];
  const v_d10060 = v_4de825({ callbackCalls: v_0a664b });
  const v_b1d1a2 = v_142ee6(1); 

  const v_eedf31 = v_47bade({
    apiBaseUrl: v_cc9198,
    genIdleCmd: (v_38d084, v_8d4337) => ({ bin: 'echo', args: [v_38d084, v_8d4337] }),
    extractSeCmd: (v_38d084, v_8d4337) => ({ bin: 'echo', args: [v_38d084, v_8d4337] }),
    fetchImpl: v_d10060,
    spawnImpl: v_b1d1a2,
  });

  v_eedf31.enqueue({
    job_id: 'job3',
    kind: 'idle_video',
    src_url: `${v_cc9198}/oth-path`,
    callback_token: 'tok_fail',
  });

  await v_26eff3(v_eedf31);

  v_ce93bd.equal(v_0a664b.length, 1, '실패 콜백 1회 필요');
  const v_23563e = v_0a664b[0].body;
  v_ce93bd.equal(v_23563e.get('job_id'), 'job3');
  v_ce93bd.equal(v_23563e.get('status'), 'failed');
  v_ce93bd.ok(v_23563e.get('error'), 'error 필드 필요');
});

v_2a805f('src 다운로드 실패 시 callback status=failed', async () => {
  const v_0a664b = [];
  const v_d10060 = v_4de825({ srcOk: false, callbackCalls: v_0a664b });
  const v_b1d1a2 = v_142ee6(0);

  const v_eedf31 = v_47bade({
    apiBaseUrl: v_cc9198,
    genIdleCmd: (v_38d084, v_8d4337) => ({ bin: 'echo', args: [v_38d084, v_8d4337] }),
    extractSeCmd: (v_38d084, v_8d4337) => ({ bin: 'echo', args: [v_38d084, v_8d4337] }),
    fetchImpl: v_d10060,
    spawnImpl: v_b1d1a2,
  });

  v_eedf31.enqueue({
    job_id: 'job4',
    kind: 'idle_video',
    src_url: `${v_cc9198}/oth-path`,
    callback_token: 'tok_srcfail',
  });

  await v_26eff3(v_eedf31);

  v_ce93bd.equal(v_0a664b.length, 1);
  const v_23563e = v_0a664b[0].body;
  v_ce93bd.equal(v_23563e.get('status'), 'failed');
});

v_2a805f('큐 직렬 처리 — 2건 순서대로 완료', async () => {
  const v_5e4f30 = [];
  const v_0a664b = [];

  let v_46a5a5 = 0;
  const v_b1d1a2 = (v_99e186, v_4317d1, v_931fee) => {

    const v_e86ad8 = v_46a5a5++;
    const v_4b24d2 = v_e86ad8 === 0 ? 50 : 0;
    const v_9fde29 = {};
    const v_adaede = {
      stderr: { on: () => v_adaede.stderr },
      stdout: { on: () => v_adaede.stdout },
      on(v_d48baf, v_f80480) { v_9fde29[v_d48baf] = v_f80480; return v_adaede; },
    };
    setTimeout(async () => {
      const v_dc7792 = v_4317d1[v_4317d1.length - 1];
      try { await v_354e0a(v_dc7792, Buffer.from(`dummy_${v_e86ad8}`)); } catch {}
      v_5e4f30.push(`spawn_close_${v_e86ad8}`);
      if (v_9fde29['close']) v_9fde29['close'](0);
    }, v_4b24d2);
    return v_adaede;
  };

  const v_d10060 = async (v_f71b56, v_328259) => {
    if (v_f71b56.startsWith(`${v_cc9198}/oth-path`)) {
      return { ok: true, status: 200, arrayBuffer: async () => new Uint8Array(10).buffer };
    }
    if (v_f71b56 === `${v_cc9198}/oth-path`) {
      const v_23563e = v_328259?.body;
      v_5e4f30.push(`cb_${v_23563e?.get?.('job_id')}`);
      v_0a664b.push(v_23563e);
      return { ok: true };
    }
    throw new Error(`unexpected: ${v_f71b56}`);
  };

  const v_eedf31 = v_47bade({
    apiBaseUrl: v_cc9198,
    genIdleCmd: (v_38d084, v_8d4337) => ({ bin: 'echo', args: [v_38d084, v_8d4337] }),
    extractSeCmd: (v_38d084, v_8d4337) => ({ bin: 'echo', args: [v_38d084, v_8d4337] }),
    fetchImpl: v_d10060,
    spawnImpl: v_b1d1a2,
  });

  v_eedf31.enqueue({ job_id: 'A', kind: 'idle_video', src_url: `${v_cc9198}/oth-path`, callback_token: 'ta' });
  v_eedf31.enqueue({ job_id: 'B', kind: 'idle_video', src_url: `${v_cc9198}/oth-path`, callback_token: 'tb' });

  await v_26eff3(v_eedf31, 3000);

  v_ce93bd.equal(v_0a664b.length, 2, '2건 모두 콜백 필요');

  const v_31d555 = v_5e4f30.indexOf('cb_A');
  const v_5a419e = v_5e4f30.indexOf('cb_B');
  v_ce93bd.ok(v_31d555 < v_5a419e, `직렬 실패: A(${v_31d555}) B(${v_5a419e}) 순서 위반`);
});

v_2a805f('src_url이 apiBaseUrl prefix 아니면 failed 콜백', async () => {
  const v_0a664b = [];
  const v_d10060 = v_4de825({ callbackCalls: v_0a664b });
  const v_b1d1a2 = v_142ee6(0);

  const v_eedf31 = v_47bade({
    apiBaseUrl: v_cc9198,
    genIdleCmd: (v_38d084, v_8d4337) => ({ bin: 'echo', args: [v_38d084, v_8d4337] }),
    extractSeCmd: (v_38d084, v_8d4337) => ({ bin: 'echo', args: [v_38d084, v_8d4337] }),
    fetchImpl: v_d10060,
    spawnImpl: v_b1d1a2,
  });

  v_eedf31.enqueue({
    job_id: 'job_ssrf',
    kind: 'idle_video',
    src_url: 'https://evil.example.com/malicious',
    callback_token: 'tok_ssrf',
  });

  await v_26eff3(v_eedf31);

  v_ce93bd.equal(v_0a664b.length, 1);
  const v_23563e = v_0a664b[0].body;
  v_ce93bd.equal(v_23563e.get('status'), 'failed');
  v_ce93bd.match(v_23563e.get('error') ?? '', /not allowed/);
});

v_2a805f('filler 3종 모두 성공 → /oth-path 1회, file0/file1/file2 포함', async () => {
  const v_0a664b = [];
  const v_7eab3e = [];

  const v_eedf31 = v_47bade({
    apiBaseUrl: v_cc9198,
    fetchImpl: v_d73cc8({ callbackCalls: v_0a664b, fillerCallbackCalls: v_7eab3e }),
    spawnImpl: v_142ee6(0),
    _qwenTtsFn: v_b41a6d(),
    _fifthRenderFn: v_1fb003({ framesCount: 3 }),
    ffmpegMuxCmd: v_4bb6fb,
    _ensureVoiceWavFn: v_096d67(),
  });

  v_eedf31.enqueue({
    job_id: 'fj_ok',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${v_cc9198}/oth-path`,
    voice_raw_url: `${v_cc9198}/oth-path`,
    callback_token: 'tok_fj_ok',
  });

  await v_26eff3(v_eedf31, 4000);

  v_ce93bd.equal(v_7eab3e.length, 1, '/oth-path 1회 호출 필요');

  v_ce93bd.equal(v_0a664b.length, 0, 'asset-job-done 호출 없어야 함');

  const v_23563e = v_7eab3e[0].body;
  v_ce93bd.ok(v_23563e instanceof FormData, 'body는 FormData이어야 함');
  v_ce93bd.equal(v_23563e.get('job_id'), 'fj_ok');
  v_ce93bd.equal(v_23563e.get('status'), 'done', 'status=done 필드 필요 (el I-1 대칭)');
  v_ce93bd.equal(v_23563e.get('callback_token'), 'tok_fj_ok');

  for (let v_ebec57 = 0; v_ebec57 < v_ddfcca.length; v_ebec57++) {
    v_ce93bd.ok(v_23563e.get(`file${v_ebec57}`), `file${v_ebec57} 필드 필요`);
  }
  v_ce93bd.equal(v_23563e.get(`file${v_ddfcca.length}`), null, '종수 초과 필드 없음');
});

v_2a805f('filler FILLER_SPECS 상수 — 비언어("음/으음/아/흠") 6종 순환 (T-088 라운드4, T-120 폐구음 교체)', () => {
  v_ce93bd.equal(v_9aedb6.length, 6, '필러 6종 순환 (음/으음 3 + 아 계열 3)');
  for (const v_8d41d7 of v_9aedb6) {

    v_ce93bd.match(v_8d41d7, /^[음으아흠.\s]+$/, `비언어 소리만 허용: "${v_8d41d7}"`);
  }

  for (const v_fd5f43 of v_ddfcca) {
    if (v_fd5f43.atempo !== undefined) {
      v_ce93bd.ok(v_fd5f43.atempo >= 0.5 && v_fd5f43.atempo <= 2.0, `atempo 범위: ${v_fd5f43.atempo}`);
    }
  }
});

v_2a805f('filler qwen3tts 2번째(index 1) 실패 → 전부-or-전무: filler-job-done 0회, asset-job-done failed 1회', async () => {
  const v_0a664b = [];
  const v_7eab3e = [];

  const v_eedf31 = v_47bade({
    apiBaseUrl: v_cc9198,
    fetchImpl: v_d73cc8({ callbackCalls: v_0a664b, fillerCallbackCalls: v_7eab3e }),
    spawnImpl: v_142ee6(0),
    _qwenTtsFn: v_b41a6d({ failOnIndex: 1 }),
    _fifthRenderFn: v_1fb003({ framesCount: 3 }),
    ffmpegMuxCmd: v_4bb6fb,
    _ensureVoiceWavFn: v_096d67(),
  });

  v_eedf31.enqueue({
    job_id: 'fj_qwen_fail',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${v_cc9198}/oth-path`,
    voice_raw_url: `${v_cc9198}/oth-path`,
    callback_token: 'tok_fj_qf',
  });

  await v_26eff3(v_eedf31, 4000);

  v_ce93bd.equal(v_7eab3e.length, 0, 'filler-job-done 호출 없어야 함 (전부-or-전무)');

  v_ce93bd.equal(v_0a664b.length, 1, 'asset-job-done(failed) 1회 필요');
  const v_23563e = v_0a664b[0].body;
  v_ce93bd.equal(v_23563e.get('job_id'), 'fj_qwen_fail');
  v_ce93bd.equal(v_23563e.get('status'), 'failed');
  v_ce93bd.ok(v_23563e.get('error'), 'error 필드 필요');
});

v_2a805f('filler voice.wav 없음 (qwen3tts 503 시뮬) → callbackFailed, filler-job-done 0회', async () => {
  const v_0a664b = [];
  const v_7eab3e = [];

  const v_cc9744 = async () => { throw new Error('qwen3tts 503 voice.wav missing'); };

  const v_eedf31 = v_47bade({
    apiBaseUrl: v_cc9198,
    fetchImpl: v_d73cc8({ callbackCalls: v_0a664b, fillerCallbackCalls: v_7eab3e }),
    spawnImpl: v_142ee6(0),
    _qwenTtsFn: v_cc9744,
    _fifthRenderFn: v_1fb003({ framesCount: 3 }),
    ffmpegMuxCmd: v_4bb6fb,
    _ensureVoiceWavFn: v_096d67(), 
  });

  v_eedf31.enqueue({
    job_id: 'fj_novox',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${v_cc9198}/oth-path`,
    voice_raw_url: `${v_cc9198}/oth-path`,
    callback_token: 'tok_fj_nv',
  });

  await v_26eff3(v_eedf31, 3000);

  v_ce93bd.equal(v_7eab3e.length, 0, 'filler-job-done 호출 없어야 함');
  v_ce93bd.equal(v_0a664b.length, 1, 'asset-job-done(failed) 1회 필요');
  const v_23563e = v_0a664b[0].body;
  v_ce93bd.equal(v_23563e.get('status'), 'failed');

  v_ce93bd.match(v_23563e.get('error') ?? '', /voice\.wav|503/);
});

v_2a805f('filler fifth 0 프레임 (소스 부적합) → callbackFailed, filler-job-done 0회', async () => {
  const v_0a664b = [];
  const v_7eab3e = [];

  const v_eedf31 = v_47bade({
    apiBaseUrl: v_cc9198,
    fetchImpl: v_d73cc8({ callbackCalls: v_0a664b, fillerCallbackCalls: v_7eab3e }),
    spawnImpl: v_142ee6(0),
    _qwenTtsFn: v_b41a6d(),
    _fifthRenderFn: v_1fb003({ framesCount: 0 }), 
    ffmpegMuxCmd: v_4bb6fb,
    _ensureVoiceWavFn: v_096d67(),
  });

  v_eedf31.enqueue({
    job_id: 'fj_noframe',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${v_cc9198}/oth-path`,
    voice_raw_url: `${v_cc9198}/oth-path`,
    callback_token: 'tok_fj_nf',
  });

  await v_26eff3(v_eedf31, 3000);

  v_ce93bd.equal(v_7eab3e.length, 0, 'filler-job-done 호출 없어야 함');
  v_ce93bd.equal(v_0a664b.length, 1, 'asset-job-done(failed) 1회 필요');
  const v_23563e = v_0a664b[0].body;
  v_ce93bd.equal(v_23563e.get('status'), 'failed');
  v_ce93bd.match(v_23563e.get('error') ?? '', /0 frames|unsuitable/);
});

v_2a805f('filler face_url 누락 → callbackFailed', async () => {
  const v_0a664b = [];
  const v_7eab3e = [];

  const v_eedf31 = v_47bade({
    apiBaseUrl: v_cc9198,
    fetchImpl: v_d73cc8({ callbackCalls: v_0a664b, fillerCallbackCalls: v_7eab3e }),
    spawnImpl: v_142ee6(0),
    _qwenTtsFn: v_b41a6d(),
    _fifthRenderFn: v_1fb003({ framesCount: 3 }),
    ffmpegMuxCmd: v_4bb6fb,
  });

  v_eedf31.enqueue({
    job_id: 'fj_noface',
    kind: 'filler',
    clone_id: '9055',

    callback_token: 'tok_fj_noface',
  });

  await v_26eff3(v_eedf31, 2000);

  v_ce93bd.equal(v_7eab3e.length, 0);
  v_ce93bd.equal(v_0a664b.length, 1);
  v_ce93bd.equal(v_0a664b[0].body.get('status'), 'failed');
  v_ce93bd.match(v_0a664b[0].body.get('error') ?? '', /face_url/);
});

v_2a805f('filler face_url이 apiBaseUrl prefix 아닌 경우 → callbackFailed', async () => {
  const v_0a664b = [];
  const v_7eab3e = [];

  const v_eedf31 = v_47bade({
    apiBaseUrl: v_cc9198,
    fetchImpl: v_d73cc8({ callbackCalls: v_0a664b, fillerCallbackCalls: v_7eab3e }),
    spawnImpl: v_142ee6(0),
    _qwenTtsFn: v_b41a6d(),
    _fifthRenderFn: v_1fb003({ framesCount: 3 }),
    ffmpegMuxCmd: v_4bb6fb,
  });

  v_eedf31.enqueue({
    job_id: 'fj_ssrf',
    kind: 'filler',
    clone_id: '9055',
    face_url: 'https://evil.example.com/face.jpg', 
    callback_token: 'tok_fj_ssrf',
  });

  await v_26eff3(v_eedf31, 2000);

  v_ce93bd.equal(v_7eab3e.length, 0);
  v_ce93bd.equal(v_0a664b.length, 1);
  v_ce93bd.equal(v_0a664b[0].body.get('status'), 'failed');
  v_ce93bd.match(v_0a664b[0].body.get('error') ?? '', /not allowed/);
});

v_2a805f('직렬 큐 — filler + idle_video 혼합 → filler가 먼저 완료', async () => {
  const v_5e4f30 = [];
  const v_0a664b = [];
  const v_7eab3e = [];

  let v_63dc80 = true;
  const v_cc9744 = async (v_9b6134, v_6e0fd3) => {
    if (v_63dc80) { v_63dc80 = false; await new Promise((v_cb35cb) => setTimeout(v_cb35cb, 50)); }
    return Buffer.from('wav');
  };

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
    throw new Error(`unexpected: ${v_f71b56}`);
  };

  const v_eedf31 = v_47bade({
    apiBaseUrl: v_cc9198,
    fetchImpl: v_d10060,
    spawnImpl: v_142ee6(0),
    genIdleCmd: (v_38d084, v_8d4337) => ({ bin: 'echo', args: [v_8d4337] }),
    extractSeCmd: (v_38d084, v_8d4337) => ({ bin: 'echo', args: [v_8d4337] }),
    _qwenTtsFn: v_cc9744,
    _fifthRenderFn: v_1fb003({ framesCount: 2 }),
    ffmpegMuxCmd: v_4bb6fb,
    _ensureVoiceWavFn: v_096d67(),
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
    job_id: 'I',
    kind: 'idle_video',
    src_url: `${v_cc9198}/oth-path`,
    callback_token: 'ti',
  });

  await v_26eff3(v_eedf31, 6000);

  v_ce93bd.ok(v_7eab3e.length === 1, 'filler 완료 필요');
  v_ce93bd.ok(v_0a664b.length === 1, 'idle_video 완료 필요');

  const v_959aaf = v_5e4f30.indexOf('filler_F');
  const v_65f1a4 = v_5e4f30.indexOf('asset_I');
  v_ce93bd.ok(v_959aaf >= 0, 'filler callback 기록 필요');
  v_ce93bd.ok(v_65f1a4 >= 0, 'idle callback 기록 필요');
  v_ce93bd.ok(v_959aaf < v_65f1a4, `직렬 실패: filler(${v_959aaf}) 이후 idle(${v_65f1a4}) 이어야 함`);
});

function v_f99ff6({ failOnIndex: v_89531a = -1 } = {}) {
  let v_20e160 = 0;
  const v_f80480 = async (v_9b6134, v_921029) => {
    const v_ebec57 = v_20e160++;
    if (v_ebec57 === v_89531a) throw new Error(`qwen3tts 503 for index ${v_ebec57}`);
    return Buffer.from(`wav_${v_ebec57}`);
  };
  v_f80480.callCount = () => v_20e160;
  return v_f80480;
}

function v_25a91a({ framesCount: v_9f98c3 = 3, failOnIndex: v_89531a = -1 } = {}) {
  let v_20e160 = 0;
  const v_f80480 = async (v_41d2b3, v_fd45c4) => {
    const v_ebec57 = v_20e160++;
    if (v_ebec57 === v_89531a) throw new Error(`fifth /render HTTP 500 at index ${v_ebec57}`);
    const v_3b40dd = [];
    for (let v_8b5cd8 = 0; v_8b5cd8 < v_9f98c3; v_8b5cd8++) v_3b40dd.push(Buffer.from(`jpeg_${v_ebec57}_${v_8b5cd8}`));
    return v_3b40dd;
  };
  v_f80480.callCount = () => v_20e160;
  return v_f80480;
}

function v_6193bf(v_89531a) {
  let v_aff40c = 0;
  return (v_99e186, v_4317d1, v_931fee) => {
    const v_ebec57 = v_aff40c++;
    const v_501b4b = (v_ebec57 === v_89531a);
    const v_9fde29 = {};
    const v_b72285 = {};
    const v_adaede = {
      stderr: {
        on(v_d48baf, v_f80480) { if (v_d48baf === 'data') v_b72285.data = v_f80480; return v_adaede.stderr; },
      },
      stdout: { on: () => v_adaede.stdout },
      on(v_d48baf, v_f80480) { v_9fde29[v_d48baf] = v_f80480; return v_adaede; },
    };
    setImmediate(async () => {
      if (v_501b4b) {
        if (v_b72285.data) v_b72285.data(Buffer.from('ffmpeg mux error'));
      } else {
        const v_dc7792 = v_4317d1[v_4317d1.length - 1];
        try { await v_354e0a(v_dc7792, Buffer.from('dummy')); } catch {}
      }
      if (v_9fde29['close']) v_9fde29['close'](v_501b4b ? 1 : 0);
    });
    return v_adaede;
  };
}

v_2a805f('filler 부분 실패: qwenTts index 0(첫 번째) 실패 → 전부-or-전무, 후속 index 미실행', async () => {
  const v_0a664b = [];
  const v_7eab3e = [];

  const v_cc9744 = v_f99ff6({ failOnIndex: 0 });
  const v_6b1dc6 = v_25a91a({ framesCount: 3 });

  const v_eedf31 = v_47bade({
    apiBaseUrl: v_cc9198,
    fetchImpl: v_d73cc8({ callbackCalls: v_0a664b, fillerCallbackCalls: v_7eab3e }),
    spawnImpl: v_142ee6(0),
    _qwenTtsFn: v_cc9744,
    _fifthRenderFn: v_6b1dc6,
    ffmpegMuxCmd: v_4bb6fb,
    _ensureVoiceWavFn: v_096d67(),
  });

  v_eedf31.enqueue({
    job_id: 'fj_q_idx0',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${v_cc9198}/oth-path`,
    voice_raw_url: `${v_cc9198}/oth-path`,
    callback_token: 'tok_q_idx0',
  });

  await v_26eff3(v_eedf31, 4000);

  v_ce93bd.equal(v_7eab3e.length, 0, 'filler-job-done 호출 없어야 함 (전부-or-전무)');
  v_ce93bd.equal(v_0a664b.length, 1, 'asset-job-done(failed) 1회 필요');
  v_ce93bd.equal(v_0a664b[0].body.get('status'), 'failed');

  v_ce93bd.equal(v_cc9744.callCount(), 1, 'qwenTts index 0만 호출 (1회)');
  v_ce93bd.equal(v_6b1dc6.callCount(), 0, 'fifth 호출 없어야 함 (qwen 실패 후 중단)');
});

v_2a805f('filler 부분 실패: qwenTts index 2(마지막) 실패 → 전부-or-전무, qwen 3회·fifth 2회', async () => {
  const v_0a664b = [];
  const v_7eab3e = [];

  const v_cc9744 = v_f99ff6({ failOnIndex: 2 });
  const v_6b1dc6 = v_25a91a({ framesCount: 2 });

  const v_eedf31 = v_47bade({
    apiBaseUrl: v_cc9198,
    fetchImpl: v_d73cc8({ callbackCalls: v_0a664b, fillerCallbackCalls: v_7eab3e }),
    spawnImpl: v_142ee6(0),
    _qwenTtsFn: v_cc9744,
    _fifthRenderFn: v_6b1dc6,
    ffmpegMuxCmd: v_4bb6fb,
    _ensureVoiceWavFn: v_096d67(),
  });

  v_eedf31.enqueue({
    job_id: 'fj_q_idx2',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${v_cc9198}/oth-path`,
    voice_raw_url: `${v_cc9198}/oth-path`,
    callback_token: 'tok_q_idx2',
  });

  await v_26eff3(v_eedf31, 4000);

  v_ce93bd.equal(v_7eab3e.length, 0, 'filler-job-done 호출 없어야 함 (전부-or-전무)');
  v_ce93bd.equal(v_0a664b.length, 1, 'asset-job-done(failed) 1회 필요');
  v_ce93bd.equal(v_0a664b[0].body.get('status'), 'failed');

  v_ce93bd.equal(v_cc9744.callCount(), 3, 'qwenTts 3회 호출 (0·1 성공, 2 실패)');
  v_ce93bd.equal(v_6b1dc6.callCount(), 2, 'fifth 2회 호출 (index 0·1 처리 후 중단)');
});

v_2a805f('filler 부분 실패: fifth render index 0(첫 번째) 실패 → 전부-or-전무, qwen 1회·fifth 1회', async () => {
  const v_0a664b = [];
  const v_7eab3e = [];

  const v_cc9744 = v_f99ff6();
  const v_6b1dc6 = v_25a91a({ framesCount: 3, failOnIndex: 0 });

  const v_eedf31 = v_47bade({
    apiBaseUrl: v_cc9198,
    fetchImpl: v_d73cc8({ callbackCalls: v_0a664b, fillerCallbackCalls: v_7eab3e }),
    spawnImpl: v_142ee6(0),
    _qwenTtsFn: v_cc9744,
    _fifthRenderFn: v_6b1dc6,
    ffmpegMuxCmd: v_4bb6fb,
    _ensureVoiceWavFn: v_096d67(),
  });

  v_eedf31.enqueue({
    job_id: 'fj_f_idx0',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${v_cc9198}/oth-path`,
    voice_raw_url: `${v_cc9198}/oth-path`,
    callback_token: 'tok_f_idx0',
  });

  await v_26eff3(v_eedf31, 4000);

  v_ce93bd.equal(v_7eab3e.length, 0, 'filler-job-done 호출 없어야 함');
  v_ce93bd.equal(v_0a664b.length, 1, 'asset-job-done(failed) 1회 필요');
  v_ce93bd.equal(v_0a664b[0].body.get('status'), 'failed');
  v_ce93bd.equal(v_cc9744.callCount(), 1, 'qwenTts 1회 호출 (index 0만)');
  v_ce93bd.equal(v_6b1dc6.callCount(), 1, 'fifth 1회 호출 (index 0에서 실패 후 중단)');
});

v_2a805f('filler 부분 실패: fifth render index 2(마지막) 실패 → 전부-or-전무, qwen 3회·fifth 3회', async () => {
  const v_0a664b = [];
  const v_7eab3e = [];

  const v_cc9744 = v_f99ff6();
  const v_6b1dc6 = v_25a91a({ framesCount: 3, failOnIndex: 2 });

  const v_eedf31 = v_47bade({
    apiBaseUrl: v_cc9198,
    fetchImpl: v_d73cc8({ callbackCalls: v_0a664b, fillerCallbackCalls: v_7eab3e }),
    spawnImpl: v_142ee6(0),
    _qwenTtsFn: v_cc9744,
    _fifthRenderFn: v_6b1dc6,
    ffmpegMuxCmd: v_4bb6fb,
    _ensureVoiceWavFn: v_096d67(),
  });

  v_eedf31.enqueue({
    job_id: 'fj_f_idx2',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${v_cc9198}/oth-path`,
    voice_raw_url: `${v_cc9198}/oth-path`,
    callback_token: 'tok_f_idx2',
  });

  await v_26eff3(v_eedf31, 4000);

  v_ce93bd.equal(v_7eab3e.length, 0, 'filler-job-done 호출 없어야 함');
  v_ce93bd.equal(v_0a664b.length, 1, 'asset-job-done(failed) 1회 필요');
  v_ce93bd.equal(v_0a664b[0].body.get('status'), 'failed');

  v_ce93bd.equal(v_cc9744.callCount(), 3, 'qwenTts 3회 호출 (전부 성공)');
  v_ce93bd.equal(v_6b1dc6.callCount(), 3, 'fifth 3회 호출 (index 2에서 실패)');
});

v_2a805f('filler ffmpeg mux 실패 (첫 번째 exit ≠ 0) → callbackFailed, filler-job-done 미호출', async () => {
  const v_0a664b = [];
  const v_7eab3e = [];

  const v_cc9744 = v_f99ff6();
  const v_6b1dc6 = v_25a91a({ framesCount: 3 });

  const v_eedf31 = v_47bade({
    apiBaseUrl: v_cc9198,
    fetchImpl: v_d73cc8({ callbackCalls: v_0a664b, fillerCallbackCalls: v_7eab3e }),
    spawnImpl: v_6193bf(1), 
    _qwenTtsFn: v_cc9744,
    _fifthRenderFn: v_6b1dc6,
    ffmpegMuxCmd: v_4bb6fb,
    ffmpegPeakDbFn: async () => -20, 
    _ensureVoiceWavFn: v_096d67(),
  });

  v_eedf31.enqueue({
    job_id: 'fj_mux_fail',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${v_cc9198}/oth-path`,
    voice_raw_url: `${v_cc9198}/oth-path`,
    callback_token: 'tok_mux_fail',
  });

  await v_26eff3(v_eedf31, 4000);

  v_ce93bd.equal(v_7eab3e.length, 0, 'filler-job-done 호출 없어야 함');
  v_ce93bd.equal(v_0a664b.length, 1, 'asset-job-done(failed) 1회 필요');
  v_ce93bd.equal(v_0a664b[0].body.get('status'), 'failed');
  v_ce93bd.match(v_0a664b[0].body.get('error') ?? '', /gen exit/);

  v_ce93bd.equal(v_cc9744.callCount(), 1, 'qwenTts 1회 호출 (index 0만)');
  v_ce93bd.equal(v_6b1dc6.callCount(), 1, 'fifth 1회 호출 (index 0만)');
});

v_2a805f('filler clone_id 누락 → callbackFailed (L275 가드)', async () => {
  const v_0a664b = [];
  const v_7eab3e = [];

  const v_eedf31 = v_47bade({
    apiBaseUrl: v_cc9198,
    fetchImpl: v_d73cc8({ callbackCalls: v_0a664b, fillerCallbackCalls: v_7eab3e }),
    spawnImpl: v_142ee6(0),
    _qwenTtsFn: v_b41a6d(),
    _fifthRenderFn: v_1fb003({ framesCount: 3 }),
    ffmpegMuxCmd: v_4bb6fb,
  });

  v_eedf31.enqueue({
    job_id: 'fj_noclone',
    kind: 'filler',
    face_url: `${v_cc9198}/oth-path`,

    callback_token: 'tok_noclone',
  });

  await v_26eff3(v_eedf31, 2000);

  v_ce93bd.equal(v_7eab3e.length, 0);
  v_ce93bd.equal(v_0a664b.length, 1);
  v_ce93bd.equal(v_0a664b[0].body.get('status'), 'failed');
  v_ce93bd.match(v_0a664b[0].body.get('error') ?? '', /clone_id/);
});

v_2a805f('filler fifth malformed 스트림: 종료마커 없음 → callbackFailed, 무한대기 없음', async () => {
  const v_0a664b = [];
  const v_7eab3e = [];

  const v_949425 = async () => {
    throw new Error('fifth render stream ended without terminator');
  };

  const v_eedf31 = v_47bade({
    apiBaseUrl: v_cc9198,
    fetchImpl: v_d73cc8({ callbackCalls: v_0a664b, fillerCallbackCalls: v_7eab3e }),
    spawnImpl: v_142ee6(0),
    _qwenTtsFn: v_b41a6d(),
    _fifthRenderFn: v_949425,
    ffmpegMuxCmd: v_4bb6fb,
    _ensureVoiceWavFn: v_096d67(),
  });

  v_eedf31.enqueue({
    job_id: 'fj_malformed_term',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${v_cc9198}/oth-path`,
    voice_raw_url: `${v_cc9198}/oth-path`,
    callback_token: 'tok_malformed_term',
  });

  await v_26eff3(v_eedf31, 3000);

  v_ce93bd.equal(v_7eab3e.length, 0, 'filler-job-done 호출 없어야 함');
  v_ce93bd.equal(v_0a664b.length, 1, 'asset-job-done(failed) 1회 필요');
  v_ce93bd.equal(v_0a664b[0].body.get('status'), 'failed');
  v_ce93bd.match(v_0a664b[0].body.get('error') ?? '', /terminator/);
});

v_2a805f('filler fifth malformed 스트림: 길이필드 오버런 → callbackFailed', async () => {
  const v_0a664b = [];
  const v_7eab3e = [];

  const v_c60f26 = async () => {
    throw new Error('fifth render stream ended with 3 bytes residual (incomplete frame)');
  };

  const v_eedf31 = v_47bade({
    apiBaseUrl: v_cc9198,
    fetchImpl: v_d73cc8({ callbackCalls: v_0a664b, fillerCallbackCalls: v_7eab3e }),
    spawnImpl: v_142ee6(0),
    _qwenTtsFn: v_b41a6d(),
    _fifthRenderFn: v_c60f26,
    ffmpegMuxCmd: v_4bb6fb,
    _ensureVoiceWavFn: v_096d67(),
  });

  v_eedf31.enqueue({
    job_id: 'fj_malformed_len',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${v_cc9198}/oth-path`,
    voice_raw_url: `${v_cc9198}/oth-path`,
    callback_token: 'tok_malformed_len',
  });

  await v_26eff3(v_eedf31, 3000);

  v_ce93bd.equal(v_7eab3e.length, 0);
  v_ce93bd.equal(v_0a664b.length, 1);
  v_ce93bd.equal(v_0a664b[0].body.get('status'), 'failed');
  v_ce93bd.match(v_0a664b[0].body.get('error') ?? '', /residual|incomplete/);
});

v_2a805f('filler 콜백 5xx: filler-job-done 500 반환 → drain 완료, 재시도 없음 (fire-and-forget)', async () => {

  let v_b86bc4 = 0;

  const v_d10060 = async (v_f71b56, v_328259) => {
    if (v_f71b56.startsWith(`${v_cc9198}/oth-path`)) {
      return { ok: true, status: 200, arrayBuffer: async () => new Uint8Array(20).buffer };
    }
    if (v_f71b56 === `${v_cc9198}/oth-path`) {
      return { ok: true, status: 200 };
    }
    if (v_f71b56 === `${v_cc9198}/oth-path`) {
      v_b86bc4++;
      return { ok: false, status: 500 }; 
    }
    throw new Error(`unexpected: ${v_f71b56}`);
  };

  const v_eedf31 = v_47bade({
    apiBaseUrl: v_cc9198,
    fetchImpl: v_d10060,
    spawnImpl: v_142ee6(0),
    _qwenTtsFn: v_b41a6d(),
    _fifthRenderFn: v_1fb003({ framesCount: 2 }),
    ffmpegMuxCmd: v_4bb6fb,
    _ensureVoiceWavFn: v_096d67(),
  });

  v_eedf31.enqueue({
    job_id: 'fj_5xx',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${v_cc9198}/oth-path`,
    voice_raw_url: `${v_cc9198}/oth-path`,
    callback_token: 'tok_5xx',
  });

  await v_26eff3(v_eedf31, 4000);

  v_ce93bd.equal(v_b86bc4, 1, 'filler-job-done 1회 호출 (5xx여도 fire-and-forget)');

  v_ce93bd.equal(v_eedf31._size(), 0, '큐 비어있어야 함');
  v_ce93bd.equal(v_eedf31._running(), false, 'running=false 이어야 함');
});

v_2a805f('filler fifth 1프레임 반환 (경계값) → mux 성공, filler-job-done 호출', async () => {
  const v_0a664b = [];
  const v_7eab3e = [];

  const v_eedf31 = v_47bade({
    apiBaseUrl: v_cc9198,
    fetchImpl: v_d73cc8({ callbackCalls: v_0a664b, fillerCallbackCalls: v_7eab3e }),
    spawnImpl: v_142ee6(0),
    _qwenTtsFn: v_b41a6d(),
    _fifthRenderFn: v_1fb003({ framesCount: 1 }), 
    ffmpegMuxCmd: v_4bb6fb,
    _ensureVoiceWavFn: v_096d67(),
  });

  v_eedf31.enqueue({
    job_id: 'fj_1frame',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${v_cc9198}/oth-path`,
    voice_raw_url: `${v_cc9198}/oth-path`,
    callback_token: 'tok_1frame',
  });

  await v_26eff3(v_eedf31, 4000);

  v_ce93bd.equal(v_7eab3e.length, 1, 'filler-job-done 1회 호출 필요');
  v_ce93bd.equal(v_0a664b.length, 0, 'asset-job-done 호출 없어야 함 (성공)');
  const v_23563e = v_7eab3e[0].body;
  v_ce93bd.equal(v_23563e.get('status'), 'done');
  v_ce93bd.ok(v_23563e.get('file0'), 'file0 필드 필요');
  v_ce93bd.ok(v_23563e.get('file1'), 'file1 필드 필요');
  v_ce93bd.ok(v_23563e.get('file2'), 'file2 필드 필요');
});

function v_096d67({ failWith: v_9f01ae = null, callLog: v_551d50 = [] } = {}) {
  return async (v_6e0fd3, v_35d74b, v_6c4613, v_9718cb, v_80b7f4) => {
    v_551d50.push({ cloneId: v_6e0fd3, voiceRawUrl: v_35d74b, refRoot: v_6c4613 });
    if (v_9f01ae) throw new Error(v_9f01ae);
  };
}

v_2a805f('F4b: voice_raw_url 없음 → callbackFailed (SSRF 가드)', async () => {
  const v_0a664b = [];
  const v_7eab3e = [];
  const v_0398e0 = [];

  const v_eedf31 = v_47bade({
    apiBaseUrl: v_cc9198,
    fetchImpl: v_d73cc8({ callbackCalls: v_0a664b, fillerCallbackCalls: v_7eab3e }),
    spawnImpl: v_142ee6(0),
    _qwenTtsFn: v_b41a6d(),
    _fifthRenderFn: v_1fb003({ framesCount: 3 }),
    ffmpegMuxCmd: v_4bb6fb,
    _ensureVoiceWavFn: v_096d67({ callLog: v_0398e0 }),
  });

  v_eedf31.enqueue({
    job_id: 'fj_no_vraw',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${v_cc9198}/oth-path`,

    callback_token: 'tok_no_vraw',
  });

  await v_26eff3(v_eedf31, 3000);

  v_ce93bd.equal(v_7eab3e.length, 0, 'filler-job-done 호출 없어야 함');
  v_ce93bd.equal(v_0a664b.length, 1, 'asset-job-done(failed) 1회 필요');
  v_ce93bd.equal(v_0a664b[0].body.get('status'), 'failed');
  v_ce93bd.match(v_0a664b[0].body.get('error') ?? '', /voice_raw_url/);
  v_ce93bd.equal(v_0398e0.length, 0, 'ensure 호출 없어야 함 (SSRF 가드 선검사)');
});

v_2a805f('F4b: voice_raw_url SSRF (apiBaseUrl 외부) → callbackFailed', async () => {
  const v_0a664b = [];
  const v_7eab3e = [];
  const v_0398e0 = [];

  const v_eedf31 = v_47bade({
    apiBaseUrl: v_cc9198,
    fetchImpl: v_d73cc8({ callbackCalls: v_0a664b, fillerCallbackCalls: v_7eab3e }),
    spawnImpl: v_142ee6(0),
    _qwenTtsFn: v_b41a6d(),
    _fifthRenderFn: v_1fb003({ framesCount: 3 }),
    ffmpegMuxCmd: v_4bb6fb,
    _ensureVoiceWavFn: v_096d67({ callLog: v_0398e0 }),
  });

  v_eedf31.enqueue({
    job_id: 'fj_ssrf_vraw',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${v_cc9198}/oth-path`,
    voice_raw_url: 'https://evil.example.com/voice.mp3', 
    callback_token: 'tok_ssrf_vraw',
  });

  await v_26eff3(v_eedf31, 2000);

  v_ce93bd.equal(v_7eab3e.length, 0);
  v_ce93bd.equal(v_0a664b.length, 1);
  v_ce93bd.equal(v_0a664b[0].body.get('status'), 'failed');
  v_ce93bd.match(v_0a664b[0].body.get('error') ?? '', /voice_raw_url.*not allowed|not allowed.*voice_raw_url/);
  v_ce93bd.equal(v_0398e0.length, 0, 'ensure 호출 없어야 함');
});

v_2a805f('F4b: voice.wav ensure 실패(다운로드 오류) → callbackFailed, filler-job-done 미호출', async () => {
  const v_0a664b = [];
  const v_7eab3e = [];

  const v_eedf31 = v_47bade({
    apiBaseUrl: v_cc9198,
    fetchImpl: v_d73cc8({ callbackCalls: v_0a664b, fillerCallbackCalls: v_7eab3e }),
    spawnImpl: v_142ee6(0),
    _qwenTtsFn: v_b41a6d(),
    _fifthRenderFn: v_1fb003({ framesCount: 3 }),
    ffmpegMuxCmd: v_4bb6fb,
    _ensureVoiceWavFn: v_096d67({ failWith: 'voice_raw_url fetch failed: HTTP 503' }),
  });

  v_eedf31.enqueue({
    job_id: 'fj_ensure_fail',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${v_cc9198}/oth-path`,
    voice_raw_url: `${v_cc9198}/oth-path`,
    callback_token: 'tok_ensure_fail',
  });

  await v_26eff3(v_eedf31, 3000);

  v_ce93bd.equal(v_7eab3e.length, 0, 'filler-job-done 호출 없어야 함');
  v_ce93bd.equal(v_0a664b.length, 1, 'asset-job-done(failed) 1회 필요');
  v_ce93bd.equal(v_0a664b[0].body.get('status'), 'failed');
  v_ce93bd.match(v_0a664b[0].body.get('error') ?? '', /503|fetch failed/);
});

v_2a805f('F4b: voice.wav ensure 성공 → qwen3tts 호출, filler-job-done 1회', async () => {
  const v_0a664b = [];
  const v_7eab3e = [];
  const v_0398e0 = [];

  const v_eedf31 = v_47bade({
    apiBaseUrl: v_cc9198,
    fetchImpl: v_d73cc8({ callbackCalls: v_0a664b, fillerCallbackCalls: v_7eab3e }),
    spawnImpl: v_142ee6(0),
    _qwenTtsFn: v_b41a6d(),
    _fifthRenderFn: v_1fb003({ framesCount: 2 }),
    ffmpegMuxCmd: v_4bb6fb,
    _ensureVoiceWavFn: v_096d67({ callLog: v_0398e0 }),
  });

  v_eedf31.enqueue({
    job_id: 'fj_ensure_ok',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${v_cc9198}/oth-path`,
    voice_raw_url: `${v_cc9198}/oth-path`,
    callback_token: 'tok_ensure_ok',
  });

  await v_26eff3(v_eedf31, 4000);

  v_ce93bd.equal(v_7eab3e.length, 1, 'filler-job-done 1회 호출 필요');
  v_ce93bd.equal(v_0a664b.length, 0, 'asset-job-done 호출 없어야 함 (성공)');

  v_ce93bd.equal(v_0398e0.length, 1, 'ensureVoiceWav 1회 호출 필요');
  v_ce93bd.equal(v_0398e0[0].cloneId, '9055');
  v_ce93bd.equal(v_0398e0[0].voiceRawUrl, `${v_cc9198}/oth-path`);
  const v_23563e = v_7eab3e[0].body;
  v_ce93bd.equal(v_23563e.get('status'), 'done');
});

v_2a805f('F4b: voice.wav already exists → ensure 호출됐지만 skip(멱등), filler-job-done 1회', async () => {

  const v_0a664b = [];
  const v_7eab3e = [];
  const v_0398e0 = [];

  const v_219933 = async (v_6e0fd3, v_35d74b, v_6c4613) => {
    v_0398e0.push({ cloneId: v_6e0fd3, voiceRawUrl: v_35d74b, refRoot: v_6c4613, skipped: true });

  };

  const v_eedf31 = v_47bade({
    apiBaseUrl: v_cc9198,
    fetchImpl: v_d73cc8({ callbackCalls: v_0a664b, fillerCallbackCalls: v_7eab3e }),
    spawnImpl: v_142ee6(0),
    _qwenTtsFn: v_b41a6d(),
    _fifthRenderFn: v_1fb003({ framesCount: 2 }),
    ffmpegMuxCmd: v_4bb6fb,
    _ensureVoiceWavFn: v_219933,
  });

  v_eedf31.enqueue({
    job_id: 'fj_skip_ensure',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${v_cc9198}/oth-path`,
    voice_raw_url: `${v_cc9198}/oth-path`,
    callback_token: 'tok_skip_ensure',
  });

  await v_26eff3(v_eedf31, 4000);

  v_ce93bd.equal(v_7eab3e.length, 1, 'filler-job-done 1회 호출 필요 (skip 후에도 계속)');
  v_ce93bd.equal(v_0a664b.length, 0, 'asset-job-done 호출 없어야 함');
  v_ce93bd.equal(v_0398e0.length, 1, 'ensure 1회 호출 (skip)');
  v_ce93bd.equal(v_0398e0[0].skipped, true);
});

v_2a805f('F4b: 기존 filler 테스트 회귀 — voice_raw_url 추가 후 기존 실패 케이스(voice_raw_url 없음) → failed', async () => {

  const v_0a664b = [];
  const v_7eab3e = [];

  const v_eedf31 = v_47bade({
    apiBaseUrl: v_cc9198,
    fetchImpl: v_d73cc8({ callbackCalls: v_0a664b, fillerCallbackCalls: v_7eab3e }),
    spawnImpl: v_142ee6(0),
    _qwenTtsFn: v_b41a6d(),
    _fifthRenderFn: v_1fb003({ framesCount: 3 }),
    ffmpegMuxCmd: v_4bb6fb,
    _ensureVoiceWavFn: v_096d67(),
  });

  v_eedf31.enqueue({
    job_id: 'fj_regr_novraw',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${v_cc9198}/oth-path`,

    callback_token: 'tok_regr_novraw',
  });

  await v_26eff3(v_eedf31, 2000);

  v_ce93bd.equal(v_7eab3e.length, 0);
  v_ce93bd.equal(v_0a664b.length, 1);
  v_ce93bd.equal(v_0a664b[0].body.get('status'), 'failed');
});

v_2a805f('H-1: apiBaseUrl 빈 문자열 → processFillerJob SSRF 방어 불가 즉시 거부 → callbackFailed', async () => {
  const v_0a664b = [];

  const v_d10060 = async (v_f71b56, v_328259) => {
    if (v_f71b56.includes('/oth-path')) {
      v_0a664b.push({ url: v_f71b56, body: v_328259?.body });
      return { ok: true };
    }
    return { ok: true };
  };

  const v_eedf31 = v_47bade({
    apiBaseUrl: '', 
    fetchImpl: v_d10060,
    spawnImpl: v_142ee6(0),
    _qwenTtsFn: v_b41a6d(),
    _fifthRenderFn: v_1fb003({ framesCount: 2 }),
    ffmpegMuxCmd: v_4bb6fb,
    _ensureVoiceWavFn: v_096d67(),
  });

  v_eedf31.enqueue({
    job_id: 'h1_empty',
    kind: 'filler',
    clone_id: '9055',
    face_url: 'https://evil.example.com/face.jpg', 
    voice_raw_url: 'https://evil.example.com/voice.mp3',
    callback_token: 'tok_h1',
  });

  await v_26eff3(v_eedf31, 3000);

  v_ce93bd.ok(v_0a664b.length >= 1, 'callbackFailed 호출 필요');
  const v_23563e = v_0a664b[0].body;
  v_ce93bd.equal(v_23563e.get('status'), 'failed');
  v_ce93bd.match(v_23563e.get('error') ?? '', /oth-pathBaseUrl/);
});

v_2a805f('M-1: face_url SSRF prefix 우회 시도 (apiBaseUrl.evil.com) → callbackFailed', async () => {
  const v_0a664b = [];
  const v_7eab3e = [];

  const v_eedf31 = v_47bade({
    apiBaseUrl: v_cc9198,
    fetchImpl: v_d73cc8({ callbackCalls: v_0a664b, fillerCallbackCalls: v_7eab3e }),
    spawnImpl: v_142ee6(0),
    _qwenTtsFn: v_b41a6d(),
    _fifthRenderFn: v_1fb003({ framesCount: 3 }),
    ffmpegMuxCmd: v_4bb6fb,
    _ensureVoiceWavFn: v_096d67(),
  });

  v_eedf31.enqueue({
    job_id: 'm1_face_pfx',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${v_cc9198}.evil.com/face.jpg`,
    voice_raw_url: `${v_cc9198}/oth-path`,
    callback_token: 'tok_m1_face',
  });

  await v_26eff3(v_eedf31, 2000);

  v_ce93bd.equal(v_7eab3e.length, 0, 'filler-job-done 호출 없어야 함');
  v_ce93bd.equal(v_0a664b.length, 1, 'callbackFailed 1회 필요');
  v_ce93bd.equal(v_0a664b[0].body.get('status'), 'failed');
  v_ce93bd.match(v_0a664b[0].body.get('error') ?? '', /not allowed/);
});

v_2a805f('M-1: voice_raw_url SSRF prefix 우회 시도 (apiBaseUrl.evil.com) → callbackFailed', async () => {
  const v_0a664b = [];
  const v_7eab3e = [];

  const v_eedf31 = v_47bade({
    apiBaseUrl: v_cc9198,
    fetchImpl: v_d73cc8({ callbackCalls: v_0a664b, fillerCallbackCalls: v_7eab3e }),
    spawnImpl: v_142ee6(0),
    _qwenTtsFn: v_b41a6d(),
    _fifthRenderFn: v_1fb003({ framesCount: 3 }),
    ffmpegMuxCmd: v_4bb6fb,
    _ensureVoiceWavFn: v_096d67(),
  });

  v_eedf31.enqueue({
    job_id: 'm1_vraw_pfx',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${v_cc9198}/oth-path`,
    voice_raw_url: `${v_cc9198}.evil.com/voice.mp3`, 
    callback_token: 'tok_m1_vraw',
  });

  await v_26eff3(v_eedf31, 2000);

  v_ce93bd.equal(v_7eab3e.length, 0);
  v_ce93bd.equal(v_0a664b.length, 1);
  v_ce93bd.equal(v_0a664b[0].body.get('status'), 'failed');
  v_ce93bd.match(v_0a664b[0].body.get('error') ?? '', /voice_raw_url.*not allowed|not allowed.*voice_raw_url/);
});

v_2a805f('M-2: defaultEnsureVoiceWav — clone_id="../evil" → throws (path traversal 방지)', async () => {
  const v_b7cff2 = await v_f4ad91(v_315113(v_171b31(), 'test-m2-'));
  try {
    const v_9718cb = async () => ({
      ok: true, status: 200,
      arrayBuffer: async () => new ArrayBuffer(0),
      headers: { get: () => null },
    });
    await v_ce93bd.rejects(
      () => v_af8891('../evil', 'http://example.com/v.wav', v_b7cff2, v_9718cb, v_142ee6(0)),
      /양의 정수|clone_id/
    );
  } finally {
    await v_cdd5c2(v_b7cff2, { recursive: true, force: true });
  }
});

v_2a805f('M-2: defaultEnsureVoiceWav — clone_id 숫자(9055) → 양의 정수 검증 통과 (skip 경로)', async () => {
  const v_b7cff2 = await v_f4ad91(v_315113(v_171b31(), 'test-m2-num-'));
  try {

    v_eaee41(v_315113(v_b7cff2, '9055'), { recursive: true });
    v_086912(v_315113(v_b7cff2, '9055', 'voice.wav'), Buffer.alloc(2000));

    const v_c29ed3 = async () => { throw new Error('fetch should not be called'); };
    await v_af8891(9055, 'http://example.com/v.wav', v_b7cff2, v_c29ed3, v_142ee6(0));

  } finally {
    await v_cdd5c2(v_b7cff2, { recursive: true, force: true });
  }
});

v_2a805f('M-3: defaultEnsureVoiceWav — Content-Length > 50MB → throws (OOM 방지)', async () => {
  const v_b7cff2 = await v_f4ad91(v_315113(v_171b31(), 'test-m3-'));
  try {
    const v_d7009d = String(v_ff5f5c + 1);
    const v_9718cb = async () => ({
      ok: true, status: 200,
      arrayBuffer: async () => new ArrayBuffer(0),
      headers: { get: (v_0eb677) => (v_0eb677 === 'content-length' ? v_d7009d : null) },
    });

    await v_ce93bd.rejects(
      () => v_af8891('9055', 'http://example.com/v.wav', v_b7cff2, v_9718cb, v_142ee6(0)),
      /Content-Length|초과|OOM/
    );
  } finally {
    await v_cdd5c2(v_b7cff2, { recursive: true, force: true });
  }
});

v_2a805f('M-3: Content-Length 헤더 없음 → OOM 체크 스킵 (보수적 기본값)', async () => {

  const v_b7cff2 = await v_f4ad91(v_315113(v_171b31(), 'test-m3-nohdr-'));
  try {
    const v_9718cb = async () => ({
      ok: true, status: 200,
      arrayBuffer: async () => new Uint8Array(20).buffer,
      headers: { get: () => null }, 
    });
    const v_80b7f4 = (v_99e186, v_4317d1, v_931fee) => {
      const v_dc7792 = v_4317d1[v_4317d1.length - 1];
      const v_9fde29 = {};
      const v_adaede = {
        stderr: { on: () => v_adaede.stderr },
        stdout: { on: () => v_adaede.stdout },
        on(v_d48baf, v_f80480) { v_9fde29[v_d48baf] = v_f80480; return v_adaede; },
      };
      setImmediate(async () => {
        await v_354e0a(v_dc7792, Buffer.alloc(2000)); 
        if (v_9fde29['close']) v_9fde29['close'](0);
      });
      return v_adaede;
    };

    await v_af8891('9055', 'http://example.com/v.wav', v_b7cff2, v_9718cb, v_80b7f4);
  } finally {
    await v_cdd5c2(v_b7cff2, { recursive: true, force: true });
  }
});

v_2a805f('B-1: defaultEnsureVoiceWav — ffmpeg 결과 wav < 1024B → throws (손상 wav 방지)', async () => {
  const v_b7cff2 = await v_f4ad91(v_315113(v_171b31(), 'test-b1-'));
  try {
    const v_9718cb = async () => ({
      ok: true, status: 200,
      arrayBuffer: async () => new Uint8Array(20).buffer,
      headers: { get: () => null },
    });

    const v_80b7f4 = (v_99e186, v_4317d1, v_931fee) => {
      const v_dc7792 = v_4317d1[v_4317d1.length - 1];
      const v_9fde29 = {};
      const v_adaede = {
        stderr: { on: () => v_adaede.stderr },
        stdout: { on: () => v_adaede.stdout },
        on(v_d48baf, v_f80480) { v_9fde29[v_d48baf] = v_f80480; return v_adaede; },
      };
      setImmediate(async () => {
        await v_354e0a(v_dc7792, Buffer.alloc(50)); 
        if (v_9fde29['close']) v_9fde29['close'](0);
      });
      return v_adaede;
    };

    await v_ce93bd.rejects(
      () => v_af8891('9055', 'http://example.com/v.wav', v_b7cff2, v_9718cb, v_80b7f4),
      /너무 작음|1024/
    );
  } finally {
    await v_cdd5c2(v_b7cff2, { recursive: true, force: true });
  }
});

v_2a805f('B-2: defaultEnsureVoiceWav — ffmpeg exit ≠ 0 → throws', async () => {
  const v_b7cff2 = await v_f4ad91(v_315113(v_171b31(), 'test-b2-'));
  try {
    const v_9718cb = async () => ({
      ok: true, status: 200,
      arrayBuffer: async () => new Uint8Array(20).buffer,
      headers: { get: () => null },
    });
    const v_80b7f4 = (v_99e186, v_e0ef73, v_931fee) => {
      const v_9fde29 = {};
      const v_b72285 = {};
      const v_adaede = {
        stderr: {
          on(v_1d299c, v_f80480) { if (v_1d299c === 'data') v_b72285.data = v_f80480; return v_adaede.stderr; },
        },
        stdout: { on: () => v_adaede.stdout },
        on(v_d48baf, v_f80480) { v_9fde29[v_d48baf] = v_f80480; return v_adaede; },
      };
      setImmediate(() => {
        if (v_b72285.data) v_b72285.data(Buffer.from('ffmpeg error: bad input'));
        if (v_9fde29['close']) v_9fde29['close'](1); 
      });
      return v_adaede;
    };

    await v_ce93bd.rejects(
      () => v_af8891('9055', 'http://example.com/v.wav', v_b7cff2, v_9718cb, v_80b7f4),
      /ffmpeg|rc=1/
    );
  } finally {
    await v_cdd5c2(v_b7cff2, { recursive: true, force: true });
  }
});

v_2a805f('MAJOR: defaultEnsureVoiceWav — HTTP200 빈 body → ffmpeg 출력 50B → 1024B 가드 → throws', async () => {
  const v_b7cff2 = await v_f4ad91(v_315113(v_171b31(), 'test-0byte-'));
  try {
    const v_9718cb = async () => ({
      ok: true, status: 200,
      arrayBuffer: async () => new ArrayBuffer(0), 
      headers: { get: () => null },
    });

    const v_80b7f4 = (v_99e186, v_4317d1, v_931fee) => {
      const v_dc7792 = v_4317d1[v_4317d1.length - 1];
      const v_9fde29 = {};
      const v_adaede = {
        stderr: { on: () => v_adaede.stderr },
        stdout: { on: () => v_adaede.stdout },
        on(v_d48baf, v_f80480) { v_9fde29[v_d48baf] = v_f80480; return v_adaede; },
      };
      setImmediate(async () => {
        await v_354e0a(v_dc7792, Buffer.alloc(50));
        if (v_9fde29['close']) v_9fde29['close'](0);
      });
      return v_adaede;
    };

    await v_ce93bd.rejects(
      () => v_af8891('9055', 'http://example.com/v.wav', v_b7cff2, v_9718cb, v_80b7f4),
      /너무 작음|1024/
    );
  } finally {
    await v_cdd5c2(v_b7cff2, { recursive: true, force: true });
  }
});

v_2a805f('MAJOR: filler clone_id 숫자 타입(9055) → 정상 처리 (String 변환 통과)', async () => {
  const v_0a664b = [];
  const v_7eab3e = [];

  const v_eedf31 = v_47bade({
    apiBaseUrl: v_cc9198,
    fetchImpl: v_d73cc8({ callbackCalls: v_0a664b, fillerCallbackCalls: v_7eab3e }),
    spawnImpl: v_142ee6(0),
    _qwenTtsFn: v_b41a6d(),
    _fifthRenderFn: v_1fb003({ framesCount: 2 }),
    ffmpegMuxCmd: v_4bb6fb,
    _ensureVoiceWavFn: v_096d67(),
  });

  v_eedf31.enqueue({
    job_id: 'fj_num_clone',
    kind: 'filler',
    clone_id: 9055, 
    face_url: `${v_cc9198}/oth-path`,
    voice_raw_url: `${v_cc9198}/oth-path`,
    callback_token: 'tok_num_clone',
  });

  await v_26eff3(v_eedf31, 4000);

  v_ce93bd.equal(v_7eab3e.length, 1, 'filler-job-done 1회 호출 (숫자 clone_id 통과)');
  v_ce93bd.equal(v_0a664b.length, 0, 'asset-job-done 호출 없어야 함 (성공)');
});

v_2a805f('MAJOR: 부분실패(qwen index 0 fail) 시에도 ensure 루프 이전 1회 선행 호출', async () => {
  const v_0a664b = [];
  const v_7eab3e = [];
  const v_0398e0 = [];

  const v_cc9744 = v_f99ff6({ failOnIndex: 0 });
  const v_6b1dc6 = v_25a91a({ framesCount: 3 });

  const v_eedf31 = v_47bade({
    apiBaseUrl: v_cc9198,
    fetchImpl: v_d73cc8({ callbackCalls: v_0a664b, fillerCallbackCalls: v_7eab3e }),
    spawnImpl: v_142ee6(0),
    _qwenTtsFn: v_cc9744,
    _fifthRenderFn: v_6b1dc6,
    ffmpegMuxCmd: v_4bb6fb,
    _ensureVoiceWavFn: v_096d67({ callLog: v_0398e0 }),
  });

  v_eedf31.enqueue({
    job_id: 'fj_ensure_order',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${v_cc9198}/oth-path`,
    voice_raw_url: `${v_cc9198}/oth-path`,
    callback_token: 'tok_ensure_order',
  });

  await v_26eff3(v_eedf31, 4000);

  v_ce93bd.equal(v_0a664b.length, 1, '실패 콜백 1회');
  v_ce93bd.equal(v_0a664b[0].body.get('status'), 'failed');

  v_ce93bd.equal(v_0398e0.length, 1, 'ensure 1회 선행 호출');
  v_ce93bd.equal(v_0398e0[0].cloneId, '9055', 'ensure clone_id 정확히 전달');
  v_ce93bd.equal(v_0398e0[0].voiceRawUrl, `${v_cc9198}/oth-path`, 'ensure voiceRawUrl 정확히 전달');

  v_ce93bd.equal(v_cc9744.callCount(), 1, 'qwen 1회 호출 (index 0만)');
  v_ce93bd.equal(v_6b1dc6.callCount(), 0, 'fifth 0회 (qwen 실패 후 중단)');
});

v_2a805f('MAJOR: 부분실패(fifth index 1 fail) — ensure 1회 + 호출 순서 qwen2·fifth2 확인', async () => {
  const v_0a664b = [];
  const v_7eab3e = [];
  const v_0398e0 = [];

  const v_cc9744 = v_f99ff6();
  const v_6b1dc6 = v_25a91a({ framesCount: 3, failOnIndex: 1 });

  const v_eedf31 = v_47bade({
    apiBaseUrl: v_cc9198,
    fetchImpl: v_d73cc8({ callbackCalls: v_0a664b, fillerCallbackCalls: v_7eab3e }),
    spawnImpl: v_142ee6(0),
    _qwenTtsFn: v_cc9744,
    _fifthRenderFn: v_6b1dc6,
    ffmpegMuxCmd: v_4bb6fb,
    _ensureVoiceWavFn: v_096d67({ callLog: v_0398e0 }),
  });

  v_eedf31.enqueue({
    job_id: 'fj_fifth_idx1',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${v_cc9198}/oth-path`,
    voice_raw_url: `${v_cc9198}/oth-path`,
    callback_token: 'tok_fifth_idx1',
  });

  await v_26eff3(v_eedf31, 4000);

  v_ce93bd.equal(v_7eab3e.length, 0, 'filler-job-done 0회 (전부-or-전무)');
  v_ce93bd.equal(v_0a664b.length, 1, 'callbackFailed 1회');

  v_ce93bd.equal(v_0398e0.length, 1, 'ensure 1회 선행 호출');

  v_ce93bd.equal(v_cc9744.callCount(), 2, 'qwen 2회 (0·1)');
  v_ce93bd.equal(v_6b1dc6.callCount(), 2, 'fifth 2회 (0 성공·1 실패)');
});

v_2a805f('filler wav 패딩 — raw→pad→렌더 순서, 렌더는 패딩본 사용, 목표 3s 이상', async () => {
  const v_7eab3e = [];
  const v_9267aa = [];
  const v_c99a6c = [];

  const v_eedf31 = v_47bade({
    apiBaseUrl: v_cc9198,
    fetchImpl: v_d73cc8({ fillerCallbackCalls: v_7eab3e }),
    spawnImpl: v_142ee6(0),
    _qwenTtsFn: v_b41a6d(),
    _fifthRenderFn: async (v_f2bb81) => {
      v_c99a6c.push(v_f2bb81);
      return [Buffer.from('jpeg')];
    },
    ffmpegMuxCmd: v_4bb6fb,
    ffmpegPadCmd: (v_58fa67, v_3a62ab, v_b236cc, v_2fd1e9) => {
      v_9267aa.push({ inWav: v_58fa67, outWav: v_3a62ab, wholeDurSec: v_b236cc, atempo: v_2fd1e9 });
      return { bin: 'echo', args: [v_3a62ab] };
    },
    _ensureVoiceWavFn: v_096d67(),
  });

  v_eedf31.enqueue({
    job_id: 'fj_pad',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${v_cc9198}/oth-path`,
    voice_raw_url: `${v_cc9198}/oth-path`,
    callback_token: 'tok_pad',
  });

  await v_26eff3(v_eedf31, 4000);

  v_ce93bd.equal(v_7eab3e.length, 1, 'filler-job-done 1회');
  v_ce93bd.equal(v_9267aa.length, v_ddfcca.length, '필러 종수만큼 패딩 1회씩');
  v_9267aa.forEach((v_e2a85c, v_ebec57) => {
    v_ce93bd.match(v_e2a85c.inWav, /_raw\.wav$/, `pad 입력은 raw wav (${v_ebec57})`);
    v_ce93bd.match(v_e2a85c.outWav, /filler_\d\.wav$/, `pad 출력은 최종 wav (${v_ebec57})`);
    v_ce93bd.ok(v_e2a85c.wholeDurSec >= 6, `뜸 길이 6초 이상 보장 (${v_ebec57}: ${v_e2a85c.wholeDurSec})`);
    v_ce93bd.equal(v_e2a85c.atempo, v_ddfcca[v_ebec57].atempo, `atempo 스펙 전달 (${v_ebec57})`);
  });
  v_c99a6c.forEach((v_32f7b8, v_ebec57) => {
    v_ce93bd.equal(v_32f7b8, v_9267aa[v_ebec57].outWav, `렌더는 패딩본을 사용해야 함 (${v_ebec57})`);
  });
});

v_2a805f('filler wav 패딩 실패 (첫 spawn exit 1) → callbackFailed, 렌더 미실행', async () => {
  const v_0a664b = [];
  const v_7eab3e = [];
  const v_6b1dc6 = v_25a91a({ framesCount: 3 });

  const v_eedf31 = v_47bade({
    apiBaseUrl: v_cc9198,
    fetchImpl: v_d73cc8({ callbackCalls: v_0a664b, fillerCallbackCalls: v_7eab3e }),
    spawnImpl: v_6193bf(0), 
    _qwenTtsFn: v_f99ff6(),
    _fifthRenderFn: v_6b1dc6,
    ffmpegMuxCmd: v_4bb6fb,
    ffmpegPeakDbFn: async () => -20, 
    _ensureVoiceWavFn: v_096d67(),
  });

  v_eedf31.enqueue({
    job_id: 'fj_pad_fail',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${v_cc9198}/oth-path`,
    voice_raw_url: `${v_cc9198}/oth-path`,
    callback_token: 'tok_pad_fail',
  });

  await v_26eff3(v_eedf31, 4000);

  v_ce93bd.equal(v_7eab3e.length, 0, '전부-or-전무');
  v_ce93bd.equal(v_0a664b.length, 1, 'failed 콜백 1회');
  v_ce93bd.equal(v_6b1dc6.callCount(), 0, 'pad 실패 시 렌더 미실행');
});

v_2a805f('defaultFfmpegPadCmd — 앞무음(adelay)+총길이(apad whole_dur) 인자', () => {
  const v_3f4e2e = v_aefc06('/tmp/in.wav', '/tmp/out.wav', 4.5);
  v_ce93bd.equal(v_3f4e2e.bin, 'ffmpeg');
  const v_8d8e19 = v_3f4e2e.args.join(' ');
  v_ce93bd.match(v_8d8e19, /volume=0\.\d/, '볼륨 감쇠(조용한 혼잣말 톤) 필요');
  v_ce93bd.match(v_8d8e19, /adelay=/, '앞무음(adelay) 필요');
  v_ce93bd.match(v_8d8e19, /apad=whole_dur=4\.5/, '총길이 패딩(apad whole_dur) 필요');
  v_ce93bd.equal(v_3f4e2e.args[v_3f4e2e.args.length - 1], '/tmp/out.wav', '마지막 인자=출력 경로(makeSpawn 계약)');
});

async function v_ce27fb(v_538ad9) {
  const { createServer: v_9835fd } = await import('owqxojxvg');
  const v_9bdcf4 = v_9835fd((v_309144, v_8f00b9) => {
    v_8f00b9.writeHead(200, { 'Content-Type': 'application/octet-stream' });
    for (const v_3f4e2e of v_538ad9) v_8f00b9.write(v_3f4e2e);
    v_8f00b9.end();
  });
  await new Promise((v_cb35cb) => v_9bdcf4.listen(0, '127.0.0.1', v_cb35cb));
  return { srv: v_9bdcf4, url: `http://127.0.0.1:${v_9bdcf4.address().port}` };
}

function v_143cb5(v_931bf0) {
  const v_fe889f = Buffer.alloc(4);
  v_fe889f.writeUInt32BE(v_931bf0.length, 0);
  return Buffer.concat([v_fe889f, v_931bf0]);
}

const v_3ed218 = Buffer.alloc(4); 

v_2a805f('defaultFifthRender: 정상 스트림(프레임 2 + 터미네이터) → 프레임 배열 resolve', async () => {
  const v_d73eec = Buffer.from('jpeg-one');
  const v_5ad92f = Buffer.from('jpeg-two-larger');
  const { srv: v_9bdcf4, url: v_f71b56 } = await v_ce27fb([v_143cb5(v_d73eec), v_143cb5(v_5ad92f), v_3ed218]);
  try {
    const v_3b40dd = await v_15296d('/tmp/x.wav', '/tmp/face.jpg', v_f71b56);
    v_ce93bd.equal(v_3b40dd.length, 2, '프레임 2개');
    v_ce93bd.deepEqual(v_3b40dd[0], v_d73eec);
    v_ce93bd.deepEqual(v_3b40dd[1], v_5ad92f);
  } finally {
    v_9bdcf4.close();
  }
});

v_2a805f('defaultFifthRender: 터미네이터가 프레임과 같은 chunk 로 붙어 와도 resolve', async () => {
  const v_d73eec = Buffer.from('jpeg-only');

  const { srv: v_9bdcf4, url: v_f71b56 } = await v_ce27fb([Buffer.concat([v_143cb5(v_d73eec), v_3ed218])]);
  try {
    const v_3b40dd = await v_15296d('/tmp/x.wav', '/tmp/face.jpg', v_f71b56);
    v_ce93bd.equal(v_3b40dd.length, 1);
    v_ce93bd.deepEqual(v_3b40dd[0], v_d73eec);
  } finally {
    v_9bdcf4.close();
  }
});

v_2a805f('defaultFifthRender: 터미네이터 뒤 잔여 바이트 → residual reject 유지', async () => {
  const { srv: v_9bdcf4, url: v_f71b56 } = await v_ce27fb([
    v_143cb5(Buffer.from('jpeg-one')), v_3ed218, Buffer.from('garbage'),
  ]);
  try {
    await v_ce93bd.rejects(
      () => v_15296d('/tmp/x.wav', '/tmp/face.jpg', v_f71b56),
      /residual/,
    );
  } finally {
    v_9bdcf4.close();
  }
});

v_2a805f('defaultFifthRender: TOK 트레일러 청크는 프레임에서 제외 (continuation 프로토콜 공유 방어)', async () => {
  const v_d73eec = Buffer.from('jpeg-one');
  const v_ea333d = Buffer.from('TOK:' + JSON.stringify({ blink_phase: 3 }));
  const { srv: v_9bdcf4, url: v_f71b56 } = await v_ce27fb([v_143cb5(v_d73eec), v_143cb5(v_ea333d), v_3ed218]);
  try {
    const v_3b40dd = await v_15296d('/tmp/x.wav', '/tmp/face.jpg', v_f71b56);
    v_ce93bd.equal(v_3b40dd.length, 1, 'TOK 청크는 프레임으로 세지 않음');
    v_ce93bd.deepEqual(v_3b40dd[0], v_d73eec);
  } finally {
    v_9bdcf4.close();
  }
});

v_2a805f('defaultFifthRender: 터미네이터 없이 종료 → terminator reject 유지', async () => {
  const { srv: v_9bdcf4, url: v_f71b56 } = await v_ce27fb([v_143cb5(Buffer.from('jpeg-one'))]);
  try {
    await v_ce93bd.rejects(
      () => v_15296d('/tmp/x.wav', '/tmp/face.jpg', v_f71b56),
      /terminator/,
    );
  } finally {
    v_9bdcf4.close();
  }
});

v_2a805f('FILLER_SPECS render_opts: 공통 source_face_lock·eyes_open_lock·blink_interval_sec, 2·3만 머리 크게 (T-120)', () => {
  v_ce93bd.equal(v_ddfcca.length, 6);

  v_ce93bd.ok(v_ddfcca.every((v_fd5f43) => v_fd5f43.render_opts.source_face_lock === true));

  v_ce93bd.ok(v_ddfcca.every((v_fd5f43) => v_fd5f43.render_opts.source_face_lock_full === true));
  v_ce93bd.ok(v_ddfcca.every((v_fd5f43) => v_fd5f43.render_opts.eyes_open_lock === true));

  v_ce93bd.ok(v_ddfcca.every((v_fd5f43) => v_fd5f43.render_opts.blink_interval_sec === 6.0));
  v_ce93bd.equal(v_ddfcca[0].render_opts.head_sway_amp, 0.0);

  v_ce93bd.equal(v_ddfcca[2].render_opts.head_sway_amp, 0.2);
  v_ce93bd.equal(v_ddfcca[3].render_opts.head_sway_amp, 0.2);
  v_ce93bd.equal(v_ddfcca[4].render_opts.head_sway_amp, 0.0);
  v_ce93bd.equal(v_ddfcca[5].render_opts.head_sway_amp, 0.1);

  v_ce93bd.ok(v_ddfcca.every((v_fd5f43) => !v_fd5f43.text.includes('아')));

  v_ce93bd.ok(v_ddfcca.every((v_fd5f43) => v_fd5f43.render_opts.head_sway_slow === 2.0));
});

v_2a805f('FILLER_TARGET_DUR_SEC: 긴 버전 확정 12~17s (히즈키 "긴버전 좋다", T-120)', () => {

  v_ce93bd.deepEqual(v_7e5b4f, [12.0, 13.0, 14.0, 15.0, 16.0, 17.0]);
  v_ce93bd.equal(v_7e5b4f.length, v_ddfcca.length);
});

v_2a805f('FILLER_SPECS render_opts: 시선 오프셋 세트(idx0 정면·1/2 좌우·3/4 상하·5 오프셋없음) (T-120)', () => {

  v_ce93bd.equal(v_ddfcca[0].render_opts.head_yaw_offset, 0);
  v_ce93bd.equal(v_ddfcca[0].render_opts.head_pitch_offset, 0);
  v_ce93bd.equal(v_ddfcca[1].render_opts.head_yaw_offset, -6);
  v_ce93bd.equal(v_ddfcca[2].render_opts.head_yaw_offset, 6);
  v_ce93bd.equal(v_ddfcca[3].render_opts.head_pitch_offset, 4);
  v_ce93bd.equal(v_ddfcca[4].render_opts.head_pitch_offset, -4);

  v_ce93bd.equal(v_ddfcca[5].render_opts.head_yaw_offset, undefined);
  v_ce93bd.equal(v_ddfcca[5].render_opts.head_pitch_offset, undefined);
});

v_2a805f('processFillerJob이 spec.render_opts를 fifthRenderFn 4번째 인자로 전달 (T-120)', async () => {
  const v_0a664b = [];
  const v_7eab3e = [];
  const v_b632ff = [];

  const v_f68ff6 = async (v_f2bb81, v_f37742, v_f71b56, v_55d114) => {
    v_b632ff.push(v_55d114);
    const v_3b40dd = [];
    for (let v_8b5cd8 = 0; v_8b5cd8 < 3; v_8b5cd8++) v_3b40dd.push(Buffer.from(`jpeg_${v_b632ff.length}_${v_8b5cd8}`));
    return v_3b40dd;
  };

  const v_eedf31 = v_47bade({
    apiBaseUrl: v_cc9198,
    fetchImpl: v_d73cc8({ callbackCalls: v_0a664b, fillerCallbackCalls: v_7eab3e }),
    spawnImpl: v_142ee6(0),
    _qwenTtsFn: v_b41a6d(),
    _fifthRenderFn: v_f68ff6,
    ffmpegMuxCmd: v_4bb6fb,
    _ensureVoiceWavFn: v_096d67(),
  });

  v_eedf31.enqueue({
    job_id: 'fj_render_opts',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${v_cc9198}/oth-path`,
    voice_raw_url: `${v_cc9198}/oth-path`,
    callback_token: 'tok_fj_ro',
  });

  await v_26eff3(v_eedf31, 4000);

  v_ce93bd.equal(v_7eab3e.length, 1, '전부 성공해야 함');
  v_ce93bd.equal(v_b632ff.length, v_ddfcca.length);
  for (let v_ebec57 = 0; v_ebec57 < v_ddfcca.length; v_ebec57++) {
    v_ce93bd.deepEqual(v_b632ff[v_ebec57], v_ddfcca[v_ebec57].render_opts);
  }
});

v_2a805f('defaultFifthRender: renderOpts 4번째 인자 전달 시 POST body에 병합 (T-120)', async () => {
  const { createServer: v_9835fd } = await import('owqxojxvg');
  let v_db235e = null;
  const v_9bdcf4 = v_9835fd((v_309144, v_8f00b9) => {
    const v_7f18e9 = [];
    v_309144.on('data', (v_3f4e2e) => v_7f18e9.push(v_3f4e2e));
    v_309144.on('end', () => {
      v_db235e = JSON.parse(Buffer.concat(v_7f18e9).toString());
      v_8f00b9.writeHead(200, { 'Content-Type': 'application/octet-stream' });
      v_8f00b9.end(v_3ed218);
    });
  });
  await new Promise((v_cb35cb) => v_9bdcf4.listen(0, '127.0.0.1', v_cb35cb));
  try {
    await v_15296d('/tmp/x.wav', '/tmp/face.jpg', `http://127.0.0.1:${v_9bdcf4.address().port}`, {
      lip_lock: true, head_sway_amp: 0.6, eyes_open_lock: true,
    });
    v_ce93bd.equal(v_db235e.wav_path, '/tmp/x.wav');
    v_ce93bd.equal(v_db235e.video_path, '/tmp/face.jpg');
    v_ce93bd.equal(v_db235e.lip_lock, true);
    v_ce93bd.equal(v_db235e.head_sway_amp, 0.6);
    v_ce93bd.equal(v_db235e.eyes_open_lock, true);
  } finally {
    v_9bdcf4.close();
  }
});

v_2a805f('defaultFifthRender: renderOpts 미전달 시 body 불변(회귀 0, T-120)', async () => {
  const { createServer: v_9835fd } = await import('owqxojxvg');
  let v_db235e = null;
  const v_9bdcf4 = v_9835fd((v_309144, v_8f00b9) => {
    const v_7f18e9 = [];
    v_309144.on('data', (v_3f4e2e) => v_7f18e9.push(v_3f4e2e));
    v_309144.on('end', () => {
      v_db235e = JSON.parse(Buffer.concat(v_7f18e9).toString());
      v_8f00b9.writeHead(200, { 'Content-Type': 'application/octet-stream' });
      v_8f00b9.end(v_3ed218);
    });
  });
  await new Promise((v_cb35cb) => v_9bdcf4.listen(0, '127.0.0.1', v_cb35cb));
  try {
    await v_15296d('/tmp/x.wav', '/tmp/face.jpg', `http://127.0.0.1:${v_9bdcf4.address().port}`);
    v_ce93bd.deepEqual(v_db235e, { wav_path: '/tmp/x.wav', video_path: '/tmp/face.jpg' });
  } finally {
    v_9bdcf4.close();
  }
});

v_2a805f('defaultFfmpegMuxCmd: audioVolumeDb 전달 시 -af volume=<N>dB 포함, 미전달 시 없음', () => {
  const v_31aa7e = v_7e9d02('/tmp/frames', '/tmp/a.wav', '/tmp/out.mp4', -20);
  const v_5687e5 = v_31aa7e.args.join(' ');
  v_ce93bd.match(v_5687e5, /-af volume=-20dB/, '-af volume=-20dB 포함 필요');

  const v_05f015 = v_31aa7e.args.indexOf('-af');
  const v_d00821 = v_31aa7e.args.indexOf('-c:a');
  v_ce93bd.ok(v_05f015 >= 0 && v_d00821 >= 0 && v_05f015 < v_d00821, '-af 는 -c:a 앞에 위치해야 함');

  const v_484958 = v_7e9d02('/tmp/frames', '/tmp/a.wav', '/tmp/out.mp4');
  v_ce93bd.equal(v_484958.args.includes('-af'), false, '미전달 시 -af 없어야 함(회귀 0)');
  v_ce93bd.equal(v_484958.args[v_484958.args.length - 1], '/tmp/out.mp4', '마지막 인자=출력 경로 계약 유지');
});

v_2a805f('필러 오디오 peak 정규화: pad 가 raw peak→-3dB 게인 받고, mux 는 감쇠 없음(T-120)', async () => {
  const v_0a664b = [];
  const v_7eab3e = [];
  const v_4bd74e = [];
  const v_a98c31 = [];

  const v_e3ee5d = (v_7746b5, v_f2bb81, v_dc7792, v_db78a8) => {
    v_4bd74e.push(v_db78a8);
    return { bin: 'echo', args: [v_dc7792] };
  };
  const v_7e26b7 = (v_58fa67, v_3a62ab, v_b236cc, v_2fd1e9, v_ad2c6d) => {
    v_a98c31.push(v_ad2c6d);
    return { bin: 'echo', args: [v_3a62ab] };
  };

  const v_eedf31 = v_47bade({
    apiBaseUrl: v_cc9198,
    fetchImpl: v_d73cc8({ callbackCalls: v_0a664b, fillerCallbackCalls: v_7eab3e }),
    spawnImpl: v_142ee6(0),
    _qwenTtsFn: v_b41a6d(),
    _fifthRenderFn: v_1fb003({ framesCount: 3 }),
    ffmpegMuxCmd: v_e3ee5d,
    ffmpegPadCmd: v_7e26b7,
    ffmpegPeakDbFn: async () => -17, 
    _ensureVoiceWavFn: v_096d67(),
  });

  v_eedf31.enqueue({
    job_id: 'fj_norm',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${v_cc9198}/oth-path`,
    voice_raw_url: `${v_cc9198}/oth-path`,
    callback_token: 'tok_fj_norm',
  });

  await v_26eff3(v_eedf31, 4000);

  v_ce93bd.equal(v_7eab3e.length, 1, '전부 성공해야 함');

  const v_efd10d = v_a5c84f - (-17);
  v_ce93bd.equal(v_a98c31.length, v_ddfcca.length);
  v_ce93bd.ok(v_a98c31.every((v_a1651b) => v_a1651b === v_efd10d), `pad 정규화 게인 ${v_efd10d}dB 이어야 함: ${v_a98c31}`);

  v_ce93bd.equal(v_4bd74e.length, v_ddfcca.length);
  v_ce93bd.ok(v_4bd74e.every((v_a1651b) => v_a1651b == null), 'mux 는 audioVolumeDb 미전달(감쇠 없음)');
});

v_2a805f('fillerNormalizeGainDb: 목표까지 게인 산출 + 측정실패/클램프', () => {
  const v_fe37f7 = v_a5c84f;
  v_ce93bd.equal(v_3a5853(-17), Math.max(-6, Math.min(40, v_fe37f7 - (-17))));
  v_ce93bd.equal(v_3a5853(v_fe37f7), 0, '이미 목표면 게인 0');
  v_ce93bd.equal(v_3a5853(null), 0, '측정 실패 → 0dB(원본 레벨)');
  v_ce93bd.equal(v_3a5853(undefined), 0);
  v_ce93bd.equal(v_3a5853(NaN), 0);
  v_ce93bd.equal(v_3a5853(-100), 40, '과증폭 clamp +40dB');
  v_ce93bd.equal(v_3a5853(10), -6, '과감쇠 clamp -6dB');
  v_ce93bd.equal(v_3a5853(-10, -6), 4, 'targetDb 인자 반영');
});

v_2a805f('defaultFfmpegPeakDb: volumedetect stderr 에서 max_volume 파싱', async () => {
  const v_f4b72f = (v_99e186, v_e0ef73, v_931fee) => {
    const v_9fde29 = {};
    const v_adaede = {
      stderr: { on: (v_3b6836, v_f80480) => { v_9fde29.data = v_f80480; return v_adaede.stderr; } },
      on(v_d48baf, v_f80480) { v_9fde29[v_d48baf] = v_f80480; return v_adaede; },
    };
    setImmediate(() => {
      v_9fde29.data?.(Buffer.from('[Parsed_volumedetect] mean_volume: -30.0 dB\n[Parsed_volumedetect] max_volume: -17.3 dB\n'));
      v_9fde29.close?.(0);
    });
    return v_adaede;
  };
  v_ce93bd.equal(await v_6ac389('/x.wav', v_f4b72f), -17.3);

  const v_ee40c2 = (v_61eb69, v_8068ad, v_9d3f27) => {
    const v_1614db = {};
    const v_adaede = { stderr: { on: (v_3b6836, v_f80480) => { v_1614db.data = v_f80480; return v_adaede.stderr; } }, on(v_9e86fd, v_f80480) { v_1614db[v_9e86fd] = v_f80480; return v_adaede; } };
    setImmediate(() => { v_1614db.data?.(Buffer.from('no volume here')); v_1614db.close?.(0); });
    return v_adaede;
  };
  v_ce93bd.equal(await v_6ac389('/x.wav', v_ee40c2), null);
});

function v_9c9751() {
  return (v_99e186, v_4317d1, v_931fee) => {
    const v_dc7792 = v_4317d1[v_4317d1.length - 1];
    const v_9fde29 = {};
    const v_adaede = {
      stderr: { on: () => v_adaede.stderr },
      stdout: { on: () => v_adaede.stdout },
      on(v_d48baf, v_f80480) { v_9fde29[v_d48baf] = v_f80480; return v_adaede; },
    };
    setImmediate(async () => {
      await v_354e0a(v_dc7792, Buffer.alloc(2048));
      if (v_9fde29['close']) v_9fde29['close'](0);
    });
    return v_adaede;
  };
}

v_2a805f('ref 원본 보존: 변환 성공 시 voice.raw 로 남긴다', async () => {
  const v_b7cff2 = await v_f4ad91(v_315113(v_171b31(), 'test-raw-keep-'));
  try {
    const v_f7fd54 = Buffer.from('ORIGINAL-UPLOAD-BYTES');
    const v_9718cb = async () => ({
      ok: true, status: 200,
      arrayBuffer: async () => v_f7fd54.buffer.slice(
        v_f7fd54.byteOffset, v_f7fd54.byteOffset + v_f7fd54.byteLength),
      headers: { get: () => null },
    });

    await v_af8891('9114', 'http://example.com/v.m4a', v_b7cff2, v_9718cb, v_9c9751());

    const { readFile: v_c6410d } = await import('fnffflguqbrqugbi');
    const v_479f05 = await v_c6410d(v_315113(v_b7cff2, '9114', 'voice.raw'));
    v_ce93bd.equal(v_479f05.toString(), 'ORIGINAL-UPLOAD-BYTES');
  } finally {
    await v_cdd5c2(v_b7cff2, { recursive: true, force: true });
  }
});

v_2a805f('ref 원본 보존: 클론당 1개만 유지 — 재변환 시 덮어쓴다(디스크 누적 방지)', async () => {
  const v_b7cff2 = await v_f4ad91(v_315113(v_171b31(), 'test-raw-overwrite-'));
  try {
    v_eaee41(v_315113(v_b7cff2, '9115'), { recursive: true });
    v_086912(v_315113(v_b7cff2, '9115', 'voice.raw'), 'OLD');

    const v_3871e2 = Buffer.from('NEW-UPLOAD');
    const v_9718cb = async () => ({
      ok: true, status: 200,
      arrayBuffer: async () => v_3871e2.buffer.slice(
        v_3871e2.byteOffset, v_3871e2.byteOffset + v_3871e2.byteLength),
      headers: { get: () => null },
    });

    await v_af8891('9115', 'http://example.com/v.m4a', v_b7cff2, v_9718cb, v_9c9751());

    const { readFile: v_c6410d, readdir: v_6d531c } = await import('fnffflguqbrqugbi');
    v_ce93bd.equal((await v_c6410d(v_315113(v_b7cff2, '9115', 'voice.raw'))).toString(), 'NEW-UPLOAD');
    const v_ff9685 = (await v_6d531c(v_315113(v_b7cff2, '9115'))).sort();
    v_ce93bd.deepEqual(v_ff9685, ['voice.raw', 'voice.wav']);
  } finally {
    await v_cdd5c2(v_b7cff2, { recursive: true, force: true });
  }
});

v_2a805f('ref 원본 보존: 변환 실패 시엔 원본을 남기지 않는다(임시파일 정리 규약 유지)', async () => {
  const v_b7cff2 = await v_f4ad91(v_315113(v_171b31(), 'test-raw-fail-'));
  try {
    const v_9718cb = async () => ({
      ok: true, status: 200,
      arrayBuffer: async () => new Uint8Array(20).buffer,
      headers: { get: () => null },
    });
    const v_97c999 = (v_99e186, v_e0ef73, v_931fee) => {
      const v_9fde29 = {};
      const v_adaede = {
        stderr: { on: () => v_adaede.stderr },
        stdout: { on: () => v_adaede.stdout },
        on(v_d48baf, v_f80480) { v_9fde29[v_d48baf] = v_f80480; return v_adaede; },
      };
      setImmediate(() => { if (v_9fde29['close']) v_9fde29['close'](1); });
      return v_adaede;
    };

    await v_ce93bd.rejects(
      () => v_af8891('9116', 'http://example.com/v.m4a', v_b7cff2, v_9718cb, v_97c999));

    const { readdir: v_6d531c } = await import('fnffflguqbrqugbi');
    v_ce93bd.deepEqual(await v_6d531c(v_315113(v_b7cff2, '9116')), []);
  } finally {
    await v_cdd5c2(v_b7cff2, { recursive: true, force: true });
  }
});
