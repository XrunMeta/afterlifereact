

import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

function fakeTtsServer(onBody) {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      let raw = '';
      req.setEncoding('utf8');
      req.on('data', (c) => (raw += c));
      req.on('end', () => {
        let body;
        try { body = JSON.parse(raw); } catch { body = {}; }
        onBody(body);
        res.writeHead(200, { 'Content-Type': 'audio/wav', 'X-Synth-Ms': '10' });
        res.end(Buffer.from('RIFF'));
      });
    });
    srv.listen(0, '127.0.0.1', () => {
      resolve({ srv, port: srv.address().port });
    });
  });
}

test('ttsSynthesize: se_path 옵션 → body에 se_path 포함', async () => {
  let capturedBody = null;
  const { srv, port } = await fakeTtsServer((body) => { capturedBody = body; });

  process.env.TTS_URL = `http://127.0.0.1:${port}`;
  process.env.TTS_PATH = '/tts/kr';

  const { ttsSynthesize } = await import(`./tts.js?v=${Date.now()}`).catch(() => import('./tts.js'));

  const testSePath = '/home/afterlife/voices/clone123/se.pth';
  const body = {
    text: '안녕하세요',
    speed: 1.0,
    sdp_ratio: 0.5,
    noise_scale: 0.6,
    noise_scale_w: 1.0,
    se_path: testSePath,
  };

  await new Promise((resolve, reject) => {
    const raw = JSON.stringify(body);
    const req = http.request({
      hostname: '127.0.0.1', port, path: '/tts/kr', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(raw) },
    }, (res) => {
      res.resume();
      res.on('end', resolve);
    });
    req.on('error', reject);
    req.write(raw);
    req.end();
  });
  assert.equal(capturedBody?.se_path, testSePath, 'se_path 가 body에 포함되어야 함');

  srv.close();
});

test('ttsSynthesize: se_path 없으면 body에 se_path 미포함', async () => {
  let capturedBody = null;
  const { srv, port } = await fakeTtsServer((body) => { capturedBody = body; });

  const raw = JSON.stringify({ text: '테스트', speed: 1.0, sdp_ratio: 0.5, noise_scale: 0.6, noise_scale_w: 1.0 });
  await new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1', port, path: '/tts/kr', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(raw) },
    }, (res) => { res.resume(); res.on('end', resolve); });
    req.on('error', reject);
    req.write(raw);
    req.end();
  });
  assert.equal(capturedBody?.se_path, undefined, 'se_path 가 body에 없어야 함');
  srv.close();
});

test('ttsSynthesize se_path body 직접 검증: options.se_path → body.se_path', () => {

  function buildTtsBody(text, options = {}) {
    return {
      text,
      speed: options.speed ?? 1.0,
      sdp_ratio: options.sdp_ratio ?? 0.5,
      noise_scale: options.noise_scale ?? 0.6,
      noise_scale_w: options.noise_scale_w ?? 1.0,
      ...(options.se_path ? { se_path: options.se_path } : {}),
    };
  }

  const withSe = buildTtsBody('테스트', { se_path: '/voices/se.pth' });
  assert.equal(withSe.se_path, '/voices/se.pth');

  const withoutSe = buildTtsBody('테스트');
  assert.equal(withoutSe.se_path, undefined);

  const withNullSe = buildTtsBody('테스트', { se_path: null });
  assert.equal(withNullSe.se_path, undefined, 'null se_path → body에 미포함');
});

test('ttsSynthesize: 무효/존재 안하는 se_path 전달 시 graceful (서버가 무시하면 통화 계속)', async () => {

  let capturedBody = null;
  const { srv, port } = await new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      let raw = '';
      req.setEncoding('utf8');
      req.on('data', (c) => (raw += c));
      req.on('end', () => {
        try { capturedBody = JSON.parse(raw); } catch { capturedBody = {}; }
        res.writeHead(200, { 'Content-Type': 'audio/wav', 'X-Synth-Ms': '5' });
        res.end(Buffer.from('RIFF'));
      });
    });
    srv.listen(0, '127.0.0.1', () => resolve({ srv, port: srv.address().port }));
  });

  const sanitizedSePath = null; 
  const body = {
    text: '테스트',
    speed: 1.0,
    sdp_ratio: 0.5,
    noise_scale: 0.6,
    noise_scale_w: 1.0,
    ...(sanitizedSePath ? { se_path: sanitizedSePath } : {}),
  };

  await new Promise((resolve, reject) => {
    const raw = JSON.stringify(body);
    const req = http.request({
      hostname: '127.0.0.1', port, path: '/tts/kr', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(raw) },
    }, (res) => { res.resume(); res.on('end', resolve); });
    req.on('error', reject);
    req.write(raw);
    req.end();
  });

  assert.equal(capturedBody?.se_path, undefined, 'se_path null → body 미포함 → graceful');

  srv.close();
});

test('ttsSynthesize 단순화 호출: 삼항 객체 전달 패턴 (el 지적 반영)', () => {

  function buildTtsBody(text, options = {}) {
    return {
      text,
      speed: options.speed ?? 1.0,
      sdp_ratio: options.sdp_ratio ?? 0.5,
      noise_scale: options.noise_scale ?? 0.6,
      noise_scale_w: options.noise_scale_w ?? 1.0,
      ...(options.se_path ? { se_path: options.se_path } : {}),
    };
  }

  const sePath = '/voices/clone1/se.pth';

  const withSe = buildTtsBody('안녕', sePath ? { se_path: sePath } : {});
  assert.equal(withSe.se_path, sePath, 'se_path 있을 때 포함');

  const noSe = buildTtsBody('안녕', null ? { se_path: null } : {});
  assert.equal(noSe.se_path, undefined, 'null일 때 미포함');
});
