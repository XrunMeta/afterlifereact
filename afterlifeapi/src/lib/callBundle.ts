

import { v_b60bdd } from "./systemPersona";
import { v_24564b } from "./personaResolver";
import { v_db508f, v_445ba7, v_56dc8c, v_20b0e8 } from "./personaBundle";
import type { v_b107dc } from "./cloneAccess";

export interface CallBundle {
  personaBundle: ReturnType<typeof v_445ba7>;
  assets: {
    idleVideoUrl: string | null;
    voiceSeUrl: string | null;
    voiceSeKey: string | null;
    voiceRawUrl: string | null;
    avatarUrl: string | null;
  };
}

export async function v_87cfd2(v_a1651b, clone: v_b107dc, v_43e90c, v_f17108): Promise<CallBundle> {
  const v_6e0fd3 = v_eb25ce.id;

  const v_b6c480 = await v_b60bdd(v_a1651b);
  const { l1: v_020b4b } = await v_db508f(v_a1651b, v_6e0fd3);   
  const v_1af19b = await v_20b0e8(v_a1651b, v_6e0fd3, v_43e90c);       
  const v_5ed063 = v_24564b({ l1: v_56dc8c(v_020b4b), l2: v_1af19b });

  v_5ed063.displayName = v_eb25ce.name;
  if (v_eb25ce.relation != null) v_5ed063.relation = v_eb25ce.relation;

  const v_ba0fde = v_445ba7(v_b6c480, v_5ed063, v_6e0fd3);

  let v_c910d9 = v_eb25ce.voice_se_url ?? null;
  let v_4f80ac = null;
  if (!v_c910d9 && v_eb25ce.voice_preset_id) {
    const v_f653fc = await v_a1651b
      .prepare(`SELECT se_key FROM voice_presets WHERE id = ? AND is_active = 1`)
      .bind(v_eb25ce.voice_preset_id)
      .first<{ se_key: string | null }>();
    v_4f80ac = v_f653fc?.se_key ?? null;
  }

  let v_35d74b = null;
  if (v_eb25ce.voice_se_url) {
    const v_d5e460 = await v_a1651b
      .prepare(
        `SELECT f.id AS file_id
           FROM clone_asset_jobs j
           JOIN files f ON j.src_file_id = f.id
          WHERE j.out_url = ? AND j.kind = 'voice_clone' AND j.status = 'done'
          ORDER BY j.created_at DESC
          LIMIT 1`,
      )
      .bind(v_eb25ce.voice_se_url)
      .first<{ file_id: number }>();
    v_35d74b = v_d5e460 ? `${v_f17108}/oth-path${v_d5e460.file_id}` : null;
  }

  const v_7adc95 = {
    idleVideoUrl: v_eb25ce.idle_video_url ?? null,
    voiceSeUrl: v_c910d9,
    voiceSeKey: v_4f80ac,
    voiceRawUrl: v_35d74b,
    avatarUrl: v_eb25ce.avatar_url ?? null,
  };

  return { personaBundle: v_ba0fde, assets: v_7adc95 };
}
