

import fs from 'node:fs';
import path from 'node:path';

const SAFE_SEGMENT_RE = /^[a-zA-Z0-9_-]+$/;

function isSameOrigin(url, apiBaseUrl) {
  try {
    const parsed = new URL(url);
    const allowed = new URL(apiBaseUrl);
    return parsed.protocol === allowed.protocol && parsed.host === allowed.host;
  } catch {
    return false;
  }
}

export async function ensureLocalAsset({ url, destPath, fetchImpl, maxBytes }) {

  if (fs.existsSync(destPath)) return;

  fs.mkdirSync(path.dirname(destPath), { recursive: true });

  const res = await fetchImpl(url);
  if (!res.ok) {
    throw new Error(`fetch_failed: ${url} status=${res.status ?? 'unknown'}`);
  }

  if (maxBytes != null) {
    const cl = res.headers?.get?.('content-length');
    if (cl != null) {
      const clNum = parseInt(cl, 10);
      if (!isNaN(clNum) && clNum > maxBytes) {
        throw new Error(`size_exceeded: content-length=${clNum} > maxBytes=${maxBytes} url=${url}`);
      }
    }
  }

  const buf = await res.arrayBuffer();

  if (maxBytes != null && buf.byteLength > maxBytes) {
    throw new Error(`size_exceeded: byteLength=${buf.byteLength} > maxBytes=${maxBytes} url=${url}`);
  }

  fs.writeFileSync(destPath, Buffer.from(buf));
}

export async function ensureAssets({ cloneId, assets = {}, dirs, apiBaseUrl, fetchImpl }) {
  const fetch_ = fetchImpl ?? globalThis.fetch;
  const { voiceRefDir, videoRefDir, imageRefDir } = dirs;

  const cloneIdSafe = SAFE_SEGMENT_RE.test(cloneId);
  if (!cloneIdSafe) {
    console.warn(`[assetFetch] unsafe cloneId rejected: ${JSON.stringify(cloneId)}`);
  }

  async function safePull(url, destPath, baseDir, maxBytes) {
    if (!url) return null;

    if (!isSameOrigin(url, apiBaseUrl)) return null;

    const resolvedDest = path.resolve(destPath);
    const resolvedBase = path.resolve(baseDir);
    if (!resolvedDest.startsWith(resolvedBase + path.sep) && resolvedDest !== resolvedBase) {
      console.warn(`[assetFetch] path traversal blocked: ${destPath}`);
      return null;
    }

    try {
      await ensureLocalAsset({ url, destPath, fetchImpl: fetch_, maxBytes });
      return destPath;
    } catch (e) {
      console.warn(`[assetFetch] pull failed (graceful): ${e?.message ?? e}`);
      return null;
    }
  }

  let ttsSePath = null;
  if (assets.voiceSeUrl) {
    if (!cloneIdSafe) {

      ttsSePath = null;
    } else {
      const dest = path.join(voiceRefDir, cloneId, 'se.pth');

      ttsSePath = await safePull(assets.voiceSeUrl, dest, voiceRefDir, 10 * 1024 * 1024);
    }
  } else if (assets.voiceSeKey) {

    if (!SAFE_SEGMENT_RE.test(assets.voiceSeKey)) {
      console.warn(`[assetFetch] unsafe voiceSeKey rejected: ${JSON.stringify(assets.voiceSeKey)}`);
      ttsSePath = null;
    } else {

      const dest = path.join(voiceRefDir, assets.voiceSeKey, 'se.pth');

      const resolvedDest = path.resolve(dest);
      const resolvedBase = path.resolve(voiceRefDir);
      if (!resolvedDest.startsWith(resolvedBase + path.sep) && resolvedDest !== resolvedBase) {
        console.warn(`[assetFetch] voiceSeKey path traversal blocked: ${dest}`);
        ttsSePath = null;
      } else {

        ttsSePath = fs.existsSync(dest) ? dest : null;
      }
    }
  }

  let museVideoPath = null;
  if (assets.idleVideoUrl) {
    if (!cloneIdSafe) {
      museVideoPath = null;
    } else {
      const dest = path.join(videoRefDir, cloneId, 'idle-25fps.mp4');

      museVideoPath = await safePull(assets.idleVideoUrl, dest, videoRefDir, 100 * 1024 * 1024);
    }
  }

  let avatarImagePath = null;
  if (assets.avatarUrl) {
    if (!cloneIdSafe) {
      avatarImagePath = null;
    } else {
      const dest = path.join(imageRefDir, `${cloneId}.png`);

      avatarImagePath = await safePull(assets.avatarUrl, dest, imageRefDir, 10 * 1024 * 1024);
    }
  }

  return { museVideoPath, ttsSePath, avatarImagePath };
}
