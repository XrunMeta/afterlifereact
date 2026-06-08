

import { loadSystemPersona } from "./systemPersona";
import { resolvePersona } from "./personaResolver";
import { loadCloneProfiles, buildPersonaBundle, flattenAttrs } from "./personaBundle";
import type { CloneRow } from "./cloneAccess";

export interface CallBundle {
  personaBundle: ReturnType<typeof buildPersonaBundle>;
  assets: {
    idleVideoUrl: string | null;
    voiceSeUrl: string | null;
    voiceSeKey: string | null;
    avatarUrl: string | null;
  };
}

export async function buildCallBundle(db: D1Database, clone: CloneRow): Promise<CallBundle> {
  const cloneId = clone.id;

  const l0 = await loadSystemPersona(db);
  const { l1, l2 } = await loadCloneProfiles(db, cloneId);
  const persona = resolvePersona({ l1: flattenAttrs(l1), l2 });

  persona.displayName = clone.name;
  if (clone.relation != null) persona.relation = clone.relation;

  const personaBundle = buildPersonaBundle(l0, persona, cloneId);

  let voiceSeUrl: string | null = clone.voice_se_url ?? null;
  let voiceSeKey: string | null = null;
  if (!voiceSeUrl && clone.voice_preset_id) {
    const vp = await db
      .prepare(`SELECT se_key FROM voice_presets WHERE id = ? AND is_active = 1`)
      .bind(clone.voice_preset_id)
      .first<{ se_key: string | null }>();
    voiceSeKey = vp?.se_key ?? null;
  }

  const assets = {
    idleVideoUrl: clone.idle_video_url ?? null,
    voiceSeUrl,
    voiceSeKey,
    avatarUrl: clone.avatar_url ?? null,
  };

  return { personaBundle, assets };
}
