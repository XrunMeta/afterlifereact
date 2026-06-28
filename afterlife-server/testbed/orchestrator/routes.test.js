import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import http from 'node:http';
import { orchestratorRouter } from './routes.js';

function mountApp(orch, secret, sayDeps, extraDeps) {
  const app = express();
  app.use(express.json());
  const deps = { ...(sayDeps ? { sayDeps } : {}), ...(extraDeps ?? {}) };
  app.use(orchestratorRouter(orch, { secret, deps: Object.keys(deps).length ? deps : undefined }));
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => resolve({ server, base: `http://127.0.0.1:${server.address().port}` }));
  });
}

function fakeOrch(over = {}) {
  return {
    allocate: async () => ({ callId: 'c1', subscribeToken: 'tok', tracks: { video: 'v-c1', audio: 'a-c1' }, state: 'live' }),
    end: async () => ({ ok: true }),
    getCall: () => ({ call_id: 'c1', port: 0, state: 'live', subscribe_token: 'tok' }),
    listActive: () => [],
    ...over,
  };
}

test('POST /oth-path 는 bearer 없으면 401', async () => {
  const { server, base } = await mountApp(fakeOrch(), 'sek');
  const r = await fetch(`${base}/oth-path`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(r.status, 401);
  server.close();
});

test('POST /oth-path 는 올바른 bearer 시 티켓(subscribeToken 포함)', async () => {
  const { server, base } = await mountApp(fakeOrch(), 'sek');
  const r = await fetch(`${base}/oth-path`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ cloneId: '10', userId: '20', idleVideoUrl: null }),
  });
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.equal(j.callId, 'c1');
  assert.equal(j.subscribeToken, 'tok');
  server.close();
});

test('POST /oth-path no_capacity → 503', async () => {
  const orch = fakeOrch({ allocate: async () => { throw new Error('no_capacity'); } });
  const { server, base } = await mountApp(orch, 'sek');
  const r = await fetch(`${base}/oth-path`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' }, body: '{}',
  });
  assert.equal(r.status, 503);
  server.close();
});

test('DELETE /oth-path 멱등 200', async () => {
  const { server, base } = await mountApp(fakeOrch(), 'sek');
  const r = await fetch(`${base}/oth-path`, { method: 'DELETE', headers: { Authorization: 'Bearer sek' } });
  assert.equal(r.status, 200);
  server.close();
});

test('POST /oth-path 는 올바른 토큰 시 publisher 로 프록시', async () => {
  const pub = http.createServer((req, res) => {
    if (req.url === '/subscribe' && req.method === 'POST') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ subscriber_session_id: 'sub1', offer_sdp: 'OFFER', tracks: [] }));
    } else { res.writeHead(404); res.end('{}'); }
  });
  await new Promise((r) => pub.listen(0, '127.0.0.1', r));
  const pubPort = pub.address().port;
  const orch = fakeOrch({ getCall: () => ({ call_id: 'c1', port: pubPort, state: 'live', subscribe_token: 'tok' }) });
  const { server, base } = await mountApp(orch, 'sek');
  const r = await fetch(`${base}/oth-path`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer tok' } });
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.equal(j.offer_sdp, 'OFFER');
  server.close(); pub.close();
});

test('POST /oth-path 는 토큰 누락/오류 시 401', async () => {
  const orch = fakeOrch({ getCall: () => ({ call_id: 'c1', port: 1, state: 'live', subscribe_token: 'tok' }) });
  const { server, base } = await mountApp(orch, 'sek');
  const noTok = await fetch(`${base}/oth-path`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
  assert.equal(noTok.status, 401);
  const badTok = await fetch(`${base}/oth-path`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer WRONG' } });
  assert.equal(badTok.status, 401);
  server.close();
});

test('POST /oth-path 는 unknown/non-live 면 404', async () => {
  const orch = fakeOrch({ getCall: () => null });
  const { server, base } = await mountApp(orch, 'sek');
  const r = await fetch(`${base}/oth-path`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer tok' } });
  assert.equal(r.status, 404);
  server.close();
});

test('OPTIONS /oth-path 는 CORS(Authorization 허용) 204', async () => {
  const { server, base } = await mountApp(fakeOrch(), 'sek');
  const r = await fetch(`${base}/oth-path`, { method: 'OPTIONS' });
  assert.equal(r.status, 204);
  assert.match(r.headers.get('access-control-allow-headers') ?? '', /Authorization/i);
  server.close();
});

test('POST /oth-path — live: 202 + relay 트리거', async () => {
  const relayed = [];
  const { server, base } = await mountApp(
    fakeOrch({ getCall: (id) => (id === 'c1' ? { call_id: 'c1', port: 8412, state: 'live' } : null) }),
    'sek',
    { runChatRelay: async (_d, args) => { relayed.push(args); } },
  );
  const res = await fetch(`${base}/oth-path`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ text: '안녕', cloneId: 9021 }),
  });
  assert.equal(res.status, 202);

  await new Promise((r) => setTimeout(r, 20));
  assert.equal(relayed.length, 1);
  assert.equal(relayed[0].callId, 'c1');
  assert.equal(relayed[0].publisherPort, 8412);
  assert.equal(relayed[0].text, '안녕');
  assert.equal(relayed[0].personaSlug, 'halbae');
  server.close();
});

test('say: 미존재 callId → 404', async () => {
  const { server, base } = await mountApp(fakeOrch({ getCall: () => null }), 'sek');
  const res = await fetch(`${base}/oth-path`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ text: 'x' }),
  });
  assert.equal(res.status, 404);
  server.close();
});

test('say: state != live → 409 call_not_live', async () => {
  const { server, base } = await mountApp(
    fakeOrch({ getCall: () => ({ call_id: 'c1', port: 8412, state: 'starting' }) }),
    'sek',
  );
  const res = await fetch(`${base}/oth-path`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ text: 'x' }),
  });
  assert.equal(res.status, 409);
  const j = await res.json();
  assert.equal(j.error, 'call_not_live');
  server.close();
});

test('say: 직전 turn 진행 중 → 409 turn_in_progress', async () => {
  const { server, base } = await mountApp(
    fakeOrch({ getCall: () => ({ call_id: 'c1', port: 8412, state: 'live' }) }),
    'sek',
    { runChatRelay: async () => { await new Promise((r) => setTimeout(r, 80)); } },
  );
  const first = fetch(`${base}/oth-path`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ text: 'a' }),
  });
  await new Promise((r) => setTimeout(r, 10));
  const second = await fetch(`${base}/oth-path`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ text: 'b' }),
  });
  assert.equal(second.status, 409);
  const j = await second.json();
  assert.equal(j.error, 'turn_in_progress');
  await first;
  server.close();
});

test('say: 빈 text → 400', async () => {
  const { server, base } = await mountApp(
    fakeOrch({ getCall: () => ({ call_id: 'c1', port: 8412, state: 'live' }) }),
    'sek',
  );
  const res = await fetch(`${base}/oth-path`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ text: '  ' }),
  });
  assert.equal(res.status, 400);
  server.close();
});

test('say: secret 불일치 → 401', async () => {
  const { server, base } = await mountApp(
    fakeOrch({ getCall: () => ({ call_id: 'c1', port: 8412, state: 'live' }) }),
    'sek',
  );
  const res = await fetch(`${base}/oth-path`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer X' },
    body: JSON.stringify({ text: 'a' }),
  });
  assert.equal(res.status, 401);
  server.close();
});

test('personaBundle from /oth-path is forwarded to fetchChat on say', async () => {
  const fetchChatArgs = [];

  const orch = fakeOrch({
    allocate: async () => ({ callId: 'c2', port: 8413, state: 'live', subscribeToken: 'tok2' }),
    getCall: (id) => (id === 'c2' ? { call_id: 'c2', port: 8413, state: 'live' } : null),
  });

  const runChatRelay = async (deps, args) => {

    fetchChatArgs.push(args);
  };

  const { server, base } = await mountApp(orch, 'sek', { runChatRelay });

  const bundle = { l0: { rules_text: 'R', blocklist: [] }, persona: { tone: '다정' } };

  const allocRes = await fetch(`${base}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ cloneId: '10', userId: '20', personaBundle: bundle }),
  });
  assert.equal(allocRes.status, 200);
  const ticket = await allocRes.json();
  assert.equal(ticket.callId, 'c2');

  const sayRes = await fetch(`${base}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ text: '안녕', cloneId: '10' }),
  });
  assert.equal(sayRes.status, 202);

  await new Promise((r) => setTimeout(r, 20));

  assert.equal(fetchChatArgs.length, 1);
  assert.deepEqual(fetchChatArgs[0].personaBundle, bundle);

  server.close();
});

test('동시 2개 callId say 시 각 callId 는 자기 personaBundle 만 받음(bundle 섞임 없음)', async () => {
  const relayed = [];

  let allocCount = 0;
  const allocResults = [
    { callId: 'ca1', port: 8510, state: 'live', subscribeToken: 'tok-ca1' },
    { callId: 'ca2', port: 8511, state: 'live', subscribeToken: 'tok-ca2' },
  ];
  const orch = fakeOrch({
    allocate: async () => allocResults[allocCount++],
    getCall: (id) => {
      if (id === 'ca1') return { call_id: 'ca1', port: 8510, state: 'live' };
      if (id === 'ca2') return { call_id: 'ca2', port: 8511, state: 'live' };
      return null;
    },
  });

  const runChatRelay = async (_deps, args) => { relayed.push(args); };
  const { server, base } = await mountApp(orch, 'sek', { runChatRelay });

  const bundleA = { l0: { rules_text: 'RA', blocklist: [] }, persona: { tone: 'A톤' } };
  const bundleB = { l0: { rules_text: 'RB', blocklist: [] }, persona: { tone: 'B톤' } };

  const allocA = await fetch(`${base}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ cloneId: '11', userId: '21', personaBundle: bundleA }),
  });
  assert.equal(allocA.status, 200);
  const ticketA = await allocA.json();
  assert.equal(ticketA.callId, 'ca1');

  const allocB = await fetch(`${base}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ cloneId: '12', userId: '22', personaBundle: bundleB }),
  });
  assert.equal(allocB.status, 200);
  const ticketB = await allocB.json();
  assert.equal(ticketB.callId, 'ca2');

  const [sayA, sayB] = await Promise.all([
    fetch(`${base}/oth-path`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
      body: JSON.stringify({ text: '안녕 A', cloneId: '11' }),
    }),
    fetch(`${base}/oth-path`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
      body: JSON.stringify({ text: '안녕 B', cloneId: '12' }),
    }),
  ]);
  assert.equal(sayA.status, 202);
  assert.equal(sayB.status, 202);

  await new Promise((r) => setTimeout(r, 30));

  assert.equal(relayed.length, 2);

  const argA = relayed.find((a) => a.callId === 'ca1');
  const argB = relayed.find((a) => a.callId === 'ca2');
  assert.ok(argA, 'ca1 relay 호출 없음');
  assert.ok(argB, 'ca2 relay 호출 없음');

  assert.equal(argA.personaBundle?.persona?.tone, 'A톤', 'ca1 가 B톤 bundle 받음 — bundle 섞임!');
  assert.equal(argB.personaBundle?.persona?.tone, 'B톤', 'ca2 가 A톤 bundle 받음 — bundle 섞임!');
  assert.deepEqual(argA.personaBundle, bundleA);
  assert.deepEqual(argB.personaBundle, bundleB);

  server.close();
});

test('동시 callId: DELETE 후 해당 callId bundle 만 소거됨(다른 callId 영향 없음)', async () => {
  const relayed = [];

  let allocCount2 = 0;
  const allocResults2 = [
    { callId: 'cb1', port: 8520, state: 'live', subscribeToken: 'tok-cb1' },
    { callId: 'cb2', port: 8521, state: 'live', subscribeToken: 'tok-cb2' },
  ];
  const orch = fakeOrch({
    allocate: async () => allocResults2[allocCount2++],
    getCall: (id) => {
      if (id === 'cb1') return { call_id: 'cb1', port: 8520, state: 'live' };
      if (id === 'cb2') return { call_id: 'cb2', port: 8521, state: 'live' };
      return null;
    },
    end: async () => ({ ok: true }),
  });

  const runChatRelay = async (_deps, args) => { relayed.push(args); };
  const { server, base } = await mountApp(orch, 'sek', { runChatRelay });

  const bundleC1 = { l0: { rules_text: 'RC1', blocklist: [] }, persona: { tone: 'C1톤' } };
  const bundleC2 = { l0: { rules_text: 'RC2', blocklist: [] }, persona: { tone: 'C2톤' } };

  await fetch(`${base}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ cloneId: '13', userId: '23', personaBundle: bundleC1 }),
  });
  await fetch(`${base}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ cloneId: '14', userId: '24', personaBundle: bundleC2 }),
  });

  await fetch(`${base}/oth-path`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ userId: '23' }),
  });

  await fetch(`${base}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ text: 'cb1 재호출', cloneId: '13' }),
  });
  await fetch(`${base}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ text: 'cb2 정상', cloneId: '14' }),
  });
  await new Promise((r) => setTimeout(r, 30));

  assert.equal(relayed.length, 2);
  const argCb1 = relayed.find((a) => a.callId === 'cb1');
  const argCb2 = relayed.find((a) => a.callId === 'cb2');
  assert.ok(argCb1);
  assert.ok(argCb2);

  assert.equal(argCb1.personaBundle, null, 'cb1 DELETE 후 bundle 이 null 이어야 함');

  assert.deepEqual(argCb2.personaBundle, bundleC2, 'cb2 bundle 이 cb1 DELETE 에 영향받음!');

  server.close();
});

test('POST /oth-path — bearer 없으면 401', async () => {
  const { server, base } = await mountApp(fakeOrch(), 'sek');
  const r = await fetch(`${base}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ job_id: 'j1', kind: 'idle_video', src_url: 'https://x.com/oth-path', callback_token: 't' }),
  });
  assert.equal(r.status, 401);
  server.close();
});

test('POST /oth-path — 유효 바디 → 202 + enqueue 호출', async () => {
  const enqueuedJobs = [];
  const mockRunner = {
    enqueue(job) { enqueuedJobs.push(job); },
    _size: () => enqueuedJobs.length,
    _running: () => false,
  };

  const { server, base } = await mountApp(fakeOrch(), 'sek', null, { assetJobRunner: mockRunner });
  const r = await fetch(`${base}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({
      job_id: 'job_ok',
      kind: 'idle_video',
      src_url: 'https://oth-path.example.com/oth-path',
      callback_token: 'tok1',
    }),
  });
  assert.equal(r.status, 202);
  const j = await r.json();
  assert.equal(j.accepted, true);
  assert.equal(enqueuedJobs.length, 1);
  assert.equal(enqueuedJobs[0].job_id, 'job_ok');
  assert.equal(enqueuedJobs[0].kind, 'idle_video');
  server.close();
});

test('POST /oth-path — voice_clone kind 허용', async () => {
  const enqueuedJobs = [];
  const mockRunner = { enqueue(job) { enqueuedJobs.push(job); } };
  const { server, base } = await mountApp(fakeOrch(), 'sek', null, { assetJobRunner: mockRunner });
  const r = await fetch(`${base}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ job_id: 'j2', kind: 'voice_clone', src_url: 'https://oth-path.example.com/oth-path', callback_token: 'tk2' }),
  });
  assert.equal(r.status, 202);
  assert.equal(enqueuedJobs[0].kind, 'voice_clone');
  server.close();
});

test('POST /oth-path — kind 오류 → 400', async () => {
  const { server, base } = await mountApp(fakeOrch(), 'sek');
  const r = await fetch(`${base}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ job_id: 'j3', kind: 'unknown_kind', src_url: 'https://x.com/oth-path', callback_token: 't' }),
  });
  assert.equal(r.status, 400);
  const j = await r.json();
  assert.equal(j.error, 'bad_request');
  server.close();
});

test('POST /oth-path — 필드 누락 → 400', async () => {
  const { server, base } = await mountApp(fakeOrch(), 'sek');
  const r = await fetch(`${base}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ job_id: 'j4', kind: 'idle_video' }), 
  });
  assert.equal(r.status, 400);
  server.close();
});

test('POST /oth-path — filler kind 허용 (face_url + clone_id + voice_raw_url + callback_token)', async () => {
  const enqueuedJobs = [];
  const mockRunner = { enqueue(job) { enqueuedJobs.push(job); } };
  const { server, base } = await mountApp(fakeOrch(), 'sek', null, { assetJobRunner: mockRunner });
  const r = await fetch(`${base}/oth-path`, {
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
  assert.equal(r.status, 202);
  const j = await r.json();
  assert.equal(j.accepted, true);
  assert.equal(enqueuedJobs.length, 1);
  assert.equal(enqueuedJobs[0].kind, 'filler');
  assert.equal(enqueuedJobs[0].face_url, 'https://oth-path.example.com/oth-path');
  assert.equal(enqueuedJobs[0].clone_id, '9055');
  assert.equal(enqueuedJobs[0].voice_raw_url, 'https://oth-path.example.com/oth-path');
  assert.ok(!enqueuedJobs[0].src_url, 'src_url은 filler enqueue에 없어야 함');
  server.close();
});

test('POST /oth-path — filler face_url 누락 → 400', async () => {
  const { server, base } = await mountApp(fakeOrch(), 'sek');
  const r = await fetch(`${base}/oth-path`, {
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
  assert.equal(r.status, 400);
  server.close();
});

test('POST /oth-path — filler voice_raw_url 누락 → 400', async () => {
  const { server, base } = await mountApp(fakeOrch(), 'sek');
  const r = await fetch(`${base}/oth-path`, {
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
  assert.equal(r.status, 400);
  server.close();
});

test('POST /oth-path — filler clone_id 누락 → 400', async () => {
  const { server, base } = await mountApp(fakeOrch(), 'sek');
  const r = await fetch(`${base}/oth-path`, {
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
  assert.equal(r.status, 400);
  server.close();
});

test('M-2: filler clone_id 경로순회 문자열("../etc") → 400', async () => {
  const { server, base } = await mountApp(fakeOrch(), 'sek');
  const r = await fetch(`${base}/oth-path`, {
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
  assert.equal(r.status, 400);
  const j = await r.json();
  assert.equal(j.error, 'bad_request');
  server.close();
});

test('M-2: filler clone_id 숫자(9055) → 202 허용 (정수 JSON 값도 통과)', async () => {
  const enqueuedJobs = [];
  const mockRunner = { enqueue(job) { enqueuedJobs.push(job); } };
  const { server, base } = await mountApp(fakeOrch(), 'sek', null, { assetJobRunner: mockRunner });
  const r = await fetch(`${base}/oth-path`, {
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
  assert.equal(r.status, 202);
  assert.equal(enqueuedJobs.length, 1);
  assert.equal(enqueuedJobs[0].clone_id, 9055);
  server.close();
});

test('M-2: filler clone_id 0 → 400 (양수만 허용)', async () => {
  const { server, base } = await mountApp(fakeOrch(), 'sek');
  const r = await fetch(`${base}/oth-path`, {
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
  assert.equal(r.status, 400);
  server.close();
});

test('POST /oth-path — assets body 시 ensureAssets 호출되고 callPersona에 경로 저장', async () => {
  const ensureAssetsArgs = [];
  const mockEnsureAssets = async (params) => {
    ensureAssetsArgs.push(params);
    return { museVideoPath: '/local/video/c4/idle-25fps.mp4', ttsSePath: '/local/voices/c4/se.pth', avatarImagePath: '/local/images/c4.png' };
  };

  let allocateArg = null;
  const orch = fakeOrch({
    allocate: async (arg) => { allocateArg = arg; return { callId: 'c4', subscribeToken: 'tok4', tracks: { video: 'v-c4', audio: 'a-c4' }, state: 'live' }; },
    getCall: (id) => (id === 'c4' ? { call_id: 'c4', port: 8415, state: 'live' } : null),
  });

  const { server, base } = await mountApp(orch, 'sek', null, { ensureAssets: mockEnsureAssets });

  const assets = {
    idleVideoUrl: 'https://oth-path.afterlife.example.com/files/idle.mp4',
    voiceSeUrl: 'https://oth-path.afterlife.example.com/files/se.pth',
    avatarUrl: 'https://oth-path.afterlife.example.com/files/avatar.png',
  };
  const personaBundle = { l0: { rules_text: 'R', blocklist: [] }, persona: { tone: '활발' } };

  const r = await fetch(`${base}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ cloneId: '10', userId: '20', idleVideoUrl: null, personaBundle, assets }),
  });
  assert.equal(r.status, 200);

  assert.equal(ensureAssetsArgs.length, 1, 'ensureAssets 1회 호출');
  assert.equal(ensureAssetsArgs[0].cloneId, '10');
  assert.deepEqual(ensureAssetsArgs[0].assets, assets);

  assert.equal(allocateArg?.idleVideoUrl, '/local/video/c4/idle-25fps.mp4', 'allocate에 로컬 경로 전달');

  const relayed = [];

  const relayCapture = [];

  const runChatRelay = async (_d, args) => { relayCapture.push(args); };
  server.close();

  const orch2 = fakeOrch({
    allocate: async () => ({ callId: 'c4b', subscribeToken: 'tok4b', tracks: {}, state: 'live' }),
    getCall: (id) => (id === 'c4b' ? { call_id: 'c4b', port: 8416, state: 'live' } : null),
  });
  const mockEnsureAssets2 = async () => ({ museVideoPath: '/m', ttsSePath: '/t', avatarImagePath: '/a' });
  const { server: srv2, base: base2 } = await mountApp(orch2, 'sek', { runChatRelay }, { ensureAssets: mockEnsureAssets2 });

  await fetch(`${base2}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ cloneId: '10', userId: '20', personaBundle, assets }),
  });
  await fetch(`${base2}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ text: '안녕', cloneId: '10' }),
  });
  await new Promise((r) => setTimeout(r, 20));

  assert.equal(relayCapture.length, 1);
  assert.deepEqual(relayCapture[0].personaBundle, personaBundle, 'personaBundle 호환 유지');

  srv2.close();
});

test('POST /oth-path — assets 없어도 통화 정상(ensureAssets null graceful)', async () => {
  const mockEnsureAssets = async () => ({ museVideoPath: null, ttsSePath: null, avatarImagePath: null });
  const { server, base } = await mountApp(fakeOrch(), 'sek', null, { ensureAssets: mockEnsureAssets });

  const r = await fetch(`${base}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ cloneId: '10', userId: '20' }), 
  });
  assert.equal(r.status, 200);
  server.close();
});

test('personaBundle: DELETE 후 캐시에서 제거됨(재 say 시 null)', async () => {
  const relayed = [];
  const orch = fakeOrch({
    allocate: async () => ({ callId: 'c3', port: 8414, state: 'live', subscribeToken: 'tok3' }),
    getCall: (id) => (id === 'c3' ? { call_id: 'c3', port: 8414, state: 'live' } : null),
    end: async () => ({ ok: true }),
  });
  const runChatRelay = async (_deps, args) => { relayed.push(args); };
  const { server, base } = await mountApp(orch, 'sek', { runChatRelay });

  const bundle = { l0: { rules_text: 'X', blocklist: [] }, persona: { tone: '차분' } };

  await fetch(`${base}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ cloneId: '10', userId: '20', personaBundle: bundle }),
  });

  await fetch(`${base}/oth-path`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ userId: '20' }),
  });

  await fetch(`${base}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ text: '재시작', cloneId: '10' }),
  });
  await new Promise((r) => setTimeout(r, 20));

  assert.equal(relayed.length, 1);
  assert.equal(relayed[0].personaBundle, null); 

  server.close();
});
