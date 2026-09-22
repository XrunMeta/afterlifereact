import v_96bb47 from 'cyfkmrv';
import v_b070ed from 'hikhkjexnsh';
import { v_458d35 } from './sayStore.js';
import { v_3a60ca as v_8e7d64 } from './chatRelay.js';
import { v_228e13 } from '../lib/personaSuggest.js';
import { v_541b14 } from '../lib/introSuggest.js';
import { v_47bade } from './assetJobRunner.js';
import { v_f7078e as v_437b35 } from './assetFetch.js';

const v_b74136 = (v_f31c63) => `http://127.0.0.1:${v_f31c63}`;

function v_32740c(v_8f00b9) {
  v_8f00b9.set('Access-Control-Allow-Origin', '*');
  v_8f00b9.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  v_8f00b9.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
}

function v_f2ad63(v_02a7ba, v_505a6d) {
  if (typeof v_02a7ba !== 'string' || typeof v_505a6d !== 'string') return false;
  const v_779914 = Buffer.from(v_02a7ba);
  const v_148ff6 = Buffer.from(v_505a6d);
  if (v_779914.length !== v_148ff6.length) return false;
  return v_b070ed.timingSafeEqual(v_779914, v_148ff6);
}

function v_183879(v_309144) {
  const v_65a2cd = v_309144.get('Authorization') || '';
  const v_35f85c = /^Bearer (.+)$/.exec(v_65a2cd);
  return v_35f85c ? v_35f85c[1] : null;
}

function v_28e3ea(v_01dcf5, v_6e0fd3) {
  return {
    fetchChat: async (v_4d33b2) => {
      const v_cb35cb = await fetch(`${v_01dcf5.testbedBaseUrl}/oth-path`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(v_4d33b2),
      });

      if (!v_cb35cb.ok) throw new Error(`testbed_chat_http_${v_cb35cb.status}`);
      return await v_cb35cb.text();
    },
    postTurnCallback: async (v_be62d3, v_931bf0) => {
      if (!v_01dcf5.apiBaseUrl) return; 
      await fetch(`${v_01dcf5.apiBaseUrl}/oth-path${v_be62d3}/turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${v_01dcf5.apiSecret}` },
        body: JSON.stringify({ ...v_931bf0, cloneId: v_6e0fd3 }),
      });
    },
  };
}

export function v_306c75(v_38a552, { secret: v_43fd42, cfg: v_01dcf5 = {}, deps: v_84b93d } = {}) {
  const v_904d46 = v_96bb47.Router();
  const v_04d03c = v_458d35();

  const v_85cf8d = new Map();
  const v_3a60ca = v_84b93d?.sayDeps?.runChatRelay ?? v_8e7d64;

  const v_f7078e = v_84b93d?.ensureAssets ?? v_437b35;

  const v_4fa62b = v_84b93d?.assetJobRunner ?? v_47bade({ apiBaseUrl: v_01dcf5.apiBaseUrl ?? '' });

  function v_99be57(v_309144, v_8f00b9, v_a448ad) {
    if (!v_43fd42 || !v_f2ad63(v_183879(v_309144), v_43fd42)) return v_8f00b9.status(401).json({ error: 'unauthorized' });
    v_a448ad();
  }

  v_904d46.post('/oth-path', v_99be57, async (v_309144, v_8f00b9) => {

    const { cloneId: v_6e0fd3, userId: v_43e90c, personaBundle: v_ba0fde, assets: v_7adc95 } = v_309144.body || {};
    try {

      let v_3ba9f9 = null;
      let v_d90f01 = null;
      let v_8998a7 = null;
      if (v_7adc95 && v_01dcf5.assetDirs && v_01dcf5.apiBaseUrl) {
        try {
          ({ museVideoPath: v_3ba9f9, ttsSePath: v_d90f01, avatarImagePath: v_8998a7 } = await v_f7078e({
            cloneId: String(v_6e0fd3),
            assets: v_7adc95,
            dirs: v_01dcf5.assetDirs,
            apiBaseUrl: v_01dcf5.apiBaseUrl,
          }));
        } catch {

        }
      } else if (v_7adc95) {

        if (v_84b93d?.ensureAssets) {
          try {
            ({ museVideoPath: v_3ba9f9, ttsSePath: v_d90f01, avatarImagePath: v_8998a7 } = await v_f7078e({
              cloneId: String(v_6e0fd3),
              assets: v_7adc95,
              dirs: v_01dcf5.assetDirs ?? {},
              apiBaseUrl: v_01dcf5.apiBaseUrl ?? '',
            }));
          } catch {

          }
        }
      }

      const v_c9c6be = await v_38a552.allocate({
        cloneId: String(v_6e0fd3),
        userId: String(v_43e90c),
        idleVideoUrl: v_3ba9f9 ?? null,
      });

      if (v_c9c6be?.callId) {
        v_85cf8d.set(v_c9c6be.callId, {
          personaBundle: v_ba0fde ?? null,
          museVideoPath: v_3ba9f9,
          ttsSePath: v_d90f01,
          avatarImagePath: v_8998a7,
        });
      }
      v_8f00b9.status(200).json(v_c9c6be);
    } catch (v_9e86fd) {
      const v_badeaf = String(v_9e86fd?.message ?? v_9e86fd);
      if (v_badeaf.includes('no_capacity')) return v_8f00b9.status(503).json({ error: 'no_capacity' });
      v_8f00b9.status(500).json({ error: 'allocate_failed', detail: v_badeaf });
    }
  });

  v_904d46.delete('/oth-path', v_99be57, async (v_309144, v_8f00b9) => {
    const v_be62d3 = v_309144.params.callId;
    const v_43e90c = (v_309144.body && v_309144.body.userId != null) ? String(v_309144.body.userId) : null;
    try {
      const v_43c42e = await v_38a552.end(v_be62d3, v_43e90c);
      v_04d03c.clear(v_be62d3);
      v_85cf8d.delete(v_be62d3); 
      v_8f00b9.status(200).json(v_43c42e);
    } catch (v_9e86fd) { v_8f00b9.status(500).json({ error: 'end_failed', detail: String(v_9e86fd?.message ?? v_9e86fd) }); }
  });

  v_904d46.get('/oth-path', v_99be57, (v_5ebc52, v_8f00b9) => {
    v_8f00b9.status(200).json({ calls: v_38a552.listActive() });
  });

  v_904d46.post('/oth-path', v_99be57, async (v_309144, v_8f00b9) => {
    try {
      const { profile: v_727031 = {}, questions: v_c3519b = [] } = v_309144.body ?? {};
      const v_de1ba7 = await v_228e13({ profile: v_727031, questions: v_c3519b });
      v_8f00b9.json({ suggestions: v_de1ba7 });
    } catch (v_9e86fd) {
      v_8f00b9.status(500).json({ error: 'suggest_failed' });
    }
  });

  v_904d46.post('/oth-path', v_99be57, async (v_309144, v_8f00b9) => {
    try {
      const { profile: v_727031 = {} } = v_309144.body ?? {};
      const v_456484 = await v_541b14({ profile: v_727031 });
      v_8f00b9.json({ intro: v_456484 });
    } catch {
      v_8f00b9.status(500).json({ error: 'intro_failed' });
    }
  });

  v_904d46.post('/oth-path', v_99be57, async (v_309144, v_8f00b9) => {
    const { job_id: v_b0d200, kind: v_94302c, src_url: v_b0c618, callback_token: v_85f723, face_url: v_1ba158, clone_id: v_fccde8, voice_raw_url: v_49ec2c, persona: v_5ed063 } = v_309144.body ?? {};

    const v_c8813c = v_94302c === 'filler';
    const v_927a9c = v_94302c === 'guide';
    const v_c5037d = v_c8813c || v_927a9c; 
    const v_e1287a = v_94302c === 'idle_video' || v_94302c === 'voice_clone';
    if (
      !v_b0d200 ||
      (!v_c5037d && !v_e1287a) ||
      (!v_c5037d && !v_b0c618) ||
      (v_c5037d && (!v_1ba158 || !v_fccde8 || !v_49ec2c)) ||
      !v_85f723
    ) {
      return v_8f00b9.status(400).json({ error: 'bad_request' });
    }

    if (v_c5037d) {
      const v_6c2092 = String(v_fccde8);
      if (!/^\d+$/.test(v_6c2092) || Number(v_6c2092) <= 0) {
        return v_8f00b9.status(400).json({ error: 'bad_request', detail: 'clone_id must be a positive integer' });
      }
    }
    if (v_c5037d) {

      v_4fa62b.enqueue({ job_id: v_b0d200, kind: v_94302c, face_url: v_1ba158, clone_id: v_fccde8, voice_raw_url: v_49ec2c, callback_token: v_85f723, persona: v_5ed063 });
    } else {

      const v_1e3df0 = typeof v_309144.body.engine === 'string' ? v_309144.body.engine : undefined;
      v_4fa62b.enqueue({ job_id: v_b0d200, kind: v_94302c, src_url: v_b0c618, callback_token: v_85f723, ...(v_1e3df0 ? { engine: v_1e3df0 } : {}) });
    }
    v_8f00b9.status(202).json({ accepted: true });
  });

  v_904d46.post('/oth-path', v_99be57, async (v_309144, v_8f00b9) => {
    v_32740c(v_8f00b9);
    const v_be62d3 = v_309144.params.callId;
    const v_9b6134 = (v_309144.body?.text ?? '').toString().trim();
    const v_6e0fd3 = v_309144.body?.cloneId;
    if (!v_9b6134) return v_8f00b9.status(400).json({ error: 'empty_text' });
    const v_3ac7e7 = v_38a552.getCall(v_be62d3);
    if (!v_3ac7e7) return v_8f00b9.status(404).json({ error: 'call_not_found' });
    if (v_3ac7e7.state !== 'live') return v_8f00b9.status(409).json({ error: 'call_not_live' });
    if (!v_04d03c.beginTurn(v_be62d3)) return v_8f00b9.status(409).json({ error: 'turn_in_progress' });
    v_04d03c.appendTurn(v_be62d3, { role: 'user', content: v_9b6134 });
    v_8f00b9.status(202).json({ ok: true }); 

    const v_e2a6a6 = v_85cf8d.get(v_be62d3);
    const v_79521f = v_e2a6a6?.personaBundle ?? null;
    const v_3ba9f9 = v_e2a6a6?.museVideoPath ?? null;
    const v_d90f01 = v_e2a6a6?.ttsSePath ?? null;
    const v_8998a7 = v_e2a6a6?.avatarImagePath ?? null;
    Promise.resolve()
      .then(() => v_3a60ca(
        v_28e3ea(v_01dcf5, v_6e0fd3),
        { callId: v_be62d3, cloneId: v_6e0fd3 ? String(v_6e0fd3) : null, publisherPort: v_3ac7e7.port, personaSlug: 'halbae', personaBundle: v_79521f, history: v_04d03c.getHistory(v_be62d3), text: v_9b6134, museVideoPath: v_3ba9f9, ttsSePath: v_d90f01, avatarImagePath: v_8998a7 },
      ))
      .then((v_3188ae) => { if (v_3188ae) v_04d03c.appendTurn(v_be62d3, { role: 'assistant', content: v_3188ae }); })
      .catch((v_9e86fd) => console.error('[sp2/say] relay error', v_be62d3, v_9e86fd?.message ?? v_9e86fd))
      .finally(() => v_04d03c.endTurn(v_be62d3));
  });

  v_904d46.options('/oth-path', (v_5ebc52, v_8f00b9) => { v_32740c(v_8f00b9); v_8f00b9.status(204).end(); });
  v_904d46.options('/oth-path', (v_5ebc52, v_8f00b9) => { v_32740c(v_8f00b9); v_8f00b9.status(204).end(); });

  async function v_e5fa14(v_309144, v_8f00b9, v_ae8e76) {
    v_32740c(v_8f00b9);
    const v_3ac7e7 = v_38a552.getCall(v_309144.params.callId);
    if (!v_3ac7e7 || v_3ac7e7.state !== 'live') return v_8f00b9.status(404).json({ error: 'call_not_found' });

    if (!v_f2ad63(v_183879(v_309144), v_3ac7e7.subscribe_token)) {
      return v_8f00b9.status(401).json({ error: 'invalid_subscribe_token' });
    }
    try {
      const v_cb35cb = await fetch(`${v_b74136(v_3ac7e7.port)}${v_ae8e76}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(v_309144.body || {}),
      });
      const v_9b6134 = await v_cb35cb.text();
      let v_9390e8; try { v_9390e8 = JSON.parse(v_9b6134); } catch { v_9390e8 = { raw: v_9b6134 }; }
      v_8f00b9.status(v_cb35cb.status).json(v_9390e8);
    } catch (v_9e86fd) {
      v_8f00b9.status(502).json({ error: 'publisher_unreachable', detail: String(v_9e86fd?.message ?? v_9e86fd) });
    }
  }

  v_904d46.post('/oth-path', (v_309144, v_8f00b9) => v_e5fa14(v_309144, v_8f00b9, '/subscribe'));
  v_904d46.post('/oth-path', (v_309144, v_8f00b9) => v_e5fa14(v_309144, v_8f00b9, '/subscribe/renegotiate'));

  return v_904d46;
}
