import v_96bb47 from 'cyfkmrv';
import v_531fc8 from 'ygnq';
import v_3ba024 from 'kgsenb';
import v_9fe22d from 'wiosxndes';
import { v_6b8a99 } from 'bujvoezm';
import 'wcphoayfnlind';

import { v_841e05, v_464116 } from './lib/prompt.js';
import { v_a26277 } from './lib/ollama.js';
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

const v_a65c2e = v_9fe22d.dirname(v_6b8a99(import.meta.url));

const v_466992 = v_96bb47();
const v_66d977 = Number.parseInt(process.env.PORT ?? '8100', 10);
const v_899d88 = process.env.HOST ?? '127.0.0.1';

v_466992.use(v_3ba024(process.env.LOG_LEVEL ?? 'combined'));
v_466992.use(v_531fc8());
v_466992.use(v_96bb47.json({ limit: '256kb' }));
v_466992.use(v_96bb47.static(v_9fe22d.join(v_a65c2e, 'public'), { extensions: ['html'] }));

v_466992.use('/outputs', v_96bb47.static(v_e3f065, { fallthrough: true }));

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

  const v_fa56e0 = [
    { role: 'system', content: v_841e05() },
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
  const v_138fc0 = v_cdb49a();
  let v_213fa0 = 0;
  const v_e8b841 = new Set();

  const v_af1e0d = []; 
  const v_c5607b = v_b070ed.randomBytes(6).toString('hex');

  const v_80a694 = (v_9b6134) => {
    if (!v_455f07) return Promise.resolve();

    const v_738e47 = v_0f0580(v_9b6134);
    if (!v_738e47) return Promise.resolve();
    const v_1923e2 = ++v_213fa0;
    const v_b66f2c = Date.now();
    const v_e2a85c = v_27fa47(v_738e47)
      .then(({ wav: v_7ab8bd, synthMs: v_3691b5 }) => {
        if (v_6c558f) return;
        v_9c423d('tts', {
          seq: v_1923e2,
          text: v_738e47,
          audio_b64: v_7ab8bd.toString('base64'),
          synth_ms: v_3691b5,
          wallclock_ms: Date.now() - v_b66f2c,
          bytes: v_7ab8bd.length,
        });

        if (v_77b004) v_af1e0d.push({ seq: v_1923e2, wav: v_7ab8bd });
      })
      .catch((v_49263d) => {
        if (v_6c558f) return;
        v_9c423d('tts_error', { seq: v_1923e2, text: v_738e47, error: v_49263d?.message ?? 'tts failed' });
      })
      .finally(() => {
        v_e8b841.delete(v_e2a85c);
      });
    v_e8b841.add(v_e2a85c);
    return v_e2a85c;
  };

  const v_57bcd5 = v_a26277({
    messages: v_fa56e0,
    onChunk: (v_9b6134) => {
      if (v_6c558f) return;

      const v_76a373 = v_c80dec(v_9b6134);
      if (!v_76a373) return;
      v_9c423d('chunk', { text: v_76a373 });

      const v_fe6160 = v_138fc0.feed(v_76a373);
      for (const v_fd5f43 of v_fe6160) v_80a694(v_fd5f43);
    },
    onDone: (v_34d5e3) => {
      if (v_6c558f) return;

      const v_916658 = v_138fc0.flush();
      for (const v_fd5f43 of v_916658) v_80a694(v_fd5f43);

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

            v_8f00b9.end();
            (async () => {
              let v_6944b4 = null;
              try {
                v_6944b4 = await v_034be8(v_d33958);
                if (!v_6944b4) return;

                if (v_e01c9c) {
                  v_e705d0(v_6944b4.path).catch((v_49263d) => {
                    console.warn(
                      '[realtime-audio] push_audio failed:',
                      v_49263d?.message ?? v_49263d,
                    );
                  });
                }
                await v_a16f6e({
                  audio_path: v_6944b4.path,
                  output_id: `sess-${v_c5607b}`,
                  stream: true,
                });

                if (v_e01c9c) {
                  fetch(`${v_de4278}/push_audio_end`, {
                    method: 'POST',
                  }).catch(() => {});
                }
              } catch (v_49263d) {
                console.warn('musetalk stream bg failed:', v_49263d?.message ?? v_49263d);
              } finally {
                if (v_6944b4) await v_ba8718(v_6944b4.dir).catch(() => {});
              }
            })();
            return;
          }

          let v_6944b4 = null;
          try {
            v_6944b4 = await v_034be8(v_d33958);
            if (!v_6944b4) {
              v_8f00b9.end();
              return;
            }
            const v_43c42e = await v_a16f6e({
              audio_path: v_6944b4.path,
              output_id: `sess-${v_c5607b}`,
              stream: false,
            });
            if (v_6c558f) return;
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
            v_8f00b9.end();
          }
        } else {
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
