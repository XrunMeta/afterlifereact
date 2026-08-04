import { Buffer } from "buffer";

const { PNG } = require("pngjs/browser") as typeof import("pngjs");
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

type PngImage = InstanceType<typeof PNG>;

const OUT_W = 512;
const OUT_H = 1024;

const TINY_W = 6;

const FEATHER = 40;

const RAMP_RATIO = 0.4;
const RAMP = OUT_W * RAMP_RATIO;

interface Rgb { r: number; g: number; b: number }

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

  const yAdjust = Math.round((h - src.height) / 2);
  const dx = Math.round(outLeft);
  const dy = Math.round(outTop) + yAdjust;

  const tiny = await readTiny(uri);
  if (tiny) {
    fillBlurPadding(dst, OUT_W, OUT_H, tiny, dx, dy, src.width, src.height, RAMP);
  } else {

    fillSolid(dst, { r: 0, g: 0, b: 0 });
  }

  blitPngFeathered(src, dst, dx, dy);

  const outBuf = PNG.sync.write(dst);
  const dataUri = `data:image/png;base64,${outBuf.toString("base64")}`;
  const final = await manipulateAsync(dataUri, [], { compress: 0.9, format: SaveFormat.JPEG });
  return final.uri;
}

export async function averagePaddingColor(uri: string): Promise<string | null> {
  const tiny = await readTiny(uri);
  if (!tiny) return null;
  const { r, g, b } = tiny.avg;
  return `rgb(${r}, ${g}, ${b})`;
}

export const PAD_SCALE = 2;

export async function buildPaddedBackground(
  uri: string,
  imgW: number,
  imgH: number,
  pw = 480,
): Promise<string | null> {
  const tiny = await readTiny(uri);
  if (!tiny) return null;
  try {
    const t0 = Date.now();
    const ph = Math.max(1, Math.round((pw * imgH) / Math.max(1, imgW)));
    const cw = pw, ch = ph;
    const W = cw * PAD_SCALE, H = ch * PAD_SCALE;
    const cx = Math.round((W - cw) / 2), cy = Math.round((H - ch) / 2);
    const png = new PNG({ width: W, height: H });
    const tFill = Date.now();
    fillBlurPadding(png, W, H, tiny, cx, cy, cw, ch, RAMP_RATIO * cw);
    const tEnc = Date.now();
    const buf = PNG.sync.write(png);
    const uriOut = `data:image/png;base64,${buf.toString("base64")}`;
    if (__DEV__) {
      console.log(
        `[T-244] padded bg ${W}x${H} (${((W * H) / 1e6).toFixed(2)}M px) · ` +
        `fill ${tEnc - tFill}ms · encode ${Date.now() - tEnc}ms · total ${Date.now() - t0}ms`,
      );
    }
    return uriOut;
  } catch {
    return null;
  }
}

interface Tiny { data: Buffer | Uint8Array; width: number; height: number; avg: Rgb }

async function readTiny(uri: string): Promise<Tiny | null> {
  try {
    const res = await manipulateAsync(
      uri,
      [{ resize: { width: TINY_W } }],
      { compress: 1, format: SaveFormat.PNG, base64: true },
    );
    if (!res.base64) return null;
    const png = PNG.sync.read(Buffer.from(res.base64, "base64"));
    let sr = 0, sg = 0, sb = 0;
    const n = png.width * png.height;
    for (let i = 0; i < png.data.length; i += 4) {
      sr += png.data[i]; sg += png.data[i + 1]; sb += png.data[i + 2];
    }
    return {
      data: png.data,
      width: png.width,
      height: png.height,
      avg: { r: Math.round(sr / n), g: Math.round(sg / n), b: Math.round(sb / n) },
    };
  } catch {
    return null;
  }
}

function fillSolid(dst: PngImage, c: Rgb): void {
  for (let i = 0; i < dst.data.length; i += 4) {
    dst.data[i] = c.r;
    dst.data[i + 1] = c.g;
    dst.data[i + 2] = c.b;
    dst.data[i + 3] = 255;
  }
}

function fillBlurPadding(
  dst: PngImage, dstW: number, dstH: number, tiny: Tiny,
  cx: number, cy: number, cw: number, ch: number, ramp: number,
): void {
  const { avg } = tiny;
  const tw = tiny.width, th = tiny.height;
  const RAMP2 = ramp * ramp;

  for (let y = 0; y < dstH; y++) {

    const dyOut = y < cy ? cy - y : (y >= cy + ch ? y - (cy + ch - 1) : 0);
    const dy2 = dyOut * dyOut;

    const fy = clamp(((y - cy) / Math.max(1, ch - 1)) * (th - 1), 0, th - 1);
    const y0 = Math.floor(fy), y1 = Math.min(y0 + 1, th - 1), wy = fy - y0;

    for (let x = 0; x < dstW; x++) {
      const o = (y * dstW + x) * 4;
      dst.data[o + 3] = 255;

      const dxOut = x < cx ? cx - x : (x >= cx + cw ? x - (cx + cw - 1) : 0);
      const d2 = dxOut * dxOut + dy2;
      if (d2 >= RAMP2) {

        dst.data[o] = avg.r; dst.data[o + 1] = avg.g; dst.data[o + 2] = avg.b;
        continue;
      }

      const fx = clamp(((x - cx) / Math.max(1, cw - 1)) * (tw - 1), 0, tw - 1);
      const x0 = Math.floor(fx), x1 = Math.min(x0 + 1, tw - 1), wx = fx - x0;
      const i00 = (y0 * tw + x0) * 4, i01 = (y0 * tw + x1) * 4;
      const i10 = (y1 * tw + x0) * 4, i11 = (y1 * tw + x1) * 4;
      const t = d2 === 0 ? 0 : Math.sqrt(d2) / ramp;

      for (let k = 0; k < 3; k++) {
        const top = tiny.data[i00 + k] * (1 - wx) + tiny.data[i01 + k] * wx;
        const bot = tiny.data[i10 + k] * (1 - wx) + tiny.data[i11 + k] * wx;
        const blurred = top * (1 - wy) + bot * wy;
        const a = k === 0 ? avg.r : k === 1 ? avg.g : avg.b;
        dst.data[o + k] = (blurred * (1 - t) + a * t) | 0;
      }
    }
  }
}

function blitPngFeathered(src: PngImage, dst: PngImage, dx: number, dy: number): void {
  const srcX0 = Math.max(0, -dx);
  const srcY0 = Math.max(0, -dy);
  const dstX0 = Math.max(0, dx);
  const dstY0 = Math.max(0, dy);
  const copyW = Math.min(src.width - srcX0, dst.width - dstX0);
  const copyH = Math.min(src.height - srcY0, dst.height - dstY0);
  if (copyW <= 0 || copyH <= 0) return;

  const fTop = dy > 0;
  const fBottom = dy + src.height < OUT_H;
  const fLeft = dx > 0;
  const fRight = dx + src.width < OUT_W;
  const horiz = fLeft || fRight;

  for (let y = 0; y < copyH; y++) {
    const sy = srcY0 + y;
    const srcRow = (sy * src.width + srcX0) * 4;
    const dstRow = ((dstY0 + y) * dst.width + dstX0) * 4;

    let ay = 1;
    if (fTop) ay = Math.min(ay, (sy + 1) / FEATHER);
    if (fBottom) ay = Math.min(ay, (src.height - sy) / FEATHER);
    if (ay > 1) ay = 1;

    if (ay >= 1 && !horiz) {

      const bytes = copyW * 4;
      if (typeof (src.data as Buffer).copy === "function") {
        (src.data as Buffer).copy(dst.data as Buffer, dstRow, srcRow, srcRow + bytes);
      } else {
        dst.data.set(src.data.subarray(srcRow, srcRow + bytes), dstRow);
      }
      continue;
    }

    for (let x = 0; x < copyW; x++) {
      const sx = srcX0 + x;
      let a = ay;
      if (fLeft) a = Math.min(a, (sx + 1) / FEATHER);
      if (fRight) a = Math.min(a, (src.width - sx) / FEATHER);
      if (a > 1) a = 1;
      const s = srcRow + x * 4;
      const o = dstRow + x * 4;
      if (a >= 1) {
        dst.data[o] = src.data[s];
        dst.data[o + 1] = src.data[s + 1];
        dst.data[o + 2] = src.data[s + 2];
      } else {
        dst.data[o] = (dst.data[o] * (1 - a) + src.data[s] * a) | 0;
        dst.data[o + 1] = (dst.data[o + 1] * (1 - a) + src.data[s + 1] * a) | 0;
        dst.data[o + 2] = (dst.data[o + 2] * (1 - a) + src.data[s + 2] * a) | 0;
      }
      dst.data[o + 3] = 255;
    }
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
