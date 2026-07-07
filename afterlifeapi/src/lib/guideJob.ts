

import { createJob, setStatus, linkClone } from "./assetJobs";
import { loadCloneProfiles, flattenAttrs } from "./personaBundle";
import { loadSystemPersona } from "./systemPersona";

export interface TriggerGuideJobOpts {
  cloneId: number;
  userId: number;
  faceSrcFileId: number;
  voiceRawUrl: string;
  origin: string;
  orchestratorUrl?: string;
  orchSecret?: string;
  waitUntil: (p: Promise<unknown>) => void;
}

export interface TriggerGuideJobResult {
  guideJobId: string;
}

export async function triggerGuideJob(
  db: D1Database,
  opts: TriggerGuideJobOpts,
): Promise<TriggerGuideJobResult> {
  const {
    cloneId,
    userId,
    faceSrcFileId,
    voiceRawUrl,
    origin,
    orchestratorUrl,
    orchSecret,
    waitUntil,
  } = opts;

  const guideJobId = crypto.randomUUID();
  const guideCallbackToken = await createJob(db, guideJobId, userId, "guide", faceSrcFileId);

  await linkClone(db, guideJobId, cloneId);

  if (orchestratorUrl && orchSecret) {
    const faceUrl = `${origin}/oth-path${faceSrcFileId}`;

    let persona: { l0: unknown; l1: unknown } | null = null;
    try {
      const l0 = await loadSystemPersona(db);
      const { l1 } = await loadCloneProfiles(db, cloneId);
      persona = { l0, l1: flattenAttrs(l1) };
    } catch (err) {
      console.warn("[guide-job] persona 조립 실패 — persona 없이 진행:", (err as Error).message);
    }
    waitUntil(
      fetch(`${orchestratorUrl}/oth-path`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${orchSecret}`,
        },
        body: JSON.stringify({
          job_id: guideJobId,
          kind: "guide",
          face_url: faceUrl,
          clone_id: String(cloneId),
          voice_raw_url: voiceRawUrl,
          callback_token: guideCallbackToken,
          persona,
        }),
        signal: AbortSignal.timeout(8000),
      })
        .then((res) => setStatus(db, guideJobId, res.ok ? "running" : "failed"))
        .catch(() => setStatus(db, guideJobId, "failed")),
    );
  }

  return { guideJobId };
}
