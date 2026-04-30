

import { v_b7c41b } from "zmui";
import type { v_de0a25 } from "../lib/env";
import { v_3ebe58 } from "../lib/errors";
import { v_6690d9 } from "../middleware/auth";
import { v_74defc } from "../lib/logger";

export const v_ff9685 = new v_b7c41b<v_de0a25>();

const v_0e84b9 = "uploadedfiles/";
const v_4fcdd2 = 5 * 1024 * 1024; 
const v_69dc63 = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function v_c0ca5d(v_43e90c, v_c0c2d5): string {

  const v_40a923 =
    v_c0c2d5 === "image/jpeg"
      ? ".jpg"
      : v_c0c2d5 === "image/png"
        ? ".png"
        : v_c0c2d5 === "image/webp"
          ? ".webp"
          : v_c0c2d5 === "image/gif"
            ? ".gif"
            : ".bin";
  const v_2d1eeb = Math.random().toString(36).slice(2, 10);
  const v_b96973 = Math.random().toString(36).slice(2, 10);
  const v_8d41d7 = Date.now().toString(36);
  return `${v_0e84b9}${v_43e90c}/${v_8d41d7}${v_2d1eeb}${v_b96973}${v_40a923}`;
}

v_ff9685.post("/", v_6690d9, async (v_3f4e2e) => {
  const v_43e90c = v_3f4e2e.get("userId")!;
  let v_ebd523;
  try {
    v_ebd523 = await v_3f4e2e.req.formData();
  } catch {
    throw new v_3ebe58("VALIDATION_FAILED", "multipart/form-data required.");
  }

  const v_479f05 = v_ebd523.get("file");
  if (
    !v_479f05 ||
    typeof v_479f05 !== "object" ||
    typeof (v_479f05 as { arrayBuffer?: unknown }).arrayBuffer !== "function"
  ) {
    throw new v_3ebe58("VALIDATION_FAILED", "Missing 'file' field.");
  }
  const v_4de33e = v_479f05 as {
    type: string;
    size: number;
    arrayBuffer: () => Promise<ArrayBuffer>;
  };
  if (!v_69dc63.has(v_4de33e.type)) {
    throw new v_3ebe58(
      "VALIDATION_FAILED",
      `Unsupported content type: ${v_4de33e.type}. Allowed: ${[...v_69dc63].join(", ")}`,
    );
  }
  if (v_4de33e.size > v_4fcdd2) {
    throw new v_3ebe58(
      "VALIDATION_FAILED",
      `File too large (${v_4de33e.size} bytes). Max ${v_4fcdd2} bytes.`,
    );
  }

  const v_fa63e0 = (v_ebd523.get("purpose") as string | null) ?? null;
  const v_0037e3 = v_c0ca5d(v_43e90c, v_4de33e.type);

  const v_83ee53 = await v_4de33e.arrayBuffer();
  await v_3f4e2e.env.R2_ARCHIVE.put(v_0037e3, v_83ee53, {
    httpMetadata: { contentType: v_4de33e.type },
    customMetadata: { ownerUserId: String(v_43e90c), purpose: v_fa63e0 ?? "" },
  });

  const v_81161e = await v_3f4e2e.env.DB
    .prepare(
      `INSERT INTO files (r2_key, content_type, size_bytes, owner_user_id, purpose)
       VALUES (?, ?, ?, ?, ?)
       RETURNING id`,
    )
    .bind(v_0037e3, v_4de33e.type, v_4de33e.size, v_43e90c, v_fa63e0)
    .first<{ id: number }>();

  if (!v_81161e) {

    await v_3f4e2e.env.R2_ARCHIVE.delete(v_0037e3);
    throw new v_3ebe58("INTERNAL_ERROR", "Failed to register file.");
  }

  const v_f17108 = new URL(v_3f4e2e.req.url).origin;
  const v_f71b56 = `${v_f17108}/oth-path${v_81161e.id}`;

  await v_74defc(v_3f4e2e, {
    userId: v_43e90c,
    action: "file.upload",
    details: { fileId: v_81161e.id, purpose: v_fa63e0, contentType: v_4de33e.type, sizeBytes: v_4de33e.size },
  });

  return v_3f4e2e.json(
    {
      id: v_81161e.id,
      url: v_f71b56,
      contentType: v_4de33e.type,
      sizeBytes: v_4de33e.size,
    },
    201,
  );
});

v_ff9685.get("/:id", async (v_3f4e2e) => {
  const v_2c44c0 = v_3f4e2e.req.param("id");
  const v_389afb = Number(v_2c44c0);
  if (!Number.isFinite(v_389afb) || v_389afb <= 0) {
    throw new v_3ebe58("VALIDATION_FAILED", "Invalid file id.");
  }

  const v_3ac7e7 = await v_3f4e2e.env.DB
    .prepare(`SELECT r2_key, content_type FROM files WHERE id = ?`)
    .bind(v_389afb)
    .first<{ r2_key: string; content_type: string }>();

  if (!v_3ac7e7) throw new v_3ebe58("NOT_FOUND", "File not found.");

  const v_8839e3 = await v_3f4e2e.env.R2_ARCHIVE.get(v_3ac7e7.r2_key);
  if (!v_8839e3) throw new v_3ebe58("NOT_FOUND", "Object missing in storage.");

  return new Response(v_8839e3.body, {
    headers: {
      "Content-Type": v_3ac7e7.content_type,
      "Cache-Control": "public, max-age=86400",
    },
  });
});
