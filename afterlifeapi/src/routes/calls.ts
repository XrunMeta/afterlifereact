

import { Hono } from "hono";
import type { AppEnv } from "../lib/env";
import { APIError } from "../lib/errors";
import { requireAuth } from "../middleware/auth";
import { loadCloneById, resolveResponseViewerRole } from "../lib/cloneAccess";

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
  if (!viewerRole) throw new APIError("FORBIDDEN", "No access to this clone for call.");

  const orchUrl = c.env.ORCHESTRATOR_URL;
  let r: Response;
  try {
    r = await fetch(`${orchUrl}/oth-path`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${c.env.ORCH_SECRET}` },

      body: JSON.stringify({ cloneId: String(cloneId), userId: String(userId), idleVideoUrl: null }),
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

calls.post("/:cloneId/call/:callId/end", requireAuth, async (c) => {
  parseCloneId(c);
  const callId = c.req.param("callId");
  const userId = c.get("userId")!;

  if (!/^[0-9a-fA-F-]{8,64}$/.test(callId)) return c.json({ ok: true });
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
