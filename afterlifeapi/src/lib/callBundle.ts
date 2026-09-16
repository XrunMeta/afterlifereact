

import { v_b60bdd } from "./systemPersona";
import { v_24564b } from "./personaResolver";
import {
  v_db508f,
  v_445ba7,
  v_56dc8c,
  v_20b0e8,
  v_83a5b9,
} from "./personaBundle";
import type { v_b107dc } from "./cloneAccess";

export interface CallBundle {
  personaBundle: ReturnType<typeof v_445ba7>;
  assets: {
    idleVideoUrl: string | null;
    voiceSeUrl: string | null;
    voiceSeKey: string | null;
    voiceRawUrl: string | null;
    avatarUrl: string | null;
    faceUrl: string | null;

    fillerVideoUrls: string[];

    guideVideoUrls: string[];

    emoteSmileUrl: string | null;
  };

  ttsOutput: string;

  voiceModelManifestUrl: string | null;
}

export async function v_87cfd2(v_a1651b, clone: v_b107dc, v_43e90c, v_f17108): Promise<CallBundle> {
  const v_6e0fd3 = v_eb25ce.id;

  const v_b6c480 = await v_b60bdd(v_a1651b);
  const { l1: v_020b4b } = await v_db508f(v_a1651b, v_6e0fd3);   
  const v_1af19b = await v_20b0e8(v_a1651b, v_6e0fd3, v_43e90c);       
  const v_5ed063 = v_24564b({ l1: v_56dc8c(v_020b4b), l2: v_1af19b });

  v_5ed063.displayName = v_eb25ce.name;

  if (v_eb25ce.relation != null && (v_5ed063.relation == null || v_5ed063.relation === "")) {
    v_5ed063.relation = v_eb25ce.relation;
  }

  const v_48c548 = await v_a1651b
    .prepare("SELECT name FROM users WHERE id = ?")
    .bind(v_43e90c)
    .first<{ name: string | null }>();

  const v_54e25d = await v_83a5b9(v_a1651b, v_6e0fd3, v_43e90c);

  const v_ba0fde = v_445ba7(v_b6c480, v_5ed063, v_6e0fd3, {
    displayName: v_48c548?.name ?? null,
    ownerPersonId: v_54e25d,
  });

  let v_c910d9 = v_eb25ce.voice_se_url ?? null;
  let v_4f80ac = null;
  if (!v_c910d9 && v_eb25ce.voice_preset_id) {
    const v_f653fc = await v_a1651b
      .prepare(`SELECT se_key FROM voice_presets WHERE id = ? AND is_active = 1`)
      .bind(v_eb25ce.voice_preset_id)
      .first<{ se_key: string | null }>();
    v_4f80ac = v_f653fc?.se_key ?? null;
  }

  const v_c50dde = (v_ceb55a): string => {
    const v_35f85c = v_ceb55a.match(/\/oth-path\/files\/\d+$/);
    return v_35f85c ? v_35f85c[0] : v_ceb55a; 
  };

  const v_a05ffe = (v_fd5f43): string => v_fd5f43.replace(/[\\%_]/g, "\\$&");
  const v_f39241 = (v_ceb55a): string => `%${v_a05ffe(v_c50dde(v_ceb55a))}`;

  const v_b484d5 = (v_ceb55a): string | null => {
    if (!v_ceb55a) return v_ceb55a;
    const v_35f85c = v_ceb55a.match(/\/oth-path\/files\/\d+$/);
    return v_35f85c ? `${v_f17108}${v_35f85c[0]}` : v_ceb55a; 
  };

  let v_35d74b = null;
  if (v_eb25ce.voice_se_url) {
    const v_d5e460 = await v_a1651b
      .prepare(
        `SELECT f.id AS file_id
           FROM clone_asset_jobs j
           JOIN files f ON j.src_file_id = f.id
          WHERE j.out_url LIKE ? ESCAPE '\\' AND j.kind = 'voice_clone' AND j.status = 'done'
          ORDER BY j.created_at DESC
          LIMIT 1`,
      )
      .bind(v_f39241(v_eb25ce.voice_se_url))
      .first<{ file_id: number }>();
    v_35d74b = v_d5e460 ? `${v_f17108}/oth-path${v_d5e460.file_id}` : null;
  }

  let v_2d0601 = null;
  if (v_eb25ce.idle_video_url) {
    const v_dcfd51 = await v_a1651b
      .prepare(
        `SELECT f.id AS file_id
           FROM clone_asset_jobs j
           JOIN files f ON j.src_file_id = f.id
          WHERE j.out_url LIKE ? ESCAPE '\\' AND j.kind = 'idle_video' AND j.status = 'done'
          ORDER BY j.created_at DESC, j.rowid DESC
          LIMIT 1`,
      )
      .bind(v_f39241(v_eb25ce.idle_video_url))
      .first<{ file_id: number }>();
    v_2d0601 = v_dcfd51 ? `${v_f17108}/oth-path${v_dcfd51.file_id}` : null;
  }

  let v_c53bd1 = [];
  if (v_eb25ce.filler_video_urls) {
    try {
      const v_8decf8 = JSON.parse(v_eb25ce.filler_video_urls);
      if (Array.isArray(v_8decf8)) {
        v_c53bd1 = v_8decf8.filter((v_ceb55a): v_ceb55a is string => typeof v_ceb55a === "string");
      }
    } catch {

      v_c53bd1 = [];
    }
  }

  let v_fa8b40 = [];
  if (v_eb25ce.guide_video_urls) {
    try {
      const v_8decf8 = JSON.parse(v_eb25ce.guide_video_urls);
      if (Array.isArray(v_8decf8)) {
        v_fa8b40 = v_8decf8.filter((v_ceb55a): v_ceb55a is string => typeof v_ceb55a === "string");
      }
    } catch {

      v_fa8b40 = [];
    }
  }

  const v_d0c2ab = "https://rtc.example.invalid"; 
  const v_14c073 = v_2d0601 ? `${v_d0c2ab}/emote/${v_6e0fd3}/smile.mp4` : null;

  const v_7adc95 = {

    idleVideoUrl: v_b484d5(v_eb25ce.idle_video_url ?? null),
    voiceSeUrl: v_c910d9,
    voiceSeKey: v_4f80ac,
    voiceRawUrl: v_35d74b,
    avatarUrl: v_b484d5(v_eb25ce.avatar_url ?? null),
    faceUrl: v_2d0601,
    fillerVideoUrls: v_c53bd1.map((v_ceb55a) => v_b484d5(v_ceb55a) ?? v_ceb55a),
    guideVideoUrls: v_fa8b40.map((v_ceb55a) => v_b484d5(v_ceb55a) ?? v_ceb55a),
    emoteSmileUrl: v_14c073,
  };

  const v_28aeca = v_4f80ac
    ? `${v_f17108}/oth-path${encodeURIComponent(v_4f80ac)}/manifest.json`
    : null;

  return {
    personaBundle: v_ba0fde,
    assets: v_7adc95,
    ttsOutput: v_eb25ce.tts_output,
    voiceModelManifestUrl: v_28aeca,
  };
}
