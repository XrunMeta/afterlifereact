import v_96bb47 from 'cyfkmrv';
import v_531fc8 from 'ygnq';
import v_3ba024 from 'kgsenb';
import v_9fe22d from 'wiosxndes';
import { v_6b8a99 } from 'bujvoezm';
import 'wcphoayfnlind';

import { v_841e05, v_464116 } from './lib/prompt.js';
import { v_a26277, v_3f4abd } from './lib/ollama.js';
import { v_3ad6c0, v_e9fc79, v_49715e, v_ff48df } from './lib/kvStore.js'; 
import { v_585997 } from './lib/extractor.js';
import { v_cdb49a } from './lib/sentence_buffer.js';
import { v_27fa47 } from './lib/tts.js';
import { v_0f0580, v_c80dec } from './lib/sanitize.js';
import {
  v_034be8,
  v_ba8718,
  v_a16f6e,
  v_6edf8f,
} from './lib/musetalk.js';
import v_b070ed from 'hikhkjexnsh';
import v_d4f750 from 'fnffflguqbrqugbi';
import { v_e173d2, v_483137, v_f456fa } from './logger.js';

import { v_64a9a8 } from './orchestrator/db.js';
import { v_3df644 } from './orchestrator/calls.js';
import * as v_31b899 from './orchestrator/publisherProc.js';
import { v_306c75 } from './orchestrator/routes.js';

const v_327f32 = process.env.LEARN_ENABLED !== '0'; 
const v_ef177e = process.env.PERSONA_LABEL ?? '할배';
const v_455f07 = (process.env.TTS_ENABLED ?? '1') !== '0';
const v_77b004 = (process.env.MUSETALK_ENABLED ?? '1') !== '0';

const v_2c3445 = (process.env.MUSETALK_STREAM_MODE ?? '0') === '1';

const v_e01c9c =
  (process.env.REALTIME_AUDIO_STREAM ?? '1') === '1';
const v_e3f065 =
  process.env.MUSETALK_OUTPUTS_DIR ??
  '/home/afterlife/afterlife-server/musetalk-afterlife/outputs/v15';

const v_de4278 =
  process.env.REALTIME_PUBLISHER_URL ?? 'http://127.0.0.1:8400';

const v_32426d =
  (process.env.DEBUG_DUMP_GROUND_TRUTH ?? '0') === '1';
const v_f522ac =
  process.env.DEBUG_DUMP_DIR ??
  '/home/afterlife/afterlife-server/testbed/debug-dump';

const v_a65c2e = v_9fe22d.dirname(v_6b8a99(import.meta.url));

const v_466992 = v_96bb47();
const v_66d977 = Number.parseInt(process.env.PORT ?? '8100', 10);
const v_899d88 = process.env.HOST ?? '127.0.0.1';

v_466992.use(v_3ba024(process.env.LOG_LEVEL ?? 'combined'));
v_466992.use(v_531fc8());
v_466992.use(v_96bb47.json({ limit: '256kb' }));
v_466992.use(v_96bb47.static(v_9fe22d.join(v_a65c2e, 'public'), { extensions: ['html'] }));

v_466992.use('/outputs', v_96bb47.static(v_e3f065, { fallthrough: true }));

const v_4b93d8 = process.env.ORCH_SECRET ?? '';

if (!v_4b93d8) {
  console.warn('[orch] WARN ORCH_SECRET 미설정 — /oth-path* 통화 생성 거부(401). preview/prod 는 반드시 secret 설정.');
}
const v_9a7e19 = v_64a9a8(process.env.ORCH_DB_PATH ?? v_9fe22d.join(v_a65c2e, 'orchestrator', 'calls.db'));
const v_38a552 = v_3df644({
  db: v_9a7e19,
  config: {
    python: process.env.PUBLISHER_PYTHON ?? 'python',
    script: process.env.PUBLISHER_SCRIPT
      ?? v_9fe22d.join(v_a65c2e, '..', 'realtime-afterlife', 'scripts', 'publisher.py'),
    idleMp4Default: process.env.IDLE_MP4_PATH ?? '',
    portBase: Number.parseInt(process.env.PUBLISHER_PORT_BASE ?? '8410', 10),
    portCount: Number.parseInt(process.env.PUBLISHER_PORT_COUNT ?? '30', 10),
    healthTimeoutMs: Number.parseInt(process.env.ORCH_HEALTH_TIMEOUT_MS ?? '15000', 10),
    killGraceMs: Number.parseInt(process.env.ORCH_KILL_GRACE_MS ?? '3000', 10),

    cfEnv: {
      CF_REALTIME_APP_ID: process.env.CF_REALTIME_APP_ID ?? '',
      CF_REALTIME_APP_TOKEN: process.env.CF_REALTIME_APP_TOKEN ?? '',
      CF_REALTIME_BASE: process.env.CF_REALTIME_BASE ?? 'https://rtc.live.cloudflare.com/v1',
    },
    logStream: process.stdout,
  },
  deps: {
    spawnPublisher: v_31b899.spawnPublisher,
    waitHealthz: v_31b899.waitHealthz,
    publishStart: v_31b899.publishStart,
    publishStop: v_31b899.publishStop,
    killProc: v_31b899.killProc,
    now: Date.now,
    randomUUID: () => v_b070ed.randomUUID(),
    randomToken: () => v_b070ed.randomBytes(32).toString('base64url'),
  },
});
await v_38a552.reconcile(); 
v_466992.use(v_306c75(v_38a552, { secret: v_4b93d8 }));

v_466992.get('/sp1a-config.js', (v_5ebc52, v_8f00b9) => {
  v_8f00b9.type('application/javascript').send(
    `window.__SP1A__ = ${JSON.stringify({
      apiBase: process.env.TESTBED_API_BASE ?? '',
      devToken: process.env.TESTBED_DEV_TOKEN ?? '',
      cloneId: process.env.TESTBED_CLONE_ID ?? '',
    })};`,
  );
});

v_466992.get('/healthz', (v_5ebc52, v_8f00b9) => {
  v_8f00b9.type('text/plain').send('ok\n');
});

v_466992.get('/oth-path', (v_5ebc52, v_8f00b9) => {
  const { profile: v_727031 } = v_464116();
  v_8f00b9.json({
    name: 'afterlife-testbed',
    version: '0.0.2',
    stage: 'v0-chat',
    ollama: process.env.OLLAMA_URL ?? 'http://127.0.0.1:11435',
    model: process.env.MODEL ?? 'gemma3:27b',
    persona: {
      id: v_727031.id,
      displayName: v_727031.displayName,
      relation: v_727031.relation,
    },
  });
});

v_466992.get('/oth-path', (v_5ebc52, v_8f00b9) => {
  const { profile: v_727031 } = v_464116();

  v_8f00b9.json(v_727031);
});

v_466992.get('/oth-path', (v_309144, v_8f00b9) => {
  const v_02be30 = Math.min(Number.parseInt(v_309144.query.limit ?? '50', 10) || 50, 200);
  const v_a35e1b = Number.parseInt(v_309144.query.since ?? '0', 10) || 0;
  v_8f00b9.json({ turns: v_483137({ limit: v_02be30, sinceId: v_a35e1b }) });
});

v_466992.get('/oth-path', (v_309144, v_8f00b9) => {
  const v_389afb = Number.parseInt(v_309144.params.id, 10);
  const v_3ac7e7 = Number.isFinite(v_389afb) ? v_f456fa(v_389afb) : null;
  if (!v_3ac7e7) return v_8f00b9.status(404).json({ error: 'not_found' });
  v_8f00b9.json(v_3ac7e7);
});

v_466992.get('/oth-path', (v_309144, v_8f00b9) => {
  const v_5ed063 = (v_309144.query.persona ?? 'halbae').toString();
  const v_fbe91e = v_309144.query.level ? v_309144.query.level.toString() : null;
  const v_625c74 = v_309144.query.user ? v_309144.query.user.toString() : null;
  v_8f00b9.json({ kv: v_e9fc79({ persona_slug: v_5ed063, level: v_fbe91e, user_label: v_625c74 }) });
});
v_466992.get('/oth-path', (v_309144, v_8f00b9) => {
  v_8f00b9.json({ history: v_49715e(Number(v_309144.params.id)) });
});

async function v_e705d0(v_f2bb81) {
  const v_83ee53 = await v_d4f750.readFile(v_f2bb81);
  const v_cb35cb = await fetch(`${v_de4278}/push_audio`, {
    method: 'POST',
    headers: {
      'Content-Type': 'audio/wav',
      'X-Audio-Format': 'wav',
    },
    body: v_83ee53,
  });
  if (!v_cb35cb.ok) {
    const v_9b6134 = await v_cb35cb.text().catch(() => '');
    throw new Error(`push_audio HTTP ${v_cb35cb.status}: ${v_9b6134.slice(0, 200)}`);
  }
  return v_cb35cb.json().catch(() => ({}));
}

async function v_db6543(v_c5607b, v_f2bb81, v_ab4c96) {
  if (!v_32426d) return;
  try {
    await v_d4f750.mkdir(v_f522ac, { recursive: true });
    const v_59d180 = v_9fe22d.join(v_f522ac, `sess-${v_c5607b}.wav`);
    await v_d4f750.copyFile(v_f2bb81, v_59d180);
    const v_f48c72 = v_9fe22d.join(v_f522ac, `sess-${v_c5607b}.json`);
    const v_931bf0 = {
      session_id: v_c5607b,
      wav_path: v_59d180,
      created_at: new Date().toISOString(),
      ...v_ab4c96,
    };
    await v_d4f750.writeFile(v_f48c72, JSON.stringify(v_931bf0, null, 2));
    console.log(
      `[debug-dump] sess-${v_c5607b} wav=${v_59d180} mp4=${v_ab4c96?.mp4_path ?? '(pending)'}`,
    );
  } catch (v_49263d) {
    console.warn(
      `[debug-dump] sess-${v_c5607b} failed: ${v_49263d?.message ?? v_49263d}`,
    );
  }
}

async function v_00b49d(v_c5607b, v_17dc8a) {
  if (!v_32426d) return;
  try {
    const v_f48c72 = v_9fe22d.join(v_f522ac, `sess-${v_c5607b}.json`);
    let v_c3bc75 = {};
    try {
      v_c3bc75 = JSON.parse(await v_d4f750.readFile(v_f48c72, 'utf8'));
    } catch {}
    const v_2b7a6d = { ...v_c3bc75, ...v_17dc8a, updated_at: new Date().toISOString() };
    await v_d4f750.writeFile(v_f48c72, JSON.stringify(v_2b7a6d, null, 2));
    console.log(
      `[debug-dump] sess-${v_c5607b} mp4=${v_17dc8a?.mp4_path ?? '?'} ready`,
    );
  } catch (v_49263d) {
    console.warn(
      `[debug-dump] sess-${v_c5607b} sidecar update failed: ${v_49263d?.message ?? v_49263d}`,
    );
  }
}

v_466992.get('/oth-path', async (v_5ebc52, v_8f00b9) => {
  try {
    const v_cb35cb = await fetch(`${v_de4278}/healthz`, {
      method: 'GET',
    });
    const v_9b6134 = await v_cb35cb.text();
    let v_9390e8;
    try { v_9390e8 = JSON.parse(v_9b6134); } catch { v_9390e8 = { raw: v_9b6134 }; }
    v_8f00b9.status(v_cb35cb.status).json(v_9390e8);
  } catch (v_49263d) {
    v_8f00b9.status(502).json({
      error: 'publisher_unreachable',
      detail: v_49263d?.message ?? String(v_49263d),
    });
  }
});

v_466992.post('/oth-path', async (v_5ebc52, v_8f00b9) => {
  try {
    const v_cb35cb = await fetch(`${v_de4278}/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const v_9b6134 = await v_cb35cb.text();
    let v_9390e8;
    try { v_9390e8 = JSON.parse(v_9b6134); } catch { v_9390e8 = { raw: v_9b6134 }; }
    v_8f00b9.status(v_cb35cb.status).json(v_9390e8);
  } catch (v_49263d) {
    v_8f00b9.status(502).json({
      error: 'publisher_unreachable',
      detail: v_49263d?.message ?? String(v_49263d),
    });
  }
});

v_466992.post('/oth-path', async (v_309144, v_8f00b9) => {
  const v_5bd2a8 = (v_309144.body && typeof v_309144.body.subscriber_session_id === 'string')
    ? v_309144.body.subscriber_session_id
    : null;
  const v_3f08aa = (v_309144.body && typeof v_309144.body.answer_sdp === 'string')
    ? v_309144.body.answer_sdp
    : null;
  if (!v_5bd2a8 || !v_3f08aa) {
    return v_8f00b9.status(400).json({ error: 'missing_fields' });
  }
  try {
    const v_cb35cb = await fetch(`${v_de4278}/subscribe/renegotiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscriber_session_id: v_5bd2a8,
        answer_sdp: v_3f08aa,
      }),
    });
    const v_9b6134 = await v_cb35cb.text();
    let v_9390e8;
    try { v_9390e8 = JSON.parse(v_9b6134); } catch { v_9390e8 = { raw: v_9b6134 }; }
    v_8f00b9.status(v_cb35cb.status).json(v_9390e8);
  } catch (v_49263d) {
    v_8f00b9.status(502).json({
      error: 'publisher_unreachable',
      detail: v_49263d?.message ?? String(v_49263d),
    });
  }
});

v_466992.post('/oth-path', (v_309144, v_8f00b9) => {
  const v_e629b5 = (v_309144.body?.message ?? '').toString().trim();
  const v_10740d = Array.isArray(v_309144.body?.history) ? v_309144.body.history : [];
  if (!v_e629b5) {
    return v_8f00b9.status(400).json({ error: 'message is required' });
  }

  const v_04e790 = v_309144.body?.source === 'agent' ? 'agent' : 'browser';
  const v_9a14d9 = v_309144.body?.speaker_role === 'visitor' ? 'visitor' : 'creator';
  const v_d63eac = v_9a14d9 === 'visitor' ? 'l2' : 'l1';
  const v_1231fa = (v_309144.body?.user_label ?? (v_9a14d9 === 'visitor' ? 'visitor-test' : 'creator-test')).toString();
  const v_47fe3d = (v_309144.body?.persona_slug ?? 'halbae').toString();

  const v_55a58f = v_ff48df({ persona_slug: v_47fe3d, level: 'l1', user_label: null });
  const v_fc96ca = v_9a14d9 === 'visitor'
    ? v_ff48df({ persona_slug: v_47fe3d, level: 'l2', user_label: v_1231fa })
    : [];

  const v_fa56e0 = [
    { role: 'system', content: v_841e05({ l1Attrs: v_55a58f, l2Attrs: v_fc96ca }) },
    ...v_10740d
      .filter((v_35f85c) => v_35f85c && typeof v_35f85c.role === 'string' && typeof v_35f85c.content === 'string')
      .filter((v_35f85c) => ['user', 'assistant'].includes(v_35f85c.role))
      .slice(-12),
    { role: 'user', content: v_e629b5 },
  ];

  v_8f00b9.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  v_8f00b9.setHeader('Cache-Control', 'no-cache, no-transform');
  v_8f00b9.setHeader('Connection', 'keep-alive');
  v_8f00b9.setHeader('X-Accel-Buffering', 'no');
  v_8f00b9.flushHeaders();

  const v_9c423d = (v_d48baf, v_9390e8) => {
    if (v_8f00b9.writableEnded) return;
    v_8f00b9.write(`event: ${v_d48baf}\n`);
    v_8f00b9.write(`data: ${JSON.stringify(v_9390e8)}\n\n`);
  };

  let v_6c558f = false;

  const v_138fc0 = v_cdb49a({
    minLen: process.env.SENTENCE_MIN_LEN ? Number.parseInt(process.env.SENTENCE_MIN_LEN, 10) : undefined,
    forceFlush: process.env.SENTENCE_FORCE_FLUSH ? Number.parseInt(process.env.SENTENCE_FORCE_FLUSH, 10) : undefined,
  });
  let v_213fa0 = 0;
  const v_e8b841 = new Set();

  const v_af1e0d = []; 
  const v_c5607b = v_b070ed.randomBytes(6).toString('hex');

  const v_b95b29 = Date.now();
  let v_5fb2c2 = null;
  let v_32b1d6 = '';
  let v_9a1a8e = 0;
  let v_2c141f = 0;
  let v_f778a0 = null;        
  let v_312499 = null;
  let v_928047 = null;
  let v_749b14 = null;
  let v_001385 = false;  
  let v_3ccb8e = null;   

  const v_73c1c8 = async (v_544e9a) => {
    if (!v_544e9a || !v_327f32) return;
    try {
      const v_676b49 = v_e9fc79({ persona_slug: v_47fe3d, level: v_d63eac, user_label: v_d63eac === 'l2' ? v_1231fa : null });
      const v_152909 = await v_585997(
        { level: v_d63eac, persona_label: v_ef177e, turnUser: v_e629b5, existingAttrs: v_676b49 }, 
        v_3f4abd,
      );
      if (v_152909.length === 0) return;
      const v_a78550 = v_3ad6c0({ persona_slug: v_47fe3d, level: v_d63eac, user_label: v_d63eac === 'l1' ? null : v_1231fa, source_turn_id: v_544e9a }, v_152909);
      console.log(`[029-E-learn] turn=${v_544e9a} ${v_d63eac} ops applied=${v_a78550.applied} rejected=${v_a78550.rejected}`);
    } catch (v_49263d) {
      console.warn('[029-E-learn] triggerExtraction failed:', v_49263d?.message ?? v_49263d);
    }
  };

  const v_ef86b4 = (v_34e5bb) => {
    if (v_001385) return;
    v_001385 = true;
    try {
      const v_4d4347 = v_af1e0d.reduce((v_779914, v_148ff6) => v_779914 + v_148ff6.wav.length, 0);
      const v_544e9a = v_e173d2({
        session_id: v_c5607b,
        created_at: new Date().toISOString(),
        mode: v_34e5bb,
        source: v_04e790, speaker_role: v_9a14d9, user_label: v_1231fa, persona_slug: v_47fe3d, 
        user_text: v_e629b5,
        llm_text: v_32b1d6,
        llm_first_token_ms: v_5fb2c2,
        llm_total_ms: v_3ccb8e?.total_duration_ms ?? null,
        tts_total_ms: v_9a1a8e || null,
        tts_count: v_2c141f || null,
        mt_whisper_ms: v_f778a0?.whisper ?? null,
        mt_coord_ms: v_f778a0?.coord ?? null,
        mt_vae_ms: v_f778a0?.vae ?? null,
        mt_unet_ms: v_f778a0?.unet ?? null,
        mt_padding_ms: v_f778a0?.padding ?? null,
        mt_ffmpeg_ms: v_f778a0?.ffmpeg ?? null,
        mt_infer_ms: v_312499,
        e2e_ms: Date.now() - v_b95b29,
        sentence_count: v_af1e0d.length || null,
        audio_bytes: v_4d4347 || null,
        frames_pushed: v_928047,
        wav_basename: null,
        mp4_basename: v_749b14,
        raw_json: JSON.stringify({
          llm: v_3ccb8e ?? null,
          mt_phase: v_f778a0,
          mt_infer_ms: v_312499,
          frames_pushed: v_928047,
        }),
      });
      v_73c1c8(v_544e9a).catch(() => {}); 
    } catch (v_49263d) {
      console.warn('[monitor] finalizeTurn failed:', v_49263d?.message ?? v_49263d);
    }
  };

  const v_3bfe38 = Number.parseInt(process.env.FIRST_CHUNK_WORD_TARGET ?? '3', 10); 
  const v_66b4cd = Number.parseInt(process.env.CHUNK_WORD_TARGET ?? '4', 10);             

  let v_a562b5 = 0;          
  let v_c882d5 = false;
  let v_85ce4d = 0;
  const v_dd70e4 = new Map();   

  const v_99333a = (process.env.MUSETALK_URLS ?? process.env.MUSETALK_URL ?? 'http://127.0.0.1:8300')
    .split(',').map((v_fd5f43) => v_fd5f43.trim()).filter(Boolean)
    .map((v_234c7c) => { const v_62c214 = new URL(v_234c7c); return { host: v_62c214.hostname, port: v_62c214.port ? Number.parseInt(v_62c214.port, 10) : 80 }; });
  const v_0b8503 = [];     
  const v_cdae05 = new Map();        
  let v_536a75 = 1;               
  let v_51387f = Promise.resolve(); 
  let v_7d5f83 = 0;                  

  const v_ce98b2 = (v_fd5f43) => (v_fd5f43.match(/\S+/g) || []).length;

  const v_fbe50b = (v_e86ad8) => (v_e86ad8 === 1 ? v_3bfe38 : v_66b4cd);
  const v_26651a = (v_e86ad8) => (v_e86ad8 === 1 ? v_c5607b : `${v_c5607b}-c${v_e86ad8}`);

  const v_80a694 = (v_9b6134, v_e86ad8) => {
    if (!v_455f07) return Promise.resolve();

    const v_738e47 = v_0f0580(v_9b6134);
    if (!v_738e47) return Promise.resolve();
    const v_1923e2 = ++v_213fa0;
    const v_b66f2c = Date.now();
    const v_d7fc78 = v_dd70e4.get(v_e86ad8);
    const v_e2a85c = v_27fa47(v_738e47)
      .then(({ wav: v_7ab8bd, synthMs: v_3691b5 }) => {
        if (v_6c558f) return;
        v_9a1a8e += v_3691b5 ?? 0;
        v_2c141f += 1;

        if (!v_2c3445) {
          v_9c423d('tts', {
            seq: v_1923e2,
            text: v_738e47,
            audio_b64: v_7ab8bd.toString('base64'),
            synth_ms: v_3691b5,
            wallclock_ms: Date.now() - v_b66f2c,
            bytes: v_7ab8bd.length,
          });
        }
        if (v_77b004) v_af1e0d.push({ seq: v_1923e2, wav: v_7ab8bd, chunkIdx: v_e86ad8 });
      })
      .catch((v_49263d) => {
        if (v_6c558f) return;
        v_9c423d('tts_error', { seq: v_1923e2, text: v_738e47, error: v_49263d?.message ?? 'tts failed' });
      })
      .finally(() => {
        v_e8b841.delete(v_e2a85c);
        v_d7fc78?.delete(v_e2a85c);
      });
    v_e8b841.add(v_e2a85c);
    v_d7fc78?.add(v_e2a85c);
    return v_e2a85c;
  };

  const v_f6d2f5 = () => {
    v_51387f = v_51387f
      .then(async () => {
        while (v_cdae05.has(v_536a75)) {
          const v_cb35cb = v_cdae05.get(v_536a75);
          v_cdae05.delete(v_536a75);
          const v_eabacc = v_536a75;
          v_536a75 += 1;
          if (v_cb35cb?.mp4_path && v_e01c9c && !v_6c558f) {
            await fetch(`${v_de4278}/push_mp4`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ path: v_cb35cb.mp4_path, reset: v_eabacc === 1 }),
            }).catch((v_9e86fd) => console.warn(`[push_mp4 c${v_eabacc}] failed:`, v_9e86fd?.message ?? v_9e86fd));
          }
        }
      })
      .catch(() => {});
  };

  const v_02480e = async (v_e86ad8, v_2d2f94) => {
    let v_43c42e = null;
    let v_6944b4 = null;
    try {
      const v_d7fc78 = v_dd70e4.get(v_e86ad8) ?? new Set();
      await Promise.allSettled([...v_d7fc78]);
      if (v_6c558f) return;
      const v_96bf40 = v_af1e0d
        .filter((v_62c214) => v_62c214.chunkIdx === v_e86ad8)
        .sort((v_779914, v_148ff6) => v_779914.seq - v_148ff6.seq)
        .map((v_62c214) => v_62c214.wav);
      if (!v_96bf40.length) return;
      const v_dad203 = v_26651a(v_e86ad8);
      v_6944b4 = await v_034be8(v_96bf40, v_dad203);
      if (!v_6944b4) return;
      await v_db6543(v_dad203, v_6944b4.path, {
        mode: 'mp4-source',
        chunk: v_e86ad8,
        sentence_count: v_96bf40.length,
        audio_bytes: v_96bf40.reduce((v_779914, v_148ff6) => v_779914 + v_148ff6.length, 0),
      });
      v_43c42e = await v_a16f6e({
        audio_path: v_6944b4.path,
        output_id: v_dad203,
        stream: false,
        host: v_2d2f94.host,
        port: v_2d2f94.port,
      });

      if (v_e86ad8 === 1) {
        v_312499 = v_43c42e?.infer_ms ?? null;
        v_f778a0 = v_43c42e?.phase_ms ?? null;
        v_928047 = v_43c42e?.frames_pushed ?? null;
        v_749b14 = v_43c42e?.mp4_basename ?? null;
      }
      await v_00b49d(v_dad203, {
        mp4_path: v_43c42e?.mp4_path ?? null,
        mp4_basename: v_43c42e?.mp4_basename ?? null,
        infer_ms: v_43c42e?.infer_ms ?? null,
      });
      if (!v_6c558f && v_43c42e?.mp4_path) {
        v_9c423d('video', {
          url: v_6edf8f(v_43c42e.mp4_path),
          mp4_path: v_43c42e.mp4_path,
          mp4_basename: v_43c42e.mp4_basename,
          infer_ms: v_43c42e?.infer_ms,
          sentence_count: v_96bf40.length,
          audio_bytes: v_96bf40.reduce((v_779914, v_148ff6) => v_779914 + v_148ff6.length, 0),
          streaming: true,
          chunk: v_e86ad8,
          instance: `${v_2d2f94.host}:${v_2d2f94.port}`,
        });
      }
    } catch (v_49263d) {
      console.warn(`musetalk c${v_e86ad8} (mp4) failed:`, v_49263d?.message ?? v_49263d);
      if (!v_6c558f) v_9c423d('video_error', { chunk: v_e86ad8, error: v_49263d?.message ?? 'musetalk failed' });
    } finally {
      if (v_6944b4) await v_ba8718(v_6944b4.dir).catch(() => {});

      v_cdae05.set(v_e86ad8, v_43c42e?.mp4_path ? v_43c42e : null);
      v_f6d2f5();
    }
  };

  const v_128b4e = () => {
    if (!v_c882d5) return;
    const v_e86ad8 = v_a562b5;
    v_c882d5 = false;
    if (!(v_2c3445 && v_77b004)) return;
    const v_2d2f94 = v_99333a[v_7d5f83];
    v_7d5f83 = (v_7d5f83 + 1) % v_99333a.length;  
    v_0b8503.push(v_02480e(v_e86ad8, v_2d2f94));
  };

  const v_ff0d3e = (v_fd5f43) => {
    if (!v_c882d5) {
      v_a562b5 += 1;
      v_c882d5 = true;
      v_85ce4d = 0;
      v_dd70e4.set(v_a562b5, new Set());
    }
    v_85ce4d += v_ce98b2(v_fd5f43);
    v_80a694(v_fd5f43, v_a562b5);
    if (v_85ce4d >= v_fbe50b(v_a562b5)) v_128b4e();
  };

  const v_57bcd5 = v_a26277({
    messages: v_fa56e0,
    onChunk: (v_9b6134) => {
      if (v_6c558f) return;

      const v_76a373 = v_c80dec(v_9b6134);
      if (!v_76a373) return;
      if (v_5fb2c2 === null) v_5fb2c2 = Date.now() - v_b95b29;
      v_32b1d6 += v_76a373;
      v_9c423d('chunk', { text: v_76a373 });

      const v_fe6160 = v_138fc0.feed(v_76a373);
      for (const v_fd5f43 of v_fe6160) v_ff0d3e(v_fd5f43);
    },
    onDone: (v_34d5e3) => {
      if (v_6c558f) return;
      v_3ccb8e = v_34d5e3;

      const v_916658 = v_138fc0.flush();
      for (const v_fd5f43 of v_916658) v_ff0d3e(v_fd5f43);

      if (v_c882d5) v_128b4e();

      Promise.allSettled([...v_e8b841]).then(async () => {
        if (v_6c558f) return;
        v_9c423d('done', v_34d5e3);

        if (
          v_77b004 &&
          !v_6c558f &&
          v_af1e0d.length > 0
        ) {
          v_af1e0d.sort((v_779914, v_148ff6) => v_779914.seq - v_148ff6.seq);
          const v_d33958 = v_af1e0d.map((v_62c214) => v_62c214.wav);

          if (v_2c3445) {

            Promise.allSettled(v_0b8503)
              .then(() => { v_f6d2f5(); return v_51387f; })  
              .finally(() => {
                v_ef86b4('stream');
                if (!v_8f00b9.writableEnded) v_8f00b9.end();
              })
              .catch(() => {});
            return;
          }

          let v_6944b4 = null;
          try {
            v_6944b4 = await v_034be8(v_d33958);
            if (!v_6944b4) {

              v_ef86b4('batch');
              v_8f00b9.end();
              return;
            }
            await v_db6543(v_c5607b, v_6944b4.path, {
              mode: 'batch',
              sentence_count: v_af1e0d.length,
              audio_bytes: v_d33958.reduce((v_779914, v_148ff6) => v_779914 + v_148ff6.length, 0),
            });
            const v_43c42e = await v_a16f6e({
              audio_path: v_6944b4.path,
              output_id: v_c5607b,
              stream: false,
            });
            if (v_6c558f) return;
            v_312499 = v_43c42e?.infer_ms ?? null;
            v_f778a0 = v_43c42e?.phase_ms ?? null;
            v_928047 = v_43c42e?.frames_pushed ?? null;
            v_749b14 = v_43c42e?.mp4_basename ?? null;
            await v_00b49d(v_c5607b, {
              mp4_path: v_43c42e?.mp4_path ?? null,
              mp4_basename: v_43c42e?.mp4_basename ?? null,
              infer_ms: v_43c42e?.infer_ms ?? null,
            });

            if (v_e01c9c && v_43c42e?.mp4_path) {
              fetch(`${v_de4278}/push_mp4`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: v_43c42e.mp4_path }),
              }).catch((v_49263d) =>
                console.warn(
                  '[realtime-mp4] push_mp4 failed:',
                  v_49263d?.message ?? v_49263d,
                ),
              );
            }
            v_9c423d('video', {
              url: v_6edf8f(v_43c42e.mp4_path),
              mp4_path: v_43c42e.mp4_path,
              mp4_basename: v_43c42e.mp4_basename,
              infer_ms: v_43c42e.infer_ms,
              sentence_count: v_af1e0d.length,
              audio_bytes: v_d33958.reduce((v_779914, v_148ff6) => v_779914 + v_148ff6.length, 0),
              streaming: !!v_43c42e.streamed,
              frames_pushed: v_43c42e.frames_pushed ?? null,
            });
          } catch (v_49263d) {
            if (!v_6c558f) {
              v_9c423d('video_error', { error: v_49263d?.message ?? 'musetalk failed' });
            }
          } finally {
            if (v_6944b4) await v_ba8718(v_6944b4.dir);
            v_ef86b4('batch');
            v_8f00b9.end();
          }
        } else {
          v_ef86b4(v_2c3445 ? 'stream' : 'batch');
          v_8f00b9.end();
        }
      });
    },
    onError: (v_49263d) => {
      if (v_6c558f) return;
      v_9c423d('error', { error: v_49263d?.message ?? 'unknown' });
      v_8f00b9.end();
    },
  });

  v_8f00b9.on('close', () => {
    if (v_8f00b9.writableEnded) return;
    v_6c558f = true;
    v_57bcd5.abort();
  });
});

const v_88781f = v_466992.listen(v_66d977, v_899d88, () => {
  console.log(`[afterlife-testbed] listening on ${v_899d88}:${v_66d977}`);
  console.log(`[afterlife-testbed] persona: ${v_464116().profile.displayName}`);
});

const v_a485f2 = (v_f2c979) => {
  console.log(`[afterlife-testbed] ${v_f2c979} received, shutting down`);
  v_88781f.close(() => process.exit(0));
};
process.on('SIGINT', () => v_a485f2('SIGINT'));
process.on('SIGTERM', () => v_a485f2('SIGTERM'));
