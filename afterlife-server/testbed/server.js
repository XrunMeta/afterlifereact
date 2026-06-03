import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';

import { buildSystemPrompt, loadPersona } from './lib/prompt.js';
import { chatStream, chatOnce } from './lib/ollama.js';
import { applyOps, recentAttrs, getHistory, getAttrsFor } from './lib/kvStore.js'; 
import { extractTurn } from './lib/extractor.js';
import { createSentenceBuffer } from './lib/sentence_buffer.js';
import { ttsSynthesize } from './lib/tts.js';
import { stripEmoji, sanitizeChunk, applyBlocklist } from './lib/sanitize.js';
import { selectPromptInputs } from './lib/personaSelect.js';
import {
  concatWavs,
  cleanupTempDir,
  museTalkInfer,
  mp4PathToUrl,
  ensurePhotoStill,
} from './lib/musetalk.js';
import crypto from 'node:crypto';
import fsp from 'node:fs/promises';
import { recordTurn, recentTurns, getTurn } from './logger.js';

import { openDb } from './orchestrator/db.js';
import { createOrchestrator } from './orchestrator/calls.js';
import * as publisherProc from './orchestrator/publisherProc.js';
import { orchestratorRouter } from './orchestrator/routes.js';
import { loadCfEnv } from './orchestrator/envFile.js';

import { resolvePublisherUrl } from './lib/publisherUrl.js';

const LEARN_ENABLED = process.env.LEARN_ENABLED !== '0'; 
const PERSONA_LABEL = process.env.PERSONA_LABEL ?? '할배';
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

const ASSET_VIDEO_REF_DIR =
  process.env.ASSET_VIDEO_REF_DIR ??
  '/home/afterlife/afterlife-server/testbed/video-ref';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = Number.parseInt(process.env.PORT ?? '8100', 10);
const HOST = process.env.HOST ?? '127.0.0.1';

app.use(morgan(process.env.LOG_LEVEL ?? 'combined'));
app.use(cors());
app.use(express.json({ limit: '256kb' }));
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

app.use('/outputs', express.static(MUSETALK_OUTPUTS_DIR, { fallthrough: true }));

const ORCH_SECRET = process.env.ORCH_SECRET ?? '';

if (!ORCH_SECRET) {
  console.warn('[orch] WARN ORCH_SECRET 미설정 — /oth-path* 통화 생성 거부(401). preview/prod 는 반드시 secret 설정.');
}

const cfFromFile = loadCfEnv(process.env.PUBLISHER_CF_ENV_FILE);
const cfCanonical = {
  CF_REALTIME_APP_ID: cfFromFile.CF_REALTIME_APP_ID ?? process.env.CF_REALTIME_APP_ID ?? '',
  CF_REALTIME_APP_SECRET: cfFromFile.CF_REALTIME_APP_SECRET ?? process.env.CF_REALTIME_APP_SECRET ?? '',
  CF_REALTIME_APP_TOKEN: cfFromFile.CF_REALTIME_APP_TOKEN ?? process.env.CF_REALTIME_APP_TOKEN ?? '',
  CF_REALTIME_BASE: cfFromFile.CF_REALTIME_BASE ?? process.env.CF_REALTIME_BASE ?? 'https://rtc.live.cloudflare.com/v1',
};
if (process.env.PUBLISHER_CF_ENV_FILE && !cfFromFile.CF_REALTIME_APP_ID) {
  console.warn(`[orch] WARN PUBLISHER_CF_ENV_FILE=${process.env.PUBLISHER_CF_ENV_FILE} 에서 CF_REALTIME_APP_ID 못 읽음 — process.env fallback.`);
}
const orchDb = openDb(process.env.ORCH_DB_PATH ?? path.join(__dirname, 'orchestrator', 'calls.db'));
const orch = createOrchestrator({
  db: orchDb,
  config: {
    python: process.env.PUBLISHER_PYTHON ?? 'python',
    script: process.env.PUBLISHER_SCRIPT
      ?? path.join(__dirname, '..', 'realtime-afterlife', 'scripts', 'publisher.py'),
    idleMp4Default: process.env.IDLE_MP4_PATH ?? '',
    portBase: Number.parseInt(process.env.PUBLISHER_PORT_BASE ?? '8410', 10),
    portCount: Number.parseInt(process.env.PUBLISHER_PORT_COUNT ?? '30', 10),
    healthTimeoutMs: Number.parseInt(process.env.ORCH_HEALTH_TIMEOUT_MS ?? '15000', 10),
    killGraceMs: Number.parseInt(process.env.ORCH_KILL_GRACE_MS ?? '3000', 10),

    cfEnv: cfCanonical,
    logStream: process.stdout,
  },
  deps: {
    spawnPublisher: publisherProc.spawnPublisher,
    waitHealthz: publisherProc.waitHealthz,
    publishStart: publisherProc.publishStart,
    publishStop: publisherProc.publishStop,
    killProc: publisherProc.killProc,
    now: Date.now,
    randomUUID: () => crypto.randomUUID(),
    randomToken: () => crypto.randomBytes(32).toString('base64url'),
  },
});
await orch.reconcile(); 

const ASSET_VOICE_REF_DIR =
  process.env.ASSET_VOICE_REF_DIR ??
  '/home/afterlife/afterlife-server/openvoice-afterlife/reference_voices';
const ASSET_IMAGE_REF_DIR =
  process.env.ASSET_IMAGE_REF_DIR ??
  '/home/afterlife/afterlife-server/testbed/image-ref';
app.use(orchestratorRouter(orch, {
  secret: ORCH_SECRET,
  cfg: {
    testbedBaseUrl: process.env.TESTBED_BASE_URL ?? `http://127.0.0.1:${PORT}`,
    apiBaseUrl: process.env.AFTERLIFE_API_URL ?? '',
    apiSecret: process.env.ORCH_SECRET ?? ORCH_SECRET,

    assetDirs: {
      voiceRefDir: ASSET_VOICE_REF_DIR,
      videoRefDir: ASSET_VIDEO_REF_DIR,
      imageRefDir: ASSET_IMAGE_REF_DIR,
    },
  },
}));

app.get('/sp1a-config.js', (_req, res) => {
  res.type('application/javascript').send(
    `window.__SP1A__ = ${JSON.stringify({
      apiBase: process.env.TESTBED_API_BASE ?? '',
      devToken: process.env.TESTBED_DEV_TOKEN ?? '',
      cloneId: process.env.TESTBED_CLONE_ID ?? '',
    })};`,
  );
});

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

app.get('/oth-path', (req, res) => {
  const limit = Math.min(Number.parseInt(req.query.limit ?? '50', 10) || 50, 200);
  const sinceId = Number.parseInt(req.query.since ?? '0', 10) || 0;
  res.json({ turns: recentTurns({ limit, sinceId }) });
});

app.get('/oth-path', (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  const row = Number.isFinite(id) ? getTurn(id) : null;
  if (!row) return res.status(404).json({ error: 'not_found' });
  res.json(row);
});

app.get('/oth-path', (req, res) => {
  const persona = (req.query.persona ?? 'halbae').toString();
  const level = req.query.level ? req.query.level.toString() : null;
  const user = req.query.user ? req.query.user.toString() : null;
  res.json({ kv: recentAttrs({ persona_slug: persona, level, user_label: user }) });
});
app.get('/oth-path', (req, res) => {
  res.json({ history: getHistory(Number(req.params.id)) });
});

async function pushWavToPublisher(wavPath, baseUrl = REALTIME_PUBLISHER_URL) {
  const buf = await fsp.readFile(wavPath);
  const r = await fetch(`${baseUrl}/push_audio`, {
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

  const sourceRaw = req.body?.source;
  const source = sourceRaw === 'agent' ? 'agent' : sourceRaw === 'rn-call' ? 'rn-call' : 'browser';
  const speakerRole = req.body?.speaker_role === 'visitor' ? 'visitor' : 'creator';
  const learnLevel = speakerRole === 'visitor' ? 'l2' : 'l1';
  const userLabel = (req.body?.user_label ?? (speakerRole === 'visitor' ? 'visitor-test' : 'creator-test')).toString();
  const personaSlug = (req.body?.persona_slug ?? 'halbae').toString();

  const callPublisherUrl = resolvePublisherUrl(req.body?.publisherPort, REALTIME_PUBLISHER_URL);

  const personaBundle = req.body?.personaBundle ?? null;

  const ttsSePath = req.body?.ttsSePath ?? null;
  const museVideoPath = req.body?.museVideoPath ?? null;
  const avatarImagePath = req.body?.avatarImagePath ?? null;

  const chatCloneId = req.body?.cloneId ? String(req.body.cloneId).replace(/[^a-zA-Z0-9_-]/g, '') : null;
  const fallbackL1 = getAttrsFor({ persona_slug: personaSlug, level: 'l1', user_label: null });
  const fallbackL2 = speakerRole === 'visitor'
    ? getAttrsFor({ persona_slug: personaSlug, level: 'l2', user_label: userLabel })
    : [];
  const { l0, l1Attrs, l2Attrs } = selectPromptInputs({ personaBundle, fallbackL1, fallbackL2 });
  if (personaBundle && personaBundle.persona && l1Attrs.length === 0) {
    console.warn(`[sp3] personaBundle present but persona empty (source=${source}) — responding with L0 only`);
  }

  const messages = [
    { role: 'system', content: buildSystemPrompt({ l0, l1Attrs, l2Attrs }) },
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

  const sb = createSentenceBuffer({
    minLen: process.env.SENTENCE_MIN_LEN ? Number.parseInt(process.env.SENTENCE_MIN_LEN, 10) : undefined,
    forceFlush: process.env.SENTENCE_FORCE_FLUSH ? Number.parseInt(process.env.SENTENCE_FORCE_FLUSH, 10) : undefined,
  });
  let ttsSeq = 0;
  const inflightTts = new Set();

  const collectedWavs = []; 
  const sessionId = crypto.randomBytes(6).toString('hex');

  const turnT0 = Date.now();
  let llmFirstTokenMs = null;
  let llmText = '';
  let ttsTotalMs = 0;
  let ttsCount = 0;
  let mtPhase = null;        
  let mtInferMs = null;
  let mtFramesPushed = null;
  let mtMp4Basename = null;
  let turnRecorded = false;  
  let lastDoneInfo = null;   

  const triggerExtraction = async (turnId) => {

    if (!turnId || !LEARN_ENABLED || source === 'rn-call') return;
    try {
      const existingAttrs = recentAttrs({ persona_slug: personaSlug, level: learnLevel, user_label: learnLevel === 'l2' ? userLabel : null });
      const ops = await extractTurn(
        { level: learnLevel, persona_label: PERSONA_LABEL, turnUser: userMessage, existingAttrs }, 
        chatOnce,
      );
      if (ops.length === 0) return;
      const applyResult = applyOps({ persona_slug: personaSlug, level: learnLevel, user_label: learnLevel === 'l1' ? null : userLabel, source_turn_id: turnId }, ops);
      console.log(`[029-E-learn] turn=${turnId} ${learnLevel} ops applied=${applyResult.applied} rejected=${applyResult.rejected}`);
    } catch (err) {
      console.warn('[029-E-learn] triggerExtraction failed:', err?.message ?? err);
    }
  };

  const finalizeTurn = (mode) => {
    if (turnRecorded) return;
    turnRecorded = true;
    try {
      const audioBytes = collectedWavs.reduce((a, b) => a + b.wav.length, 0);
      const turnId = recordTurn({
        session_id: sessionId,
        created_at: new Date().toISOString(),
        mode,
        source, speaker_role: speakerRole, user_label: userLabel, persona_slug: personaSlug, 
        user_text: userMessage,
        llm_text: llmText,
        llm_first_token_ms: llmFirstTokenMs,
        llm_total_ms: lastDoneInfo?.total_duration_ms ?? null,
        tts_total_ms: ttsTotalMs || null,
        tts_count: ttsCount || null,
        mt_whisper_ms: mtPhase?.whisper ?? null,
        mt_coord_ms: mtPhase?.coord ?? null,
        mt_vae_ms: mtPhase?.vae ?? null,
        mt_unet_ms: mtPhase?.unet ?? null,
        mt_padding_ms: mtPhase?.padding ?? null,
        mt_ffmpeg_ms: mtPhase?.ffmpeg ?? null,
        mt_infer_ms: mtInferMs,
        e2e_ms: Date.now() - turnT0,
        sentence_count: collectedWavs.length || null,
        audio_bytes: audioBytes || null,
        frames_pushed: mtFramesPushed,
        wav_basename: null,
        mp4_basename: mtMp4Basename,
        raw_json: JSON.stringify({
          llm: lastDoneInfo ?? null,
          mt_phase: mtPhase,
          mt_infer_ms: mtInferMs,
          frames_pushed: mtFramesPushed,
        }),
      });
      triggerExtraction(turnId).catch(() => {}); 
    } catch (err) {
      console.warn('[monitor] finalizeTurn failed:', err?.message ?? err);
    }
  };

  const FIRST_CHUNK_WORD_TARGET = Number.parseInt(process.env.FIRST_CHUNK_WORD_TARGET ?? '3', 10); 
  const CHUNK_WORD_TARGET = Number.parseInt(process.env.CHUNK_WORD_TARGET ?? '4', 10);             

  let chunkIdx = 0;          
  let chunkOpen = false;
  let curChunkWords = 0;
  const chunkInflight = new Map();   

  const MUSETALK_POOL = (process.env.MUSETALK_URLS ?? process.env.MUSETALK_URL ?? 'http://127.0.0.1:8300')
    .split(',').map((s) => s.trim()).filter(Boolean)
    .map((urlStr) => { const x = new URL(urlStr); return { host: x.hostname, port: x.port ? Number.parseInt(x.port, 10) : 80 }; });
  const chunkInferPromises = [];     
  const mp4Ready = new Map();        
  let nextPushIdx = 1;               
  let pushChain = Promise.resolve(); 
  let rrCursor = 0;                  

  const countWords = (s) => (s.match(/\S+/g) || []).length;

  const wordTargetFor = (idx) => (idx === 1 ? FIRST_CHUNK_WORD_TARGET : CHUNK_WORD_TARGET);
  const chunkOutId = (idx) => (idx === 1 ? sessionId : `${sessionId}-c${idx}`);

  const synthAndSend = (text, idx) => {
    if (!TTS_ENABLED) return Promise.resolve();

    const cleaned = applyBlocklist(stripEmoji(text), l0?.blocklist ?? []);
    if (!cleaned) return Promise.resolve();
    const seq = ++ttsSeq;
    const t0 = Date.now();
    const inflight = chunkInflight.get(idx);

    const p = ttsSynthesize(cleaned, ...(ttsSePath ? [{ se_path: ttsSePath }] : [{}]))
      .then(({ wav, synthMs }) => {
        if (aborted) return;
        ttsTotalMs += synthMs ?? 0;
        ttsCount += 1;

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
        if (MUSETALK_ENABLED) collectedWavs.push({ seq, wav, chunkIdx: idx });
      })
      .catch((err) => {
        if (aborted) return;
        send('tts_error', { seq, text: cleaned, error: err?.message ?? 'tts failed' });
      })
      .finally(() => {
        inflightTts.delete(p);
        inflight?.delete(p);
      });
    inflightTts.add(p);
    inflight?.add(p);
    return p;
  };

  const schedulePush = () => {
    pushChain = pushChain
      .then(async () => {
        while (mp4Ready.has(nextPushIdx)) {
          const r = mp4Ready.get(nextPushIdx);
          mp4Ready.delete(nextPushIdx);
          const idxNow = nextPushIdx;
          nextPushIdx += 1;
          if (r?.mp4_path && REALTIME_AUDIO_STREAM && !aborted) {
            await fetch(`${callPublisherUrl}/push_mp4`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ path: r.mp4_path, reset: idxNow === 1 }),
            }).catch((e) => console.warn(`[push_mp4 c${idxNow}] failed:`, e?.message ?? e));
          }
        }
      })
      .catch(() => {});
  };

  const processChunkMp4 = async (idx, inst) => {
    let result = null;
    let tmp = null;
    try {
      const inflight = chunkInflight.get(idx) ?? new Set();
      await Promise.allSettled([...inflight]);
      if (aborted) return;
      const wavs = collectedWavs
        .filter((x) => x.chunkIdx === idx)
        .sort((a, b) => a.seq - b.seq)
        .map((x) => x.wav);
      if (!wavs.length) return;
      const outId = chunkOutId(idx);
      tmp = await concatWavs(wavs, outId);
      if (!tmp) return;
      await dumpGroundTruthWav(outId, tmp.path, {
        mode: 'mp4-source',
        chunk: idx,
        sentence_count: wavs.length,
        audio_bytes: wavs.reduce((a, b) => a + b.length, 0),
      });

      let resolvedVideoPath = museVideoPath || null;
      if (!resolvedVideoPath && avatarImagePath && chatCloneId) {

        const photoStillOut = path.join(ASSET_VIDEO_REF_DIR, chatCloneId, 'photo-still-25fps.mp4');
        try {
          resolvedVideoPath = await ensurePhotoStill({ photoPath: avatarImagePath, outPath: photoStillOut });
        } catch (photoErr) {
          console.warn('[sp4/photo-still] ffmpeg 폴백 실패(graceful):', photoErr?.message ?? photoErr);
          resolvedVideoPath = null;
        }
      }
      result = await museTalkInfer({
        audio_path: tmp.path,
        ...(resolvedVideoPath ? { video_path: resolvedVideoPath } : {}),
        output_id: outId,
        stream: false,
        host: inst.host,
        port: inst.port,
      });

      if (idx === 1) {
        mtInferMs = result?.infer_ms ?? null;
        mtPhase = result?.phase_ms ?? null;
        mtFramesPushed = result?.frames_pushed ?? null;
        mtMp4Basename = result?.mp4_basename ?? null;
      }
      await updateGroundTruthSidecar(outId, {
        mp4_path: result?.mp4_path ?? null,
        mp4_basename: result?.mp4_basename ?? null,
        infer_ms: result?.infer_ms ?? null,
      });
      if (!aborted && result?.mp4_path) {
        send('video', {
          url: mp4PathToUrl(result.mp4_path),
          mp4_path: result.mp4_path,
          mp4_basename: result.mp4_basename,
          infer_ms: result?.infer_ms,
          sentence_count: wavs.length,
          audio_bytes: wavs.reduce((a, b) => a + b.length, 0),
          streaming: true,
          chunk: idx,
          instance: `${inst.host}:${inst.port}`,
        });
      }
    } catch (err) {
      console.warn(`musetalk c${idx} (mp4) failed:`, err?.message ?? err);
      if (!aborted) send('video_error', { chunk: idx, error: err?.message ?? 'musetalk failed' });
    } finally {
      if (tmp) await cleanupTempDir(tmp.dir).catch(() => {});

      mp4Ready.set(idx, result?.mp4_path ? result : null);
      schedulePush();
    }
  };

  const closeChunk = () => {
    if (!chunkOpen) return;
    const idx = chunkIdx;
    chunkOpen = false;
    if (!(MUSETALK_STREAM_MODE && MUSETALK_ENABLED)) return;
    const inst = MUSETALK_POOL[rrCursor];
    rrCursor = (rrCursor + 1) % MUSETALK_POOL.length;  
    chunkInferPromises.push(processChunkMp4(idx, inst));
  };

  const routeSentence = (s) => {
    if (!chunkOpen) {
      chunkIdx += 1;
      chunkOpen = true;
      curChunkWords = 0;
      chunkInflight.set(chunkIdx, new Set());
    }
    curChunkWords += countWords(s);
    synthAndSend(s, chunkIdx);
    if (curChunkWords >= wordTargetFor(chunkIdx)) closeChunk();
  };

  const ac = chatStream({
    messages,
    onChunk: (text) => {
      if (aborted) return;

      const clean = sanitizeChunk(text);
      if (!clean) return;
      if (llmFirstTokenMs === null) llmFirstTokenMs = Date.now() - turnT0;
      llmText += clean;
      send('chunk', { text: clean });

      const sentences = sb.feed(clean);
      for (const s of sentences) routeSentence(s);
    },
    onDone: (info) => {
      if (aborted) return;
      lastDoneInfo = info;

      const remaining = sb.flush();
      for (const s of remaining) routeSentence(s);

      if (chunkOpen) closeChunk();

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

            Promise.allSettled(chunkInferPromises)
              .then(() => { schedulePush(); return pushChain; })  
              .finally(() => {
                finalizeTurn('stream');
                if (!res.writableEnded) res.end();
              })
              .catch(() => {});
            return;
          }

          let tmp = null;
          try {
            tmp = await concatWavs(wavOnly);
            if (!tmp) {

              finalizeTurn('batch');
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
            mtInferMs = result?.infer_ms ?? null;
            mtPhase = result?.phase_ms ?? null;
            mtFramesPushed = result?.frames_pushed ?? null;
            mtMp4Basename = result?.mp4_basename ?? null;
            await updateGroundTruthSidecar(sessionId, {
              mp4_path: result?.mp4_path ?? null,
              mp4_basename: result?.mp4_basename ?? null,
              infer_ms: result?.infer_ms ?? null,
            });

            if (REALTIME_AUDIO_STREAM && result?.mp4_path) {
              fetch(`${callPublisherUrl}/push_mp4`, {
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
            finalizeTurn('batch');
            res.end();
          }
        } else {
          finalizeTurn(MUSETALK_STREAM_MODE ? 'stream' : 'batch');
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
