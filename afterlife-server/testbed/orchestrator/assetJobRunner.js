

import { spawn } from 'node:child_process';
import { writeFile, mkdtemp, rm, mkdir, stat, rename } from 'node:fs/promises';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { suggestGuideMents as defaultSuggestGuideMents } from '../lib/guideMentSuggest.js';

export const FILLER_SPECS = [
  { text: '음..... 음... 음..', render_opts: { eyes_open_lock: true, source_face_lock: true, blink_interval_sec: 3.5, head_sway_amp: 0.0, head_yaw_offset: 0, head_pitch_offset: 0 } },
  { text: '음... 음.....', render_opts: { eyes_open_lock: true, source_face_lock: true, blink_interval_sec: 3.5, head_sway_amp: 0.0, head_yaw_offset: -12 } },
  { text: '으음... 음.....', render_opts: { eyes_open_lock: true, source_face_lock: true, blink_interval_sec: 3.5, head_sway_amp: 0.4, head_yaw_offset: 12 } },
  { text: '음..... 음...', render_opts: { eyes_open_lock: true, source_face_lock: true, blink_interval_sec: 3.5, head_sway_amp: 0.4, head_pitch_offset: 8 } }, 
  { text: '음... 으음...', render_opts: { eyes_open_lock: true, source_face_lock: true, blink_interval_sec: 3.5, head_sway_amp: 0.0, head_pitch_offset: -8 } }, 
  { text: '흠.....', atempo: 0.55, render_opts: { eyes_open_lock: true, source_face_lock: true, blink_interval_sec: 3.5, head_sway_amp: 0.2 } }, 
];

export const FILLER_TEXTS = FILLER_SPECS.map((s) => s.text);

const LP_BASE = '/home/afterlife/afterlife-server';

const VOICE_REF_ROOT = '/home/afterlife/afterlife-server/openvoice-afterlife/reference_voices';

const _MIN_WAV_BYTES = 1024;

export const _MAX_VOICE_WAV_BYTES = 50 * 1024 * 1024; 
const GEN_IDLE_SH = `${LP_BASE}/musepose-afterlife/afterlife/gen_idle_asset.sh`;
const OPENVOICE_PY = '/home/afterlife/miniconda3/envs/openvoice/bin/python';
const AFL_EXTRACT_SE_IO = `${LP_BASE}/openvoice-afterlife/scripts/afl_extract_se_io.py`;

export function defaultGenIdleCmd(src, out) {
  return { bin: 'bash', args: [GEN_IDLE_SH, src, out] };
}

export function defaultExtractSeCmd(src, out) {
  return { bin: OPENVOICE_PY, args: [AFL_EXTRACT_SE_IO, src, out] };
}

export const FILLER_TARGET_DUR_SEC = [6.0, 6.5, 7.0, 7.5, 8.0, 8.5];

const FILLER_LEAD_SILENCE_MS = 600;

export const FILLER_VOLUME = 0.3;

const FILLER_MUX_VOLUME_DB = -20;

export function defaultFfmpegPadCmd(inWav, outWav, wholeDurSec, atempo) {
  const pre = atempo ? `atempo=${atempo},` : '';
  return {
    bin: 'ffmpeg',
    args: [
      '-y',
      '-i', inWav,
      '-af', `${pre}volume=${FILLER_VOLUME},adelay=${FILLER_LEAD_SILENCE_MS}:all=1,apad=whole_dur=${wholeDurSec}`,
      outWav,
    ],
  };
}

export function defaultFfmpegMuxCmd(framesDir, wavPath, outPath, audioVolumeDb = null) {
  const af = audioVolumeDb != null ? ['-af', `volume=${audioVolumeDb}dB`] : [];
  return {
    bin: 'ffmpeg',
    args: [
      '-y',
      '-framerate', '25',
      '-i', path.join(framesDir, 'frame_%04d.jpg'),
      '-i', wavPath,
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      ...af,
      '-c:a', 'aac',
      '-shortest',
      outPath,
    ],
  };
}

export async function defaultEnsureVoiceWav(cloneId, voiceRawUrl, refRoot, fetchFn, spawnFn) {

  const cloneIdStr = String(cloneId);
  if (!/^\d+$/.test(cloneIdStr) || Number(cloneIdStr) <= 0) {
    throw new Error(`clone_id 가 양의 정수가 아닙니다 (path traversal 방지): "${cloneId}"`);
  }

  const cloneDir = join(refRoot, cloneIdStr);
  const dest = join(cloneDir, 'voice.wav');

  if (existsSync(dest)) return;

  mkdirSync(cloneDir, { recursive: true });
  const uid = Math.random().toString(36).slice(2);
  const srcTmp = join(cloneDir, `voice.${uid}.src`);
  const wavTmp = join(cloneDir, `voice.${uid}.wav.part`);

  try {

    const r = await fetchFn(voiceRawUrl);
    if (!r.ok) throw new Error(`voice_raw_url fetch failed: HTTP ${r.status}`);

    const _cl = parseInt(r.headers?.get?.('content-length') ?? '-1', 10);
    if (!isNaN(_cl) && _cl >= 0 && _cl > _MAX_VOICE_WAV_BYTES) {
      throw new Error(
        `voiceRawUrl Content-Length ${_cl} 초과 상한 ${_MAX_VOICE_WAV_BYTES} (OOM 방지)`
      );
    }

    const buf = Buffer.from(await r.arrayBuffer());
    await writeFile(srcTmp, buf);

    await new Promise((resolve, reject) => {
      const p = spawnFn('ffmpeg', ['-y', '-i', srcTmp, '-ac', '1', '-f', 'wav', wavTmp], {
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 60000, 
      });
      let errOut = '';
      p.stderr.on('data', (d) => { errOut += d; });
      p.stdout.on('data', () => {});
      p.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`voice.wav ffmpeg 변환 실패 (rc=${code}): ${errOut.slice(-300)}`));
      });
      p.on('error', reject);
    });

    const info = await stat(wavTmp);
    if (info.size < _MIN_WAV_BYTES) {
      throw new Error(
        `변환 결과 wav가 너무 작음(${info.size}B < ${_MIN_WAV_BYTES}) — 손상 wav 방지 (clone=${cloneId})`
      );
    }

    await rename(wavTmp, dest);
  } finally {

    for (const p of [srcTmp, wavTmp]) {
      try { await rm(p, { force: true }); } catch {}
    }
  }
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

export async function defaultFifthRender(wavPath, facePath, renderUrl, renderOpts = null) {
  const { default: http } = await import('node:http');
  const { default: https } = await import('node:https');

  return new Promise((resolve, reject) => {
    let u;
    try { u = new URL(renderUrl); } catch {
      return reject(new Error(`invalid fifthRenderUrl: ${renderUrl}`));
    }
    const mod = u.protocol === 'https:' ? https : http;

    const bodyObj = { wav_path: wavPath, video_path: facePath };
    if (renderOpts && typeof renderOpts === 'object') Object.assign(bodyObj, renderOpts);
    const bodyBuf = Buffer.from(JSON.stringify(bodyObj));

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

        const TOK_MAGIC = Buffer.from('TOK:');
        let buf = Buffer.alloc(0);
        let done = false;
        res.on('data', (chunk) => {
          buf = Buffer.concat([buf, chunk]);
          while (!done && buf.length >= 4) {
            const len = buf.readUInt32BE(0);

            if (len === 0) { done = true; buf = buf.slice(4); break; }
            if (buf.length < 4 + len) break;
            const payload = buf.slice(4, 4 + len);
            if (!(payload.length >= TOK_MAGIC.length && payload.slice(0, TOK_MAGIC.length).equals(TOK_MAGIC))) {
              frames.push(payload);
            }
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
  ffmpegPadCmd = defaultFfmpegPadCmd,
  _qwenTtsFn = null,    
  _fifthRenderFn = null, 

  voiceRefRoot = VOICE_REF_ROOT,
  _ensureVoiceWavFn = null, 

  suggestGuideMentsFn = defaultSuggestGuideMents, 
} = {}) {

  const queue = [];
  let running = false;

  const qwenTtsFn = _qwenTtsFn ?? ((text, cloneId, url, fetchFn) => defaultQwenTts(text, cloneId, url, fetchFn));
  const fifthRenderFn = _fifthRenderFn ?? ((wavPath, facePath, url, renderOpts) => defaultFifthRender(wavPath, facePath, url, renderOpts));
  const ensureVoiceWavFn = _ensureVoiceWavFn ?? defaultEnsureVoiceWav;

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

    if (job.kind === 'guide') {
      const dir = await mkdtemp(path.join(tmpdir(), 'asset-guide-'));
      try {
        await processGuideJob(job, dir);
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

    if (!apiBaseUrl) {
      throw new Error('apiBaseUrl 미설정 — SSRF 방어 무력화 방지: filler 잡 거부 (H-1)');
    }

    const _ssrfPrefix = apiBaseUrl.endsWith('/') ? apiBaseUrl : apiBaseUrl + '/';

    if (!job.face_url || !job.face_url.startsWith(_ssrfPrefix)) {
      throw new Error(
        `face_url not allowed or missing: must start with apiBaseUrl prefix (${_ssrfPrefix})`
      );
    }

    if (!job.clone_id) {
      throw new Error('filler job requires clone_id');
    }

    if (!job.voice_raw_url || !job.voice_raw_url.startsWith(_ssrfPrefix)) {
      throw new Error(
        `voice_raw_url not allowed or missing: must start with apiBaseUrl prefix (${_ssrfPrefix})`
      );
    }
    await ensureVoiceWavFn(job.clone_id, job.voice_raw_url, voiceRefRoot, fetchImpl, spawnImpl);

    const rFace = await fetchImpl(job.face_url);
    if (!rFace.ok) throw new Error(`face.jpg fetch failed: HTTP ${rFace.status}`);
    const faceBuf = Buffer.from(await rFace.arrayBuffer());
    const faceJpgPath = path.join(dir, 'face.jpg');
    await writeFile(faceJpgPath, faceBuf);

    const mp4Bufs = [];
    const { readFile } = await import('node:fs/promises');

    for (let i = 0; i < FILLER_SPECS.length; i++) {
      const spec = FILLER_SPECS[i];

      const wavBuf = await qwenTtsFn(spec.text, job.clone_id, qwenTtsUrl, fetchImpl);
      const rawWavPath = path.join(dir, `filler_${i}_raw.wav`);
      await writeFile(rawWavPath, wavBuf);

      const fillerWavPath = path.join(dir, `filler_${i}.wav`);
      const targetDur = Math.max(6, FILLER_TARGET_DUR_SEC[i] ?? 6.5);
      const padCmd = ffmpegPadCmd(rawWavPath, fillerWavPath, targetDur, spec.atempo);
      await run(padCmd.bin, padCmd.args, spawnImpl);

      const frames = await fifthRenderFn(fillerWavPath, faceJpgPath, fifthRenderUrl, spec.render_opts);
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
      const cmd = ffmpegMuxCmd(framesDir, fillerWavPath, mp4Path, FILLER_MUX_VOLUME_DB);
      await run(cmd.bin, cmd.args, spawnImpl);
      mp4Bufs.push(await readFile(mp4Path));
    }

    await callbackFillerDone(job, mp4Bufs);
  }

  async function processGuideJob(job, dir) {

    if (!apiBaseUrl) {
      throw new Error('apiBaseUrl 미설정 — SSRF 방어 무력화 방지: guide 잡 거부 (H-1)');
    }

    const _ssrfPrefix = apiBaseUrl.endsWith('/') ? apiBaseUrl : apiBaseUrl + '/';

    if (!job.face_url || !job.face_url.startsWith(_ssrfPrefix)) {
      throw new Error(
        `face_url not allowed or missing: must start with apiBaseUrl prefix (${_ssrfPrefix})`
      );
    }

    if (!job.clone_id) {
      throw new Error('guide job requires clone_id');
    }

    if (!job.voice_raw_url || !job.voice_raw_url.startsWith(_ssrfPrefix)) {
      throw new Error(
        `voice_raw_url not allowed or missing: must start with apiBaseUrl prefix (${_ssrfPrefix})`
      );
    }
    await ensureVoiceWavFn(job.clone_id, job.voice_raw_url, voiceRefRoot, fetchImpl, spawnImpl);

    const rFace = await fetchImpl(job.face_url);
    if (!rFace.ok) throw new Error(`face.jpg fetch failed: HTTP ${rFace.status}`);
    const faceBuf = Buffer.from(await rFace.arrayBuffer());
    const faceJpgPath = path.join(dir, 'face.jpg');
    await writeFile(faceJpgPath, faceBuf);

    const personaFlat = job.persona ? (job.persona.l1 || {}) : {};
    const ments = await suggestGuideMentsFn({ persona: personaFlat });

    const mp4Bufs = [];
    const { readFile } = await import('node:fs/promises');

    for (let i = 0; i < ments.length; i++) {
      const ment = ments[i];

      const wavBuf = await qwenTtsFn(ment, job.clone_id, qwenTtsUrl, fetchImpl);
      const wavPath = path.join(dir, `guide_${i}.wav`);
      await writeFile(wavPath, wavBuf);

      const frames = await fifthRenderFn(wavPath, faceJpgPath, fifthRenderUrl);
      if (frames.length === 0) {
        throw new Error(
          `fifth returned 0 frames for guide[${i}] — face source may be unsuitable (non-frontal or low-resolution)`
        );
      }

      const framesDir = path.join(dir, `frames_${i}`);
      await mkdir(framesDir, { recursive: true });
      for (let f = 0; f < frames.length; f++) {
        const fname = `frame_${String(f).padStart(4, '0')}.jpg`;
        await writeFile(path.join(framesDir, fname), frames[f]);
      }

      const mp4Path = path.join(dir, `guide_${i}.mp4`);
      const cmd = ffmpegMuxCmd(framesDir, wavPath, mp4Path);
      await run(cmd.bin, cmd.args, spawnImpl);
      mp4Bufs.push(await readFile(mp4Path));
    }

    await callbackGuideDone(job, mp4Bufs);
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
    }).then(async (r) => {

      const body = typeof r?.text === 'function' ? await r.text().catch(() => '') : '';
      if (r?.ok) {
        console.log('[assetJobRunner] filler callback done ok', job.job_id, r.status, body.slice(0, 120));
      } else {
        console.error('[assetJobRunner] filler callback done non-ok', job.job_id, r?.status, body.slice(0, 200));
      }
    }).catch((e) => console.error('[assetJobRunner] filler callback done fetch error', e?.message));
  }

  async function callbackGuideDone(job, mp4Bufs) {
    const fd = new FormData();
    fd.append('job_id', job.job_id);
    fd.append('status', 'done');
    fd.append('callback_token', job.callback_token);
    for (let i = 0; i < mp4Bufs.length; i++) {
      fd.append(`file${i}`, new Blob([mp4Bufs[i]]), `guide_${i}.mp4`);
    }
    await fetchImpl(`${apiBaseUrl}/oth-path`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.ORCH_SECRET ?? ''}` },
      body: fd,
    }).then(async (r) => {

      const body = typeof r?.text === 'function' ? await r.text().catch(() => '') : '';
      if (r?.ok) {
        console.log('[assetJobRunner] guide callback done ok', job.job_id, r.status, body.slice(0, 120));
      } else {
        console.error('[assetJobRunner] guide callback done non-ok', job.job_id, r?.status, body.slice(0, 200));
      }
    }).catch((e) => console.error('[assetJobRunner] guide callback done fetch error', e?.message));
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
