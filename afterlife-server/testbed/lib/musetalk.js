

import http from 'node:http';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

const MUSETALK_URL_RAW = process.env.MUSETALK_URL ?? 'http://127.0.0.1:8300';
const MUSETALK_TIMEOUT_MS = Number.parseInt(process.env.MUSETALK_TIMEOUT_MS ?? '600000', 10);

const MUSETALK_INPUT_DIR = process.env.MUSETALK_INPUT_DIR ?? tmpdir();

const u = new URL(MUSETALK_URL_RAW);
const HOST = u.hostname;
const PORT = u.port ? Number.parseInt(u.port, 10) : 80;

export async function concatWavs(wavBuffers) {
  if (!Array.isArray(wavBuffers) || wavBuffers.length === 0) return null;

  await fs.mkdir(MUSETALK_INPUT_DIR, { recursive: true }).catch(() => {});
  const dir = await fs.mkdtemp(path.join(MUSETALK_INPUT_DIR, 'mt-'));

  if (wavBuffers.length === 1) {
    const out = path.join(dir, 'concat.wav');
    await fs.writeFile(out, wavBuffers[0]);
    return { path: out, dir };
  }

  const listPath = path.join(dir, 'list.txt');
  const lines = [];
  for (let i = 0; i < wavBuffers.length; i++) {
    const fp = path.join(dir, `${i}.wav`);
    await fs.writeFile(fp, wavBuffers[i]);

    lines.push(`file '${fp.replaceAll("'", "'\\''")}'`);
  }
  await fs.writeFile(listPath, lines.join('\n') + '\n');

  const out = path.join(dir, 'concat.wav');

  const ok = await runFfmpeg([
    '-y', '-loglevel', 'error',
    '-f', 'concat', '-safe', '0',
    '-i', listPath,
    '-c', 'copy',
    out,
  ]).catch(() => false);

  if (ok === false) {
    await runFfmpeg([
      '-y', '-loglevel', 'error',
      '-f', 'concat', '-safe', '0',
      '-i', listPath,
      '-c:a', 'pcm_s16le',
      '-ar', '24000',
      out,
    ]);
  }

  return { path: out, dir };
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const ff = spawn('ffmpeg', args);
    let stderr = '';
    ff.stderr.on('data', (c) => (stderr += c.toString()));
    ff.on('error', reject);
    ff.on('close', (code) => {
      if (code === 0) resolve(true);
      else reject(new Error(`ffmpeg ${code}: ${stderr.slice(-300)}`));
    });
  });
}

export async function cleanupTempDir(dir) {
  if (!dir) return;
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch {

  }
}

export function museTalkInfer({ audio_path, video_path, output_id }) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      audio_path,
      ...(video_path ? { video_path } : {}),
      output_id,
    });

    const req = http.request(
      {
        hostname: HOST,
        port: PORT,
        path: '/infer',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          Connection: 'close',
        },
      },
      (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          if (res.statusCode !== 200) {
            return reject(new Error(`musetalk ${res.statusCode}: ${data.slice(0, 300)}`));
          }
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`musetalk parse: ${e?.message ?? e}`));
          }
        });
        res.on('error', reject);
      }
    );

    req.on('error', reject);
    req.setTimeout(MUSETALK_TIMEOUT_MS, () => {
      req.destroy(new Error(`musetalk timeout ${MUSETALK_TIMEOUT_MS}ms`));
    });
    req.write(body);
    req.end();
  });
}

export function mp4PathToUrl(mp4Path) {
  const base = path.basename(mp4Path);
  return `/outputs/${base}`;
}
