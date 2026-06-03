import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { waitHealthz, publishStart, publishStop, killProc } from './publisherProc.js';

function startFakePublisher(handlers) {
  const server = http.createServer((req, res) => {
    const fn = handlers[`${req.method} ${req.url}`];
    if (!fn) { res.writeHead(404); res.end('{}'); return; }
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => fn(req, res, body));
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

test('waitHealthz 는 200 도달 시 resolve', async () => {
  const { server, port } = await startFakePublisher({
    'GET /oth-path': (_r, res) => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ state: 'idle' })); },
  });
  await waitHealthz(port, { timeoutMs: 2000, intervalMs: 50 });
  server.close();
});

test('waitHealthz 는 타임아웃 시 throw', async () => {
  await assert.rejects(
    () => waitHealthz(59999, { timeoutMs: 300, intervalMs: 50 }),
    /health_timeout/,
  );
});

test('publishStart 는 publish/start 호출 결과 반환 (mode=queue)', async () => {
  let received = null;
  const { server, port } = await startFakePublisher({
    'POST /oth-path': (_r, res, body) => { received = JSON.parse(body); res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ state: 'publishing', trackName: 'v' })); },
  });
  const out = await publishStart(port, { video: true, audio: true });
  assert.equal(out.state, 'publishing');
  assert.deepEqual(received, { mode: 'queue', video: true, audio: true });
  server.close();
});

test('publishStop 는 publish/stop 호출', async () => {
  let hit = false;
  const { server, port } = await startFakePublisher({
    'POST /oth-path': (_r, res) => { hit = true; res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ state: 'stopped' })); },
  });
  await publishStop(port);
  assert.equal(hit, true);
  server.close();
});

test('killProc 는 살아있는 프로세스를 종료', async () => {
  const child = spawn(process.execPath, ['-e', 'setInterval(()=>{}, 1000)']);
  await new Promise((r) => setTimeout(r, 100));
  await killProc(child.pid, { graceMs: 500 });
  assert.throws(() => process.kill(child.pid, 0));
});
