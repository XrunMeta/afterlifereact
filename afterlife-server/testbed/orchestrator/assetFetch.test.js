import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ensureLocalAsset, ensureAssets } from './assetFetch.js';

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'assetFetch-test-'));
}

test('ensureLocalAsset: destPath 이미 존재하면 fetch 호출 안 함(skip)', async () => {
  const dir = tmpDir();
  const dest = path.join(dir, 'file.bin');
  fs.writeFileSync(dest, 'already-here');

  let fetchCalled = false;
  const fetchImpl = async () => { fetchCalled = true; return { ok: true, arrayBuffer: async () => Buffer.from('new') }; };

  await ensureLocalAsset({ url: 'https://oth-path.example.com/f', destPath: dest, fetchImpl });
  assert.equal(fetchCalled, false, 'destPath 존재 시 fetch 호출 금지');
  assert.equal(fs.readFileSync(dest, 'utf8'), 'already-here', '기존 파일 유지');
});

test('ensureLocalAsset: destPath 없으면 fetch 후 파일 저장, 디렉토리 mkdir -p', async () => {
  const dir = tmpDir();
  const dest = path.join(dir, 'sub', 'deep', 'file.bin');

  const content = Buffer.from('downloaded-content');
  const fetchImpl = async (_url) => ({
    ok: true,
    arrayBuffer: async () => content.buffer.slice(content.byteOffset, content.byteOffset + content.byteLength),
  });

  await ensureLocalAsset({ url: 'https://oth-path.example.com/f', destPath: dest, fetchImpl });
  assert.ok(fs.existsSync(dest), '파일이 생성되어야 함');
  assert.equal(fs.readFileSync(dest).toString(), 'downloaded-content');
});

test('ensureLocalAsset: fetch 실패(ok=false) 시 throw', async () => {
  const dir = tmpDir();
  const dest = path.join(dir, 'fail.bin');
  const fetchImpl = async () => ({ ok: false, status: 404, arrayBuffer: async () => Buffer.from('') });
  await assert.rejects(
    () => ensureLocalAsset({ url: 'https://oth-path.example.com/f', destPath: dest, fetchImpl }),
    /fetch_failed/,
  );
});

function makeDirs() {
  const base = tmpDir();
  return {
    voiceRefDir: path.join(base, 'reference_voices'),
    videoRefDir: path.join(base, 'video'),
    imageRefDir: path.join(base, 'images'),
  };
}

const API_BASE = 'https://oth-path.afterlife.example.com';

test('ensureAssets: ①destPath 존재 시 pull skip — fetchImpl 미호출', async () => {
  const dirs = makeDirs();
  const cloneId = 'clone-skip';

  const sePath = path.join(dirs.voiceRefDir, cloneId, 'se.pth');
  fs.mkdirSync(path.dirname(sePath), { recursive: true });
  fs.writeFileSync(sePath, 'existing-se');

  let fetchCount = 0;
  const fetchImpl = async () => {
    fetchCount++;
    return { ok: true, arrayBuffer: async () => Buffer.from('x').buffer };
  };

  const assets = { voiceSeUrl: `${API_BASE}/files/se.pth`, idleVideoUrl: null, avatarUrl: null };
  const result = await ensureAssets({ cloneId, assets, dirs, apiBaseUrl: API_BASE, fetchImpl });

  assert.equal(fetchCount, 0, 'destPath 존재 + null url → fetch 0회');
  assert.equal(result.ttsSePath, sePath);
});

test('ensureAssets: ②url 있을 때 pull 수행·저장', async () => {
  const dirs = makeDirs();
  const cloneId = 'clone-pull';

  let pulled = [];
  const fetchImpl = async (url) => {
    pulled.push(url);
    return {
      ok: true,
      arrayBuffer: async () => {
        const buf = Buffer.from('mock-data');
        return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
      },
    };
  };

  const assets = {
    voiceSeUrl: `${API_BASE}/files/se123.pth`,
    idleVideoUrl: `${API_BASE}/files/idle.mp4`,
    avatarUrl: `${API_BASE}/files/avatar.png`,
  };
  const result = await ensureAssets({ cloneId, assets, dirs, apiBaseUrl: API_BASE, fetchImpl });

  assert.equal(pulled.length, 3, '3개 url 모두 fetch');
  assert.ok(result.ttsSePath?.endsWith(`${cloneId}/se.pth`));
  assert.ok(result.museVideoPath?.endsWith(`${cloneId}/idle-25fps.mp4`));
  assert.ok(result.avatarImagePath?.endsWith(`${cloneId}.png`));
  assert.ok(fs.existsSync(result.ttsSePath));
  assert.ok(fs.existsSync(result.museVideoPath));
  assert.ok(fs.existsSync(result.avatarImagePath));
});

test('ensureAssets: ③apiBaseUrl prefix 아닌 url → 해당 자산 null(SSRF 방어)', async () => {
  const dirs = makeDirs();
  const cloneId = 'clone-ssrf';

  let pullCount = 0;
  const fetchImpl = async () => {
    pullCount++;
    return { ok: true, arrayBuffer: async () => Buffer.from('x').buffer };
  };

  const assets = {
    voiceSeUrl: 'https://evil.example.com/se.pth',   
    idleVideoUrl: `${API_BASE}/files/ok.mp4`,          
    avatarUrl: null,
  };
  const result = await ensureAssets({ cloneId, assets, dirs, apiBaseUrl: API_BASE, fetchImpl });

  assert.equal(result.ttsSePath, null, 'SSRF url → null');
  assert.equal(pullCount, 1, '정상 url 1개만 fetch');
  assert.ok(result.museVideoPath != null);
});

test('ensureAssets: ④pull 실패 시 해당 경로 null(graceful, throw 금지)', async () => {
  const dirs = makeDirs();
  const cloneId = 'clone-fail';

  const fetchImpl = async () => ({ ok: false, status: 500, arrayBuffer: async () => Buffer.from('').buffer });

  const assets = {
    voiceSeUrl: `${API_BASE}/files/se.pth`,
    idleVideoUrl: `${API_BASE}/files/idle.mp4`,
    avatarUrl: null,
  };

  let result;
  await assert.doesNotReject(async () => {
    result = await ensureAssets({ cloneId, assets, dirs, apiBaseUrl: API_BASE, fetchImpl });
  }, 'pull 실패 시 throw 금지');

  assert.equal(result.ttsSePath, null, 'pull 실패 → null');
  assert.equal(result.museVideoPath, null, 'pull 실패 → null');
  assert.equal(result.avatarImagePath, null);
});

test('ensureAssets: voiceSeUrl 없고 voiceSeKey 있으면 프리셋 경로 사용(fetch 없이 경로만)', async () => {
  const dirs = makeDirs();
  const cloneId = 'clone-preset';
  const voiceSeKey = 'preset-halbae';

  const presetPath = path.join(dirs.voiceRefDir, voiceSeKey, 'se.pth');
  fs.mkdirSync(path.dirname(presetPath), { recursive: true });
  fs.writeFileSync(presetPath, 'preset-data');

  let fetchCount = 0;
  const fetchImpl = async () => { fetchCount++; return { ok: true, arrayBuffer: async () => Buffer.from('x').buffer }; };

  const assets = { voiceSeUrl: null, voiceSeKey, idleVideoUrl: null, avatarUrl: null };
  const result = await ensureAssets({ cloneId, assets, dirs, apiBaseUrl: API_BASE, fetchImpl });

  assert.equal(fetchCount, 0, '프리셋 파일 존재 시 fetch 없음');
  assert.equal(result.ttsSePath, presetPath);
});

test('ensureAssets: 모든 url null 이면 전부 null 반환', async () => {
  const dirs = makeDirs();
  const cloneId = 'clone-all-null';
  let fetchCount = 0;
  const fetchImpl = async () => { fetchCount++; return { ok: true, arrayBuffer: async () => Buffer.from('x').buffer }; };

  const assets = { voiceSeUrl: null, idleVideoUrl: null, avatarUrl: null };
  const result = await ensureAssets({ cloneId, assets, dirs, apiBaseUrl: API_BASE, fetchImpl });

  assert.equal(fetchCount, 0);
  assert.equal(result.ttsSePath, null);
  assert.equal(result.museVideoPath, null);
  assert.equal(result.avatarImagePath, null);
});
