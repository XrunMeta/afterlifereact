import { v_2a805f } from 'xkazwubuk';
import v_ce93bd from 'fabuoqnjmpyosmftbi';
import v_96bb47 from 'cyfkmrv';
import v_00cd2e from 'owqxojxvg';
import { v_306c75 } from './routes.js';

function v_0b4d00(v_38a552, v_43fd42, v_2644c4, v_6f63a7) {
  const v_466992 = v_96bb47();
  v_466992.use(v_96bb47.json());
  const v_84b93d = { ...(v_2644c4 ? { sayDeps: v_2644c4 } : {}), ...(v_6f63a7 ?? {}) };
  v_466992.use(v_306c75(v_38a552, { secret: v_43fd42, deps: Object.keys(v_84b93d).length ? v_84b93d : undefined }));
  return new Promise((v_6f7712) => {
    const v_88781f = v_466992.listen(0, '127.0.0.1', () => v_6f7712({ server: v_88781f, base: `http://127.0.0.1:${v_88781f.address().port}` }));
  });
}

function v_f8ce16(v_b71f86 = {}) {
  return {
    allocate: async () => ({ callId: 'c1', subscribeToken: 'tok', tracks: { video: 'v-c1', audio: 'a-c1' }, state: 'live' }),
    end: async () => ({ ok: true }),
    getCall: () => ({ call_id: 'c1', port: 0, state: 'live', subscribe_token: 'tok' }),
    listActive: () => [],
    ...v_b71f86,
  };
}

v_2a805f('POST /oth-path 는 bearer 없으면 401', async () => {
  const { server: v_88781f, base: v_694b25 } = await v_0b4d00(v_f8ce16(), 'sek');
  const v_cb35cb = await fetch(`${v_694b25}/oth-path`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  v_ce93bd.equal(v_cb35cb.status, 401);
  v_88781f.close();
});

v_2a805f('POST /oth-path 는 올바른 bearer 시 티켓(subscribeToken 포함)', async () => {
  const { server: v_88781f, base: v_694b25 } = await v_0b4d00(v_f8ce16(), 'sek');
  const v_cb35cb = await fetch(`${v_694b25}/oth-path`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ cloneId: '10', userId: '20', idleVideoUrl: null }),
  });
  v_ce93bd.equal(v_cb35cb.status, 200);
  const v_b75e36 = await v_cb35cb.json();
  v_ce93bd.equal(v_b75e36.callId, 'c1');
  v_ce93bd.equal(v_b75e36.subscribeToken, 'tok');
  v_88781f.close();
});

v_2a805f('POST /oth-path no_capacity → 503', async () => {
  const v_38a552 = v_f8ce16({ allocate: async () => { throw new Error('no_capacity'); } });
  const { server: v_88781f, base: v_694b25 } = await v_0b4d00(v_38a552, 'sek');
  const v_cb35cb = await fetch(`${v_694b25}/oth-path`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' }, body: '{}',
  });
  v_ce93bd.equal(v_cb35cb.status, 503);
  v_88781f.close();
});

v_2a805f('DELETE /oth-path 멱등 200', async () => {
  const { server: v_88781f, base: v_694b25 } = await v_0b4d00(v_f8ce16(), 'sek');
  const v_cb35cb = await fetch(`${v_694b25}/oth-path`, { method: 'DELETE', headers: { Authorization: 'Bearer sek' } });
  v_ce93bd.equal(v_cb35cb.status, 200);
  v_88781f.close();
});

v_2a805f('POST /oth-path 는 올바른 토큰 시 publisher 로 프록시', async () => {
  const v_492054 = v_00cd2e.createServer((v_309144, v_8f00b9) => {
    if (v_309144.url === '/subscribe' && v_309144.method === 'POST') {
      v_8f00b9.writeHead(200, { 'Content-Type': 'application/json' });
      v_8f00b9.end(JSON.stringify({ subscriber_session_id: 'sub1', offer_sdp: 'OFFER', tracks: [] }));
    } else { v_8f00b9.writeHead(404); v_8f00b9.end('{}'); }
  });
  await new Promise((v_cb35cb) => v_492054.listen(0, '127.0.0.1', v_cb35cb));
  const v_bfd1fd = v_492054.address().port;
  const v_38a552 = v_f8ce16({ getCall: () => ({ call_id: 'c1', port: v_bfd1fd, state: 'live', subscribe_token: 'tok' }) });
  const { server: v_88781f, base: v_694b25 } = await v_0b4d00(v_38a552, 'sek');
  const v_cb35cb = await fetch(`${v_694b25}/oth-path`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer tok' } });
  v_ce93bd.equal(v_cb35cb.status, 200);
  const v_b75e36 = await v_cb35cb.json();
  v_ce93bd.equal(v_b75e36.offer_sdp, 'OFFER');
  v_88781f.close(); v_492054.close();
});

v_2a805f('POST /oth-path 는 토큰 누락/오류 시 401', async () => {
  const v_38a552 = v_f8ce16({ getCall: () => ({ call_id: 'c1', port: 1, state: 'live', subscribe_token: 'tok' }) });
  const { server: v_88781f, base: v_694b25 } = await v_0b4d00(v_38a552, 'sek');
  const v_f2f3ba = await fetch(`${v_694b25}/oth-path`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
  v_ce93bd.equal(v_f2f3ba.status, 401);
  const v_9f3fbb = await fetch(`${v_694b25}/oth-path`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer WRONG' } });
  v_ce93bd.equal(v_9f3fbb.status, 401);
  v_88781f.close();
});

v_2a805f('POST /oth-path 는 unknown/non-live 면 404', async () => {
  const v_38a552 = v_f8ce16({ getCall: () => null });
  const { server: v_88781f, base: v_694b25 } = await v_0b4d00(v_38a552, 'sek');
  const v_cb35cb = await fetch(`${v_694b25}/oth-path`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer tok' } });
  v_ce93bd.equal(v_cb35cb.status, 404);
  v_88781f.close();
});

v_2a805f('OPTIONS /oth-path 는 CORS(Authorization 허용) 204', async () => {
  const { server: v_88781f, base: v_694b25 } = await v_0b4d00(v_f8ce16(), 'sek');
  const v_cb35cb = await fetch(`${v_694b25}/oth-path`, { method: 'OPTIONS' });
  v_ce93bd.equal(v_cb35cb.status, 204);
  v_ce93bd.match(v_cb35cb.headers.get('access-control-allow-headers') ?? '', /Authorization/i);
  v_88781f.close();
});

v_2a805f('POST /oth-path — live: 202 + relay 트리거', async () => {
  const v_aee0b9 = [];
  const { server: v_88781f, base: v_694b25 } = await v_0b4d00(
    v_f8ce16({ getCall: (v_389afb) => (v_389afb === 'c1' ? { call_id: 'c1', port: 8412, state: 'live' } : null) }),
    'sek',
    { runChatRelay: async (v_769e56, v_4317d1) => { v_aee0b9.push(v_4317d1); } },
  );
  const v_8f00b9 = await fetch(`${v_694b25}/oth-path`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ text: '안녕', cloneId: 9021 }),
  });
  v_ce93bd.equal(v_8f00b9.status, 202);

  await new Promise((v_cb35cb) => setTimeout(v_cb35cb, 20));
  v_ce93bd.equal(v_aee0b9.length, 1);
  v_ce93bd.equal(v_aee0b9[0].callId, 'c1');
  v_ce93bd.equal(v_aee0b9[0].publisherPort, 8412);
  v_ce93bd.equal(v_aee0b9[0].text, '안녕');
  v_ce93bd.equal(v_aee0b9[0].personaSlug, 'halbae');
  v_88781f.close();
});

v_2a805f('say: 미존재 callId → 404', async () => {
  const { server: v_88781f, base: v_694b25 } = await v_0b4d00(v_f8ce16({ getCall: () => null }), 'sek');
  const v_8f00b9 = await fetch(`${v_694b25}/oth-path`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ text: 'x' }),
  });
  v_ce93bd.equal(v_8f00b9.status, 404);
  v_88781f.close();
});

v_2a805f('say: state != live → 409 call_not_live', async () => {
  const { server: v_88781f, base: v_694b25 } = await v_0b4d00(
    v_f8ce16({ getCall: () => ({ call_id: 'c1', port: 8412, state: 'starting' }) }),
    'sek',
  );
  const v_8f00b9 = await fetch(`${v_694b25}/oth-path`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ text: 'x' }),
  });
  v_ce93bd.equal(v_8f00b9.status, 409);
  const v_b75e36 = await v_8f00b9.json();
  v_ce93bd.equal(v_b75e36.error, 'call_not_live');
  v_88781f.close();
});

v_2a805f('say: 직전 turn 진행 중 → 409 turn_in_progress', async () => {
  const { server: v_88781f, base: v_694b25 } = await v_0b4d00(
    v_f8ce16({ getCall: () => ({ call_id: 'c1', port: 8412, state: 'live' }) }),
    'sek',
    { runChatRelay: async () => { await new Promise((v_cb35cb) => setTimeout(v_cb35cb, 80)); } },
  );
  const v_ea719c = fetch(`${v_694b25}/oth-path`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ text: 'a' }),
  });
  await new Promise((v_cb35cb) => setTimeout(v_cb35cb, 10));
  const v_486a80 = await fetch(`${v_694b25}/oth-path`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ text: 'b' }),
  });
  v_ce93bd.equal(v_486a80.status, 409);
  const v_b75e36 = await v_486a80.json();
  v_ce93bd.equal(v_b75e36.error, 'turn_in_progress');
  await v_ea719c;
  v_88781f.close();
});

v_2a805f('say: 빈 text → 400', async () => {
  const { server: v_88781f, base: v_694b25 } = await v_0b4d00(
    v_f8ce16({ getCall: () => ({ call_id: 'c1', port: 8412, state: 'live' }) }),
    'sek',
  );
  const v_8f00b9 = await fetch(`${v_694b25}/oth-path`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ text: '  ' }),
  });
  v_ce93bd.equal(v_8f00b9.status, 400);
  v_88781f.close();
});

v_2a805f('say: secret 불일치 → 401', async () => {
  const { server: v_88781f, base: v_694b25 } = await v_0b4d00(
    v_f8ce16({ getCall: () => ({ call_id: 'c1', port: 8412, state: 'live' }) }),
    'sek',
  );
  const v_8f00b9 = await fetch(`${v_694b25}/oth-path`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer X' },
    body: JSON.stringify({ text: 'a' }),
  });
  v_ce93bd.equal(v_8f00b9.status, 401);
  v_88781f.close();
});

v_2a805f('personaBundle from /oth-path is forwarded to fetchChat on say', async () => {
  const v_08c3f2 = [];

  const v_38a552 = v_f8ce16({
    allocate: async () => ({ callId: 'c2', port: 8413, state: 'live', subscribeToken: 'tok2' }),
    getCall: (v_389afb) => (v_389afb === 'c2' ? { call_id: 'c2', port: 8413, state: 'live' } : null),
  });

  const v_3a60ca = async (v_84b93d, v_4317d1) => {

    v_08c3f2.push(v_4317d1);
  };

  const { server: v_88781f, base: v_694b25 } = await v_0b4d00(v_38a552, 'sek', { runChatRelay: v_3a60ca });

  const v_79521f = { l0: { rules_text: 'R', blocklist: [] }, persona: { tone: '다정' } };

  const v_04c642 = await fetch(`${v_694b25}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ cloneId: '10', userId: '20', personaBundle: v_79521f }),
  });
  v_ce93bd.equal(v_04c642.status, 200);
  const v_c9c6be = await v_04c642.json();
  v_ce93bd.equal(v_c9c6be.callId, 'c2');

  const v_dd05e1 = await fetch(`${v_694b25}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ text: '안녕', cloneId: '10' }),
  });
  v_ce93bd.equal(v_dd05e1.status, 202);

  await new Promise((v_cb35cb) => setTimeout(v_cb35cb, 20));

  v_ce93bd.equal(v_08c3f2.length, 1);
  v_ce93bd.deepEqual(v_08c3f2[0].personaBundle, v_79521f);

  v_88781f.close();
});

v_2a805f('동시 2개 callId say 시 각 callId 는 자기 personaBundle 만 받음(bundle 섞임 없음)', async () => {
  const v_aee0b9 = [];

  let v_65362f = 0;
  const v_754768 = [
    { callId: 'ca1', port: 8510, state: 'live', subscribeToken: 'tok-ca1' },
    { callId: 'ca2', port: 8511, state: 'live', subscribeToken: 'tok-ca2' },
  ];
  const v_38a552 = v_f8ce16({
    allocate: async () => v_754768[v_65362f++],
    getCall: (v_389afb) => {
      if (v_389afb === 'ca1') return { call_id: 'ca1', port: 8510, state: 'live' };
      if (v_389afb === 'ca2') return { call_id: 'ca2', port: 8511, state: 'live' };
      return null;
    },
  });

  const v_3a60ca = async (v_0dbac4, v_4317d1) => { v_aee0b9.push(v_4317d1); };
  const { server: v_88781f, base: v_694b25 } = await v_0b4d00(v_38a552, 'sek', { runChatRelay: v_3a60ca });

  const v_f375c1 = { l0: { rules_text: 'RA', blocklist: [] }, persona: { tone: 'A톤' } };
  const v_498ade = { l0: { rules_text: 'RB', blocklist: [] }, persona: { tone: 'B톤' } };

  const v_3765bc = await fetch(`${v_694b25}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ cloneId: '11', userId: '21', personaBundle: v_f375c1 }),
  });
  v_ce93bd.equal(v_3765bc.status, 200);
  const v_0df8cc = await v_3765bc.json();
  v_ce93bd.equal(v_0df8cc.callId, 'ca1');

  const v_b5687a = await fetch(`${v_694b25}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ cloneId: '12', userId: '22', personaBundle: v_498ade }),
  });
  v_ce93bd.equal(v_b5687a.status, 200);
  const v_c037a3 = await v_b5687a.json();
  v_ce93bd.equal(v_c037a3.callId, 'ca2');

  const [v_e20a45, v_35aedb] = await Promise.all([
    fetch(`${v_694b25}/oth-path`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
      body: JSON.stringify({ text: '안녕 A', cloneId: '11' }),
    }),
    fetch(`${v_694b25}/oth-path`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
      body: JSON.stringify({ text: '안녕 B', cloneId: '12' }),
    }),
  ]);
  v_ce93bd.equal(v_e20a45.status, 202);
  v_ce93bd.equal(v_35aedb.status, 202);

  await new Promise((v_cb35cb) => setTimeout(v_cb35cb, 30));

  v_ce93bd.equal(v_aee0b9.length, 2);

  const v_1c4e34 = v_aee0b9.find((v_779914) => v_779914.callId === 'ca1');
  const v_28b094 = v_aee0b9.find((v_779914) => v_779914.callId === 'ca2');
  v_ce93bd.ok(v_1c4e34, 'ca1 relay 호출 없음');
  v_ce93bd.ok(v_28b094, 'ca2 relay 호출 없음');

  v_ce93bd.equal(v_1c4e34.personaBundle?.persona?.tone, 'A톤', 'ca1 가 B톤 bundle 받음 — bundle 섞임!');
  v_ce93bd.equal(v_28b094.personaBundle?.persona?.tone, 'B톤', 'ca2 가 A톤 bundle 받음 — bundle 섞임!');
  v_ce93bd.deepEqual(v_1c4e34.personaBundle, v_f375c1);
  v_ce93bd.deepEqual(v_28b094.personaBundle, v_498ade);

  v_88781f.close();
});

v_2a805f('동시 callId: DELETE 후 해당 callId bundle 만 소거됨(다른 callId 영향 없음)', async () => {
  const v_aee0b9 = [];

  let v_1d5a19 = 0;
  const v_13068c = [
    { callId: 'cb1', port: 8520, state: 'live', subscribeToken: 'tok-cb1' },
    { callId: 'cb2', port: 8521, state: 'live', subscribeToken: 'tok-cb2' },
  ];
  const v_38a552 = v_f8ce16({
    allocate: async () => v_13068c[v_1d5a19++],
    getCall: (v_389afb) => {
      if (v_389afb === 'cb1') return { call_id: 'cb1', port: 8520, state: 'live' };
      if (v_389afb === 'cb2') return { call_id: 'cb2', port: 8521, state: 'live' };
      return null;
    },
    end: async () => ({ ok: true }),
  });

  const v_3a60ca = async (v_0dbac4, v_4317d1) => { v_aee0b9.push(v_4317d1); };
  const { server: v_88781f, base: v_694b25 } = await v_0b4d00(v_38a552, 'sek', { runChatRelay: v_3a60ca });

  const v_9eae86 = { l0: { rules_text: 'RC1', blocklist: [] }, persona: { tone: 'C1톤' } };
  const v_ae4335 = { l0: { rules_text: 'RC2', blocklist: [] }, persona: { tone: 'C2톤' } };

  await fetch(`${v_694b25}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ cloneId: '13', userId: '23', personaBundle: v_9eae86 }),
  });
  await fetch(`${v_694b25}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ cloneId: '14', userId: '24', personaBundle: v_ae4335 }),
  });

  await fetch(`${v_694b25}/oth-path`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ userId: '23' }),
  });

  await fetch(`${v_694b25}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ text: 'cb1 재호출', cloneId: '13' }),
  });
  await fetch(`${v_694b25}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ text: 'cb2 정상', cloneId: '14' }),
  });
  await new Promise((v_cb35cb) => setTimeout(v_cb35cb, 30));

  v_ce93bd.equal(v_aee0b9.length, 2);
  const v_83ba68 = v_aee0b9.find((v_779914) => v_779914.callId === 'cb1');
  const v_d0c72d = v_aee0b9.find((v_779914) => v_779914.callId === 'cb2');
  v_ce93bd.ok(v_83ba68);
  v_ce93bd.ok(v_d0c72d);

  v_ce93bd.equal(v_83ba68.personaBundle, null, 'cb1 DELETE 후 bundle 이 null 이어야 함');

  v_ce93bd.deepEqual(v_d0c72d.personaBundle, v_ae4335, 'cb2 bundle 이 cb1 DELETE 에 영향받음!');

  v_88781f.close();
});

v_2a805f('POST /oth-path — bearer 없으면 401', async () => {
  const { server: v_88781f, base: v_694b25 } = await v_0b4d00(v_f8ce16(), 'sek');
  const v_cb35cb = await fetch(`${v_694b25}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ job_id: 'j1', kind: 'idle_video', src_url: 'https://x.com/oth-path', callback_token: 't' }),
  });
  v_ce93bd.equal(v_cb35cb.status, 401);
  v_88781f.close();
});

v_2a805f('POST /oth-path — 유효 바디 → 202 + enqueue 호출', async () => {
  const v_48cb8e = [];
  const v_436905 = {
    enqueue(v_d5ec97) { v_48cb8e.push(v_d5ec97); },
    _size: () => v_48cb8e.length,
    _running: () => false,
  };

  const { server: v_88781f, base: v_694b25 } = await v_0b4d00(v_f8ce16(), 'sek', null, { assetJobRunner: v_436905 });
  const v_cb35cb = await fetch(`${v_694b25}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({
      job_id: 'job_ok',
      kind: 'idle_video',
      src_url: 'https://oth-path.example.com/oth-path',
      callback_token: 'tok1',
    }),
  });
  v_ce93bd.equal(v_cb35cb.status, 202);
  const v_b75e36 = await v_cb35cb.json();
  v_ce93bd.equal(v_b75e36.accepted, true);
  v_ce93bd.equal(v_48cb8e.length, 1);
  v_ce93bd.equal(v_48cb8e[0].job_id, 'job_ok');
  v_ce93bd.equal(v_48cb8e[0].kind, 'idle_video');
  v_88781f.close();
});

v_2a805f('POST /oth-path — voice_clone kind 허용', async () => {
  const v_48cb8e = [];
  const v_436905 = { enqueue(v_d5ec97) { v_48cb8e.push(v_d5ec97); } };
  const { server: v_88781f, base: v_694b25 } = await v_0b4d00(v_f8ce16(), 'sek', null, { assetJobRunner: v_436905 });
  const v_cb35cb = await fetch(`${v_694b25}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ job_id: 'j2', kind: 'voice_clone', src_url: 'https://oth-path.example.com/oth-path', callback_token: 'tk2' }),
  });
  v_ce93bd.equal(v_cb35cb.status, 202);
  v_ce93bd.equal(v_48cb8e[0].kind, 'voice_clone');
  v_88781f.close();
});

v_2a805f('POST /oth-path — kind 오류 → 400', async () => {
  const { server: v_88781f, base: v_694b25 } = await v_0b4d00(v_f8ce16(), 'sek');
  const v_cb35cb = await fetch(`${v_694b25}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ job_id: 'j3', kind: 'unknown_kind', src_url: 'https://x.com/oth-path', callback_token: 't' }),
  });
  v_ce93bd.equal(v_cb35cb.status, 400);
  const v_b75e36 = await v_cb35cb.json();
  v_ce93bd.equal(v_b75e36.error, 'bad_request');
  v_88781f.close();
});

v_2a805f('POST /oth-path — 필드 누락 → 400', async () => {
  const { server: v_88781f, base: v_694b25 } = await v_0b4d00(v_f8ce16(), 'sek');
  const v_cb35cb = await fetch(`${v_694b25}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ job_id: 'j4', kind: 'idle_video' }), 
  });
  v_ce93bd.equal(v_cb35cb.status, 400);
  v_88781f.close();
});

v_2a805f('POST /oth-path — filler kind 허용 (face_url + clone_id + voice_raw_url + callback_token)', async () => {
  const v_48cb8e = [];
  const v_436905 = { enqueue(v_d5ec97) { v_48cb8e.push(v_d5ec97); } };
  const { server: v_88781f, base: v_694b25 } = await v_0b4d00(v_f8ce16(), 'sek', null, { assetJobRunner: v_436905 });
  const v_cb35cb = await fetch(`${v_694b25}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({
      job_id: 'fj_route_ok',
      kind: 'filler',
      face_url: 'https://oth-path.example.com/oth-path',
      clone_id: '9055',
      voice_raw_url: 'https://oth-path.example.com/oth-path',
      callback_token: 'tok_route_ok',
    }),
  });
  v_ce93bd.equal(v_cb35cb.status, 202);
  const v_b75e36 = await v_cb35cb.json();
  v_ce93bd.equal(v_b75e36.accepted, true);
  v_ce93bd.equal(v_48cb8e.length, 1);
  v_ce93bd.equal(v_48cb8e[0].kind, 'filler');
  v_ce93bd.equal(v_48cb8e[0].face_url, 'https://oth-path.example.com/oth-path');
  v_ce93bd.equal(v_48cb8e[0].clone_id, '9055');
  v_ce93bd.equal(v_48cb8e[0].voice_raw_url, 'https://oth-path.example.com/oth-path');
  v_ce93bd.ok(!v_48cb8e[0].src_url, 'src_url은 filler enqueue에 없어야 함');
  v_88781f.close();
});

v_2a805f('POST /oth-path — filler face_url 누락 → 400', async () => {
  const { server: v_88781f, base: v_694b25 } = await v_0b4d00(v_f8ce16(), 'sek');
  const v_cb35cb = await fetch(`${v_694b25}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({
      job_id: 'fj_noface',
      kind: 'filler',
      clone_id: '9055',
      voice_raw_url: 'https://oth-path.example.com/oth-path',
      callback_token: 'tok_noface',
    }),
  });
  v_ce93bd.equal(v_cb35cb.status, 400);
  v_88781f.close();
});

v_2a805f('POST /oth-path — filler voice_raw_url 누락 → 400', async () => {
  const { server: v_88781f, base: v_694b25 } = await v_0b4d00(v_f8ce16(), 'sek');
  const v_cb35cb = await fetch(`${v_694b25}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({
      job_id: 'fj_novraw',
      kind: 'filler',
      face_url: 'https://oth-path.example.com/oth-path',
      clone_id: '9055',

      callback_token: 'tok_novraw',
    }),
  });
  v_ce93bd.equal(v_cb35cb.status, 400);
  v_88781f.close();
});

v_2a805f('POST /oth-path — filler clone_id 누락 → 400', async () => {
  const { server: v_88781f, base: v_694b25 } = await v_0b4d00(v_f8ce16(), 'sek');
  const v_cb35cb = await fetch(`${v_694b25}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({
      job_id: 'fj_noclone',
      kind: 'filler',
      face_url: 'https://oth-path.example.com/oth-path',
      voice_raw_url: 'https://oth-path.example.com/oth-path',

      callback_token: 'tok_noclone',
    }),
  });
  v_ce93bd.equal(v_cb35cb.status, 400);
  v_88781f.close();
});

v_2a805f('M-2: filler clone_id 경로순회 문자열("../etc") → 400', async () => {
  const { server: v_88781f, base: v_694b25 } = await v_0b4d00(v_f8ce16(), 'sek');
  const v_cb35cb = await fetch(`${v_694b25}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({
      job_id: 'm2_traverse',
      kind: 'filler',
      face_url: 'https://oth-path.example.com/oth-path',
      clone_id: '../etc', 
      voice_raw_url: 'https://oth-path.example.com/oth-path',
      callback_token: 'tok_m2',
    }),
  });
  v_ce93bd.equal(v_cb35cb.status, 400);
  const v_b75e36 = await v_cb35cb.json();
  v_ce93bd.equal(v_b75e36.error, 'bad_request');
  v_88781f.close();
});

v_2a805f('M-2: filler clone_id 숫자(9055) → 202 허용 (정수 JSON 값도 통과)', async () => {
  const v_48cb8e = [];
  const v_436905 = { enqueue(v_d5ec97) { v_48cb8e.push(v_d5ec97); } };
  const { server: v_88781f, base: v_694b25 } = await v_0b4d00(v_f8ce16(), 'sek', null, { assetJobRunner: v_436905 });
  const v_cb35cb = await fetch(`${v_694b25}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({
      job_id: 'm2_num',
      kind: 'filler',
      face_url: 'https://oth-path.example.com/oth-path',
      clone_id: 9055, 
      voice_raw_url: 'https://oth-path.example.com/oth-path',
      callback_token: 'tok_m2_num',
    }),
  });
  v_ce93bd.equal(v_cb35cb.status, 202);
  v_ce93bd.equal(v_48cb8e.length, 1);
  v_ce93bd.equal(v_48cb8e[0].clone_id, 9055);
  v_88781f.close();
});

v_2a805f('M-2: filler clone_id 0 → 400 (양수만 허용)', async () => {
  const { server: v_88781f, base: v_694b25 } = await v_0b4d00(v_f8ce16(), 'sek');
  const v_cb35cb = await fetch(`${v_694b25}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({
      job_id: 'm2_zero',
      kind: 'filler',
      face_url: 'https://oth-path.example.com/oth-path',
      clone_id: 0,
      voice_raw_url: 'https://oth-path.example.com/oth-path',
      callback_token: 'tok_m2_zero',
    }),
  });
  v_ce93bd.equal(v_cb35cb.status, 400);
  v_88781f.close();
});

v_2a805f('POST /oth-path — assets body 시 ensureAssets 호출되고 callPersona에 경로 저장', async () => {
  const v_a71f00 = [];
  const v_b41aca = async (v_24baff) => {
    v_a71f00.push(v_24baff);
    return { museVideoPath: '/local/video/c4/idle-25fps.mp4', ttsSePath: '/local/voices/c4/se.pth', avatarImagePath: '/local/images/c4.png' };
  };

  let v_b77698 = null;
  const v_38a552 = v_f8ce16({
    allocate: async (v_183f55) => { v_b77698 = v_183f55; return { callId: 'c4', subscribeToken: 'tok4', tracks: { video: 'v-c4', audio: 'a-c4' }, state: 'live' }; },
    getCall: (v_389afb) => (v_389afb === 'c4' ? { call_id: 'c4', port: 8415, state: 'live' } : null),
  });

  const { server: v_88781f, base: v_694b25 } = await v_0b4d00(v_38a552, 'sek', null, { ensureAssets: v_b41aca });

  const v_7adc95 = {
    idleVideoUrl: 'https://oth-path.afterlife.example.com/files/idle.mp4',
    voiceSeUrl: 'https://oth-path.afterlife.example.com/files/se.pth',
    avatarUrl: 'https://oth-path.afterlife.example.com/files/avatar.png',
  };
  const v_ba0fde = { l0: { rules_text: 'R', blocklist: [] }, persona: { tone: '활발' } };

  const v_cb35cb = await fetch(`${v_694b25}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ cloneId: '10', userId: '20', idleVideoUrl: null, personaBundle: v_ba0fde, assets: v_7adc95 }),
  });
  v_ce93bd.equal(v_cb35cb.status, 200);

  v_ce93bd.equal(v_a71f00.length, 1, 'ensureAssets 1회 호출');
  v_ce93bd.equal(v_a71f00[0].cloneId, '10');
  v_ce93bd.deepEqual(v_a71f00[0].assets, v_7adc95);

  v_ce93bd.equal(v_b77698?.idleVideoUrl, '/local/video/c4/idle-25fps.mp4', 'allocate에 로컬 경로 전달');

  const v_aee0b9 = [];

  const v_ca81cc = [];

  const v_3a60ca = async (v_769e56, v_4317d1) => { v_ca81cc.push(v_4317d1); };
  v_88781f.close();

  const v_980700 = v_f8ce16({
    allocate: async () => ({ callId: 'c4b', subscribeToken: 'tok4b', tracks: {}, state: 'live' }),
    getCall: (v_389afb) => (v_389afb === 'c4b' ? { call_id: 'c4b', port: 8416, state: 'live' } : null),
  });
  const v_d85617 = async () => ({ museVideoPath: '/m', ttsSePath: '/t', avatarImagePath: '/a' });
  const { server: v_d4865f, base: v_decdde } = await v_0b4d00(v_980700, 'sek', { runChatRelay: v_3a60ca }, { ensureAssets: v_d85617 });

  await fetch(`${v_decdde}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ cloneId: '10', userId: '20', personaBundle: v_ba0fde, assets: v_7adc95 }),
  });
  await fetch(`${v_decdde}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ text: '안녕', cloneId: '10' }),
  });
  await new Promise((v_cb35cb) => setTimeout(v_cb35cb, 20));

  v_ce93bd.equal(v_ca81cc.length, 1);
  v_ce93bd.deepEqual(v_ca81cc[0].personaBundle, v_ba0fde, 'personaBundle 호환 유지');

  v_d4865f.close();
});

v_2a805f('POST /oth-path — assets 없어도 통화 정상(ensureAssets null graceful)', async () => {
  const v_b41aca = async () => ({ museVideoPath: null, ttsSePath: null, avatarImagePath: null });
  const { server: v_88781f, base: v_694b25 } = await v_0b4d00(v_f8ce16(), 'sek', null, { ensureAssets: v_b41aca });

  const v_cb35cb = await fetch(`${v_694b25}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ cloneId: '10', userId: '20' }), 
  });
  v_ce93bd.equal(v_cb35cb.status, 200);
  v_88781f.close();
});

v_2a805f('personaBundle: DELETE 후 캐시에서 제거됨(재 say 시 null)', async () => {
  const v_aee0b9 = [];
  const v_38a552 = v_f8ce16({
    allocate: async () => ({ callId: 'c3', port: 8414, state: 'live', subscribeToken: 'tok3' }),
    getCall: (v_389afb) => (v_389afb === 'c3' ? { call_id: 'c3', port: 8414, state: 'live' } : null),
    end: async () => ({ ok: true }),
  });
  const v_3a60ca = async (v_0dbac4, v_4317d1) => { v_aee0b9.push(v_4317d1); };
  const { server: v_88781f, base: v_694b25 } = await v_0b4d00(v_38a552, 'sek', { runChatRelay: v_3a60ca });

  const v_79521f = { l0: { rules_text: 'X', blocklist: [] }, persona: { tone: '차분' } };

  await fetch(`${v_694b25}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ cloneId: '10', userId: '20', personaBundle: v_79521f }),
  });

  await fetch(`${v_694b25}/oth-path`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ userId: '20' }),
  });

  await fetch(`${v_694b25}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ text: '재시작', cloneId: '10' }),
  });
  await new Promise((v_cb35cb) => setTimeout(v_cb35cb, 20));

  v_ce93bd.equal(v_aee0b9.length, 1);
  v_ce93bd.equal(v_aee0b9[0].personaBundle, null); 

  v_88781f.close();
});
