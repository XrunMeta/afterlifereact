

import { spawn } from 'node:child_process';
import { writeFile, mkdtemp, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

export const FILLER_TEXTS = [
  '음... 그러니까...',
  '아, 잠깐만요... 어디 보자.',
  '음, 그게 말이죠...',
];

const LP_BASE = '/home/afterlife/afterlife-server';
const GEN_IDLE_SH = `${LP_BASE}/musepose-afterlife/afterlife/gen_idle_asset.sh`;
const OPENVOICE_PY = '/home/afterlife/miniconda3/envs/openvoice/bin/python';
const AFL_EXTRACT_SE_IO = `${LP_BASE}/openvoice-afterlife/scripts/afl_extract_se_io.py`;

export function defaultGenIdleCmd(src, out) {
  return { bin: 'bash', args: [GEN_IDLE_SH, src, out] };
}

export function defaultExtractSeCmd(src, out) {
  return { bin: OPENVOICE_PY, args: [AFL_EXTRACT_SE_IO, src, out] };
}

export function defaultFfmpegMuxCmd(framesDir, wavPath, outPath) {
  return {
    bin: 'ffmpeg',
    args: [
      '-y',
      '-framerate', '25',
      '-i', path.join(framesDir, 'frame_%04d.jpg'),
      '-i', wavPath,
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-shortest',
      outPath,
    ],
  };
}

export async function defaultQwenTts(text, cloneId, ttsUrl, fetchFn) {
  const r = await fetchFn(`${ttsUrl}/tts/kr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, clone_id: String(cloneId) }),
  });
  if (!r.ok) {
    const errText = await r.text().catch(() => '');
    throw new Error(`qwen3tts /tts/kr failed: HTTP ${r.status} — ${errText.slice(0, 200)}`);
  }
  return Buffer.from(await r.arrayBuffer());
}

export async function defaultFifthRender(wavPath, facePath, renderUrl) {
  const { default: http } = await import('node:http');
  const { default: https } = await import('node:https');

  return new Promise((resolve, reject) => {
    let u;
    try { u = new URL(renderUrl); } catch {
      return reject(new Error(`invalid fifthRenderUrl: ${renderUrl}`));
    }
    const mod = u.protocol === 'https:' ? https : http;
    const bodyBuf = Buffer.from(JSON.stringify({ wav_path: wavPath, video_path: facePath }));

    const req = mod.request(
      {
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: '/render',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': bodyBuf.length,
        },
        timeout: 120000,
      },
      (res) => {
        if (res.statusCode !== 200) {
          let errText = '';
          res.on('data', (c) => { errText += c.toString(); });
          res.on('end', () =>
            reject(new Error(`fifth /render HTTP ${res.statusCode}: ${errText.slice(0, 200)}`))
          );
          res.resume();
          return;
        }
        const frames = [];
        let buf = Buffer.alloc(0);
        let done = false;
        res.on('data', (chunk) => {
          buf = Buffer.concat([buf, chunk]);
          while (!done && buf.length >= 4) {
            const len = buf.readUInt32BE(0);
            if (len === 0) { done = true; break; }
            if (buf.length < 4 + len) break;
            frames.push(buf.slice(4, 4 + len));
            buf = buf.slice(4 + len);
          }
        });
        res.on('end', () => {
          if (!done) {
            return reject(new Error('fifth render stream ended without terminator'));
          }
          if (buf.length > 0) {
            return reject(
              new Error(
                `fifth render stream ended with ${buf.length} bytes residual (incomplete frame)`
              )
            );
          }
          resolve(frames);
        });
        res.on('error', reject);
      }
    );
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('fifth /render timeout')); });
    req.write(bodyBuf);
    req.end();
  });
}

export function createAssetJobRunner({
  apiBaseUrl,
  genIdleCmd = defaultGenIdleCmd,
  extractSeCmd = defaultExtractSeCmd,
  fetchImpl = fetch,
  spawnImpl = spawn,

  qwenTtsUrl = process.env.QWEN_TTS_URL ?? 'http://127.0.0.1:8201',
  fifthRenderUrl = process.env.FIFTH_RENDER_URL ?? 'http://127.0.0.1:8810',
  ffmpegMuxCmd = defaultFfmpegMuxCmd,
  _qwenTtsFn = null,    
  _fifthRenderFn = null, 
} = {}) {

  const queue = [];
  let running = false;

  const qwenTtsFn = _qwenTtsFn ?? ((text, cloneId, url, fetchFn) => defaultQwenTts(text, cloneId, url, fetchFn));
  const fifthRenderFn = _fifthRenderFn ?? ((wavPath, facePath, url) => defaultFifthRender(wavPath, facePath, url));

  async function drain() {
    if (running) return;
    running = true;
    while (queue.length) {
      const job = queue.shift();
      try {
        await process1(job);
      } catch (e) {

        console.error('[assetJobRunner] unhandled drain error', job?.job_id, e?.message ?? e);
        await callbackFailed(job, String(e?.message ?? e));
      }
    }
    running = false;
  }

  async function process1(job) {

    if (job.kind === 'filler') {
      const dir = await mkdtemp(path.join(tmpdir(), 'asset-filler-'));
      try {
        await processFillerJob(job, dir);
      } catch (e) {
        await callbackFailed(job, String(e?.message ?? e));
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
      return;
    }

    const dir = await mkdtemp(path.join(tmpdir(), 'asset-'));
    try {

      if (!job.src_url.startsWith(apiBaseUrl)) {
        throw new Error(`src_url not allowed: must start with apiBaseUrl (${apiBaseUrl})`);
      }
      const r = await fetchImpl(job.src_url);
      if (!r.ok) throw new Error(`src fetch failed: ${r.status}`);
      const buf = Buffer.from(await r.arrayBuffer());
      const srcExt = job.kind === 'idle_video' ? 'png' : 'wav';
      const src = path.join(dir, `src.${srcExt}`);
      await writeFile(src, buf);

      const outExt = job.kind === 'idle_video' ? 'mp4' : 'pth';
      const out = path.join(dir, `out.${outExt}`);
      const cmd = job.kind === 'idle_video' ? genIdleCmd(src, out) : extractSeCmd(src, out);
      await run(cmd.bin, cmd.args, spawnImpl);

      const { readFile } = await import('node:fs/promises');
      const data = await readFile(out);

      await callbackDone(job, { buf: data, name: path.basename(out) });
    } catch (e) {
      await callbackFailed(job, String(e?.message ?? e));
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }

  async function processFillerJob(job, dir) {

    if (!job.face_url || !job.face_url.startsWith(apiBaseUrl)) {
      throw new Error(
        `face_url not allowed or missing: must start with apiBaseUrl (${apiBaseUrl})`
      );
    }

    if (!job.clone_id) {
      throw new Error('filler job requires clone_id');
    }

    const rFace = await fetchImpl(job.face_url);
    if (!rFace.ok) throw new Error(`face.jpg fetch failed: HTTP ${rFace.status}`);
    const faceBuf = Buffer.from(await rFace.arrayBuffer());
    const faceJpgPath = path.join(dir, 'face.jpg');
    await writeFile(faceJpgPath, faceBuf);

    const mp4Bufs = [];
    const { readFile } = await import('node:fs/promises');

    for (let i = 0; i < FILLER_TEXTS.length; i++) {
      const text = FILLER_TEXTS[i];

      const wavBuf = await qwenTtsFn(text, job.clone_id, qwenTtsUrl, fetchImpl);
      const fillerWavPath = path.join(dir, `filler_${i}.wav`);
      await writeFile(fillerWavPath, wavBuf);

      const frames = await fifthRenderFn(fillerWavPath, faceJpgPath, fifthRenderUrl);
      if (frames.length === 0) {
        throw new Error(
          `fifth returned 0 frames for filler[${i}] — face source may be unsuitable (non-frontal or low-resolution)`
        );
      }

      const framesDir = path.join(dir, `frames_${i}`);
      await mkdir(framesDir, { recursive: true });
      for (let f = 0; f < frames.length; f++) {
        const fname = `frame_${String(f).padStart(4, '0')}.jpg`;
        await writeFile(path.join(framesDir, fname), frames[f]);
      }

      const mp4Path = path.join(dir, `filler_${i}.mp4`);
      const cmd = ffmpegMuxCmd(framesDir, fillerWavPath, mp4Path);
      await run(cmd.bin, cmd.args, spawnImpl);
      mp4Bufs.push(await readFile(mp4Path));
    }

    await callbackFillerDone(job, mp4Bufs);
  }

  function run(bin, args, spawnFn) {
    return new Promise((resolve, reject) => {
      const p = spawnFn(bin, args, { stdio: ['ignore', 'pipe', 'pipe'] });
      let errOut = '';
      p.stderr.on('data', (d) => { errOut += d; });
      p.stdout.on('data', () => {}); 
      p.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`gen exit ${code}: ${errOut.slice(-300)}`));
      });
      p.on('error', reject);
    });
  }

  async function callbackDone(job, file) {
    const fd = new FormData();
    fd.append('job_id', job.job_id);
    fd.append('status', 'done');
    fd.append('callback_token', job.callback_token);
    fd.append('file', new Blob([file.buf]), file.name);
    await fetchImpl(`${apiBaseUrl}/oth-path`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.ORCH_SECRET ?? ''}` },
      body: fd,
    }).catch((e) => console.error('[assetJobRunner] callback done fetch error', e?.message));
  }

  async function callbackFillerDone(job, mp4Bufs) {
    const fd = new FormData();
    fd.append('job_id', job.job_id);
    fd.append('status', 'done');
    fd.append('callback_token', job.callback_token);
    for (let i = 0; i < mp4Bufs.length; i++) {
      fd.append(`file${i}`, new Blob([mp4Bufs[i]]), `filler_${i}.mp4`);
    }
    await fetchImpl(`${apiBaseUrl}/oth-path`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.ORCH_SECRET ?? ''}` },
      body: fd,
    }).catch((e) => console.error('[assetJobRunner] filler callback done fetch error', e?.message));
  }

  async function callbackFailed(job, error) {
    if (!job) return;
    const fd = new FormData();
    fd.append('job_id', job.job_id);
    fd.append('status', 'failed');
    fd.append('callback_token', job.callback_token);
    fd.append('error', error ?? 'unknown');
    await fetchImpl(`${apiBaseUrl}/oth-path`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.ORCH_SECRET ?? ''}` },
      body: fd,
    }).catch((e) => console.error('[assetJobRunner] callback failed fetch error', e?.message));
  }

  return {

    enqueue(job) {
      queue.push(job);
      drain().catch((e) => console.error('[assetJobRunner] drain error', e?.message));
    },

    _size: () => queue.length,

    _running: () => running,
  };
}
