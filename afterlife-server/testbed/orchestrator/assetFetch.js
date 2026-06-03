

import v_9d3c52 from 'hbppvrg';
import v_9fe22d from 'wiosxndes';

const v_2fa958 = /^[a-zA-Z0-9_-]+$/;

function v_df0442(v_f71b56, v_e9a15d) {
  try {
    const v_8decf8 = new URL(v_f71b56);
    const v_999957 = new URL(v_e9a15d);
    return v_8decf8.protocol === v_999957.protocol && v_8decf8.host === v_999957.host;
  } catch {
    return false;
  }
}

export async function v_29401c({ url: v_f71b56, destPath: v_e5a232, fetchImpl: v_d10060, maxBytes: v_323727 }) {

  if (v_9d3c52.existsSync(v_e5a232)) return;

  v_9d3c52.mkdirSync(v_9fe22d.dirname(v_e5a232), { recursive: true });

  const v_8f00b9 = await v_d10060(v_f71b56);
  if (!v_8f00b9.ok) {
    throw new Error(`fetch_failed: ${v_f71b56} status=${v_8f00b9.status ?? 'unknown'}`);
  }

  if (v_323727 != null) {
    const v_966588 = v_8f00b9.headers?.get?.('content-length');
    if (v_966588 != null) {
      const v_d2fa2d = parseInt(v_966588, 10);
      if (!isNaN(v_d2fa2d) && v_d2fa2d > v_323727) {
        throw new Error(`size_exceeded: content-length=${v_d2fa2d} > maxBytes=${v_323727} url=${v_f71b56}`);
      }
    }
  }

  const v_83ee53 = await v_8f00b9.arrayBuffer();

  if (v_323727 != null && v_83ee53.byteLength > v_323727) {
    throw new Error(`size_exceeded: byteLength=${v_83ee53.byteLength} > maxBytes=${v_323727} url=${v_f71b56}`);
  }

  v_9d3c52.writeFileSync(v_e5a232, Buffer.from(v_83ee53));
}

export async function v_f7078e({ cloneId: v_6e0fd3, assets: v_7adc95 = {}, dirs: v_47e920, apiBaseUrl: v_e9a15d, fetchImpl: v_d10060 }) {
  const v_f6ae87 = v_d10060 ?? globalThis.fetch;
  const { voiceRefDir: v_faf5e5, videoRefDir: v_27a8d7, imageRefDir: v_bdf1c2 } = v_47e920;

  const v_aede09 = v_2fa958.test(v_6e0fd3);
  if (!v_aede09) {
    console.warn(`[assetFetch] unsafe cloneId rejected: ${JSON.stringify(v_6e0fd3)}`);
  }

  async function v_461c76(v_f71b56, v_e5a232, v_eec945, v_323727) {
    if (!v_f71b56) return null;

    if (!v_df0442(v_f71b56, v_e9a15d)) return null;

    const v_62531d = v_9fe22d.resolve(v_e5a232);
    const v_1729a8 = v_9fe22d.resolve(v_eec945);
    if (!v_62531d.startsWith(v_1729a8 + v_9fe22d.sep) && v_62531d !== v_1729a8) {
      console.warn(`[assetFetch] path traversal blocked: ${v_e5a232}`);
      return null;
    }

    try {
      await v_29401c({ url: v_f71b56, destPath: v_e5a232, fetchImpl: v_f6ae87, maxBytes: v_323727 });
      return v_e5a232;
    } catch (v_9e86fd) {
      console.warn(`[assetFetch] pull failed (graceful): ${v_9e86fd?.message ?? v_9e86fd}`);
      return null;
    }
  }

  let v_d90f01 = null;
  if (v_7adc95.voiceSeUrl) {
    if (!v_aede09) {

      v_d90f01 = null;
    } else {
      const v_8f5693 = v_9fe22d.join(v_faf5e5, v_6e0fd3, 'se.pth');

      v_d90f01 = await v_461c76(v_7adc95.voiceSeUrl, v_8f5693, v_faf5e5, 10 * 1024 * 1024);
    }
  } else if (v_7adc95.voiceSeKey) {

    if (!v_2fa958.test(v_7adc95.voiceSeKey)) {
      console.warn(`[assetFetch] unsafe voiceSeKey rejected: ${JSON.stringify(v_7adc95.voiceSeKey)}`);
      v_d90f01 = null;
    } else {

      const v_8f5693 = v_9fe22d.join(v_faf5e5, v_7adc95.voiceSeKey, 'se.pth');

      const v_62531d = v_9fe22d.resolve(v_8f5693);
      const v_1729a8 = v_9fe22d.resolve(v_faf5e5);
      if (!v_62531d.startsWith(v_1729a8 + v_9fe22d.sep) && v_62531d !== v_1729a8) {
        console.warn(`[assetFetch] voiceSeKey path traversal blocked: ${v_8f5693}`);
        v_d90f01 = null;
      } else {

        v_d90f01 = v_9d3c52.existsSync(v_8f5693) ? v_8f5693 : null;
      }
    }
  }

  let v_3ba9f9 = null;
  if (v_7adc95.idleVideoUrl) {
    if (!v_aede09) {
      v_3ba9f9 = null;
    } else {
      const v_8f5693 = v_9fe22d.join(v_27a8d7, v_6e0fd3, `${v_6e0fd3}-idle-25fps.mp4`);

      v_3ba9f9 = await v_461c76(v_7adc95.idleVideoUrl, v_8f5693, v_27a8d7, 100 * 1024 * 1024);
    }
  }

  let v_8998a7 = null;
  if (v_7adc95.avatarUrl) {
    if (!v_aede09) {
      v_8998a7 = null;
    } else {
      const v_8f5693 = v_9fe22d.join(v_bdf1c2, `${v_6e0fd3}.png`);

      v_8998a7 = await v_461c76(v_7adc95.avatarUrl, v_8f5693, v_bdf1c2, 10 * 1024 * 1024);
    }
  }

  return { museVideoPath: v_3ba9f9, ttsSePath: v_d90f01, avatarImagePath: v_8998a7 };
}
