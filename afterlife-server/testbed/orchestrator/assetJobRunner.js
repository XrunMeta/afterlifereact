

import { v_0d816f } from 'atanakbvjkneuejhky';
import { v_354e0a, v_f4ad91, v_cdd5c2, v_f12d3a } from 'fnffflguqbrqugbi';
import { v_171b31 } from 'xxkrszo';
import v_9fe22d from 'wiosxndes';

export const v_9aedb6 = [
  '음... 그러니까...',
  '아, 잠깐만요... 어디 보자.',
  '음, 그게 말이죠...',
];

const v_6f229f = '/home/afterlife/afterlife-server';
const v_57dbae = `${v_6f229f}/musepose-afterlife/afterlife/gen_idle_asset.sh`;
const v_e8b67b = '/home/afterlife/miniconda3/envs/openvoice/bin/python';
const v_c36ec8 = `${v_6f229f}/openvoice-afterlife/scripts/afl_extract_se_io.py`;

export function v_2b669d(v_38d084, v_8d4337) {
  return { bin: 'bash', args: [v_57dbae, v_38d084, v_8d4337] };
}

export function v_f20eee(v_38d084, v_8d4337) {
  return { bin: v_e8b67b, args: [v_c36ec8, v_38d084, v_8d4337] };
}

export function v_7e9d02(v_7746b5, v_f2bb81, v_dc7792) {
  return {
    bin: 'ffmpeg',
    args: [
      '-y',
      '-framerate', '25',
      '-i', v_9fe22d.join(v_7746b5, 'frame_%04d.jpg'),
      '-i', v_f2bb81,
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-shortest',
      v_dc7792,
    ],
  };
}

export async function v_36d0cf(v_9b6134, v_6e0fd3, v_bddb73, v_9718cb) {
  const v_cb35cb = await v_9718cb(`${v_bddb73}/tts/kr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: v_9b6134, clone_id: String(v_6e0fd3) }),
  });
  if (!v_cb35cb.ok) {
    const v_a896d5 = await v_cb35cb.text().catch(() => '');
    throw new Error(`qwen3tts /tts/kr failed: HTTP ${v_cb35cb.status} — ${v_a896d5.slice(0, 200)}`);
  }
  return Buffer.from(await v_cb35cb.arrayBuffer());
}

export async function v_15296d(v_f2bb81, v_f37742, v_555aed) {
  const { default: v_00cd2e } = await import('owqxojxvg');
  const { default: v_5fedb4 } = await import('shmzpkmabg');

  return new Promise((v_6f7712, v_bad6f3) => {
    let v_ceb55a;
    try { v_ceb55a = new URL(v_555aed); } catch {
      return v_bad6f3(new Error(`invalid fifthRenderUrl: ${v_555aed}`));
    }
    const v_06a17d = v_ceb55a.protocol === 'https:' ? v_5fedb4 : v_00cd2e;
    const v_f07ee1 = Buffer.from(JSON.stringify({ wav_path: v_f2bb81, video_path: v_f37742 }));

    const v_309144 = v_06a17d.request(
      {
        hostname: v_ceb55a.hostname,
        port: v_ceb55a.port || (v_ceb55a.protocol === 'https:' ? 443 : 80),
        path: '/render',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': v_f07ee1.length,
        },
        timeout: 120000,
      },
      (v_8f00b9) => {
        if (v_8f00b9.statusCode !== 200) {
          let v_a896d5 = '';
          v_8f00b9.on('data', (v_3f4e2e) => { v_a896d5 += v_3f4e2e.toString(); });
          v_8f00b9.on('end', () =>
            v_bad6f3(new Error(`fifth /render HTTP ${v_8f00b9.statusCode}: ${v_a896d5.slice(0, 200)}`))
          );
          v_8f00b9.resume();
          return;
        }
        const v_3b40dd = [];
        let v_83ee53 = Buffer.alloc(0);
        let v_2fb8cc = false;
        v_8f00b9.on('data', (v_334f63) => {
          v_83ee53 = Buffer.concat([v_83ee53, v_334f63]);
          while (!v_2fb8cc && v_83ee53.length >= 4) {
            const v_fe889f = v_83ee53.readUInt32BE(0);
            if (v_fe889f === 0) { v_2fb8cc = true; break; }
            if (v_83ee53.length < 4 + v_fe889f) break;
            v_3b40dd.push(v_83ee53.slice(4, 4 + v_fe889f));
            v_83ee53 = v_83ee53.slice(4 + v_fe889f);
          }
        });
        v_8f00b9.on('end', () => {
          if (!v_2fb8cc) {
            return v_bad6f3(new Error('fifth render stream ended without terminator'));
          }
          if (v_83ee53.length > 0) {
            return v_bad6f3(
              new Error(
                `fifth render stream ended with ${v_83ee53.length} bytes residual (incomplete frame)`
              )
            );
          }
          v_6f7712(v_3b40dd);
        });
        v_8f00b9.on('error', v_bad6f3);
      }
    );
    v_309144.on('error', v_bad6f3);
    v_309144.on('timeout', () => { v_309144.destroy(); v_bad6f3(new Error('fifth /render timeout')); });
    v_309144.write(v_f07ee1);
    v_309144.end();
  });
}

export function v_47bade({
  apiBaseUrl: v_e9a15d,
  genIdleCmd: v_e296df = v_2b669d,
  extractSeCmd: v_c107c0 = v_f20eee,
  fetchImpl: v_d10060 = fetch,
  spawnImpl: v_b1d1a2 = v_0d816f,

  qwenTtsUrl: v_2a7b41 = process.env.QWEN_TTS_URL ?? 'http://127.0.0.1:8201',
  fifthRenderUrl: v_65da63 = process.env.FIFTH_RENDER_URL ?? 'http://127.0.0.1:8810',
  ffmpegMuxCmd: v_59eea3 = v_7e9d02,
  _qwenTtsFn: v_6b1168 = null,    
  _fifthRenderFn: v_5a5306 = null, 
} = {}) {

  const v_e45ed0 = [];
  let v_ea9258 = false;

  const v_690443 = v_6b1168 ?? ((v_9b6134, v_6e0fd3, v_f71b56, v_9718cb) => v_36d0cf(v_9b6134, v_6e0fd3, v_f71b56, v_9718cb));
  const v_dc2910 = v_5a5306 ?? ((v_f2bb81, v_f37742, v_f71b56) => v_15296d(v_f2bb81, v_f37742, v_f71b56));

  async function v_26f71f() {
    if (v_ea9258) return;
    v_ea9258 = true;
    while (v_e45ed0.length) {
      const v_d5ec97 = v_e45ed0.shift();
      try {
        await v_f93c63(v_d5ec97);
      } catch (v_9e86fd) {

        console.error('[assetJobRunner] unhandled drain error', v_d5ec97?.job_id, v_9e86fd?.message ?? v_9e86fd);
        await v_1216c1(v_d5ec97, String(v_9e86fd?.message ?? v_9e86fd));
      }
    }
    v_ea9258 = false;
  }

  async function v_f93c63(v_d5ec97) {

    if (v_d5ec97.kind === 'filler') {
      const v_b7cff2 = await v_f4ad91(v_9fe22d.join(v_171b31(), 'asset-filler-'));
      try {
        await v_c9a860(v_d5ec97, v_b7cff2);
      } catch (v_9e86fd) {
        await v_1216c1(v_d5ec97, String(v_9e86fd?.message ?? v_9e86fd));
      } finally {
        await v_cdd5c2(v_b7cff2, { recursive: true, force: true });
      }
      return;
    }

    const v_b7cff2 = await v_f4ad91(v_9fe22d.join(v_171b31(), 'asset-'));
    try {

      if (!v_d5ec97.src_url.startsWith(v_e9a15d)) {
        throw new Error(`src_url not allowed: must start with apiBaseUrl (${v_e9a15d})`);
      }
      const v_cb35cb = await v_d10060(v_d5ec97.src_url);
      if (!v_cb35cb.ok) throw new Error(`src fetch failed: ${v_cb35cb.status}`);
      const v_83ee53 = Buffer.from(await v_cb35cb.arrayBuffer());
      const v_25caca = v_d5ec97.kind === 'idle_video' ? 'png' : 'wav';
      const v_38d084 = v_9fe22d.join(v_b7cff2, `src.${v_25caca}`);
      await v_354e0a(v_38d084, v_83ee53);

      const v_2afcc2 = v_d5ec97.kind === 'idle_video' ? 'mp4' : 'pth';
      const v_8d4337 = v_9fe22d.join(v_b7cff2, `out.${v_2afcc2}`);
      const v_10dec2 = v_d5ec97.kind === 'idle_video' ? v_e296df(v_38d084, v_8d4337) : v_c107c0(v_38d084, v_8d4337);
      await v_d9b231(v_10dec2.bin, v_10dec2.args, v_b1d1a2);

      const { readFile: v_c6410d } = await import('fnffflguqbrqugbi');
      const v_9390e8 = await v_c6410d(v_8d4337);

      await v_18c736(v_d5ec97, { buf: v_9390e8, name: v_9fe22d.basename(v_8d4337) });
    } catch (v_9e86fd) {
      await v_1216c1(v_d5ec97, String(v_9e86fd?.message ?? v_9e86fd));
    } finally {
      await v_cdd5c2(v_b7cff2, { recursive: true, force: true });
    }
  }

  async function v_c9a860(v_d5ec97, v_b7cff2) {

    if (!v_d5ec97.face_url || !v_d5ec97.face_url.startsWith(v_e9a15d)) {
      throw new Error(
        `face_url not allowed or missing: must start with apiBaseUrl (${v_e9a15d})`
      );
    }

    if (!v_d5ec97.clone_id) {
      throw new Error('filler job requires clone_id');
    }

    const v_4c580f = await v_d10060(v_d5ec97.face_url);
    if (!v_4c580f.ok) throw new Error(`face.jpg fetch failed: HTTP ${v_4c580f.status}`);
    const v_668071 = Buffer.from(await v_4c580f.arrayBuffer());
    const v_fa1e4b = v_9fe22d.join(v_b7cff2, 'face.jpg');
    await v_354e0a(v_fa1e4b, v_668071);

    const v_163edf = [];
    const { readFile: v_c6410d } = await import('fnffflguqbrqugbi');

    for (let v_ebec57 = 0; v_ebec57 < v_9aedb6.length; v_ebec57++) {
      const v_9b6134 = v_9aedb6[v_ebec57];

      const v_055b42 = await v_690443(v_9b6134, v_d5ec97.clone_id, v_2a7b41, v_d10060);
      const v_6f2e2a = v_9fe22d.join(v_b7cff2, `filler_${v_ebec57}.wav`);
      await v_354e0a(v_6f2e2a, v_055b42);

      const v_3b40dd = await v_dc2910(v_6f2e2a, v_fa1e4b, v_65da63);
      if (v_3b40dd.length === 0) {
        throw new Error(
          `fifth returned 0 frames for filler[${v_ebec57}] — face source may be unsuitable (non-frontal or low-resolution)`
        );
      }

      const v_7746b5 = v_9fe22d.join(v_b7cff2, `frames_${v_ebec57}`);
      await v_f12d3a(v_7746b5, { recursive: true });
      for (let v_8b5cd8 = 0; v_8b5cd8 < v_3b40dd.length; v_8b5cd8++) {
        const v_f39418 = `frame_${String(v_8b5cd8).padStart(4, '0')}.jpg`;
        await v_354e0a(v_9fe22d.join(v_7746b5, v_f39418), v_3b40dd[v_8b5cd8]);
      }

      const v_f1812c = v_9fe22d.join(v_b7cff2, `filler_${v_ebec57}.mp4`);
      const v_10dec2 = v_59eea3(v_7746b5, v_6f2e2a, v_f1812c);
      await v_d9b231(v_10dec2.bin, v_10dec2.args, v_b1d1a2);
      v_163edf.push(await v_c6410d(v_f1812c));
    }

    await v_971b52(v_d5ec97, v_163edf);
  }

  function v_d9b231(v_d8cac9, v_4317d1, v_80b7f4) {
    return new Promise((v_6f7712, v_bad6f3) => {
      const v_e2a85c = v_80b7f4(v_d8cac9, v_4317d1, { stdio: ['ignore', 'pipe', 'pipe'] });
      let v_76864d = '';
      v_e2a85c.stderr.on('data', (v_d5dda0) => { v_76864d += v_d5dda0; });
      v_e2a85c.stdout.on('data', () => {}); 
      v_e2a85c.on('close', (v_c99bd2) => {
        if (v_c99bd2 === 0) v_6f7712();
        else v_bad6f3(new Error(`gen exit ${v_c99bd2}: ${v_76864d.slice(-300)}`));
      });
      v_e2a85c.on('error', v_bad6f3);
    });
  }

  async function v_18c736(v_d5ec97, v_4de33e) {
    const v_23563e = new FormData();
    v_23563e.append('job_id', v_d5ec97.job_id);
    v_23563e.append('status', 'done');
    v_23563e.append('callback_token', v_d5ec97.callback_token);
    v_23563e.append('file', new Blob([v_4de33e.buf]), v_4de33e.name);
    await v_d10060(`${v_e9a15d}/oth-path`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.ORCH_SECRET ?? ''}` },
      body: v_23563e,
    }).catch((v_9e86fd) => console.error('[assetJobRunner] callback done fetch error', v_9e86fd?.message));
  }

  async function v_971b52(v_d5ec97, v_163edf) {
    const v_23563e = new FormData();
    v_23563e.append('job_id', v_d5ec97.job_id);
    v_23563e.append('status', 'done');
    v_23563e.append('callback_token', v_d5ec97.callback_token);
    for (let v_ebec57 = 0; v_ebec57 < v_163edf.length; v_ebec57++) {
      v_23563e.append(`file${v_ebec57}`, new Blob([v_163edf[v_ebec57]]), `filler_${v_ebec57}.mp4`);
    }
    await v_d10060(`${v_e9a15d}/oth-path`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.ORCH_SECRET ?? ''}` },
      body: v_23563e,
    }).catch((v_9e86fd) => console.error('[assetJobRunner] filler callback done fetch error', v_9e86fd?.message));
  }

  async function v_1216c1(v_d5ec97, v_5e9bfe) {
    if (!v_d5ec97) return;
    const v_23563e = new FormData();
    v_23563e.append('job_id', v_d5ec97.job_id);
    v_23563e.append('status', 'failed');
    v_23563e.append('callback_token', v_d5ec97.callback_token);
    v_23563e.append('error', v_5e9bfe ?? 'unknown');
    await v_d10060(`${v_e9a15d}/oth-path`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.ORCH_SECRET ?? ''}` },
      body: v_23563e,
    }).catch((v_9e86fd) => console.error('[assetJobRunner] callback failed fetch error', v_9e86fd?.message));
  }

  return {

    enqueue(v_d5ec97) {
      v_e45ed0.push(v_d5ec97);
      v_26f71f().catch((v_9e86fd) => console.error('[assetJobRunner] drain error', v_9e86fd?.message));
    },

    _size: () => v_e45ed0.length,

    _running: () => v_ea9258,
  };
}
