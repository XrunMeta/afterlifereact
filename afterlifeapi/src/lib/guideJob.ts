

import { v_041f8e, v_5193f8, v_f64843 } from "./assetJobs";
import { v_db508f, v_56dc8c } from "./personaBundle";
import { v_b60bdd } from "./systemPersona";

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

export async function v_842ce7(
  v_a1651b,
  v_328259,
): Promise<TriggerGuideJobResult> {
  const {
    cloneId: v_6e0fd3,
    userId: v_43e90c,
    faceSrcFileId: v_9b041b,
    voiceRawUrl: v_35d74b,
    origin: v_f17108,
    orchestratorUrl: v_aae976,
    orchSecret: v_d0c303,
    waitUntil: v_b40686,
  } = v_328259;

  const v_97f897 = crypto.randomUUID();
  const v_b9822a = await v_041f8e(v_a1651b, v_97f897, v_43e90c, "guide", v_9b041b);

  await v_f64843(v_a1651b, v_97f897, v_6e0fd3);

  if (v_aae976 && v_d0c303) {
    const v_2d0601 = `${v_f17108}/oth-path${v_9b041b}`;

    let v_5ed063 = null;
    try {
      const v_b6c480 = await v_b60bdd(v_a1651b);
      const { l1: v_020b4b } = await v_db508f(v_a1651b, v_6e0fd3);
      v_5ed063 = { l0: v_b6c480, l1: v_56dc8c(v_020b4b) };
    } catch (v_49263d) {
      console.warn("[guide-job] persona 조립 실패 — persona 없이 진행:", (v_49263d as Error).message);
    }
    v_b40686(
      fetch(`${v_aae976}/oth-path`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${v_d0c303}`,
        },
        body: JSON.stringify({
          job_id: v_97f897,
          kind: "guide",
          face_url: v_2d0601,
          clone_id: String(v_6e0fd3),
          voice_raw_url: v_35d74b,
          callback_token: v_b9822a,
          persona: v_5ed063,
        }),
        signal: AbortSignal.timeout(8000),
      })
        .then((v_8f00b9) => v_5193f8(v_a1651b, v_97f897, v_8f00b9.ok ? "running" : "failed"))
        .catch(() => v_5193f8(v_a1651b, v_97f897, "failed")),
    );
  }

  return { guideJobId: v_97f897 };
}
