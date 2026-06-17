export interface Size { width: number; height: number }

export interface GestureState { translateX: number; translateY: number; scale: number }
export interface CropRect { originX: number; originY: number; width: number; height: number }

export function baseCoverScale(image: Size, frame: Size): number {
  return Math.max(frame.width / image.width, frame.height / image.height);
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

export function computeCropRect(image: Size, frame: Size, gesture: GestureState): CropRect {
  if (image.width <= 0 || image.height <= 0) {
    throw new Error("computeCropRect: image size must be positive");
  }
  const s0 = baseCoverScale(image, frame);
  const g = Math.max(1, gesture.scale);
  const s = s0 * g;
  const width = frame.width / s;
  const height = frame.height / s;
  const px = image.width / 2 - (frame.width / 2 + gesture.translateX) / s;
  const py = image.height / 2 - (frame.height / 2 + gesture.translateY) / s;
  return {
    originX: clamp(px, 0, Math.max(0, image.width - width)),
    originY: clamp(py, 0, Math.max(0, image.height - height)),
    width,
    height,
  };
}

import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

export const AVATAR_OUT = { width: 512, height: 1024 };

export async function cropToAvatar(
  uri: string,
  image: Size,
  frame: Size,
  gesture: GestureState,
): Promise<string> {
  const r = computeCropRect(image, frame, gesture);
  const result = await manipulateAsync(
    uri,
    [
      { crop: { originX: r.originX, originY: r.originY, width: r.width, height: r.height } },
      { resize: { width: AVATAR_OUT.width, height: AVATAR_OUT.height } },
    ],
    { compress: 0.9, format: SaveFormat.JPEG },
  );
  return result.uri;
}
