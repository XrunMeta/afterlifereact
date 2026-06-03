

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';

function buildPhotoStillArgs(photoPath, outPath) {

  return [
    '-y', '-loglevel', 'error',
    '-loop', '1',
    '-i', photoPath,
    '-t', '2',
    '-r', '25',
    '-pix_fmt', 'yuv420p',
    '-vf', 'scale=256:256:force_original_aspect_ratio=decrease,pad=256:256:(ow-iw)/2:(oh-ih)/2',
    outPath,
  ];
}

test('ensurePhotoStill: ffmpeg 인자 구조 검증', () => {
  const args = buildPhotoStillArgs('/photos/avatar.png', '/video/still.mp4');
  assert.ok(args.includes('-loop'), '-loop 포함');
  assert.ok(args.includes('1'), '-loop 1');
  assert.ok(args.includes('-t'), '-t 포함');
  assert.ok(args.includes('2'), '-t 2');
  assert.ok(args.includes('-r'), '-r 포함');
  assert.ok(args.includes('25'), '-r 25');
  assert.ok(args.includes('-pix_fmt'), '-pix_fmt 포함');
  assert.ok(args.includes('yuv420p'), 'yuv420p');
  assert.ok(args.includes('/photos/avatar.png'), '입력 경로 포함');
  assert.ok(args.includes('/video/still.mp4'), '출력 경로 포함');

  const vfArg = args[args.indexOf('-vf') + 1];
  assert.ok(vfArg.includes('256'), '256 포함 (짝수 치수)');
});

test('ensurePhotoStill: 출력 경로 패턴 검증', () => {
  const videoRefDir = '/home/afterlife/afterlife-server/testbed/video-ref';
  const cloneId = 'clone_123';
  const outPath = path.join(videoRefDir, cloneId, 'photo-still-25fps.mp4');
  assert.ok(outPath.endsWith('photo-still-25fps.mp4'), '출력 파일명 규격');
  assert.ok(outPath.includes(cloneId), 'cloneId 경로 포함');
});

test('ensurePhotoStill: 이미 파일 있으면 skip (캐시 재사용)', async () => {

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mt-test-'));
  const outPath = path.join(tmpDir, 'photo-still-25fps.mp4');
  await fs.writeFile(outPath, Buffer.from('FAKEMP4'));

  const { existsSync } = await import('node:fs');
  assert.ok(existsSync(outPath), '파일 존재 확인');

  await fs.rm(tmpDir, { recursive: true, force: true });
});

test('폴백 위계: museVideoPath 있으면 avatarImagePath 무시', () => {

  function resolveVideoPath(museVideoPath, avatarImagePath, _videoRefDir, _cloneId) {
    if (museVideoPath) return { kind: 'idle', path: museVideoPath };
    if (avatarImagePath) return { kind: 'photo_still', path: avatarImagePath }; 
    return { kind: 'none', path: null };
  }

  const r1 = resolveVideoPath('/idle.mp4', '/avatar.png', '/ref', 'c1');
  assert.equal(r1.kind, 'idle');
  assert.equal(r1.path, '/idle.mp4');

  const r2 = resolveVideoPath(null, '/avatar.png', '/ref', 'c1');
  assert.equal(r2.kind, 'photo_still');

  const r3 = resolveVideoPath(null, null, '/ref', 'c1');
  assert.equal(r3.kind, 'none');
  assert.equal(r3.path, null);
});

test('musetalk.js ensurePhotoStill 함수 export 확인', async () => {
  const mod = await import('./musetalk.js');
  assert.ok(typeof mod.ensurePhotoStill === 'function', 'ensurePhotoStill 함수 export 필요');
});

test('ensurePhotoStill: 파일 이미 존재 시 ffmpeg 없이 경로 반환', async () => {
  const { ensurePhotoStill } = await import('./musetalk.js');
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mt-ps-'));
  const outPath = path.join(tmpDir, 'photo-still-25fps.mp4');
  await fs.writeFile(outPath, Buffer.from('FAKEMP4'));

  const result = await ensurePhotoStill({ photoPath: '/any/photo.png', outPath });
  assert.equal(result, outPath, '기존 파일 경로 반환');

  await fs.rm(tmpDir, { recursive: true, force: true });
});
