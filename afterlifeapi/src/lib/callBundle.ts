

import { loadSystemPersona } from "./systemPersona";
import { resolvePersona } from "./personaResolver";
import { loadCloneProfiles, buildPersonaBundle, flattenAttrs, loadUserL2 } from "./personaBundle";
import type { CloneRow } from "./cloneAccess";

export interface CallBundle {
  personaBundle: ReturnType<typeof buildPersonaBundle>;
  assets: {
    idleVideoUrl: string | null;
    voiceSeUrl: string | null;
    voiceSeKey: string | null;
    voiceRawUrl: string | null;
    avatarUrl: string | null;
    faceUrl: string | null;

    fillerVideoUrls: string[];

    guideVideoUrls: string[];
  };
}

export async function buildCallBundle(db: D1Database, clone: CloneRow, userId: number, origin: string): Promise<CallBundle> {
  const cloneId = clone.id;

  const l0 = await loadSystemPersona(db);
  const { l1 } = await loadCloneProfiles(db, cloneId);   
  const l2 = await loadUserL2(db, cloneId, userId);       
  const persona = resolvePersona({ l1: flattenAttrs(l1), l2 });

  persona.displayName = clone.name;

  if (clone.relation != null && (persona.relation == null || persona.relation === "")) {
    persona.relation = clone.relation;
  }

  const viewerRow = await db
    .prepare("SELECT name FROM users WHERE id = ?")
    .bind(userId)
    .first<{ name: string | null }>();

  const personaBundle = buildPersonaBundle(l0, persona, cloneId, {
    displayName: viewerRow?.name ?? null,
  });

  let voiceSeUrl: string | null = clone.voice_se_url ?? null;
  let voiceSeKey: string | null = null;
  if (!voiceSeUrl && clone.voice_preset_id) {
    const vp = await db
      .prepare(`SELECT se_key FROM voice_presets WHERE id = ? AND is_active = 1`)
      .bind(clone.voice_preset_id)
      .first<{ se_key: string | null }>();
    voiceSeKey = vp?.se_key ?? null;
  }

  const filesPathSuffix = (u: string): string => {
    const m = u.match(/\/oth-path\/files\/\d+$/);
    return m ? m[0] : u; 
  };

  const escapeLike = (s: string): string => s.replace(/[\\%_]/g, "\\$&");
  const likeSuffix = (u: string): string => `%${escapeLike(filesPathSuffix(u))}`;

  const rebaseOrigin = (u: string | null): string | null => {
    if (!u) return u;
    const m = u.match(/\/oth-path\/files\/\d+$/);
    return m ? `${origin}${m[0]}` : u; 
  };

  let voiceRawUrl: string | null = null;
  if (clone.voice_se_url) {
    const jobRow = await db
      .prepare(
        `SELECT f.id AS file_id
           FROM clone_asset_jobs j
           JOIN files f ON j.src_file_id = f.id
          WHERE j.out_url LIKE ? ESCAPE '\\' AND j.kind = 'voice_clone' AND j.status = 'done'
          ORDER BY j.created_at DESC
          LIMIT 1`,
      )
      .bind(likeSuffix(clone.voice_se_url))
      .first<{ file_id: number }>();
    voiceRawUrl = jobRow ? `${origin}/oth-path${jobRow.file_id}` : null;
  }

  let faceUrl: string | null = null;
  if (clone.idle_video_url) {
    const faceJob = await db
      .prepare(
        `SELECT f.id AS file_id
           FROM clone_asset_jobs j
           JOIN files f ON j.src_file_id = f.id
          WHERE j.out_url LIKE ? ESCAPE '\\' AND j.kind = 'idle_video' AND j.status = 'done'
          ORDER BY j.created_at DESC, j.rowid DESC
          LIMIT 1`,
      )
      .bind(likeSuffix(clone.idle_video_url))
      .first<{ file_id: number }>();
    faceUrl = faceJob ? `${origin}/oth-path${faceJob.file_id}` : null;
  }

  let fillerVideoUrls: string[] = [];
  if (clone.filler_video_urls) {
    try {
      const parsed = JSON.parse(clone.filler_video_urls);
      if (Array.isArray(parsed)) {
        fillerVideoUrls = parsed.filter((u): u is string => typeof u === "string");
      }
    } catch {

      fillerVideoUrls = [];
    }
  }

  let guideVideoUrls: string[] = [];
  if (clone.guide_video_urls) {
    try {
      const parsed = JSON.parse(clone.guide_video_urls);
      if (Array.isArray(parsed)) {
        guideVideoUrls = parsed.filter((u): u is string => typeof u === "string");
      }
    } catch {

      guideVideoUrls = [];
    }
  }

  const assets = {

    idleVideoUrl: rebaseOrigin(clone.idle_video_url ?? null),
    voiceSeUrl,
    voiceSeKey,
    voiceRawUrl,
    avatarUrl: rebaseOrigin(clone.avatar_url ?? null),
    faceUrl,
    fillerVideoUrls: fillerVideoUrls.map((u) => rebaseOrigin(u) ?? u),
    guideVideoUrls: guideVideoUrls.map((u) => rebaseOrigin(u) ?? u),
  };

  return { personaBundle, assets };
}
