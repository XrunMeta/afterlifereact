

import { spawn } from 'node:child_process';
import { writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

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

export function createAssetJobRunner({
  apiBaseUrl,
  genIdleCmd = defaultGenIdleCmd,
  extractSeCmd = defaultExtractSeCmd,
  fetchImpl = fetch,
  spawnImpl = spawn,
} = {}) {

  const queue = [];
  let running = false;

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
