import { v_516d20, v_91a3cf } from "bxoplsnixpmvnirxbbkstg";
import { v_a96eba } from "./letterboxAvatar";

export interface Size { width: number; height: number }

export interface GestureState { translateX: number; translateY: number; scale: number }
export interface CropRect { originX: number; originY: number; width: number; height: number }

export const v_b4e82e = { width: 512, height: 1024 };

export function v_f98917(v_7ddb73, v_143cb5): number {
  return Math.max(v_143cb5.width / v_7ddb73.width, v_143cb5.height / v_7ddb73.height);
}

const v_ffa902 = (v_81e2ef, v_bc6da1, v_d54b9c) => Math.min(Math.max(v_81e2ef, v_bc6da1), v_d54b9c);

export const v_d0c8d8 = 0.35;
export const v_66052e = 10;

export const v_723b6d = 1;

export function v_0916d7(v_479f05, v_43e24b = v_d0c8d8, v_d2c6bf = v_66052e): number {
  return v_ffa902(v_479f05, v_43e24b, v_d2c6bf);
}

export function v_f965d7(
  v_7ddb73,
  v_143cb5,
  v_a37637,
  v_3bbadf,
): { x: number; y: number } {
  const v_ca01e0 = v_f98917(v_7ddb73, v_143cb5);
  const v_fd5f43 = v_ca01e0 * Math.max(v_d0c8d8, v_a37637);
  const v_0fb40d = v_7ddb73.width * v_fd5f43;
  const v_5d608b = v_7ddb73.height * v_fd5f43;
  const v_1a63bc = Math.abs(v_0fb40d - v_143cb5.width) / 2;
  const v_6705a2 = Math.abs(v_5d608b - v_143cb5.height) / 2;
  return {
    x: v_ffa902(v_3bbadf.x, -v_1a63bc, v_1a63bc),
    y: v_ffa902(v_3bbadf.y, -v_6705a2, v_6705a2),
  };
}

export interface CropLayout { image: Size; frame: Size }

export function v_622116(
  v_6c4b91,
  v_a37637,
  v_3bbadf,
): boolean {
  const { image: v_7ddb73, frame: v_143cb5 } = v_6c4b91;
  const v_99d446 = 0.5; 
  const v_ca01e0 = v_f98917(v_7ddb73, v_143cb5);
  const v_fd5f43 = v_ca01e0 * Math.max(v_d0c8d8, v_a37637);
  const v_0fb40d = v_7ddb73.width * v_fd5f43;
  const v_5d608b = v_7ddb73.height * v_fd5f43;
  const v_1a63bc = Math.abs(v_0fb40d - v_143cb5.width) / 2;
  const v_6705a2 = Math.abs(v_5d608b - v_143cb5.height) / 2;
  return Math.abs(v_3bbadf.x) <= v_1a63bc + v_99d446 && Math.abs(v_3bbadf.y) <= v_6705a2 + v_99d446;
}

export function v_e70373(v_7ddb73, v_143cb5, v_0d09bb): CropRect {
  if (v_7ddb73.width <= 0 || v_7ddb73.height <= 0) {
    throw new Error("computeCropRect: image size must be positive");
  }
  const v_ca01e0 = v_f98917(v_7ddb73, v_143cb5);
  const v_206b88 = Math.max(v_723b6d, v_0d09bb.scale);
  const v_fd5f43 = v_ca01e0 * v_206b88;
  const v_8e4fb6 = v_143cb5.width / v_fd5f43;
  const v_c86e33 = v_143cb5.height / v_fd5f43;
  const v_9b490c = v_7ddb73.width / 2 - (v_143cb5.width / 2 + v_0d09bb.translateX) / v_fd5f43;
  const v_e3976e = v_7ddb73.height / 2 - (v_143cb5.height / 2 + v_0d09bb.translateY) / v_fd5f43;

  const v_32f7b8 = Math.max(1, Math.min(v_7ddb73.width, Math.round(v_8e4fb6)));
  const v_65a2cd = Math.max(1, Math.min(v_7ddb73.height, Math.round(v_c86e33)));
  return {
    originX: v_ffa902(Math.round(v_9b490c), 0, v_7ddb73.width - v_32f7b8),
    originY: v_ffa902(Math.round(v_e3976e), 0, v_7ddb73.height - v_65a2cd),
    width: v_32f7b8,
    height: v_65a2cd,
  };
}

export function v_76809a(
  v_7ddb73,
  v_143cb5,
  v_0d09bb,
): { contentW: number; contentH: number; outLeft: number; outTop: number } {
  const v_ca01e0 = v_f98917(v_7ddb73, v_143cb5);
  const v_206b88 = Math.max(v_d0c8d8, Math.min(v_723b6d, v_0d09bb.scale));
  const v_fd5f43 = v_ca01e0 * v_206b88;
  const v_0fb40d = v_7ddb73.width * v_fd5f43;
  const v_5d608b = v_7ddb73.height * v_fd5f43;
  const v_e7008f = v_b4e82e.width / v_143cb5.width;
  const v_708a6a = v_0fb40d * v_e7008f;
  const v_9189c0 = v_5d608b * v_e7008f;
  const v_e6390e = (v_143cb5.width - v_0fb40d) / 2 + v_0d09bb.translateX;
  const v_e1795f = (v_143cb5.height - v_5d608b) / 2 + v_0d09bb.translateY;
  return {
    contentW: v_708a6a,
    contentH: v_9189c0,
    outLeft: v_e6390e * v_e7008f,
    outTop: v_e1795f * v_e7008f,
  };
}

export async function v_34b1b1(
  v_cd1446,
  v_7ddb73,
  v_143cb5,
  v_0d09bb,
): Promise<string> {
  if (v_0d09bb.scale < v_723b6d) {
    const v_6c4b91 = v_76809a(v_7ddb73, v_143cb5, v_0d09bb);
    return v_a96eba(v_cd1446, v_6c4b91.contentW, v_6c4b91.contentH, v_6c4b91.outLeft, v_6c4b91.outTop);
  }

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
