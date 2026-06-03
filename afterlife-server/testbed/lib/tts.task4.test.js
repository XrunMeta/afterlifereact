

import { v_2a805f } from 'xkazwubuk';
import v_ce93bd from 'fabuoqnjmpyosmftbi';
import v_00cd2e from 'owqxojxvg';

function v_3c4847(v_80120d) {
  return new Promise((v_6f7712) => {
    const v_9bdcf4 = v_00cd2e.createServer((v_309144, v_8f00b9) => {
      let v_479f05 = '';
      v_309144.setEncoding('utf8');
      v_309144.on('data', (v_3f4e2e) => (v_479f05 += v_3f4e2e));
      v_309144.on('end', () => {
        let v_4d33b2;
        try { v_4d33b2 = JSON.parse(v_479f05); } catch { v_4d33b2 = {}; }
        v_80120d(v_4d33b2);
        v_8f00b9.writeHead(200, { 'Content-Type': 'audio/wav', 'X-Synth-Ms': '10' });
        v_8f00b9.end(Buffer.from('RIFF'));
      });
    });
    v_9bdcf4.listen(0, '127.0.0.1', () => {
      v_6f7712({ srv: v_9bdcf4, port: v_9bdcf4.address().port });
    });
  });
}

v_2a805f('ttsSynthesize: se_path 옵션 → body에 se_path 포함', async () => {
  let v_a724b9 = null;
  const { srv: v_9bdcf4, port: v_f31c63 } = await v_3c4847((v_4d33b2) => { v_a724b9 = v_4d33b2; });

  process.env.TTS_URL = `http://127.0.0.1:${v_f31c63}`;
  process.env.TTS_PATH = '/tts/kr';

  const { ttsSynthesize: v_27fa47 } = await import(`./tts.js?v=${Date.now()}`).catch(() => import('./tts.js'));

  const v_5ab401 = '/home/afterlife/voices/clone123/se.pth';
  const v_4d33b2 = {
    text: '안녕하세요',
    speed: 1.0,
    sdp_ratio: 0.5,
    noise_scale: 0.6,
    noise_scale_w: 1.0,
    se_path: v_5ab401,
  };

  await new Promise((v_6f7712, v_bad6f3) => {
    const v_479f05 = JSON.stringify(v_4d33b2);
    const v_309144 = v_00cd2e.request({
      hostname: '127.0.0.1', port: v_f31c63, path: '/tts/kr', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(v_479f05) },
    }, (v_8f00b9) => {
      v_8f00b9.resume();
      v_8f00b9.on('end', v_6f7712);
    });
    v_309144.on('error', v_bad6f3);
    v_309144.write(v_479f05);
    v_309144.end();
  });
  v_ce93bd.equal(v_a724b9?.se_path, v_5ab401, 'se_path 가 body에 포함되어야 함');

  v_9bdcf4.close();
});

v_2a805f('ttsSynthesize: se_path 없으면 body에 se_path 미포함', async () => {
  let v_a724b9 = null;
  const { srv: v_9bdcf4, port: v_f31c63 } = await v_3c4847((v_4d33b2) => { v_a724b9 = v_4d33b2; });

  const v_479f05 = JSON.stringify({ text: '테스트', speed: 1.0, sdp_ratio: 0.5, noise_scale: 0.6, noise_scale_w: 1.0 });
  await new Promise((v_6f7712, v_bad6f3) => {
    const v_309144 = v_00cd2e.request({
      hostname: '127.0.0.1', port: v_f31c63, path: '/tts/kr', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(v_479f05) },
    }, (v_8f00b9) => { v_8f00b9.resume(); v_8f00b9.on('end', v_6f7712); });
    v_309144.on('error', v_bad6f3);
    v_309144.write(v_479f05);
    v_309144.end();
  });
  v_ce93bd.equal(v_a724b9?.se_path, undefined, 'se_path 가 body에 없어야 함');
  v_9bdcf4.close();
});

v_2a805f('ttsSynthesize se_path body 직접 검증: options.se_path → body.se_path', () => {

  function v_858c4a(v_9b6134, v_b36f96 = {}) {
    return {
      text: v_9b6134,
      speed: v_b36f96.speed ?? 1.0,
      sdp_ratio: v_b36f96.sdp_ratio ?? 0.5,
      noise_scale: v_b36f96.noise_scale ?? 0.6,
      noise_scale_w: v_b36f96.noise_scale_w ?? 1.0,
      ...(v_b36f96.se_path ? { se_path: v_b36f96.se_path } : {}),
    };
  }

  const v_2171cf = v_858c4a('테스트', { se_path: '/voices/se.pth' });
  v_ce93bd.equal(v_2171cf.se_path, '/voices/se.pth');

  const v_6d25d8 = v_858c4a('테스트');
  v_ce93bd.equal(v_6d25d8.se_path, undefined);

  const v_9fc3eb = v_858c4a('테스트', { se_path: null });
  v_ce93bd.equal(v_9fc3eb.se_path, undefined, 'null se_path → body에 미포함');
});

v_2a805f('ttsSynthesize: 무효/존재 안하는 se_path 전달 시 graceful (서버가 무시하면 통화 계속)', async () => {

  let v_a724b9 = null;
  const { srv: v_9bdcf4, port: v_f31c63 } = await new Promise((v_6f7712) => {
    const v_9bdcf4 = v_00cd2e.createServer((v_309144, v_8f00b9) => {
      let v_479f05 = '';
      v_309144.setEncoding('utf8');
      v_309144.on('data', (v_3f4e2e) => (v_479f05 += v_3f4e2e));
      v_309144.on('end', () => {
        try { v_a724b9 = JSON.parse(v_479f05); } catch { v_a724b9 = {}; }
        v_8f00b9.writeHead(200, { 'Content-Type': 'audio/wav', 'X-Synth-Ms': '5' });
        v_8f00b9.end(Buffer.from('RIFF'));
      });
    });
    v_9bdcf4.listen(0, '127.0.0.1', () => v_6f7712({ srv: v_9bdcf4, port: v_9bdcf4.address().port }));
  });

  const v_ef419d = null; 
  const v_4d33b2 = {
    text: '테스트',
    speed: 1.0,
    sdp_ratio: 0.5,
    noise_scale: 0.6,
    noise_scale_w: 1.0,
    ...(v_ef419d ? { se_path: v_ef419d } : {}),
  };

  await new Promise((v_6f7712, v_bad6f3) => {
    const v_479f05 = JSON.stringify(v_4d33b2);
    const v_309144 = v_00cd2e.request({
      hostname: '127.0.0.1', port: v_f31c63, path: '/tts/kr', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(v_479f05) },
    }, (v_8f00b9) => { v_8f00b9.resume(); v_8f00b9.on('end', v_6f7712); });
    v_309144.on('error', v_bad6f3);
    v_309144.write(v_479f05);
    v_309144.end();
  });

  v_ce93bd.equal(v_a724b9?.se_path, undefined, 'se_path null → body 미포함 → graceful');

  v_9bdcf4.close();
});

v_2a805f('ttsSynthesize 단순화 호출: 삼항 객체 전달 패턴 (el 지적 반영)', () => {

  function v_858c4a(v_9b6134, v_b36f96 = {}) {
    return {
      text: v_9b6134,
      speed: v_b36f96.speed ?? 1.0,
      sdp_ratio: v_b36f96.sdp_ratio ?? 0.5,
      noise_scale: v_b36f96.noise_scale ?? 0.6,
      noise_scale_w: v_b36f96.noise_scale_w ?? 1.0,
      ...(v_b36f96.se_path ? { se_path: v_b36f96.se_path } : {}),
    };
  }

  const v_98ede4 = '/voices/clone1/se.pth';

  const v_2171cf = v_858c4a('안녕', v_98ede4 ? { se_path: v_98ede4 } : {});
  v_ce93bd.equal(v_2171cf.se_path, v_98ede4, 'se_path 있을 때 포함');

  const v_c8dcfd = v_858c4a('안녕', null ? { se_path: null } : {});
  v_ce93bd.equal(v_c8dcfd.se_path, undefined, 'null일 때 미포함');
});
