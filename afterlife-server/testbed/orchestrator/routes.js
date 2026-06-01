import express from 'express';
import crypto from 'node:crypto';
import { createSayStore } from './sayStore.js';
import { runChatRelay as defaultRunChatRelay } from './chatRelay.js';

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

function buildSayDeps(cfg, cloneId) {
  return {
    fetchChat: async (body) => {
      const r = await fetch(`${cfg.testbedBaseUrl}/oth-path`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!r.ok) throw new Error(`testbed_chat_http_${r.status}`);
      return await r.text();
    },
    postTurnCallback: async (callId, payload) => {
      if (!cfg.apiBaseUrl) return; 
      await fetch(`${cfg.apiBaseUrl}/oth-path${callId}/turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiSecret}` },
        body: JSON.stringify({ ...payload, cloneId }),
      });
    },
  };
}

export function orchestratorRouter(orch, { secret, cfg = {}, deps } = {}) {
  const router = express.Router();
  const sayStore = createSayStore();
  const callPersona = new Map(); 
  const runChatRelay = deps?.sayDeps?.runChatRelay ?? defaultRunChatRelay;

  function requireSecret(req, res, next) {
    if (!secret || bearer(req) !== secret) return res.status(401).json({ error: 'unauthorized' });
    next();
  }

  router.post('/oth-path', requireSecret, async (req, res) => {
    const { cloneId, userId, idleVideoUrl, personaBundle } = req.body || {};
    try {
      const ticket = await orch.allocate({ cloneId: String(cloneId), userId: String(userId), idleVideoUrl: idleVideoUrl ?? null });

      if (personaBundle && ticket?.callId) callPersona.set(ticket.callId, personaBundle);
      res.status(200).json(ticket);
    } catch (e) {
      const msg = String(e?.message ?? e);
      if (msg.includes('no_capacity')) return res.status(503).json({ error: 'no_capacity' });
      res.status(500).json({ error: 'allocate_failed', detail: msg });
    }
  });

  router.delete('/oth-path', requireSecret, async (req, res) => {
    const callId = req.params.callId;
    const userId = (req.body && req.body.userId != null) ? String(req.body.userId) : null;
    try {
      const result = await orch.end(callId, userId);
      sayStore.clear(callId);
      callPersona.delete(callId); 
      res.status(200).json(result);
    } catch (e) { res.status(500).json({ error: 'end_failed', detail: String(e?.message ?? e) }); }
  });

  router.get('/oth-path', requireSecret, (_req, res) => {
    res.status(200).json({ calls: orch.listActive() });
  });

  router.post('/oth-path', requireSecret, async (req, res) => {
    corsHeaders(res);
    const callId = req.params.callId;
    const text = (req.body?.text ?? '').toString().trim();
    const cloneId = req.body?.cloneId;
    if (!text) return res.status(400).json({ error: 'empty_text' });
    const row = orch.getCall(callId);
    if (!row) return res.status(404).json({ error: 'call_not_found' });
    if (row.state !== 'live') return res.status(409).json({ error: 'call_not_live' });
    if (!sayStore.beginTurn(callId)) return res.status(409).json({ error: 'turn_in_progress' });
    sayStore.appendTurn(callId, { role: 'user', content: text });
    res.status(202).json({ ok: true }); 
    const bundle = callPersona.get(callId) ?? null; 
    Promise.resolve()
      .then(() => runChatRelay(
        buildSayDeps(cfg, cloneId),
        { callId, publisherPort: row.port, personaSlug: 'halbae', personaBundle: bundle, history: sayStore.getHistory(callId), text },
      ))
      .then((finalText) => { if (finalText) sayStore.appendTurn(callId, { role: 'assistant', content: finalText }); })
      .catch((e) => console.error('[sp2/say] relay error', callId, e?.message ?? e))
      .finally(() => sayStore.endTurn(callId));
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
