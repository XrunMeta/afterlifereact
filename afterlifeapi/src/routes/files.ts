

import { Hono } from "hono";
import type { AppEnv } from "../lib/env";
import { APIError } from "../lib/errors";
import { requireAuth } from "../middleware/auth";
import { logActivity } from "../lib/logger";

export const files = new Hono<AppEnv>();

const UPLOAD_PREFIX = "uploadedfiles/";
const MAX_BYTES = 5 * 1024 * 1024; 
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",

  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "audio/x-m4a",
  "audio/m4a",
  "audio/aac",
  "audio/webm",
  "audio/ogg",
]);

function generateKey(userId: number, contentType: string): string {

  const ext =
    contentType === "image/jpeg"
      ? ".jpg"
      : contentType === "image/png"
        ? ".png"
        : contentType === "image/webp"
          ? ".webp"
          : contentType === "image/gif"
            ? ".gif"
            : contentType === "audio/mpeg" || contentType === "audio/mp3"
              ? ".mp3"
              : contentType === "audio/wav" || contentType === "audio/x-wav"
                ? ".wav"
                : contentType === "audio/mp4" || contentType === "audio/x-m4a" || contentType === "audio/m4a"
                  ? ".m4a"
                  : contentType === "audio/aac"
                    ? ".aac"
                    : contentType === "audio/webm"
                      ? ".webm"
                      : contentType === "audio/ogg"
                        ? ".ogg"
                        : ".bin";
  const r1 = Math.random().toString(36).slice(2, 10);
  const r2 = Math.random().toString(36).slice(2, 10);
  const t = Date.now().toString(36);
  return `${UPLOAD_PREFIX}${userId}/${t}${r1}${r2}${ext}`;
}

files.post("/", requireAuth, async (c) => {
  const userId = c.get("userId")!;
  let form: FormData;
  try {
    form = await c.req.formData();
  } catch {
    throw new APIError("VALIDATION_FAILED", "multipart/form-data required.");
  }

  const raw = form.get("file");
  if (
    !raw ||
    typeof raw !== "object" ||
    typeof (raw as { arrayBuffer?: unknown }).arrayBuffer !== "function"
  ) {
    throw new APIError("VALIDATION_FAILED", "Missing 'file' field.");
  }
  const file = raw as {
    type: string;
    size: number;
    arrayBuffer: () => Promise<ArrayBuffer>;
  };
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new APIError(
      "VALIDATION_FAILED",
      `Unsupported content type: ${file.type}. Allowed: ${[...ALLOWED_TYPES].join(", ")}`,
    );
  }
  if (file.size > MAX_BYTES) {
    throw new APIError(
      "VALIDATION_FAILED",
      `File too large (${file.size} bytes). Max ${MAX_BYTES} bytes.`,
    );
  }

  const purpose = (form.get("purpose") as string | null) ?? null;
  const r2Key = generateKey(userId, file.type);

  const buf = await file.arrayBuffer();
  await c.env.R2_ARCHIVE.put(r2Key, buf, {
    httpMetadata: { contentType: file.type },
    customMetadata: { ownerUserId: String(userId), purpose: purpose ?? "" },
  });

  const inserted = await c.env.DB
    .prepare(
      `INSERT INTO files (r2_key, content_type, size_bytes, owner_user_id, purpose)
       VALUES (?, ?, ?, ?, ?)
       RETURNING id`,
    )
    .bind(r2Key, file.type, file.size, userId, purpose)
    .first<{ id: number }>();

  if (!inserted) {

    await c.env.R2_ARCHIVE.delete(r2Key);
    throw new APIError("INTERNAL_ERROR", "Failed to register file.");
  }

  const origin = new URL(c.req.url).origin;
  const url = `${origin}/oth-path${inserted.id}`;

  await logActivity(c, {
    userId,
    action: "file.upload",
    details: { fileId: inserted.id, purpose, contentType: file.type, sizeBytes: file.size },
  });

  return c.json(
    {
      id: inserted.id,
      url,
      contentType: file.type,
      sizeBytes: file.size,
    },
    201,
  );
});

files.get("/:id", async (c) => {
  const idRaw = c.req.param("id");
  const id = Number(idRaw);
  if (!Number.isFinite(id) || id <= 0) {
    throw new APIError("VALIDATION_FAILED", "Invalid file id.");
  }

  const row = await c.env.DB
    .prepare(`SELECT r2_key, content_type FROM files WHERE id = ?`)
    .bind(id)
    .first<{ r2_key: string; content_type: string }>();

  if (!row) throw new APIError("NOT_FOUND", "File not found.");

  const obj = await c.env.R2_ARCHIVE.get(row.r2_key);
  if (!obj) throw new APIError("NOT_FOUND", "Object missing in storage.");

  return new Response(obj.body, {
    headers: {
      "Content-Type": row.content_type,
      "Cache-Control": "public, max-age=86400",
    },
  });
});
