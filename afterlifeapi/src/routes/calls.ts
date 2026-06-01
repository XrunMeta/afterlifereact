

import { Hono } from "hono";
import type { AppEnv } from "../lib/env";
import { APIError } from "../lib/errors";
import { requireAuth } from "../middleware/auth";
import { loadCloneById, resolveResponseViewerRole } from "../lib/cloneAccess";
import { loadSystemPersona } from "../lib/systemPersona";
import { resolvePersona } from "../lib/personaResolver";
import { loadCloneProfiles, buildPersonaBundle, flattenAttrs } from "../lib/personaBundle";

export const calls = new Hono<AppEnv>();

function parseCloneId(c: { req: { param: (k: string) => string } }): number {
  const id = Number(c.req.param("cloneId"));
  if (!Number.isInteger(id) || id <= 0) throw new APIError("VALIDATION_FAILED", "Invalid clone id.");
  return id;
}

calls.post("/:cloneId/call", requireAuth, async (c) => {
  const cloneId = parseCloneId(c);
  const userId = c.get("userId")!;
  const clone = await loadCloneById(c.env.DB, cloneId);
  if (!clone) throw new APIError("NOT_FOUND", "Clone not found.");
  const viewerRole = await resolveResponseViewerRole(c.env.DB, clone, userId);

  if (!viewerRole && !clone.is_system) throw new APIError("FORBIDDEN", "No access to this clone for call.");

  const l0 = await loadSystemPersona(c.env.DB);
  const { l1, l2 } = await loadCloneProfiles(c.env.DB, cloneId);
  const persona = resolvePersona({ l1: flattenAttrs(l1), l2 });
  const personaBundle = buildPersonaBundle(l0, persona, cloneId);

  const orchUrl = c.env.ORCHESTRATOR_URL;
  let r: Response;
  try {
    r = await fetch(`${orchUrl}/oth-path`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${c.env.ORCH_SECRET}` },
      body: JSON.stringify({ cloneId: String(cloneId), userId: String(userId), idleVideoUrl: null, personaBundle }),
    });
  } catch (e) {
    throw new APIError("UPSTREAM_FAILURE", `Orchestrator unreachable: ${(e as Error).message}`);
  }
  if (r.status === 503) throw new APIError("SERVICE_UNAVAILABLE", "No call capacity available.");
  if (!r.ok) throw new APIError("UPSTREAM_FAILURE", `Orchestrator error ${r.status}.`);

  const data = (await r.json()) as {
    callId: string;
    subscribeToken: string;
    tracks: { video: string; audio: string };
    state: string;
  };

  await c.env.DB.prepare(
    'INSERT INTO call_sessions (call_id, user_id, clone_id, persona_slug, started_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(data.callId, userId, cloneId, 'halbae', Date.now()).run();

  const subscribeUrl = `${orchUrl}/oth-path${data.callId}/subscribe`;

  return c.json({
    callId: data.callId,
    subscribeUrl,
    renegotiateUrl: `${subscribeUrl}/renegotiate`,
    subscribeToken: data.subscribeToken,
    tracks: data.tracks,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  });
});

calls.post("/:cloneId/call/:callId/say", requireAuth, async (c) => {
  const userId = c.get("userId")!;
  const cloneId = parseCloneId(c);
  const callId = c.req.param("callId");
  const body = await c.req.json<{ text?: string }>().catch(() => ({}) as { text?: string });
  const text = (body.text ?? "").trim();
  if (!text) return c.json({ error: "empty_text" }, 400);

  if (text.length > 2000) return c.json({ error: "text_too_long" }, 400);
  const sess = await c.env.DB.prepare(
    "SELECT user_id FROM call_sessions WHERE call_id = ? AND ended_at IS NULL"
  ).bind(callId).first<{ user_id: number }>();
  if (!sess) return c.json({ error: "call_not_found" }, 404);
  if (sess.user_id !== userId) return c.json({ error: "not_call_owner" }, 403);

  await c.env.DB.prepare(
    `INSERT INTO call_turns (call_id, seq, role, text, created_at)
     SELECT ?, COALESCE(MAX(seq),0)+1, 'user', ?, ?
     FROM call_turns WHERE call_id = ?`
  ).bind(callId, text, Date.now(), callId).run();
  const r = await fetch(`${c.env.ORCHESTRATOR_URL}/oth-path${callId}/say`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${c.env.ORCH_SECRET}` },
    body: JSON.stringify({ text, cloneId }),
  });

  if (r.status === 409) return c.json({ error: "turn_in_progress" }, 429);
  if (!r.ok) return c.json({ error: "orchestrator_error" }, 502);
  return c.json({ ok: true }, 202);
});

calls.post("/:cloneId/call/:callId/end", requireAuth, async (c) => {
  parseCloneId(c);
  const callId = c.req.param("callId");
  const userId = c.get("userId")!;

  if (!/^[0-9a-fA-F-]{8,64}$/.test(callId)) return c.json({ ok: true });

  const sess = await c.env.DB.prepare(
    "SELECT user_id FROM call_sessions WHERE call_id = ? AND ended_at IS NULL"
  ).bind(callId).first<{ user_id: number }>();
  if (sess && sess.user_id !== userId) return c.json({ ok: true }); 

  const endedAt = Date.now();
  await c.env.DB.prepare(
    `UPDATE call_sessions SET ended_at = ?, duration_sec = MAX(0, (? - started_at) / 1000) WHERE call_id = ? AND ended_at IS NULL`
  ).bind(endedAt, endedAt, callId).run();
  try {
    await fetch(`${c.env.ORCHESTRATOR_URL}/oth-path${callId}`, {
      method: "DELETE",

      headers: { "Content-Type": "application/json", Authorization: `Bearer ${c.env.ORCH_SECRET}` },
      body: JSON.stringify({ userId: String(userId) }),
    });
  } catch {

  }
  return c.json({ ok: true });
});
