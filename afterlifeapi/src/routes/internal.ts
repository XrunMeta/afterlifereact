
import { Hono } from "hono";
import type { AppEnv } from "../lib/env";
import { claimJob, failJob, finalizeJob, getJob } from "../lib/assetJobs";

export const internal = new Hono<AppEnv>();

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

internal.post("/oth-path", async (c) => {
  const auth = c.req.header("Authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token || !c.env.ORCH_SECRET || !safeEqual(token, c.env.ORCH_SECRET)) {
    return c.json({ error: "unauthorized" }, 401);
  }

  const callId = c.req.param("callId");
  const body = await c.req
    .json<{ role?: string; text?: string }>()
    .catch(() => ({}) as { role?: string; text?: string });
  const text = (body.text ?? "").trim();
  const role = body.role === "clone" ? "clone" : null;
  if (!role || !text) return c.json({ error: "bad_turn" }, 400);

  const sess = await c.env.DB.prepare(
    "SELECT 1 FROM call_sessions WHERE call_id = ?"
  ).bind(callId).first();
  if (!sess) return c.json({ error: "call_not_found" }, 404);

  await c.env.DB.prepare(
    `INSERT INTO call_turns (call_id, seq, role, text, created_at)
     SELECT ?, COALESCE(MAX(seq),0)+1, ?, ?, ?
     FROM call_turns WHERE call_id = ?`
  ).bind(callId, role, text, Date.now(), callId).run();
  return c.json({ ok: true });
});

const SIZE_LIMITS: Record<string, number> = {
  idle_video: 300 * 1024 * 1024,  
  voice_clone: 50 * 1024 * 1024,  
};

const FORCED_CONTENT_TYPE: Record<string, string> = {
  idle_video: "video/mp4",
  voice_clone: "application/octet-stream",
};

internal.post("/asset-job-done", async (c) => {

  const auth = c.req.header("Authorization") ?? "";
  const tok = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!tok || !c.env.ORCH_SECRET || !safeEqual(tok, c.env.ORCH_SECRET)) {
    return c.json({ error: "unauthorized" }, 401);
  }

  const form = await c.req.formData();
  const jobId = String(form.get("job_id") ?? "");
  const status = String(form.get("status") ?? "");
  if (!jobId) return c.json({ error: "job_id required" }, 400);

  const job = await getJob(c.env.DB, jobId);
  if (!job) return c.json({ error: "job not found" }, 404);

  const callbackToken = String(form.get("callback_token") ?? "");
  if (!job.callback_token || !callbackToken || !safeEqual(callbackToken, job.callback_token)) {
    return c.json({ error: "invalid callback_token" }, 403);
  }

  if (status === "failed") {
    await failJob(c.env.DB, jobId, String(form.get("error") ?? "generation failed"));
    return c.json({ ok: true });
  }

  const fileEntry = form.get("file");
  if (!fileEntry || typeof fileEntry === "string") return c.json({ error: "file required" }, 400);
  const file = fileEntry as File;
  const buf = await file.arrayBuffer();

  const sizeLimit = SIZE_LIMITS[job.kind];
  if (sizeLimit !== undefined && buf.byteLength > sizeLimit) {
    return c.json(
      { error: `file too large: ${buf.byteLength} > ${sizeLimit} bytes` },
      400,
    );
  }

  const claimed = await claimJob(c.env.DB, jobId);
  if (!claimed) {

    return c.json({ ok: true, idempotent: true });
  }

  const contentType = FORCED_CONTENT_TYPE[claimed.kind] ?? "application/octet-stream";

  const ext = claimed.kind === "idle_video" ? "mp4" : "pth";
  const r2Key = `assets/${claimed.kind}/${jobId}.${ext}`;
  await c.env.R2_ARCHIVE.put(r2Key, buf, {
    httpMetadata: { contentType },
  });

  const ins = await c.env.DB
    .prepare(
      `INSERT INTO files (r2_key, content_type, size_bytes, owner_user_id, purpose) VALUES (?,?,?,?,?) RETURNING id`,
    )
    .bind(r2Key, contentType, buf.byteLength, job.user_id, `asset_${claimed.kind}`)
    .first<{ id: number }>();

  const origin = new URL(c.req.url).origin;
  const outUrl = `${origin}/oth-path${ins!.id}`;

  await finalizeJob(c.env.DB, jobId, ins!.id, outUrl, claimed.clone_id, claimed.kind);

  return c.json({ ok: true, out_url: outUrl });
});
