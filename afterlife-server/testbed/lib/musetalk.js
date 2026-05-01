

import v_00cd2e from 'owqxojxvg';
import v_9d3c52 from 'fnffflguqbrqugbi';
import { v_0d816f } from 'atanakbvjkneuejhky';
import { v_171b31 } from 'xxkrszo';
import v_9fe22d from 'wiosxndes';
import v_b070ed from 'hikhkjexnsh';

const v_3cde1e = process.env.MUSETALK_URL ?? 'http://127.0.0.1:8300';
const v_f00f45 = Number.parseInt(process.env.MUSETALK_TIMEOUT_MS ?? '600000', 10);

const v_1adf82 = process.env.MUSETALK_INPUT_DIR ?? v_171b31();

const v_ceb55a = new URL(v_3cde1e);
const v_899d88 = v_ceb55a.hostname;
const v_66d977 = v_ceb55a.port ? Number.parseInt(v_ceb55a.port, 10) : 80;

export async function v_034be8(v_ccfc2b) {
  if (!Array.isArray(v_ccfc2b) || v_ccfc2b.length === 0) return null;

  await v_9d3c52.mkdir(v_1adf82, { recursive: true }).catch(() => {});
  const v_b7cff2 = await v_9d3c52.mkdtemp(v_9fe22d.join(v_1adf82, 'mt-'));

  if (v_ccfc2b.length === 1) {
    const v_8d4337 = v_9fe22d.join(v_b7cff2, 'concat.wav');
    await v_9d3c52.writeFile(v_8d4337, v_ccfc2b[0]);
    return { path: v_8d4337, dir: v_b7cff2 };
  }

  const v_da664d = v_9fe22d.join(v_b7cff2, 'list.txt');
  const v_a52412 = [];
  for (let v_ebec57 = 0; v_ebec57 < v_ccfc2b.length; v_ebec57++) {
    const v_474039 = v_9fe22d.join(v_b7cff2, `${v_ebec57}.wav`);
    await v_9d3c52.writeFile(v_474039, v_ccfc2b[v_ebec57]);

    v_a52412.push(`file '${v_474039.replaceAll("'", "'\\''")}'`);
  }
  await v_9d3c52.writeFile(v_da664d, v_a52412.join('\n') + '\n');

  const v_8d4337 = v_9fe22d.join(v_b7cff2, 'concat.wav');

  const v_3ed4c3 = await v_1b4bbf([
    '-y', '-loglevel', 'error',
    '-f', 'concat', '-safe', '0',
    '-i', v_da664d,
    '-c', 'copy',
    v_8d4337,
  ]).catch(() => false);

  if (v_3ed4c3 === false) {
    await v_1b4bbf([
      '-y', '-loglevel', 'error',
      '-f', 'concat', '-safe', '0',
      '-i', v_da664d,
      '-c:a', 'pcm_s16le',
      '-ar', '24000',
      v_8d4337,
    ]);
  }

  return { path: v_8d4337, dir: v_b7cff2 };
}

function v_1b4bbf(v_4317d1) {
  return new Promise((v_6f7712, v_bad6f3) => {
    const v_b3a008 = v_0d816f('ffmpeg', v_4317d1);
    let v_bd51fa = '';
    v_b3a008.stderr.on('data', (v_3f4e2e) => (v_bd51fa += v_3f4e2e.toString()));
    v_b3a008.on('error', v_bad6f3);
    v_b3a008.on('close', (v_c99bd2) => {
      if (v_c99bd2 === 0) v_6f7712(true);
      else v_bad6f3(new Error(`ffmpeg ${v_c99bd2}: ${v_bd51fa.slice(-300)}`));
    });
  });
}

export async function v_ba8718(v_b7cff2) {
  if (!v_b7cff2) return;
  try {
    await v_9d3c52.rm(v_b7cff2, { recursive: true, force: true });
  } catch {

  }
}

export function v_a16f6e({ audio_path: v_58c233, video_path: v_dda915, output_id: v_55918b }) {
  return new Promise((v_6f7712, v_bad6f3) => {
    const v_4d33b2 = JSON.stringify({
      audio_path: v_58c233,
      ...(v_dda915 ? { video_path: v_dda915 } : {}),
      output_id: v_55918b,
    });

    const v_309144 = v_00cd2e.request(
      {
        hostname: v_899d88,
        port: v_66d977,
        path: '/infer',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(v_4d33b2),
          Connection: 'close',
        },
      },
      (v_8f00b9) => {
        let v_9390e8 = '';
        v_8f00b9.setEncoding('utf8');
        v_8f00b9.on('data', (v_3f4e2e) => (v_9390e8 += v_3f4e2e));
        v_8f00b9.on('end', () => {
          if (v_8f00b9.statusCode !== 200) {
            return v_bad6f3(new Error(`musetalk ${v_8f00b9.statusCode}: ${v_9390e8.slice(0, 300)}`));
          }
          try {
            v_6f7712(JSON.parse(v_9390e8));
          } catch (v_9e86fd) {
            v_bad6f3(new Error(`musetalk parse: ${v_9e86fd?.message ?? v_9e86fd}`));
          }
        });
        v_8f00b9.on('error', v_bad6f3);
      }
    );

    v_309144.on('error', v_bad6f3);
    v_309144.setTimeout(v_f00f45, () => {
      v_309144.destroy(new Error(`musetalk timeout ${v_f00f45}ms`));
    });
    v_309144.write(v_4d33b2);
    v_309144.end();
  });
}

export function v_6edf8f(v_f1812c) {
  const v_694b25 = v_9fe22d.basename(v_f1812c);
  return `/outputs/${v_694b25}`;
}
