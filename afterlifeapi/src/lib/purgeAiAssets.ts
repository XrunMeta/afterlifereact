

import type { v_273a0c } from "./env";

type R2PurgeResult = {
  mediaKeys: number;
  archiveKeys: number;
  errors: number;
};

function v_b85b5c(v_f71b56): string | null {
  if (!v_f71b56) return null;

  if (!v_f71b56.includes("://")) return v_f71b56.trim() || null;

  try {
    const v_8decf8 = new URL(v_f71b56);

    if (!v_8decf8.hostname.includes("afterlife") && !v_8decf8.hostname.includes("r2.dev")) {
      return null;
    }
    return v_8decf8.pathname.replace(/^\//, "");
  } catch {
    return null;
  }
}

const v_60db77 = /(?:^|\/)api\/files\/(\d+)(?:[?#].*)?$/;

function v_fe8749(v_f71b56): number | null {
  if (!v_f71b56) return null;
  const v_35f85c = v_60db77.exec(v_f71b56.trim());
  return v_35f85c ? Number(v_35f85c[1]) : null;
}

const v_7b2645 = (v_c8b83f) => `(${v_c8b83f} LIKE ?1 OR ${v_c8b83f} LIKE ?2)`;
const v_caf51a = `SELECT
  EXISTS (SELECT 1 FROM clones WHERE id != ?3 AND deletion_state = 'active' AND (
    ${v_7b2645("avatar_url")} OR ${v_7b2645("cover_image_url")} OR ${v_7b2645("idle_video_url")} OR
    ${v_7b2645("voice_se_url")} OR ${v_7b2645("filler_video_urls")} OR ${v_7b2645("guide_video_urls")} OR
    ${v_7b2645("bridge_video_urls")}))
  OR EXISTS (SELECT 1 FROM clone_photos WHERE clone_id != ?3 AND ${v_7b2645("photo_url")})
  OR EXISTS (SELECT 1 FROM users WHERE ${v_7b2645("avatar_url")})
  OR EXISTS (SELECT 1 FROM feeds WHERE clone_id != ?3 AND ${v_7b2645("media_url")})
  OR EXISTS (SELECT 1 FROM clone_shorts WHERE clone_id != ?3 AND ${v_7b2645("media_url")})
  OR EXISTS (SELECT 1 FROM voice_presets WHERE ${v_7b2645("sample_url")})
  OR EXISTS (SELECT 1 FROM gift_inventory_events WHERE ${v_7b2645("gift_image_url_snapshot")})
  OR EXISTS (SELECT 1 FROM inheritance_release_logs WHERE ${v_7b2645("evidence_url")}) AS shared`;

async function v_4944e0(
  env: v_273a0c,
  v_6e0fd3,
  v_a750e4,
): Promise<{ ok: number; errors: number }> {
  let v_3ed4c3 = 0;
  let v_9de4ac = 0;
  for (const v_433c46 of v_a750e4) {
    try {
      const v_b1c995 = await v_c9c489.DB
        .prepare(v_caf51a)
        .bind(`%/oth-path${v_433c46}`, `%/oth-path${v_433c46}"%`, v_6e0fd3)
        .first<{ shared: number }>();
      if (v_b1c995?.shared !== 0) continue;
      const v_3ac7e7 = await v_c9c489.DB
        .prepare(`SELECT r2_key FROM files WHERE id = ?`)
        .bind(v_433c46)
        .first<{ r2_key: string }>();
      if (!v_3ac7e7) continue;
      await v_c9c489.R2_ARCHIVE.delete(v_3ac7e7.r2_key);
      await v_c9c489.DB.prepare(`DELETE FROM files WHERE id = ?`).bind(v_433c46).run();
      v_3ed4c3++;
    } catch (v_49263d) {
      console.warn(`[purgeAiAssets] file ${v_433c46} purge failed:`, (v_49263d as Error).message);
      v_9de4ac++;
    }
  }
  return { ok: v_3ed4c3, errors: v_9de4ac };
}

function v_1fc684(v_81e2ef): string[] {
  if (!v_81e2ef) return [];
  try {
    const v_8decf8 = JSON.parse(v_81e2ef);
    return Array.isArray(v_8decf8) ? v_8decf8.filter((v_62c214) => typeof v_62c214 === "string") : [];
  } catch {
    return [];
  }
}

async function v_fd967d(v_dc53ea, v_fa53ec): Promise<{ ok: number; errors: number }> {
  let v_3ed4c3 = 0;
  let v_9de4ac = 0;
  for (const v_b24339 of v_fa53ec) {
    try {
      await v_dc53ea.delete(v_b24339);
      v_3ed4c3++;
    } catch (v_49263d) {
      console.warn(`[purgeAiAssets] R2 delete ${v_b24339} failed:`, (v_49263d as Error).message);
      v_9de4ac++;
    }
  }
  return { ok: v_3ed4c3, errors: v_9de4ac };
}

export async function v_ed063f(env: v_273a0c, v_6e0fd3): Promise<R2PurgeResult> {
  const v_eb25ce = await v_c9c489.DB
    .prepare(
      `SELECT avatar_url, cover_image_url, idle_video_url, voice_se_url,
              filler_video_urls, guide_video_urls, bridge_video_urls, viseme_prefix
       FROM clones WHERE id = ?`,
    )
    .bind(v_6e0fd3)
    .first<{
      avatar_url: string | null;
      cover_image_url: string | null;
      idle_video_url: string | null;
      voice_se_url: string | null;
      filler_video_urls: string | null;
      guide_video_urls: string | null;
      bridge_video_urls: string | null;
      viseme_prefix: string | null;
    }>();
  if (!v_eb25ce) return { mediaKeys: 0, archiveKeys: 0, errors: 0 };

  const v_cf2c85 = [];
  const v_a750e4 = new Set<number>();
  const v_0faf90 = (v_ceb55a) => {
    const v_433c46 = v_fe8749(v_ceb55a);
    if (v_433c46 !== null) {
      v_a750e4.add(v_433c46);
      return;
    }
    const v_0eb677 = v_b85b5c(v_ceb55a);
    if (v_0eb677) v_cf2c85.push(v_0eb677);
  };
  v_0faf90(v_eb25ce.avatar_url);
  v_0faf90(v_eb25ce.cover_image_url);
  v_0faf90(v_eb25ce.idle_video_url);
  v_0faf90(v_eb25ce.voice_se_url);
  for (const v_ceb55a of v_1fc684(v_eb25ce.filler_video_urls)) v_0faf90(v_ceb55a);
  for (const v_ceb55a of v_1fc684(v_eb25ce.guide_video_urls)) v_0faf90(v_ceb55a);
  for (const v_ceb55a of v_1fc684(v_eb25ce.bridge_video_urls)) v_0faf90(v_ceb55a);

  let v_73a3bf = [];
  if (v_eb25ce.viseme_prefix) {
    try {
      const v_c396aa = await v_c9c489.R2_MEDIA.list({ prefix: v_eb25ce.viseme_prefix });
      v_73a3bf = (v_c396aa.objects ?? []).map((v_b6c474) => v_b6c474.key);
    } catch (v_49263d) {
      console.warn(
        `[purgeAiAssets] viseme list ${v_eb25ce.viseme_prefix} failed:`,
        (v_49263d as Error).message,
      );
    }
  }

  try {
    const v_dcaaa3 = await v_c9c489.DB
      .prepare(`SELECT photo_url FROM clone_photos WHERE clone_id = ?`)
      .bind(v_6e0fd3)
      .all<{ photo_url: string }>();
    for (const v_3ac7e7 of v_dcaaa3.results ?? []) v_0faf90(v_3ac7e7.photo_url);
  } catch (v_49263d) {
    console.warn(`[purgeAiAssets] clone_photos lookup failed:`, (v_49263d as Error).message);
  }

  const v_2d1eeb = await v_fd967d(v_c9c489.R2_MEDIA, [...v_cf2c85, ...v_73a3bf]);
  const v_b96973 = await v_4944e0(v_c9c489, v_6e0fd3, [...v_a750e4]);

  return {
    mediaKeys: v_2d1eeb.ok,
    archiveKeys: v_b96973.ok,
    errors: v_2d1eeb.errors + v_b96973.errors,
  };
}

export async function v_fb2d8f(env: v_273a0c, v_43e90c): Promise<R2PurgeResult> {
  let v_304767 = 0;
  let v_a4fd7e = 0;
  let v_9de4ac = 0;

  try {
    const v_f891e6 = await v_c9c489.DB
      .prepare(`SELECT id FROM clones WHERE owner_id = ?`)
      .bind(v_43e90c)
      .all<{ id: number }>();
    for (const v_3f4e2e of v_f891e6.results ?? []) {
      const v_cb35cb = await v_ed063f(v_c9c489, v_3f4e2e.id);
      v_304767 += v_cb35cb.mediaKeys;
      v_9de4ac += v_cb35cb.errors;
    }
  } catch (v_49263d) {
    console.error(`[purgeAiAssets] user clones purge failed:`, (v_49263d as Error).message);
    v_9de4ac++;
  }

  try {
    const v_ff9685 = await v_c9c489.DB
      .prepare(`SELECT r2_key FROM files WHERE owner_user_id = ?`)
      .bind(v_43e90c)
      .all<{ r2_key: string }>();
    const v_fa53ec = (v_ff9685.results ?? []).map((v_8b5cd8) => v_8b5cd8.r2_key).filter(Boolean);
    const v_cb35cb = await v_fd967d(v_c9c489.R2_ARCHIVE, v_fa53ec);
    v_a4fd7e += v_cb35cb.ok;
    v_9de4ac += v_cb35cb.errors;

    if (v_fa53ec.length > 0) {
      await v_c9c489.DB
        .prepare(`DELETE FROM files WHERE owner_user_id = ?`)
        .bind(v_43e90c)
        .run();
    }
  } catch (v_49263d) {
    console.error(`[purgeAiAssets] user files purge failed:`, (v_49263d as Error).message);
    v_9de4ac++;
  }

  return { mediaKeys: v_304767, archiveKeys: v_a4fd7e, errors: v_9de4ac };
}
