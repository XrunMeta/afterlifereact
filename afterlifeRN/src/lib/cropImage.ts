export interface Size { width: number; height: number }

export interface GestureState { translateX: number; translateY: number; scale: number }
export interface CropRect { originX: number; originY: number; width: number; height: number }

export function v_f98917(v_7ddb73, v_143cb5): number {
  return Math.max(v_143cb5.width / v_7ddb73.width, v_143cb5.height / v_7ddb73.height);
}

const v_ffa902 = (v_81e2ef, v_bc6da1, v_d54b9c) => Math.min(Math.max(v_81e2ef, v_bc6da1), v_d54b9c);

export function v_e70373(v_7ddb73, v_143cb5, v_0d09bb): CropRect {
  if (v_7ddb73.width <= 0 || v_7ddb73.height <= 0) {
    throw new Error("computeCropRect: image size must be positive");
  }
  const v_ca01e0 = v_f98917(v_7ddb73, v_143cb5);
  const v_206b88 = Math.max(1, v_0d09bb.scale);
  const v_fd5f43 = v_ca01e0 * v_206b88;
  const v_8e4fb6 = v_143cb5.width / v_fd5f43;
  const v_c86e33 = v_143cb5.height / v_fd5f43;
  const v_9b490c = v_7ddb73.width / 2 - (v_143cb5.width / 2 + v_0d09bb.translateX) / v_fd5f43;
  const v_e3976e = v_7ddb73.height / 2 - (v_143cb5.height / 2 + v_0d09bb.translateY) / v_fd5f43;
  return {
    originX: v_ffa902(v_9b490c, 0, Math.max(0, v_7ddb73.width - v_8e4fb6)),
    originY: v_ffa902(v_e3976e, 0, Math.max(0, v_7ddb73.height - v_c86e33)),
    width: v_8e4fb6,
    height: v_c86e33,
  };
}

import { v_516d20, v_91a3cf } from "bxoplsnixpmvnirxbbkstg";

export const v_b4e82e = { width: 512, height: 1024 };

export async function v_34b1b1(
  v_cd1446,
  v_7ddb73,
  v_143cb5,
  v_0d09bb,
): Promise<string> {
  const v_cb35cb = v_e70373(v_7ddb73, v_143cb5, v_0d09bb);
  const v_43c42e = await v_516d20(
    v_cd1446,
    [
      { crop: { originX: v_cb35cb.originX, originY: v_cb35cb.originY, width: v_cb35cb.width, height: v_cb35cb.height } },
      { resize: { width: v_b4e82e.width, height: v_b4e82e.height } },
    ],
    { compress: 0.9, format: v_91a3cf.JPEG },
  );
  return v_43c42e.uri;
}
