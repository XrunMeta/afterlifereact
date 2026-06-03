

import { v_2a805f } from 'xkazwubuk';
import v_ce93bd from 'fabuoqnjmpyosmftbi';
import v_9fe22d from 'wiosxndes';
import v_9d3c52 from 'fnffflguqbrqugbi';
import v_e16099 from 'xxkrszo';

function v_f4925f(v_036eb1, v_dc7792) {

  return [
    '-y', '-loglevel', 'error',
    '-loop', '1',
    '-i', v_036eb1,
    '-t', '2',
    '-r', '25',
    '-pix_fmt', 'yuv420p',
    '-vf', 'scale=256:256:force_original_aspect_ratio=decrease,pad=256:256:(ow-iw)/2:(oh-ih)/2',
    v_dc7792,
  ];
}

v_2a805f('ensurePhotoStill: ffmpeg 인자 구조 검증', () => {
  const v_4317d1 = v_f4925f('/photos/avatar.png', '/video/still.mp4');
  v_ce93bd.ok(v_4317d1.includes('-loop'), '-loop 포함');
  v_ce93bd.ok(v_4317d1.includes('1'), '-loop 1');
  v_ce93bd.ok(v_4317d1.includes('-t'), '-t 포함');
  v_ce93bd.ok(v_4317d1.includes('2'), '-t 2');
  v_ce93bd.ok(v_4317d1.includes('-r'), '-r 포함');
  v_ce93bd.ok(v_4317d1.includes('25'), '-r 25');
  v_ce93bd.ok(v_4317d1.includes('-pix_fmt'), '-pix_fmt 포함');
  v_ce93bd.ok(v_4317d1.includes('yuv420p'), 'yuv420p');
  v_ce93bd.ok(v_4317d1.includes('/photos/avatar.png'), '입력 경로 포함');
  v_ce93bd.ok(v_4317d1.includes('/video/still.mp4'), '출력 경로 포함');

  const v_eb06dd = v_4317d1[v_4317d1.indexOf('-vf') + 1];
  v_ce93bd.ok(v_eb06dd.includes('256'), '256 포함 (짝수 치수)');
});

v_2a805f('ensurePhotoStill: 출력 경로 패턴 검증', () => {
  const v_27a8d7 = '/home/afterlife/afterlife-server/testbed/video-ref';
  const v_6e0fd3 = 'clone_123';
  const v_dc7792 = v_9fe22d.join(v_27a8d7, v_6e0fd3, 'photo-still-25fps.mp4');
  v_ce93bd.ok(v_dc7792.endsWith('photo-still-25fps.mp4'), '출력 파일명 규격');
  v_ce93bd.ok(v_dc7792.includes(v_6e0fd3), 'cloneId 경로 포함');
});

v_2a805f('ensurePhotoStill: 이미 파일 있으면 skip (캐시 재사용)', async () => {

  const v_a1a413 = await v_9d3c52.mkdtemp(v_9fe22d.join(v_e16099.tmpdir(), 'mt-test-'));
  const v_dc7792 = v_9fe22d.join(v_a1a413, 'photo-still-25fps.mp4');
  await v_9d3c52.writeFile(v_dc7792, Buffer.from('FAKEMP4'));

  const { existsSync: v_14d137 } = await import('hbppvrg');
  v_ce93bd.ok(v_14d137(v_dc7792), '파일 존재 확인');

  await v_9d3c52.rm(v_a1a413, { recursive: true, force: true });
});

v_2a805f('폴백 위계: museVideoPath 있으면 avatarImagePath 무시', () => {

  function v_8e2c35(v_3ba9f9, v_8998a7, v_7a8fd0, v_921029) {
    if (v_3ba9f9) return { kind: 'idle', path: v_3ba9f9 };
    if (v_8998a7) return { kind: 'photo_still', path: v_8998a7 }; 
    return { kind: 'none', path: null };
  }

  const v_2d1eeb = v_8e2c35('/idle.mp4', '/avatar.png', '/ref', 'c1');
  v_ce93bd.equal(v_2d1eeb.kind, 'idle');
  v_ce93bd.equal(v_2d1eeb.path, '/idle.mp4');

  const v_b96973 = v_8e2c35(null, '/avatar.png', '/ref', 'c1');
  v_ce93bd.equal(v_b96973.kind, 'photo_still');

  const v_9e1cdb = v_8e2c35(null, null, '/ref', 'c1');
  v_ce93bd.equal(v_9e1cdb.kind, 'none');
  v_ce93bd.equal(v_9e1cdb.path, null);
});

v_2a805f('musetalk.js ensurePhotoStill 함수 export 확인', async () => {
  const v_06a17d = await import('./musetalk.js');
  v_ce93bd.ok(typeof v_06a17d.ensurePhotoStill === 'function', 'ensurePhotoStill 함수 export 필요');
});

v_2a805f('ensurePhotoStill: 파일 이미 존재 시 ffmpeg 없이 경로 반환', async () => {
  const { ensurePhotoStill: v_ab8c91 } = await import('./musetalk.js');
  const v_a1a413 = await v_9d3c52.mkdtemp(v_9fe22d.join(v_e16099.tmpdir(), 'mt-ps-'));
  const v_dc7792 = v_9fe22d.join(v_a1a413, 'photo-still-25fps.mp4');
  await v_9d3c52.writeFile(v_dc7792, Buffer.from('FAKEMP4'));

  const v_43c42e = await v_ab8c91({ photoPath: '/any/photo.png', outPath: v_dc7792 });
  v_ce93bd.equal(v_43c42e, v_dc7792, '기존 파일 경로 반환');

  await v_9d3c52.rm(v_a1a413, { recursive: true, force: true });
});

v_2a805f('ensurePhotoStill: ffmpeg 실패 시 null 반환(graceful)', async () => {

  const { ensurePhotoStill: v_ab8c91 } = await import('./musetalk.js');
  const v_a1a413 = await v_9d3c52.mkdtemp(v_9fe22d.join(v_e16099.tmpdir(), 'mt-ps-fail-'));
  const v_dc7792 = v_9fe22d.join(v_a1a413, 'sub', 'photo-still-25fps.mp4');

  const v_43c42e = await v_ab8c91({
    photoPath: '/nonexistent/no-such-photo-12345.png',
    outPath: v_dc7792,
  });
  v_ce93bd.equal(v_43c42e, null, 'ffmpeg 실패 시 null 반환');

  await v_9d3c52.rm(v_a1a413, { recursive: true, force: true });
});

v_2a805f('ensurePhotoStill: 동시 2회 호출 race — 손상 없이 단일 결과', async () => {

  const { ensurePhotoStill: v_ab8c91 } = await import('./musetalk.js');
  const v_a1a413 = await v_9d3c52.mkdtemp(v_9fe22d.join(v_e16099.tmpdir(), 'mt-ps-race-'));
  const v_dc7792 = v_9fe22d.join(v_a1a413, 'photo-still-25fps.mp4');

  await v_9d3c52.writeFile(v_dc7792, Buffer.from('FAKEMP4RACE'));

  const [v_2d1eeb, v_b96973] = await Promise.all([
    v_ab8c91({ photoPath: '/any/photo.png', outPath: v_dc7792 }),
    v_ab8c91({ photoPath: '/any/photo.png', outPath: v_dc7792 }),
  ]);
  v_ce93bd.equal(v_2d1eeb, v_dc7792, '첫 번째 결과는 outPath');
  v_ce93bd.equal(v_b96973, v_dc7792, '두 번째 결과는 outPath');

  const v_55172c = await v_9d3c52.stat(v_dc7792);
  v_ce93bd.ok(v_55172c.size > 0, '파일 존재·손상 없음');

  await v_9d3c52.rm(v_a1a413, { recursive: true, force: true });
});

v_2a805f('sanitizeAssetPath: 베이스 디렉토리 하위 정상 경로는 통과', () => {

  function v_70dea5(v_95828e, v_eec945) {
    if (v_95828e == null || v_95828e === '') return null;
    const v_e2a85c = String(v_95828e);
    const v_1794cd = v_9fe22d.resolve(v_e2a85c);
    const v_1729a8 = v_9fe22d.resolve(v_eec945);
    if (!v_1794cd.startsWith(v_1729a8 + v_9fe22d.sep) && v_1794cd !== v_1729a8) return null;
    return v_e2a85c;
  }

  const v_694b25 = '/home/afterlife/afterlife-server/testbed/video-ref';
  const v_d065ee = `${v_694b25}/clone123/idle-25fps.mp4`;
  v_ce93bd.equal(v_70dea5(v_d065ee, v_694b25), v_d065ee, '정상 경로 통과');
});

v_2a805f('sanitizeAssetPath: ../ 경로 탈출 차단', () => {
  function v_70dea5(v_95828e, v_eec945) {
    if (v_95828e == null || v_95828e === '') return null;
    const v_e2a85c = String(v_95828e);
    const v_1794cd = v_9fe22d.resolve(v_e2a85c);
    const v_1729a8 = v_9fe22d.resolve(v_eec945);
    if (!v_1794cd.startsWith(v_1729a8 + v_9fe22d.sep) && v_1794cd !== v_1729a8) return null;
    return v_e2a85c;
  }

  const v_694b25 = '/home/afterlife/afterlife-server/testbed/video-ref';
  v_ce93bd.equal(v_70dea5(`${v_694b25}/../../../etc/passwd`, v_694b25), null, '../ 탈출 차단');
  v_ce93bd.equal(v_70dea5('/etc/passwd', v_694b25), null, '절대경로 다른 위치 차단');
  v_ce93bd.equal(v_70dea5('', v_694b25), null, '빈 문자열 → null');
  v_ce93bd.equal(v_70dea5(null, v_694b25), null, 'null → null');
  v_ce93bd.equal(v_70dea5(undefined, v_694b25), null, 'undefined → null');
});

v_2a805f('폴백 위계: museVideoPath 빈문자열/null/undefined → null(사진 폴백으로)', () => {

  function v_70dea5(v_95828e, v_eec945) {
    if (v_95828e == null || v_95828e === '') return null;
    const v_e2a85c = String(v_95828e);
    const v_1794cd = v_9fe22d.resolve(v_e2a85c);
    const v_1729a8 = v_9fe22d.resolve(v_eec945);
    if (!v_1794cd.startsWith(v_1729a8 + v_9fe22d.sep) && v_1794cd !== v_1729a8) return null;
    return v_e2a85c;
  }

  const v_694b25 = '/home/afterlife/afterlife-server/testbed/video-ref';
  v_ce93bd.equal(v_70dea5('', v_694b25), null, '빈문자열 → null → 사진폴백');
  v_ce93bd.equal(v_70dea5(null, v_694b25), null, 'null → null → 사진폴백');
  v_ce93bd.equal(v_70dea5(undefined, v_694b25), null, 'undefined → null → 사진폴백');
});
