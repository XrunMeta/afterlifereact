

import type { Bindings } from "./env";
import { getFaceIndex } from "./faceVectors";
import { writeOntPerson, readOntPerson } from "./memoryStore";

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

export interface EnrollResult {
  enrolled: number;
}

export async function enrollCloneScopeFaces(
  env: Bindings,
  opts: {
    userId: number;
    cloneId: number;
    personId: number;
    vectors: number[][];
    source?: "enroll" | "call" | "self";
  },
): Promise<EnrollResult> {
  const { userId, cloneId, personId, vectors, source = "call" } = opts;

  const rows = vectors.map((values) => ({
    id: crypto.randomUUID(),
    values,
    namespace: faceNamespace(userId, cloneId),
    metadata: { personId: String(personId) },
  }));

  const createdAt = Date.now();
  const legacyStmt = env.DB.prepare(
    `INSERT INTO face_embeddings (person_id, vectorize_id, model, dim, source, created_at)
     VALUES (?, ?, 'w600k_mbf', 512, 'call', ?)`,
  );
  const scopeStmt = env.DB.prepare(
    `INSERT INTO clone_person_faces (clone_id, person_id, vectorize_id, model, dim, source, created_at)
     VALUES (?, ?, ?, 'w600k_mbf', 512, ?, ?)`,
  );
  await env.DB.batch([
    ...rows.map((r) => legacyStmt.bind(personId, r.id, createdAt)),
    ...rows.map((r) => scopeStmt.bind(cloneId, personId, r.id, source, createdAt)),
  ]);

  try {
    await getFaceIndex(env).insert(rows);
  } catch (e) {
    const placeholders = rows.map(() => "?").join(",");
    const vids = rows.map((r) => r.id);
    await env.DB.batch([
      env.DB.prepare(`DELETE FROM face_embeddings WHERE vectorize_id IN (${placeholders})`).bind(...vids),
      env.DB.prepare(`DELETE FROM clone_person_faces WHERE vectorize_id IN (${placeholders})`).bind(...vids),
    ]);
    throw e; 
  }

  const existing = await readOntPerson(env, cloneId, personId);
  if (existing === null) {
    await writeOntPerson(env, cloneId, personId, JSON.stringify({}), false);
  }

  return { enrolled: rows.length };
}
