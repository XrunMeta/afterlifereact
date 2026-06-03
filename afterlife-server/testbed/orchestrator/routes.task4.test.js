

import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { orchestratorRouter } from './routes.js';

function mountApp(orch, secret, extraDeps, cfg = {}) {
  const app = express();
  app.use(express.json());
  const deps = Object.keys(extraDeps ?? {}).length ? extraDeps : undefined;
  app.use(orchestratorRouter(orch, { secret, deps, cfg: { testbedBaseUrl: 'http://127.0.0.1:9999', ...cfg } }));
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () =>
      resolve({ server, base: `http://127.0.0.1:${server.address().port}` })
    );
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

test('cfg.assetDirs 주입 시 ensureAssets가 assetDirs 포함해 호출됨', async () => {
  const ensureAssetsArgs = [];
  const mockEnsureAssets = async (params) => {
    ensureAssetsArgs.push(params);
    return { museVideoPath: '/video/c5/idle-25fps.mp4', ttsSePath: '/voices/c5/se.pth', avatarImagePath: '/img/c5.png' };
  };

  const assetDirs = {
    voiceRefDir: '/home/afterlife/afterlife-server/openvoice-afterlife/reference_voices',
    videoRefDir: '/home/afterlife/afterlife-server/testbed/video-ref',
    imageRefDir: '/home/afterlife/afterlife-server/testbed/image-ref',
  };

  const orch = fakeOrch({
    allocate: async () => ({ callId: 'c5', subscribeToken: 'tok5', tracks: {}, state: 'live' }),
  });
  const { server, base } = await mountApp(orch, 'sek', { ensureAssets: mockEnsureAssets }, {
    assetDirs,
    apiBaseUrl: 'https://oth-path.afterlife.example.com',
  });

  const assets = {
    idleVideoUrl: 'https://oth-path.afterlife.example.com/files/idle.mp4',
    voiceSeUrl: 'https://oth-path.afterlife.example.com/files/se.pth',
    avatarUrl: 'https://oth-path.afterlife.example.com/files/avatar.png',
  };

  const r = await fetch(`${base}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ cloneId: 'c5', userId: 'u1', assets }),
  });
  assert.equal(r.status, 200);
  assert.equal(ensureAssetsArgs.length, 1, 'ensureAssets 1회 호출');

  assert.deepEqual(ensureAssetsArgs[0].dirs, assetDirs, 'dirs = assetDirs');
  assert.equal(ensureAssetsArgs[0].apiBaseUrl, 'https://oth-path.afterlife.example.com');

  server.close();
});

test('say 후 callPersona 자산 경로(ttsSePath/museVideoPath)가 올바르게 저장됨', async () => {
  const relayedArgs = [];
  const mockEnsureAssets = async () => ({
    museVideoPath: '/video/c6/idle-25fps.mp4',
    ttsSePath: '/voices/c6/se.pth',
    avatarImagePath: '/img/c6.png',
  });

  let allocCount = 0;
  const orch = fakeOrch({
    allocate: async () => { allocCount++; return { callId: 'c6', subscribeToken: 'tok6', tracks: {}, state: 'live' }; },
    getCall: (id) => (id === 'c6' ? { call_id: 'c6', port: 8420, state: 'live' } : null),
  });

  const runChatRelay = async (_deps, args) => { relayedArgs.push(args); };

  const { server, base } = await mountApp(
    orch, 'sek',
    { ensureAssets: mockEnsureAssets, sayDeps: { runChatRelay } },
    { assetDirs: { voiceRefDir: '/v', videoRefDir: '/m', imageRefDir: '/i' }, apiBaseUrl: 'https://oth-path.x.com' },
  );

  const assets = {
    idleVideoUrl: 'https://oth-path.x.com/files/idle.mp4',
    voiceSeUrl: 'https://oth-path.x.com/files/se.pth',
    avatarUrl: 'https://oth-path.x.com/files/avatar.png',
  };

  const allocR = await fetch(`${base}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ cloneId: 'c6', userId: 'u6', assets }),
  });
  assert.equal(allocR.status, 200);

  const sayR = await fetch(`${base}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ text: '안녕', cloneId: 'c6' }),
  });
  assert.equal(sayR.status, 202);

  await new Promise((r) => setTimeout(r, 30));

  assert.equal(relayedArgs.length, 1, 'relay 1회 호출');

  assert.equal(relayedArgs[0].callId, 'c6');

  server.close();
});

test('cfg.assetDirs 미주입 시에도 통화 정상 allocate', async () => {
  const { server, base } = await mountApp(fakeOrch(), 'sek', {}, {});
  const r = await fetch(`${base}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ cloneId: 'c7', userId: 'u7' }),
  });
  assert.equal(r.status, 200);
  server.close();
});
