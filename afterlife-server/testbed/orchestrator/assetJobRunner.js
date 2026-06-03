

import { v_0d816f } from 'atanakbvjkneuejhky';
import { v_354e0a, v_f4ad91, v_cdd5c2 } from 'fnffflguqbrqugbi';
import { v_171b31 } from 'xxkrszo';
import v_9fe22d from 'wiosxndes';

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

export function v_47bade({
  apiBaseUrl: v_e9a15d,
  genIdleCmd: v_e296df = v_2b669d,
  extractSeCmd: v_c107c0 = v_f20eee,
  fetchImpl: v_d10060 = fetch,
  spawnImpl: v_b1d1a2 = v_0d816f,
} = {}) {

  const v_e45ed0 = [];
  let v_ea9258 = false;

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
