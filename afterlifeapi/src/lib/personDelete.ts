

import type { Bindings } from "./env";
import { getFaceIndex } from "./faceVectors";

export interface PersonDeleteResult {
  deletedEmbeddings: number;
}

export async function deletePersonCascade(
  env: Bindings,
  personId: number,
  userId: number,
): Promise<PersonDeleteResult> {
  const embs = await env.DB.prepare("SELECT vectorize_id FROM face_embeddings WHERE person_id = ?")
    .bind(personId)
    .all<{ vectorize_id: string | null }>();
  const vids = embs.results.map((r) => r.vectorize_id).filter((v): v is string => Boolean(v));

  if (vids.length) await getFaceIndex(env).deleteByIds(vids);

  const deletedAt = Date.now();

  await env.DB.batch([
    env.DB.prepare("DELETE FROM face_embeddings WHERE person_id = ?").bind(personId),

    env.DB.prepare(
      `INSERT INTO persons_consent_log (person_id, state, terms_version, channel, changed_at)
       VALUES (?, 'revoked', NULL, 'face_delete', ?)`,
    ).bind(personId, deletedAt),
    env.DB.prepare("UPDATE call_turns SET speaker_person_id = NULL WHERE speaker_person_id = ?").bind(personId),
    env.DB.prepare("DELETE FROM clone_ont_person WHERE person_id = ?").bind(personId),
    env.DB.prepare("DELETE FROM persons WHERE id = ? AND user_id = ?").bind(personId, userId),
  ]);

  return { deletedEmbeddings: vids.length };
}

export interface CloneScopeDeleteResult {
  deletedPersons: number;
  deletedVectors: number;
}

export async function deleteCloneScopeMemory(
  env: Bindings,
  opts: { userId: number; cloneId: number },
): Promise<CloneScopeDeleteResult> {
  const { userId, cloneId } = opts;

  const persons = await env.DB.prepare("SELECT id FROM persons WHERE user_id = ? AND clone_id = ?")
    .bind(userId, cloneId)
    .all<{ id: number }>();

  let deletedVectors = 0;
  for (const p of persons.results) {

    const scoped = await env.DB.prepare(
      "SELECT vectorize_id FROM clone_person_faces WHERE clone_id = ? AND person_id = ?",
    )
      .bind(cloneId, p.id)
      .all<{ vectorize_id: string }>();
    const scopedIds = scoped.results.map((r) => r.vectorize_id).filter(Boolean);
    if (scopedIds.length) await getFaceIndex(env).deleteByIds(scopedIds);

    await env.DB.prepare("DELETE FROM clone_person_faces WHERE clone_id = ? AND person_id = ?")
      .bind(cloneId, p.id)
      .run();

    const r = await deletePersonCascade(env, p.id, userId);
    deletedVectors += Math.max(scopedIds.length, r.deletedEmbeddings);
  }

  return { deletedPersons: persons.results.length, deletedVectors };
}
