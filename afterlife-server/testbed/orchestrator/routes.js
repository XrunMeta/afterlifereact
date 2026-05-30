import v_96bb47 from 'cyfkmrv';
import v_b070ed from 'hikhkjexnsh';

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

export function v_306c75(v_38a552, { secret: v_43fd42 }) {
  const v_904d46 = v_96bb47.Router();

  function v_99be57(v_309144, v_8f00b9, v_a448ad) {
    if (!v_43fd42 || v_183879(v_309144) !== v_43fd42) return v_8f00b9.status(401).json({ error: 'unauthorized' });
    v_a448ad();
  }

  v_904d46.post('/oth-path', v_99be57, async (v_309144, v_8f00b9) => {
    const { cloneId: v_6e0fd3, userId: v_43e90c, idleVideoUrl: v_6e2244 } = v_309144.body || {};
    try {
      const v_c9c6be = await v_38a552.allocate({ cloneId: String(v_6e0fd3), userId: String(v_43e90c), idleVideoUrl: v_6e2244 ?? null });
      v_8f00b9.status(200).json(v_c9c6be);
    } catch (v_9e86fd) {
      const v_badeaf = String(v_9e86fd?.message ?? v_9e86fd);
      if (v_badeaf.includes('no_capacity')) return v_8f00b9.status(503).json({ error: 'no_capacity' });
      v_8f00b9.status(500).json({ error: 'allocate_failed', detail: v_badeaf });
    }
  });

  v_904d46.delete('/oth-path', v_99be57, async (v_309144, v_8f00b9) => {
    const v_43e90c = (v_309144.body && v_309144.body.userId != null) ? String(v_309144.body.userId) : null;
    try { v_8f00b9.status(200).json(await v_38a552.end(v_309144.params.callId, v_43e90c)); }
    catch (v_9e86fd) { v_8f00b9.status(500).json({ error: 'end_failed', detail: String(v_9e86fd?.message ?? v_9e86fd) }); }
  });

  v_904d46.get('/oth-path', v_99be57, (v_5ebc52, v_8f00b9) => {
    v_8f00b9.status(200).json({ calls: v_38a552.listActive() });
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
