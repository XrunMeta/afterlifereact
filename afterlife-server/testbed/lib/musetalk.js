

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

const TTS_TRIM_SILENCE = (process.env.TTS_TRIM_SILENCE ?? '1') === '1';
const TTS_TRIM_THRESHOLD = process.env.TTS_TRIM_THRESHOLD ?? '-40dB'; 
const TTS_TRIM_KEEP = process.env.TTS_TRIM_KEEP ?? '0.12'; 

async function trimTrailingSilence(inPath, outPath) {
  const filter =
    `areverse,silenceremove=start_periods=1:start_duration=0:` +
    `start_threshold=${TTS_TRIM_THRESHOLD}:start_silence=${TTS_TRIM_KEEP},areverse`;
  return runFfmpeg([
    '-y', '-loglevel', 'error', '-nostdin',
    '-i', inPath,
    '-af', filter,
    '-ar', '24000', '-c:a', 'pcm_s16le',
    outPath,
  ]).catch(() => false);
}

export async function concatWavs(wavBuffers, name = 'concat') {
  if (!Array.isArray(wavBuffers) || wavBuffers.length === 0) return null;

  await fs.mkdir(MUSETALK_INPUT_DIR, { recursive: true }).catch(() => {});
  const dir = await fs.mkdtemp(path.join(MUSETALK_INPUT_DIR, 'mt-'));

  const safeName = String(name).replace(/[^A-Za-z0-9_-]/g, '') || 'concat';

  const materialize = async (buf, i) => {
    const raw = path.join(dir, `raw_${i}.wav`);
    await fs.writeFile(raw, buf);
    if (!TTS_TRIM_SILENCE) return raw;
    const trimmed = path.join(dir, `${i}.wav`);
    const ok = await trimTrailingSilence(raw, trimmed);
    return ok === false ? raw : trimmed;
  };

  if (wavBuffers.length === 1) {
    const src = await materialize(wavBuffers[0], 0);
    const out = path.join(dir, `${safeName}.wav`);

    await fs.copyFile(src, out);
    return { path: out, dir };
  }

  const listPath = path.join(dir, 'list.txt');
  const lines = [];
  for (let i = 0; i < wavBuffers.length; i++) {
    const fp = await materialize(wavBuffers[i], i);

    lines.push(`file '${fp.replaceAll("'", "'\\''")}'`);
  }
  await fs.writeFile(listPath, lines.join('\n') + '\n');

  const out = path.join(dir, `${safeName}.wav`);

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

export function museTalkInfer({ audio_path, video_path, output_id, stream, host, port }) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      audio_path,
      ...(video_path ? { video_path } : {}),
      output_id,
      ...(stream ? { stream: true } : {}),
    });

    const req = http.request(
      {

        hostname: host ?? HOST,
        port: port ?? PORT,
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

let _photoStillCounter = 0;

export async function ensurePhotoStill({ photoPath, outPath }) {

  try {
    await fs.access(outPath);
    return outPath; 
  } catch {

  }

  await fs.mkdir(path.dirname(outPath), { recursive: true });

  const token = `${process.pid}.${++_photoStillCounter}`;
  const tmpPath = `${outPath}.${token}.tmp.mp4`;

  try {

    await runFfmpeg([
      '-y', '-loglevel', 'error',
      '-loop', '1',
      '-i', photoPath,
      '-t', '2',
      '-r', '25',
      '-pix_fmt', 'yuv420p',
      '-vf', 'scale=256:256:force_original_aspect_ratio=decrease,pad=256:256:(ow-iw)/2:(oh-ih)/2',
      tmpPath,
    ]);
  } catch (err) {

    await fs.unlink(tmpPath).catch(() => {});
    console.warn('[ensurePhotoStill] ffmpeg 실패(graceful):', err?.message ?? err);
    return null;
  }

  try {
    await fs.access(outPath);

    await fs.unlink(tmpPath).catch(() => {});
    return outPath;
  } catch {

  }

  await fs.rename(tmpPath, outPath);
  return outPath;
}

export function mp4PathToUrl(mp4Path) {
  const base = path.basename(mp4Path);
  return `/outputs/${base}`;
}
