import { v_2a805f } from 'xkazwubuk';
import v_ce93bd from 'fabuoqnjmpyosmftbi';
import { v_354e0a } from 'fnffflguqbrqugbi';
import { v_47bade, v_9aedb6 } from './assetJobRunner.js';

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
  });

  v_eedf31.enqueue({
    job_id: 'fj_ok',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${v_cc9198}/oth-path`,
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

  v_ce93bd.ok(v_23563e.get('file0'), 'file0 필드 필요');
  v_ce93bd.ok(v_23563e.get('file1'), 'file1 필드 필요');
  v_ce93bd.ok(v_23563e.get('file2'), 'file2 필드 필요');
});

v_2a805f('filler FILLER_TEXTS 상수 — 3종 정의 확인', () => {
  v_ce93bd.equal(v_9aedb6.length, 3, '필러 텍스트 3종 필요');
  v_ce93bd.ok(v_9aedb6[0].includes('음'), '첫 번째 필러에 "음" 포함');
  v_ce93bd.ok(v_9aedb6[1].includes('잠깐'), '두 번째 필러에 "잠깐" 포함');
  v_ce93bd.ok(v_9aedb6[2].includes('말이죠'), '세 번째 필러에 "말이죠" 포함');
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
  });

  v_eedf31.enqueue({
    job_id: 'fj_qwen_fail',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${v_cc9198}/oth-path`,
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
  });

  v_eedf31.enqueue({
    job_id: 'fj_novox',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${v_cc9198}/oth-path`,
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
  });

  v_eedf31.enqueue({
    job_id: 'fj_noframe',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${v_cc9198}/oth-path`,
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
  });

  v_eedf31.enqueue({
    job_id: 'F',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${v_cc9198}/oth-path`,
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
  });

  v_eedf31.enqueue({
    job_id: 'fj_q_idx0',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${v_cc9198}/oth-path`,
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
  });

  v_eedf31.enqueue({
    job_id: 'fj_q_idx2',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${v_cc9198}/oth-path`,
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
  });

  v_eedf31.enqueue({
    job_id: 'fj_f_idx0',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${v_cc9198}/oth-path`,
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
  });

  v_eedf31.enqueue({
    job_id: 'fj_f_idx2',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${v_cc9198}/oth-path`,
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
    spawnImpl: v_6193bf(0), 
    _qwenTtsFn: v_cc9744,
    _fifthRenderFn: v_6b1dc6,
    ffmpegMuxCmd: v_4bb6fb,
  });

  v_eedf31.enqueue({
    job_id: 'fj_mux_fail',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${v_cc9198}/oth-path`,
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
  });

  v_eedf31.enqueue({
    job_id: 'fj_malformed_term',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${v_cc9198}/oth-path`,
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
  });

  v_eedf31.enqueue({
    job_id: 'fj_malformed_len',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${v_cc9198}/oth-path`,
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
  });

  v_eedf31.enqueue({
    job_id: 'fj_5xx',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${v_cc9198}/oth-path`,
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
  });

  v_eedf31.enqueue({
    job_id: 'fj_1frame',
    kind: 'filler',
    clone_id: '9055',
    face_url: `${v_cc9198}/oth-path`,
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
