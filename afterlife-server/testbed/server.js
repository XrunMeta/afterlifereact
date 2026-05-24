import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';

import { buildSystemPrompt, loadPersona } from './lib/prompt.js';
import { chatStream } from './lib/ollama.js';
import { createSentenceBuffer } from './lib/sentence_buffer.js';
import { ttsSynthesize } from './lib/tts.js';
import { stripEmoji, sanitizeChunk } from './lib/sanitize.js';
import {
  concatWavs,
  cleanupTempDir,
  museTalkInfer,
  mp4PathToUrl,
} from './lib/musetalk.js';
import crypto from 'node:crypto';
import fsp from 'node:fs/promises';

const TTS_ENABLED = (process.env.TTS_ENABLED ?? '1') !== '0';
const MUSETALK_ENABLED = (process.env.MUSETALK_ENABLED ?? '1') !== '0';

const MUSETALK_STREAM_MODE = (process.env.MUSETALK_STREAM_MODE ?? '0') === '1';

const REALTIME_AUDIO_STREAM =
  (process.env.REALTIME_AUDIO_STREAM ?? '1') === '1';
const MUSETALK_OUTPUTS_DIR =
  process.env.MUSETALK_OUTPUTS_DIR ??
  '/home/afterlife/afterlife-server/musetalk-afterlife/outputs/v15';

const REALTIME_PUBLISHER_URL =
  process.env.REALTIME_PUBLISHER_URL ?? 'http://127.0.0.1:8400';

const DEBUG_DUMP_GROUND_TRUTH =
  (process.env.DEBUG_DUMP_GROUND_TRUTH ?? '0') === '1';
const DEBUG_DUMP_DIR =
  process.env.DEBUG_DUMP_DIR ??
  '/home/afterlife/afterlife-server/testbed/debug-dump';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = Number.parseInt(process.env.PORT ?? '8100', 10);
const HOST = process.env.HOST ?? '127.0.0.1';

app.use(morgan(process.env.LOG_LEVEL ?? 'combined'));
app.use(cors());
app.use(express.json({ limit: '256kb' }));
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

app.use('/outputs', express.static(MUSETALK_OUTPUTS_DIR, { fallthrough: true }));

app.get('/healthz', (_req, res) => {
  res.type('text/plain').send('ok\n');
});

app.get('/oth-path', (_req, res) => {
  const { profile } = loadPersona();
  res.json({
    name: 'afterlife-testbed',
    version: '0.0.2',
    stage: 'v0-chat',
    ollama: process.env.OLLAMA_URL ?? 'http://127.0.0.1:11435',
    model: process.env.MODEL ?? 'gemma3:27b',
    persona: {
      id: profile.id,
      displayName: profile.displayName,
      relation: profile.relation,
    },
  });
});

app.get('/oth-path', (_req, res) => {
  const { profile } = loadPersona();

  res.json(profile);
});

async function pushWavToPublisher(wavPath) {
  const buf = await fsp.readFile(wavPath);
  const r = await fetch(`${REALTIME_PUBLISHER_URL}/push_audio`, {
    method: 'POST',
    headers: {
      'Content-Type': 'audio/wav',
      'X-Audio-Format': 'wav',
    },
    body: buf,
  });
  if (!r.ok) {
    const text = await r.text().catch(() => '');
    throw new Error(`push_audio HTTP ${r.status}: ${text.slice(0, 200)}`);
  }
  return r.json().catch(() => ({}));
}

async function dumpGroundTruthWav(sessionId, wavPath, meta) {
  if (!DEBUG_DUMP_GROUND_TRUTH) return;
  try {
    await fsp.mkdir(DEBUG_DUMP_DIR, { recursive: true });
    const wavOut = path.join(DEBUG_DUMP_DIR, `sess-${sessionId}.wav`);
    await fsp.copyFile(wavPath, wavOut);
    const sidecarOut = path.join(DEBUG_DUMP_DIR, `sess-${sessionId}.json`);
    const payload = {
      session_id: sessionId,
      wav_path: wavOut,
      created_at: new Date().toISOString(),
      ...meta,
    };
    await fsp.writeFile(sidecarOut, JSON.stringify(payload, null, 2));
    console.log(
      `[debug-dump] sess-${sessionId} wav=${wavOut} mp4=${meta?.mp4_path ?? '(pending)'}`,
    );
  } catch (err) {
    console.warn(
      `[debug-dump] sess-${sessionId} failed: ${err?.message ?? err}`,
    );
  }
}

async function updateGroundTruthSidecar(sessionId, patch) {
  if (!DEBUG_DUMP_GROUND_TRUTH) return;
  try {
    const sidecarOut = path.join(DEBUG_DUMP_DIR, `sess-${sessionId}.json`);
    let cur = {};
    try {
      cur = JSON.parse(await fsp.readFile(sidecarOut, 'utf8'));
    } catch {}
    const merged = { ...cur, ...patch, updated_at: new Date().toISOString() };
    await fsp.writeFile(sidecarOut, JSON.stringify(merged, null, 2));
    console.log(
      `[debug-dump] sess-${sessionId} mp4=${patch?.mp4_path ?? '?'} ready`,
    );
  } catch (err) {
    console.warn(
      `[debug-dump] sess-${sessionId} sidecar update failed: ${err?.message ?? err}`,
    );
  }
}

app.get('/oth-path', async (_req, res) => {
  try {
    const r = await fetch(`${REALTIME_PUBLISHER_URL}/healthz`, {
      method: 'GET',
    });
    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    res.status(r.status).json(data);
  } catch (err) {
    res.status(502).json({
      error: 'publisher_unreachable',
      detail: err?.message ?? String(err),
    });
  }
});

app.post('/oth-path', async (_req, res) => {
  try {
    const r = await fetch(`${REALTIME_PUBLISHER_URL}/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    res.status(r.status).json(data);
  } catch (err) {
    res.status(502).json({
      error: 'publisher_unreachable',
      detail: err?.message ?? String(err),
    });
  }
});

app.post('/oth-path', async (req, res) => {
  const subSid = (req.body && typeof req.body.subscriber_session_id === 'string')
    ? req.body.subscriber_session_id
    : null;
  const answerSdp = (req.body && typeof req.body.answer_sdp === 'string')
    ? req.body.answer_sdp
    : null;
  if (!subSid || !answerSdp) {
    return res.status(400).json({ error: 'missing_fields' });
  }
  try {
    const r = await fetch(`${REALTIME_PUBLISHER_URL}/subscribe/renegotiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscriber_session_id: subSid,
        answer_sdp: answerSdp,
      }),
    });
    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    res.status(r.status).json(data);
  } catch (err) {
    res.status(502).json({
      error: 'publisher_unreachable',
      detail: err?.message ?? String(err),
    });
  }
});

app.post('/oth-path', (req, res) => {
  const userMessage = (req.body?.message ?? '').toString().trim();
  const history = Array.isArray(req.body?.history) ? req.body.history : [];
  if (!userMessage) {
    return res.status(400).json({ error: 'message is required' });
  }

  const messages = [
    { role: 'system', content: buildSystemPrompt() },
    ...history
      .filter((m) => m && typeof m.role === 'string' && typeof m.content === 'string')
      .filter((m) => ['user', 'assistant'].includes(m.role))
      .slice(-12),
    { role: 'user', content: userMessage },
  ];

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const send = (event, data) => {
    if (res.writableEnded) return;
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  let aborted = false;
  const sb = createSentenceBuffer();
  let ttsSeq = 0;
  const inflightTts = new Set();

  const collectedWavs = []; 
  const sessionId = crypto.randomBytes(6).toString('hex');

  const FIRST_CHUNK_WORD_TARGET = Number.POSITIVE_INFINITY;
  let firstChunkClosed = false;
  let firstChunkWordCount = 0;
  const firstChunkInflight = new Set();
  let firstChunkAsyncStarted = false;
  let firstChunkPromise = Promise.resolve();

  const countWords = (s) => (s.match(/\S+/g) || []).length;

  const synthAndSend = (text, chunkIdx) => {
    if (!TTS_ENABLED) return Promise.resolve();

    const cleaned = stripEmoji(text);
    if (!cleaned) return Promise.resolve();
    const seq = ++ttsSeq;
    const t0 = Date.now();
    const p = ttsSynthesize(cleaned)
      .then(({ wav, synthMs }) => {
        if (aborted) return;

        if (!MUSETALK_STREAM_MODE) {
          send('tts', {
            seq,
            text: cleaned,
            audio_b64: wav.toString('base64'),
            synth_ms: synthMs,
            wallclock_ms: Date.now() - t0,
            bytes: wav.length,
          });
        }
        if (MUSETALK_ENABLED) collectedWavs.push({ seq, wav, chunkIdx });
      })
      .catch((err) => {
        if (aborted) return;
        send('tts_error', { seq, text: cleaned, error: err?.message ?? 'tts failed' });
      })
      .finally(() => {
        inflightTts.delete(p);
        if (chunkIdx === 1) firstChunkInflight.delete(p);
      });
    inflightTts.add(p);
    if (chunkIdx === 1) firstChunkInflight.add(p);
    return p;
  };

  const kickoffFirstChunkAsync = () => {
    if (firstChunkAsyncStarted || !MUSETALK_STREAM_MODE || !MUSETALK_ENABLED) return;
    firstChunkAsyncStarted = true;
    firstChunkPromise = (async () => {
      await Promise.allSettled([...firstChunkInflight]);
      if (aborted) return;
      const c1 = collectedWavs
        .filter((x) => x.chunkIdx === 1)
        .sort((a, b) => a.seq - b.seq)
        .map((x) => x.wav);
      if (!c1.length) return;
      let tmp = null;
      try {
        tmp = await concatWavs(c1);
        if (!tmp) return;
        await dumpGroundTruthWav(sessionId, tmp.path, {
          mode: 'stream',
          sentence_count: c1.length,
          audio_bytes: c1.reduce((a, b) => a + b.length, 0),
        });
        if (REALTIME_AUDIO_STREAM) {
          pushWavToPublisher(tmp.path).catch((err) =>
            console.warn('[realtime-audio c1] push_audio failed:', err?.message ?? err),
          );
        }
        const result = await museTalkInfer({
          audio_path: tmp.path,
          output_id: sessionId,
          stream: true,
        });
        await updateGroundTruthSidecar(sessionId, {
          mp4_path: result?.mp4_path ?? null,
          mp4_basename: result?.mp4_basename ?? null,
          infer_ms: result?.infer_ms ?? null,
          frames_pushed: result?.frames_pushed ?? null,
        });
        if (REALTIME_AUDIO_STREAM) {
          await fetch(`${REALTIME_PUBLISHER_URL}/push_audio_end`, {
            method: 'POST',
          }).catch(() => {});
        }

        if (!aborted && result?.mp4_path) {
          send('video', {
            url: mp4PathToUrl(result.mp4_path),
            mp4_path: result.mp4_path,
            mp4_basename: result.mp4_basename,
            infer_ms: result?.infer_ms,
            frames_pushed: result?.frames_pushed ?? null,
            sentence_count: c1.length,
            audio_bytes: c1.reduce((a, b) => a + b.length, 0),
            streaming: true,
          });
        }
      } catch (err) {
        console.warn('musetalk c1 bg failed:', err?.message ?? err);
        if (!aborted) {
          send('video_error', { error: err?.message ?? 'musetalk stream failed' });
        }
      } finally {
        if (tmp) await cleanupTempDir(tmp.dir).catch(() => {});
      }
    })();
  };

  const routeSentence = (s) => {
    if (!firstChunkClosed) {
      firstChunkWordCount += countWords(s);
      synthAndSend(s, 1);
      if (firstChunkWordCount >= FIRST_CHUNK_WORD_TARGET) {
        firstChunkClosed = true;
        kickoffFirstChunkAsync();
      }
    } else {
      synthAndSend(s, 2);
    }
  };

  const ac = chatStream({
    messages,
    onChunk: (text) => {
      if (aborted) return;

      const clean = sanitizeChunk(text);
      if (!clean) return;
      send('chunk', { text: clean });

      const sentences = sb.feed(clean);
      for (const s of sentences) routeSentence(s);
    },
    onDone: (info) => {
      if (aborted) return;

      const remaining = sb.flush();
      for (const s of remaining) routeSentence(s);

      if (!firstChunkClosed) {
        firstChunkClosed = true;
        kickoffFirstChunkAsync();
      }

      Promise.allSettled([...inflightTts]).then(async () => {
        if (aborted) return;
        send('done', info);

        if (
          MUSETALK_ENABLED &&
          !aborted &&
          collectedWavs.length > 0
        ) {
          collectedWavs.sort((a, b) => a.seq - b.seq);
          const wavOnly = collectedWavs.map((x) => x.wav);

          if (MUSETALK_STREAM_MODE) {

            firstChunkPromise.finally(() => {
              if (!res.writableEnded) res.end();
            }).catch(() => {});
            return;
          }

          let tmp = null;
          try {
            tmp = await concatWavs(wavOnly);
            if (!tmp) {
              res.end();
              return;
            }
            await dumpGroundTruthWav(sessionId, tmp.path, {
              mode: 'batch',
              sentence_count: collectedWavs.length,
              audio_bytes: wavOnly.reduce((a, b) => a + b.length, 0),
            });
            const result = await museTalkInfer({
              audio_path: tmp.path,
              output_id: sessionId,
              stream: false,
            });
            if (aborted) return;
            await updateGroundTruthSidecar(sessionId, {
              mp4_path: result?.mp4_path ?? null,
              mp4_basename: result?.mp4_basename ?? null,
              infer_ms: result?.infer_ms ?? null,
            });

            if (REALTIME_AUDIO_STREAM && result?.mp4_path) {
              fetch(`${REALTIME_PUBLISHER_URL}/push_mp4`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: result.mp4_path }),
              }).catch((err) =>
                console.warn(
                  '[realtime-mp4] push_mp4 failed:',
                  err?.message ?? err,
                ),
              );
            }
            send('video', {
              url: mp4PathToUrl(result.mp4_path),
              mp4_path: result.mp4_path,
              mp4_basename: result.mp4_basename,
              infer_ms: result.infer_ms,
              sentence_count: collectedWavs.length,
              audio_bytes: wavOnly.reduce((a, b) => a + b.length, 0),
              streaming: !!result.streamed,
              frames_pushed: result.frames_pushed ?? null,
            });
          } catch (err) {
            if (!aborted) {
              send('video_error', { error: err?.message ?? 'musetalk failed' });
            }
          } finally {
            if (tmp) await cleanupTempDir(tmp.dir);
            res.end();
          }
        } else {
          res.end();
        }
      });
    },
    onError: (err) => {
      if (aborted) return;
      send('error', { error: err?.message ?? 'unknown' });
      res.end();
    },
  });

  res.on('close', () => {
    if (res.writableEnded) return;
    aborted = true;
    ac.abort();
  });
});

const server = app.listen(PORT, HOST, () => {
  console.log(`[afterlife-testbed] listening on ${HOST}:${PORT}`);
  console.log(`[afterlife-testbed] persona: ${loadPersona().profile.displayName}`);
});

const shutdown = (sig) => {
  console.log(`[afterlife-testbed] ${sig} received, shutting down`);
  server.close(() => process.exit(0));
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
