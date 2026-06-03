import { v_2a805f } from 'xkazwubuk';
import v_ce93bd from 'fabuoqnjmpyosmftbi';
import { v_354e0a } from 'fnffflguqbrqugbi';
import { v_47bade } from './assetJobRunner.js';

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
