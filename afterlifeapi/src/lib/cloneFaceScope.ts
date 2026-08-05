

import type { Bindings } from "./env";
import { getFaceIndex } from "./faceVectors";
import { writeOntPerson, readOntPerson } from "./memoryStore";
import { deletePersonCascade } from "./personDelete";
import { APIError } from "./errors";

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

  const legacySource = source === "self" ? "enroll" : source;

  const legacyStmt = env.DB.prepare(
    `INSERT INTO face_embeddings (person_id, vectorize_id, model, dim, source, created_at)
     VALUES (?, ?, 'w600k_mbf', 512, ?, ?)`,
  );
  const scopeStmt = env.DB.prepare(
    `INSERT INTO clone_person_faces (clone_id, person_id, vectorize_id, model, dim, source, created_at)
     VALUES (?, ?, ?, 'w600k_mbf', 512, ?, ?)`,
  );
  await env.DB.batch([
    ...rows.map((r) => legacyStmt.bind(personId, r.id, legacySource, createdAt)),
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

export interface SelfConfirmResult {
  personId: number;
  selfPersonId: number;
}

export async function confirmSelf(
  env: Bindings,
  opts: { userId: number; cloneId: number; vectors: number[][]; displayName?: string | null },
): Promise<SelfConfirmResult> {
  const { userId, cloneId, vectors, displayName = null } = opts;

  const now = Date.now();
  const ins = await env.DB.prepare(
    `INSERT INTO persons (user_id, clone_id, display_name, consent_state, consent_at, enrolled_via, created_at)
     VALUES (?, ?, ?, 'granted', ?, 'auto_biometric', ?)`,
  )
    .bind(userId, cloneId, displayName, now, now)
    .run();
  const personId = ins.meta.last_row_id as number;

  try {
    await enrollCloneScopeFaces(env, { userId, cloneId, personId, vectors, source: "self" });
  } catch (e) {
    await deletePersonCascade(env, personId, userId);
    throw e; 
  }

  const upd = await env.DB.prepare("UPDATE clones SET self_person_id = ? WHERE id = ? AND self_person_id IS NULL")
    .bind(personId, cloneId)
    .run();
  if (upd.meta.changes === 0) {

    await deletePersonCascade(env, personId, userId);
    throw new APIError("CONFLICT", "이미 self가 확정된 클론입니다.");
  }

  return { personId, selfPersonId: personId };
}

export async function ensureAccountPerson(
  env: Bindings,
  opts: { userId: number; cloneId: number },
): Promise<number> {
  const { userId, cloneId } = opts;

  const existing = await env.DB.prepare(
    "SELECT id FROM persons WHERE user_id = ? AND clone_id = ? ORDER BY id ASC LIMIT 1",
  )
    .bind(userId, cloneId)
    .first<{ id: number }>();

  let personId: number;
  if (existing) {
    personId = existing.id;
  } else {
    const now = Date.now();
    const ins = await env.DB.prepare(
      `INSERT INTO persons (user_id, clone_id, display_name, consent_state, consent_at, enrolled_via, created_at)
       VALUES (?, ?, NULL, 'none', NULL, 'card', ?)`,
    )
      .bind(userId, cloneId, now)
      .run();
    const insertedId = ins.meta.last_row_id as number;

    const canonical = await env.DB.prepare(
      "SELECT id FROM persons WHERE user_id = ? AND clone_id = ? ORDER BY id ASC LIMIT 1",
    )
      .bind(userId, cloneId)
      .first<{ id: number }>();
    personId = canonical!.id;

    if (personId !== insertedId) {

      await env.DB.prepare("DELETE FROM persons WHERE id = ?").bind(insertedId).run();
    }
  }

  const l2p = await readOntPerson(env, cloneId, personId);
  if (l2p === null) {
    await writeOntPerson(env, cloneId, personId, JSON.stringify({}), false);
  }

  return personId;
}
