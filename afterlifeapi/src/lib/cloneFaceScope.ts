

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

  landmarkRatiosList?: (Record<string, number> | null)[];
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

  const personIds = [...byPerson.keys()];

  const landmarksByPerson = new Map<number, (Record<string, number> | null)[]>();
  if (personIds.length) {
    try {
      const placeholders = personIds.map(() => "?").join(",");
      const rs = await env.DB.prepare(
        `SELECT person_id, landmark_ratios FROM clone_person_faces
          WHERE clone_id = ? AND person_id IN (${placeholders})`,
      )
        .bind(cloneId, ...personIds)
        .all<{ person_id: number; landmark_ratios: string | null }>();
      for (const row of rs.results) {
        const arr = landmarksByPerson.get(row.person_id) ?? [];
        if (row.landmark_ratios) {
          try {
            const parsed = JSON.parse(row.landmark_ratios);
            arr.push(parsed);
          } catch {
            arr.push(null);
          }
        } else {
          arr.push(null);
        }
        landmarksByPerson.set(row.person_id, arr);
      }
    } catch {

    }
  }

  return [...byPerson.entries()]
    .map(([personId, score]) => ({
      personId,
      score,
      landmarkRatiosList: landmarksByPerson.get(personId),
    }))
    .sort((a, b) => b.score - a.score);
}

export async function autoAdoptFromOtherClone(
  env: Bindings,
  opts: { userId: number; targetCloneId: number },
): Promise<{ adopted: boolean; personId?: number; count?: number }> {
  const { userId, targetCloneId } = opts;

  const existing = await env.DB.prepare(
    "SELECT COUNT(*) AS cnt FROM persons WHERE user_id = ? AND clone_id = ?",
  ).bind(userId, targetCloneId).first<{ cnt: number }>();
  if ((existing?.cnt ?? 0) > 0) return { adopted: false };

  const source = await env.DB.prepare(
    `SELECT p.id AS person_id, p.clone_id, p.display_name, p.consent_state, p.consent_at, p.enrolled_via
       FROM persons p
       JOIN clone_person_faces f ON f.person_id = p.id
      WHERE p.user_id = ? AND p.clone_id != ?
      GROUP BY p.id
      ORDER BY p.created_at ASC
      LIMIT 1`,
  ).bind(userId, targetCloneId).first<{
    person_id: number;
    clone_id: number;
    display_name: string | null;
    consent_state: string;
    consent_at: number | null;
    enrolled_via: string;
  }>();

  if (!source) return { adopted: false };

  const srcFaces = await env.DB.prepare(
    `SELECT vectorize_id, landmark_ratios FROM clone_person_faces
      WHERE clone_id = ? AND person_id = ?`,
  ).bind(source.clone_id, source.person_id).all<{
    vectorize_id: string;
    landmark_ratios: string | null;
  }>();

  const srcIds = srcFaces.results.map((r) => r.vectorize_id);
  if (srcIds.length === 0) return { adopted: false };

  const idx = getFaceIndex(env);
  const rawVectors = await idx.getByIds(srcIds);
  const vectorMap = new Map<string, number[]>();
  for (const v of rawVectors) vectorMap.set(v.id, v.values);

  const facesWithValues = srcFaces.results
    .map((src) => ({
      values: vectorMap.get(src.vectorize_id),
      landmark_ratios: src.landmark_ratios,
    }))
    .filter((r): r is { values: number[]; landmark_ratios: string | null } => r.values != null);

  if (facesWithValues.length === 0) return { adopted: false };

  const now = Date.now();
  const consentState = source.consent_state === "granted" ? "granted" : "none";
  const enrolledVia = source.enrolled_via === "auto_biometric" ? "auto_biometric" : "card";
  const insPerson = await env.DB.prepare(
    `INSERT INTO persons (user_id, clone_id, display_name, consent_state, consent_at, enrolled_via, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(userId, targetCloneId, source.display_name, consentState, source.consent_at, enrolledVia, now)
    .run();
  const newPersonId = insPerson.meta.last_row_id as number;

  const newRows = facesWithValues.map((f) => ({
    id: crypto.randomUUID(),
    values: f.values,
    namespace: faceNamespace(userId, targetCloneId),
    metadata: { personId: String(newPersonId) },
    landmark_ratios: f.landmark_ratios,
  }));

  const legacyStmt = env.DB.prepare(
    `INSERT INTO face_embeddings (person_id, vectorize_id, model, dim, source, created_at)
     VALUES (?, ?, 'w600k_mbf', 512, 'enroll', ?)`,
  );
  const scopeStmt = env.DB.prepare(
    `INSERT INTO clone_person_faces (clone_id, person_id, vectorize_id, model, dim, source, created_at, landmark_ratios)
     VALUES (?, ?, ?, 'w600k_mbf', 512, 'enroll', ?, ?)`,
  );
  const scopeStmtLegacy = env.DB.prepare(
    `INSERT INTO clone_person_faces (clone_id, person_id, vectorize_id, model, dim, source, created_at)
     VALUES (?, ?, ?, 'w600k_mbf', 512, 'enroll', ?)`,
  );
  try {
    await env.DB.batch([
      ...newRows.map((r) => legacyStmt.bind(newPersonId, r.id, now)),
      ...newRows.map((r) => scopeStmt.bind(targetCloneId, newPersonId, r.id, now, r.landmark_ratios)),
    ]);
  } catch {

    await env.DB.batch([
      ...newRows.map((r) => legacyStmt.bind(newPersonId, r.id, now)),
      ...newRows.map((r) => scopeStmtLegacy.bind(targetCloneId, newPersonId, r.id, now)),
    ]);
  }

  await idx.insert(
    newRows.map((r) => ({ id: r.id, values: r.values, namespace: r.namespace, metadata: r.metadata })),
  );

  const existingL2 = await readOntPerson(env, targetCloneId, newPersonId);
  if (existingL2 === null) {
    await writeOntPerson(env, targetCloneId, newPersonId, JSON.stringify({}), false);
  }

  return { adopted: true, personId: newPersonId, count: newRows.length };
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

    landmarkRatios?: (Record<string, number> | null)[];
    source?: "enroll" | "call" | "self";
  },
): Promise<EnrollResult> {
  const { userId, cloneId, personId, vectors, landmarkRatios, source = "call" } = opts;

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
    `INSERT INTO clone_person_faces (clone_id, person_id, vectorize_id, model, dim, source, created_at, landmark_ratios)
     VALUES (?, ?, ?, 'w600k_mbf', 512, ?, ?, ?)`,
  );
  const scopeStmtLegacy = env.DB.prepare(
    `INSERT INTO clone_person_faces (clone_id, person_id, vectorize_id, model, dim, source, created_at)
     VALUES (?, ?, ?, 'w600k_mbf', 512, ?, ?)`,
  );
  try {
    await env.DB.batch([
      ...rows.map((r) => legacyStmt.bind(personId, r.id, legacySource, createdAt)),
      ...rows.map((r, i) => {
        const lm = landmarkRatios?.[i];
        const lmJson = lm != null ? JSON.stringify(lm) : null;
        return scopeStmt.bind(cloneId, personId, r.id, source, createdAt, lmJson);
      }),
    ]);
  } catch {

    await env.DB.batch([
      ...rows.map((r) => legacyStmt.bind(personId, r.id, legacySource, createdAt)),
      ...rows.map((r) => scopeStmtLegacy.bind(cloneId, personId, r.id, source, createdAt)),
    ]);
  }

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
