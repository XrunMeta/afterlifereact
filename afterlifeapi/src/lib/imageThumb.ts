

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

  const v_694b25 = v_574c7d.replace(/^uploadedfiles\//, "uploadedfiles-thumb/");
  return v_694b25.replace(/\.[^./]+$/, ".webp");
}
