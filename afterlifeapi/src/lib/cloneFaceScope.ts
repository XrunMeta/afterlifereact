

import type { v_273a0c } from "./env";
import { v_a8d2cc } from "./faceVectors";

export function v_929ead(v_43e90c, v_6e0fd3): string {
  return `${v_43e90c}:${v_6e0fd3}`;
}

export interface CloneScopeMatch {
  personId: number;
  score: number;
}

export async function v_97be02(
  env: v_273a0c,
  v_328259,
): Promise<CloneScopeMatch[]> {
  const { userId: v_43e90c, cloneId: v_6e0fd3, vector: v_f9a45c, topK: v_171a8a = 3 } = v_328259;
  const v_e86ad8 = v_a8d2cc(v_c9c489);
  const v_cb35cb = await v_e86ad8.query(v_f9a45c, {
    topK: v_171a8a,
    namespace: v_929ead(v_43e90c, v_6e0fd3),
    returnMetadata: true,
  });

  const v_8a69ab = new Map<number, number>();
  for (const v_35f85c of v_cb35cb.matches) {
    const v_d4923e = Number(v_35f85c.metadata?.personId);
    if (!v_d4923e) continue; 
    v_8a69ab.set(v_d4923e, Math.max(v_8a69ab.get(v_d4923e) ?? -1, v_35f85c.score));
  }

  return [...v_8a69ab.entries()]
    .map(([v_ca1ec5, v_740dd8]) => ({ personId: v_ca1ec5, score: v_740dd8 }))
    .sort((v_779914, v_148ff6) => v_148ff6.score - v_779914.score);
}
