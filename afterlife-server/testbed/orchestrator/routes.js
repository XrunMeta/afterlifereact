import express from 'express';
import crypto from 'node:crypto';

const PUB = (port) => `http://127.0.0.1:${port}`;

function corsHeaders(res) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
}

function tokenMatches(provided, expected) {
  if (typeof provided !== 'string' || typeof expected !== 'string') return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function bearer(req) {
  const h = req.get('Authorization') || '';
  const m = /^Bearer (.+)$/.exec(h);
  return m ? m[1] : null;
}

export function orchestratorRouter(orch, { secret }) {
  const router = express.Router();

  function requireSecret(req, res, next) {
    if (!secret || bearer(req) !== secret) return res.status(401).json({ error: 'unauthorized' });
    next();
  }

  router.post('/oth-path', requireSecret, async (req, res) => {
    const { cloneId, userId, idleVideoUrl } = req.body || {};
    try {
      const ticket = await orch.allocate({ cloneId: String(cloneId), userId: String(userId), idleVideoUrl: idleVideoUrl ?? null });
      res.status(200).json(ticket);
    } catch (e) {
      const msg = String(e?.message ?? e);
      if (msg.includes('no_capacity')) return res.status(503).json({ error: 'no_capacity' });
      res.status(500).json({ error: 'allocate_failed', detail: msg });
    }
  });

  router.delete('/oth-path', requireSecret, async (req, res) => {
    const userId = (req.body && req.body.userId != null) ? String(req.body.userId) : null;
    try { res.status(200).json(await orch.end(req.params.callId, userId)); }
    catch (e) { res.status(500).json({ error: 'end_failed', detail: String(e?.message ?? e) }); }
  });

  router.get('/oth-path', requireSecret, (_req, res) => {
    res.status(200).json({ calls: orch.listActive() });
  });

  router.options('/oth-path', (_req, res) => { corsHeaders(res); res.status(204).end(); });
  router.options('/oth-path', (_req, res) => { corsHeaders(res); res.status(204).end(); });

  async function proxyToPublisher(req, res, suffix) {
    corsHeaders(res);
    const row = orch.getCall(req.params.callId);
    if (!row || row.state !== 'live') return res.status(404).json({ error: 'call_not_found' });

    if (!tokenMatches(bearer(req), row.subscribe_token)) {
      return res.status(401).json({ error: 'invalid_subscribe_token' });
    }
    try {
      const r = await fetch(`${PUB(row.port)}${suffix}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body || {}),
      });
      const text = await r.text();
      let data; try { data = JSON.parse(text); } catch { data = { raw: text }; }
      res.status(r.status).json(data);
    } catch (e) {
      res.status(502).json({ error: 'publisher_unreachable', detail: String(e?.message ?? e) });
    }
  }

  router.post('/oth-path', (req, res) => proxyToPublisher(req, res, '/subscribe'));
  router.post('/oth-path', (req, res) => proxyToPublisher(req, res, '/subscribe/renegotiate'));

  return router;
}
