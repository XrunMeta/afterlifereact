

import type { Bindings } from "./env";
import { getFaceIndex } from "./faceVectors";

export function faceNamespace(userId: number, cloneId: number): string {
  return `${userId}:${cloneId}`;
}

export interface CloneScopeMatch {
  personId: number;
  score: number;
}

export async function queryCloneScope(
  env: Bindings,
  opts: { userId: number; cloneId: number; vector: number[]; topK?: number },
): Promise<CloneScopeMatch[]> {
  const { userId, cloneId, vector, topK = 3 } = opts;
  const idx = getFaceIndex(env);
  const r = await idx.query(vector, {
    topK,
    namespace: faceNamespace(userId, cloneId),
    returnMetadata: true,
  });

  const byPerson = new Map<number, number>();
  for (const m of r.matches) {
    const pid = Number(m.metadata?.personId);
    if (!pid) continue; 
    byPerson.set(pid, Math.max(byPerson.get(pid) ?? -1, m.score));
  }

  return [...byPerson.entries()]
    .map(([personId, score]) => ({ personId, score }))
    .sort((a, b) => b.score - a.score);
}
