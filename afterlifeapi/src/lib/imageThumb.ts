

import { v_3b1158 } from "geuuxblzhcwkieznpwdbkwe";

export const v_d0b3cf = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",

]);

export const v_525c0c = 400;
export const v_d11b3f = 75;

export async function v_6a8de9(
  v_bbda62,
  v_c0c2d5,
): Promise<Uint8Array | null> {
  if (!v_d0b3cf.has(v_c0c2d5)) return null;
  try {
    const v_fbb6da = v_bbda62 instanceof Uint8Array ? v_bbda62 : new Uint8Array(v_bbda62);

    const v_8d4337 = await v_3b1158({
      image: v_fbb6da,
      width: v_525c0c,
      quality: v_d11b3f,
      format: "webp",
    });
    if (!v_8d4337 || v_8d4337.byteLength === 0) return null;
    return v_8d4337 instanceof Uint8Array ? v_8d4337 : new Uint8Array(v_8d4337);
  } catch (v_49263d) {
    console.warn("[imageThumb] 생성 실패:", (v_49263d as Error)?.message ?? v_49263d);
    return null;
  }
}

export function v_dc8268(v_574c7d): string {

  const v_694b25 = v_574c7d.startsWith("uploadedfiles/")
    ? v_574c7d.replace(/^uploadedfiles\//, "uploadedfiles-thumb/")
    : `uploadedfiles-thumb/${v_574c7d}`;
  return v_694b25.replace(/\.[^./]+$/, ".webp");
}

export type ThumbSource = {
  id: number;
  r2_key: string;
  content_type: string;
  owner_user_id: number | null;
};

export type ThumbResult =
  | { ok: true; key: string; bytes: number }
  | { ok: false; reason: "unsupported" | "missing" | "encode_failed" };

export async function v_bb797a(
  v_c9c489,
  v_4de33e,
  v_f7fd54,
): Promise<ThumbResult> {
  if (!v_d0b3cf.has(v_4de33e.content_type)) return { ok: false, reason: "unsupported" };
  let v_bbda62 = v_f7fd54;
  if (!v_bbda62) {
    const v_8839e3 = await v_c9c489.R2_ARCHIVE.get(v_4de33e.r2_key);
    if (!v_8839e3) return { ok: false, reason: "missing" };
    v_bbda62 = await v_8839e3.arrayBuffer();
  }
  const v_fbb6da = await v_6a8de9(v_bbda62, v_4de33e.content_type);
  if (!v_fbb6da) return { ok: false, reason: "encode_failed" };
  const v_b24339 = v_dc8268(v_4de33e.r2_key);
  await v_c9c489.R2_ARCHIVE.put(v_b24339, v_fbb6da, {
    httpMetadata: { contentType: "image/webp" },
    customMetadata: {
      ownerUserId: String(v_4de33e.owner_user_id ?? ""),
      kind: "thumb",
      sourceFileId: String(v_4de33e.id),
    },
  });
  await v_c9c489.DB.prepare(`UPDATE files SET thumb_r2_key = ? WHERE id = ?`).bind(v_b24339, v_4de33e.id).run();
  return { ok: true, key: v_b24339, bytes: v_fbb6da.byteLength };
}
