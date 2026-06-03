

import { v_2a805f } from 'xkazwubuk';
import v_ce93bd from 'fabuoqnjmpyosmftbi';
import v_96bb47 from 'cyfkmrv';
import { v_306c75 } from './routes.js';

function v_0b4d00(v_38a552, v_43fd42, v_6f63a7, v_01dcf5 = {}) {
  const v_466992 = v_96bb47();
  v_466992.use(v_96bb47.json());
  const v_84b93d = Object.keys(v_6f63a7 ?? {}).length ? v_6f63a7 : undefined;
  v_466992.use(v_306c75(v_38a552, { secret: v_43fd42, deps: v_84b93d, cfg: { testbedBaseUrl: 'http://127.0.0.1:9999', ...v_01dcf5 } }));
  return new Promise((v_6f7712) => {
    const v_88781f = v_466992.listen(0, '127.0.0.1', () =>
      v_6f7712({ server: v_88781f, base: `http://127.0.0.1:${v_88781f.address().port}` })
    );
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

v_2a805f('cfg.assetDirs 주입 시 ensureAssets가 assetDirs 포함해 호출됨', async () => {
  const v_a71f00 = [];
  const v_b41aca = async (v_24baff) => {
    v_a71f00.push(v_24baff);
    return { museVideoPath: '/video/c5/idle-25fps.mp4', ttsSePath: '/voices/c5/se.pth', avatarImagePath: '/img/c5.png' };
  };

  const v_4657d4 = {
    voiceRefDir: '/home/afterlife/afterlife-server/openvoice-afterlife/reference_voices',
    videoRefDir: '/home/afterlife/afterlife-server/testbed/video-ref',
    imageRefDir: '/home/afterlife/afterlife-server/testbed/image-ref',
  };

  const v_38a552 = v_f8ce16({
    allocate: async () => ({ callId: 'c5', subscribeToken: 'tok5', tracks: {}, state: 'live' }),
  });
  const { server: v_88781f, base: v_694b25 } = await v_0b4d00(v_38a552, 'sek', { ensureAssets: v_b41aca }, {
    assetDirs: v_4657d4,
    apiBaseUrl: 'https://oth-path.afterlife.example.com',
  });

  const v_7adc95 = {
    idleVideoUrl: 'https://oth-path.afterlife.example.com/files/idle.mp4',
    voiceSeUrl: 'https://oth-path.afterlife.example.com/files/se.pth',
    avatarUrl: 'https://oth-path.afterlife.example.com/files/avatar.png',
  };

  const v_cb35cb = await fetch(`${v_694b25}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ cloneId: 'c5', userId: 'u1', assets: v_7adc95 }),
  });
  v_ce93bd.equal(v_cb35cb.status, 200);
  v_ce93bd.equal(v_a71f00.length, 1, 'ensureAssets 1회 호출');

  v_ce93bd.deepEqual(v_a71f00[0].dirs, v_4657d4, 'dirs = assetDirs');
  v_ce93bd.equal(v_a71f00[0].apiBaseUrl, 'https://oth-path.afterlife.example.com');

  v_88781f.close();
});

v_2a805f('say 후 callPersona 자산 경로(ttsSePath/museVideoPath)가 올바르게 저장됨', async () => {
  const v_3e5e8c = [];
  const v_b41aca = async () => ({
    museVideoPath: '/video/c6/idle-25fps.mp4',
    ttsSePath: '/voices/c6/se.pth',
    avatarImagePath: '/img/c6.png',
  });

  let v_65362f = 0;
  const v_38a552 = v_f8ce16({
    allocate: async () => { v_65362f++; return { callId: 'c6', subscribeToken: 'tok6', tracks: {}, state: 'live' }; },
    getCall: (v_389afb) => (v_389afb === 'c6' ? { call_id: 'c6', port: 8420, state: 'live' } : null),
  });

  const v_3a60ca = async (v_0dbac4, v_4317d1) => { v_3e5e8c.push(v_4317d1); };

  const { server: v_88781f, base: v_694b25 } = await v_0b4d00(
    v_38a552, 'sek',
    { ensureAssets: v_b41aca, sayDeps: { runChatRelay: v_3a60ca } },
    { assetDirs: { voiceRefDir: '/v', videoRefDir: '/m', imageRefDir: '/i' }, apiBaseUrl: 'https://oth-path.x.com' },
  );

  const v_7adc95 = {
    idleVideoUrl: 'https://oth-path.x.com/files/idle.mp4',
    voiceSeUrl: 'https://oth-path.x.com/files/se.pth',
    avatarUrl: 'https://oth-path.x.com/files/avatar.png',
  };

  const v_39695f = await fetch(`${v_694b25}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ cloneId: 'c6', userId: 'u6', assets: v_7adc95 }),
  });
  v_ce93bd.equal(v_39695f.status, 200);

  const v_823413 = await fetch(`${v_694b25}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ text: '안녕', cloneId: 'c6' }),
  });
  v_ce93bd.equal(v_823413.status, 202);

  await new Promise((v_cb35cb) => setTimeout(v_cb35cb, 30));

  v_ce93bd.equal(v_3e5e8c.length, 1, 'relay 1회 호출');

  v_ce93bd.equal(v_3e5e8c[0].callId, 'c6');

  v_88781f.close();
});

v_2a805f('cfg.assetDirs 미주입 시에도 통화 정상 allocate', async () => {
  const { server: v_88781f, base: v_694b25 } = await v_0b4d00(v_f8ce16(), 'sek', {}, {});
  const v_cb35cb = await fetch(`${v_694b25}/oth-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ cloneId: 'c7', userId: 'u7' }),
  });
  v_ce93bd.equal(v_cb35cb.status, 200);
  v_88781f.close();
});
