import { Buffer } from "buffer";

const { PNG } = require("pngjs/browser") as typeof import("pngjs");
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

const OUT_W = 512;
const OUT_H = 1024;

export async function letterboxToAvatar(
  uri: string,
  contentW: number,
  contentH: number,
  outLeft: number,
  outTop: number,
): Promise<string> {
  const w = Math.max(1, Math.round(contentW));
  const h = Math.max(1, Math.round(contentH));

  const resized = await manipulateAsync(
    uri,
    [{ resize: { width: w } }],
    { compress: 1, format: SaveFormat.PNG, base64: true },
  );
  if (!resized.base64) {
    throw new Error("letterboxToAvatar: missing base64 from resize");
  }

  const src = PNG.sync.read(Buffer.from(resized.base64, "base64"));
  const dst = new PNG({ width: OUT_W, height: OUT_H });
  for (let i = 0; i < dst.data.length; i += 4) {
    dst.data[i] = 0;
    dst.data[i + 1] = 0;
    dst.data[i + 2] = 0;
    dst.data[i + 3] = 255;
  }

  const yAdjust = Math.round((h - src.height) / 2);
  blitPng(src, dst, Math.round(outLeft), Math.round(outTop) + yAdjust);

  const outBuf = PNG.sync.write(dst);
  const dataUri = `data:image/png;base64,${outBuf.toString("base64")}`;
  const final = await manipulateAsync(dataUri, [], { compress: 0.9, format: SaveFormat.JPEG });
  return final.uri;
}

function blitPng(src: PNG, dst: PNG, dx: number, dy: number): void {
  const srcX0 = Math.max(0, -dx);
  const srcY0 = Math.max(0, -dy);
  const dstX0 = Math.max(0, dx);
  const dstY0 = Math.max(0, dy);
  const copyW = Math.min(src.width - srcX0, dst.width - dstX0);
  const copyH = Math.min(src.height - srcY0, dst.height - dstY0);
  if (copyW <= 0 || copyH <= 0) return;

  for (let y = 0; y < copyH; y++) {
    const srcRow = ((srcY0 + y) * src.width + srcX0) * 4;
    const dstRow = ((dstY0 + y) * dst.width + dstX0) * 4;
    const bytes = copyW * 4;
    if (typeof (src.data as Buffer).copy === "function") {
      (src.data as Buffer).copy(dst.data as Buffer, dstRow, srcRow, srcRow + bytes);
    } else {
      dst.data.set(src.data.subarray(srcRow, srcRow + bytes), dstRow);
    }
  }
}
