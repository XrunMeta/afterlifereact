

import { Hono } from "hono";
import type { AppEnv } from "../lib/env";
import { APIError } from "../lib/errors";
import { requireAuth } from "../middleware/auth";
import {
  loadCloneById,
  resolveResponseViewerRole,
} from "../lib/cloneAccess";

export const sessions = new Hono<AppEnv>();

function parseCloneId(c: { req: { param: (k: string) => string } }): number {
  const id = Number(c.req.param("cloneId"));
  if (!Number.isInteger(id) || id <= 0) {
    throw new APIError("VALIDATION_FAILED", "Invalid clone id.");
  }
  return id;
}

sessions.post("/:cloneId", requireAuth, async (c) => {
  const cloneId = parseCloneId(c);
  const userId = c.get("userId")!;
  const clone = await loadCloneById(c.env.DB, cloneId);
  if (!clone) throw new APIError("NOT_FOUND", "Clone not found.");

  const viewerRole = await resolveResponseViewerRole(c.env.DB, clone, userId);
  if (!viewerRole) {
    throw new APIError("FORBIDDEN", "No access to this clone for session.");
  }

  const sessionId = `sess-${crypto.randomUUID()}`;
  const livekitRoom = `room-${cloneId}-${sessionId.slice(5, 13)}`;

  const livekitToken = `stub.${sessionId}.${userId}`;

  const cloudflareCallsAppId = "stub-calls-app";
  const loraUri = `r2://afterlife-models/${clone.clone_type}/${clone.username}.lora`;
  const ttsVoiceUri = `r2://afterlife-voices/${clone.clone_type}/${clone.username}.pt`;
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  return c.json({
    sessionId,
    livekitRoom,
    livekitToken,
    cloudflareCallsAppId,
    loraUri,
    ttsVoiceUri,
    expiresAt,
    viewerRole,
  });
});
