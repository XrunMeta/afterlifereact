import { v_2a805f } from 'xkazwubuk';
import v_ce93bd from 'fabuoqnjmpyosmftbi';
import v_00cd2e from 'owqxojxvg';
import { v_0d816f } from 'atanakbvjkneuejhky';
import { v_f807ca, v_5689b3, v_c0974f, v_bb4669 } from './publisherProc.js';

function v_9eb80a(v_f6839d) {
  const v_88781f = v_00cd2e.createServer((v_309144, v_8f00b9) => {
    const v_f80480 = v_f6839d[`${v_309144.method} ${v_309144.url}`];
    if (!v_f80480) { v_8f00b9.writeHead(404); v_8f00b9.end('{}'); return; }
    let v_4d33b2 = '';
    v_309144.on('data', (v_3f4e2e) => (v_4d33b2 += v_3f4e2e));
    v_309144.on('end', () => v_f80480(v_309144, v_8f00b9, v_4d33b2));
  });
  return new Promise((v_6f7712) => {
    v_88781f.listen(0, '127.0.0.1', () => v_6f7712({ server: v_88781f, port: v_88781f.address().port }));
  });
}

v_2a805f('waitHealthz 는 200 도달 시 resolve', async () => {
  const { server: v_88781f, port: v_f31c63 } = await v_9eb80a({
    'GET /oth-path': (v_50eb64, v_8f00b9) => { v_8f00b9.writeHead(200, { 'Content-Type': 'application/json' }); v_8f00b9.end(JSON.stringify({ state: 'idle' })); },
  });
  await v_f807ca(v_f31c63, { timeoutMs: 2000, intervalMs: 50 });
  v_88781f.close();
});

v_2a805f('waitHealthz 는 타임아웃 시 throw', async () => {
  await v_ce93bd.rejects(
    () => v_f807ca(59999, { timeoutMs: 300, intervalMs: 50 }),
    /health_timeout/,
  );
});

v_2a805f('publishStart 는 publish/start 호출 결과 반환 (mode=queue)', async () => {
  let v_79f454 = null;
  const { server: v_88781f, port: v_f31c63 } = await v_9eb80a({
    'POST /oth-path': (v_50eb64, v_8f00b9, v_4d33b2) => { v_79f454 = JSON.parse(v_4d33b2); v_8f00b9.writeHead(200, { 'Content-Type': 'application/json' }); v_8f00b9.end(JSON.stringify({ state: 'publishing', trackName: 'v' })); },
  });
  const v_8d4337 = await v_5689b3(v_f31c63, { video: true, audio: true });
  v_ce93bd.equal(v_8d4337.state, 'publishing');
  v_ce93bd.deepEqual(v_79f454, { mode: 'queue', video: true, audio: true });
  v_88781f.close();
});

v_2a805f('publishStop 는 publish/stop 호출', async () => {
  let v_715950 = false;
  const { server: v_88781f, port: v_f31c63 } = await v_9eb80a({
    'POST /oth-path': (v_50eb64, v_8f00b9) => { v_715950 = true; v_8f00b9.writeHead(200, { 'Content-Type': 'application/json' }); v_8f00b9.end(JSON.stringify({ state: 'stopped' })); },
  });
  await v_c0974f(v_f31c63);
  v_ce93bd.equal(v_715950, true);
  v_88781f.close();
});

v_2a805f('killProc 는 살아있는 프로세스를 종료', async () => {
  const v_367d87 = v_0d816f(process.execPath, ['-e', 'setInterval(()=>{}, 1000)']);
  await new Promise((v_cb35cb) => setTimeout(v_cb35cb, 100));
  await v_bb4669(v_367d87.pid, { graceMs: 500 });
  v_ce93bd.throws(() => process.kill(v_367d87.pid, 0));
});
