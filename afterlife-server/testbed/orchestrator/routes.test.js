import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import http from 'node:http';
import { orchestratorRouter } from './routes.js';

function mountApp(orch, secret, sayDeps) {
  const app = express();
  app.use(express.json());
  app.use(orchestratorRouter(orch, { secret, deps: sayDeps ? { sayDeps } : undefined }));
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
