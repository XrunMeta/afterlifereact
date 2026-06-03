

import fs from 'node:fs';
import path from 'node:path';

export async function ensureLocalAsset({ url, destPath, fetchImpl }) {

  if (fs.existsSync(destPath)) return;

  fs.mkdirSync(path.dirname(destPath), { recursive: true });

  const res = await fetchImpl(url);
  if (!res.ok) {
    throw new Error(`fetch_failed: ${url} status=${res.status ?? 'unknown'}`);
  }
  const buf = await res.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(buf));
}

export async function ensureAssets({ cloneId, assets = {}, dirs, apiBaseUrl, fetchImpl }) {
  const fetch_ = fetchImpl ?? globalThis.fetch;
  const { voiceRefDir, videoRefDir, imageRefDir } = dirs;

  async function safePull(url, destPath) {
    if (!url) return null;

    if (!url.startsWith(apiBaseUrl)) return null;
    try {
      await ensureLocalAsset({ url, destPath, fetchImpl: fetch_ });
      return destPath;
    } catch {
      return null;
    }
  }

  let ttsSePath = null;
  if (assets.voiceSeUrl) {

    const dest = path.join(voiceRefDir, cloneId, 'se.pth');
    ttsSePath = await safePull(assets.voiceSeUrl, dest);
  } else if (assets.voiceSeKey) {

    const dest = path.join(voiceRefDir, assets.voiceSeKey, 'se.pth');

    ttsSePath = fs.existsSync(dest) ? dest : null;
  }

  let museVideoPath = null;
  if (assets.idleVideoUrl) {
    const dest = path.join(videoRefDir, cloneId, 'idle-25fps.mp4');
    museVideoPath = await safePull(assets.idleVideoUrl, dest);
  }

  let avatarImagePath = null;
  if (assets.avatarUrl) {
    const dest = path.join(imageRefDir, `${cloneId}.png`);
    avatarImagePath = await safePull(assets.avatarUrl, dest);
  }

  return { museVideoPath, ttsSePath, avatarImagePath };
}
