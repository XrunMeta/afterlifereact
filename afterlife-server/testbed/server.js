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

const TTS_ENABLED = (process.env.TTS_ENABLED ?? '1') !== '0';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = Number.parseInt(process.env.PORT ?? '8100', 10);
const HOST = process.env.HOST ?? '127.0.0.1';

app.use(morgan(process.env.LOG_LEVEL ?? 'combined'));
app.use(cors());
app.use(express.json({ limit: '256kb' }));
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

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

  const synthAndSend = (text) => {
    if (!TTS_ENABLED) return Promise.resolve();
    const trimmed = text.trim();
    if (!trimmed) return Promise.resolve();
    const seq = ++ttsSeq;
    const t0 = Date.now();
    const p = ttsSynthesize(trimmed)
      .then(({ wav, synthMs }) => {
        if (aborted) return;
        send('tts', {
          seq,
          text: trimmed,
          audio_b64: wav.toString('base64'),
          synth_ms: synthMs,
          wallclock_ms: Date.now() - t0,
          bytes: wav.length,
        });
      })
      .catch((err) => {
        if (aborted) return;
        send('tts_error', { seq, text: trimmed, error: err?.message ?? 'tts failed' });
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
      send('chunk', { text });

      const sentences = sb.feed(text);
      for (const s of sentences) synthAndSend(s);
    },
    onDone: (info) => {
      if (aborted) return;

      const remaining = sb.flush();
      for (const s of remaining) synthAndSend(s);

      Promise.allSettled([...inflightTts]).then(() => {
        if (aborted) return;
        send('done', info);
        res.end();
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
