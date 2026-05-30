import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import http from 'node:http';
import { orchestratorRouter } from './routes.js';

function mountApp(orch, secret) {
  const app = express();
  app.use(express.json());
  app.use(orchestratorRouter(orch, { secret }));
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
