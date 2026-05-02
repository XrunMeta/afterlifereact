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

const TTS_ENABLED = (process.env.TTS_ENABLED ?? '1') !== '0';
const MUSETALK_ENABLED = (process.env.MUSETALK_ENABLED ?? '1') !== '0';

const MUSETALK_STREAM_MODE = (process.env.MUSETALK_STREAM_MODE ?? '0') === '1';
const MUSETALK_OUTPUTS_DIR =
  process.env.MUSETALK_OUTPUTS_DIR ??
  '/home/afterlife/afterlife-server/musetalk-afterlife/outputs/v15';

const REALTIME_PUBLISHER_URL =
  process.env.REALTIME_PUBLISHER_URL ?? 'http://127.0.0.1:8400';

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

  const synthAndSend = (text) => {
    if (!TTS_ENABLED) return Promise.resolve();

    const cleaned = stripEmoji(text);
    if (!cleaned) return Promise.resolve();
    const seq = ++ttsSeq;
    const t0 = Date.now();
    const p = ttsSynthesize(cleaned)
      .then(({ wav, synthMs }) => {
        if (aborted) return;
        send('tts', {
          seq,
          text: cleaned,
          audio_b64: wav.toString('base64'),
          synth_ms: synthMs,
          wallclock_ms: Date.now() - t0,
          bytes: wav.length,
        });

        if (MUSETALK_ENABLED) collectedWavs.push({ seq, wav });
      })
      .catch((err) => {
        if (aborted) return;
        send('tts_error', { seq, text: cleaned, error: err?.message ?? 'tts failed' });
      })
      .finally(() => {
        inflightTts.delete(p);
      });
    inflightTts.add(p);
    return p;
  };

  const ac = chatStream({
    messages,
    onChunk: (text) => {
      if (aborted) return;

      const clean = sanitizeChunk(text);
      if (!clean) return;
      send('chunk', { text: clean });

      const sentences = sb.feed(clean);
      for (const s of sentences) synthAndSend(s);
    },
    onDone: (info) => {
      if (aborted) return;

      const remaining = sb.flush();
      for (const s of remaining) synthAndSend(s);

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

            res.end();
            (async () => {
              let tmp = null;
              try {
                tmp = await concatWavs(wavOnly);
                if (!tmp) return;
                await museTalkInfer({
                  audio_path: tmp.path,
                  output_id: `sess-${sessionId}`,
                  stream: true,
                });
              } catch (err) {
                console.warn('musetalk stream bg failed:', err?.message ?? err);
              } finally {
                if (tmp) await cleanupTempDir(tmp.dir).catch(() => {});
              }
            })();
            return;
          }

          let tmp = null;
          try {
            tmp = await concatWavs(wavOnly);
            if (!tmp) {
              res.end();
              return;
            }
            const result = await museTalkInfer({
              audio_path: tmp.path,
              output_id: `sess-${sessionId}`,
              stream: false,
            });
            if (aborted) return;
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
