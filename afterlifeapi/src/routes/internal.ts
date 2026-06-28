
import { Hono } from "hono";
import type { AppEnv } from "../lib/env";
import { claimJob, claimJobRunning, failJob, finalizeFillerJob, finalizeJob, getJob } from "../lib/assetJobs";
import { z } from "../lib/validate";
import { loadCloneById } from "../lib/cloneAccess";
import { updateOntFromExtraction, type L2Extraction } from "../lib/memoryStore";
import { logActivity } from "../lib/logger";

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

internal.post("/oth-path", async (c) => {
  const auth = c.req.header("Authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token || !c.env.LEARN_SECRET || !safeEqual(token, c.env.LEARN_SECRET)) {
    return c.json({ error: "unauthorized" }, 401);
  }
  const callId = c.req.param("callId");

  if (!/^[0-9a-f]{12}$/.test(callId)) return c.json({ ok: true });
  const endedAt = Date.now();
  await c.env.DB.prepare(
    `UPDATE call_sessions SET ended_at = ?, duration_sec = MAX(0, (? - started_at) / 1000)
     WHERE call_id = ? AND ended_at IS NULL`,
  ).bind(endedAt, endedAt, callId).run();
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

const FILLER_CONTENT_TYPE = "video/mp4";

const FILLER_MAX_FILE_SIZE = 50 * 1024 * 1024;

const FILLER_FILE_COUNT = 3;

internal.post("/filler-job-done", async (c) => {

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

  if (form.get(`file${FILLER_FILE_COUNT}`) !== null) {
    return c.json(
      { error: `too many files: expected exactly ${FILLER_FILE_COUNT} (file0..file${FILLER_FILE_COUNT - 1})` },
      400,
    );
  }
  const fileEntries: File[] = [];
  for (let i = 0; i < FILLER_FILE_COUNT; i++) {
    const entry = form.get(`file${i}`);
    if (!entry || typeof entry === "string") {
      return c.json({ error: `file${i} required (need exactly ${FILLER_FILE_COUNT} files)` }, 400);
    }
    fileEntries.push(entry as File);
  }

  for (let i = 0; i < FILLER_FILE_COUNT; i++) {
    const f = fileEntries[i];
    if (!f) {
      return c.json({ error: `file${i} missing` }, 400);
    }
    if (f.size === 0) {
      return c.json({ error: `file${i} is empty (0 bytes)` }, 400);
    }
    if (f.size > FILLER_MAX_FILE_SIZE) {
      return c.json(
        { error: `file${i} too large: ${f.size} > ${FILLER_MAX_FILE_SIZE} bytes` },
        400,
      );
    }
  }

  const bufs: ArrayBuffer[] = [];
  for (let i = 0; i < FILLER_FILE_COUNT; i++) {
    const buf = await fileEntries[i]?.arrayBuffer();
    if (!buf) {
      return c.json({ error: `file${i} read failed` }, 400);
    }
    bufs.push(buf);
  }

  const claimed = await claimJobRunning(c.env.DB, jobId);
  if (!claimed) {
    return c.json({ ok: true, idempotent: true });
  }

  const origin = new URL(c.req.url).origin;
  const r2Entries: Array<{ r2Key: string; sizeBytes: number }> = [];
  try {
    for (let i = 0; i < FILLER_FILE_COUNT; i++) {
      const buf = bufs[i];
      if (!buf) {
        throw new Error(`buf${i} missing`);
      }
      const uuid = crypto.randomUUID();
      const r2Key = `assets/filler/${uuid}.mp4`;
      await c.env.R2_ARCHIVE.put(r2Key, buf, {
        httpMetadata: { contentType: FILLER_CONTENT_TYPE },
      });
      r2Entries.push({ r2Key, sizeBytes: buf.byteLength });
    }
  } catch (err) {

    for (const { r2Key } of r2Entries) {
      await c.env.R2_ARCHIVE.delete(r2Key).catch(() => {});
    }
    await failJob(c.env.DB, jobId, `r2_upload_failed: ${String(err).slice(0, 400)}`);
    return c.json({ error: "r2_upload_failed" }, 500);
  }

  let urls: string[];
  try {
    urls = await finalizeFillerJob(
      c.env.DB,
      jobId,
      r2Entries,
      job.user_id,
      claimed.clone_id,
      origin,
    );
  } catch (err) {

    for (const { r2Key } of r2Entries) {
      await c.env.R2_ARCHIVE.delete(r2Key).catch(() => {});
    }
    await failJob(c.env.DB, jobId, `db_commit_failed: ${String(err).slice(0, 400)}`);
    return c.json({ error: "db_commit_failed" }, 500);
  }

  return c.json({ ok: true, filler_video_urls: urls });
});

const l2LearnSchema = z.object({
  userId: z.number().int().positive(),
  extracted: z.object({

    preference_personal: z
      .record(z.string().max(100), z.union([z.string().max(200), z.number(), z.boolean()]))
      .optional(),
    relation: z.string().max(200).nullable().optional(),
    memories_personal: z.array(z.string().max(500)).max(20).optional(),
  }),
  source: z.enum(["call", "chat"]),
  session_id: z.string().max(64).optional(),
});

internal.post("/oth-path", async (c) => {
  const auth = c.req.header("Authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token || !c.env.LEARN_SECRET || !safeEqual(token, c.env.LEARN_SECRET)) {
    return c.json({ error: "unauthorized" }, 401);
  }
  const cloneId = Number(c.req.param("id"));
  if (!Number.isInteger(cloneId) || cloneId <= 0) {
    return c.json({ error: "bad_clone_id" }, 400);
  }
  const parsed = l2LearnSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    return c.json({ error: "bad_body", issues: parsed.error.issues }, 400);
  }
  const { userId, extracted, source } = parsed.data;

  const clone = await loadCloneById(c.env.DB, cloneId);
  if (!clone) return c.json({ error: "clone_not_found" }, 404);

  const interacted = await c.env.DB.prepare(
    source === "call"
      ? `SELECT 1 FROM call_sessions WHERE clone_id = ? AND user_id = ? LIMIT 1`
      : `SELECT 1 FROM messages WHERE clone_id = ? AND user_id = ? LIMIT 1`,
  ).bind(cloneId, userId).first();
  if (!interacted) return c.json({ error: "no_interaction" }, 403);

  let result: { rev: number; skipped: boolean };
  try {
    result = await updateOntFromExtraction(
      c.env, cloneId, userId, extracted as L2Extraction, source,
    );
  } catch (err) {
    return c.json({ error: "merge_failed", message: (err as Error).message }, 400);
  }

  await logActivity(c, {
    userId,
    action: "memory.l2.learn",
    details: result.skipped
      ? { cloneId, source, skipped: true }
      : {
          cloneId, source, skipped: false, rev: result.rev,
          keys: Object.keys(extracted.preference_personal ?? {}),
          memCount: extracted.memories_personal?.length ?? 0,
        },
  });
  return c.json(
    result.skipped
      ? { ok: true, skipped: true }
      : { ok: true, skipped: false, rev: result.rev },
  );
});
