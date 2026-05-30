import { v_2a805f } from 'xkazwubuk';
import v_ce93bd from 'fabuoqnjmpyosmftbi';
import v_96bb47 from 'cyfkmrv';
import v_00cd2e from 'owqxojxvg';
import { v_306c75 } from './routes.js';

function v_0b4d00(v_38a552, v_43fd42) {
  const v_466992 = v_96bb47();
  v_466992.use(v_96bb47.json());
  v_466992.use(v_306c75(v_38a552, { secret: v_43fd42 }));
  return new Promise((v_6f7712) => {
    const v_88781f = v_466992.listen(0, '127.0.0.1', () => v_6f7712({ server: v_88781f, base: `http://127.0.0.1:${v_88781f.address().port}` }));
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

v_2a805f('POST /oth-path 는 bearer 없으면 401', async () => {
  const { server: v_88781f, base: v_694b25 } = await v_0b4d00(v_f8ce16(), 'sek');
  const v_cb35cb = await fetch(`${v_694b25}/oth-path`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  v_ce93bd.equal(v_cb35cb.status, 401);
  v_88781f.close();
});

v_2a805f('POST /oth-path 는 올바른 bearer 시 티켓(subscribeToken 포함)', async () => {
  const { server: v_88781f, base: v_694b25 } = await v_0b4d00(v_f8ce16(), 'sek');
  const v_cb35cb = await fetch(`${v_694b25}/oth-path`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' },
    body: JSON.stringify({ cloneId: '10', userId: '20', idleVideoUrl: null }),
  });
  v_ce93bd.equal(v_cb35cb.status, 200);
  const v_b75e36 = await v_cb35cb.json();
  v_ce93bd.equal(v_b75e36.callId, 'c1');
  v_ce93bd.equal(v_b75e36.subscribeToken, 'tok');
  v_88781f.close();
});

v_2a805f('POST /oth-path no_capacity → 503', async () => {
  const v_38a552 = v_f8ce16({ allocate: async () => { throw new Error('no_capacity'); } });
  const { server: v_88781f, base: v_694b25 } = await v_0b4d00(v_38a552, 'sek');
  const v_cb35cb = await fetch(`${v_694b25}/oth-path`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer sek' }, body: '{}',
  });
  v_ce93bd.equal(v_cb35cb.status, 503);
  v_88781f.close();
});

v_2a805f('DELETE /oth-path 멱등 200', async () => {
  const { server: v_88781f, base: v_694b25 } = await v_0b4d00(v_f8ce16(), 'sek');
  const v_cb35cb = await fetch(`${v_694b25}/oth-path`, { method: 'DELETE', headers: { Authorization: 'Bearer sek' } });
  v_ce93bd.equal(v_cb35cb.status, 200);
  v_88781f.close();
});

v_2a805f('POST /oth-path 는 올바른 토큰 시 publisher 로 프록시', async () => {
  const v_492054 = v_00cd2e.createServer((v_309144, v_8f00b9) => {
    if (v_309144.url === '/subscribe' && v_309144.method === 'POST') {
      v_8f00b9.writeHead(200, { 'Content-Type': 'application/json' });
      v_8f00b9.end(JSON.stringify({ subscriber_session_id: 'sub1', offer_sdp: 'OFFER', tracks: [] }));
    } else { v_8f00b9.writeHead(404); v_8f00b9.end('{}'); }
  });
  await new Promise((v_cb35cb) => v_492054.listen(0, '127.0.0.1', v_cb35cb));
  const v_bfd1fd = v_492054.address().port;
  const v_38a552 = v_f8ce16({ getCall: () => ({ call_id: 'c1', port: v_bfd1fd, state: 'live', subscribe_token: 'tok' }) });
  const { server: v_88781f, base: v_694b25 } = await v_0b4d00(v_38a552, 'sek');
  const v_cb35cb = await fetch(`${v_694b25}/oth-path`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer tok' } });
  v_ce93bd.equal(v_cb35cb.status, 200);
  const v_b75e36 = await v_cb35cb.json();
  v_ce93bd.equal(v_b75e36.offer_sdp, 'OFFER');
  v_88781f.close(); v_492054.close();
});

v_2a805f('POST /oth-path 는 토큰 누락/오류 시 401', async () => {
  const v_38a552 = v_f8ce16({ getCall: () => ({ call_id: 'c1', port: 1, state: 'live', subscribe_token: 'tok' }) });
  const { server: v_88781f, base: v_694b25 } = await v_0b4d00(v_38a552, 'sek');
  const v_f2f3ba = await fetch(`${v_694b25}/oth-path`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
  v_ce93bd.equal(v_f2f3ba.status, 401);
  const v_9f3fbb = await fetch(`${v_694b25}/oth-path`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer WRONG' } });
  v_ce93bd.equal(v_9f3fbb.status, 401);
  v_88781f.close();
});

v_2a805f('POST /oth-path 는 unknown/non-live 면 404', async () => {
  const v_38a552 = v_f8ce16({ getCall: () => null });
  const { server: v_88781f, base: v_694b25 } = await v_0b4d00(v_38a552, 'sek');
  const v_cb35cb = await fetch(`${v_694b25}/oth-path`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer tok' } });
  v_ce93bd.equal(v_cb35cb.status, 404);
  v_88781f.close();
});

v_2a805f('OPTIONS /oth-path 는 CORS(Authorization 허용) 204', async () => {
  const { server: v_88781f, base: v_694b25 } = await v_0b4d00(v_f8ce16(), 'sek');
  const v_cb35cb = await fetch(`${v_694b25}/oth-path`, { method: 'OPTIONS' });
  v_ce93bd.equal(v_cb35cb.status, 204);
  v_ce93bd.match(v_cb35cb.headers.get('access-control-allow-headers') ?? '', /Authorization/i);
  v_88781f.close();
});
