

import type { v_273a0c } from "./env";
import { v_a8d2cc } from "./faceVectors";

export interface PersonDeleteResult {
  deletedEmbeddings: number;
}

export async function v_430d2b(
  env: v_273a0c,
  v_ca1ec5,
  v_43e90c,
): Promise<PersonDeleteResult> {

  const v_61c797 = await v_c9c489.DB.prepare(
    `SELECT vectorize_id FROM face_embeddings WHERE person_id = ?
     UNION
     SELECT vectorize_id FROM clone_person_faces WHERE person_id = ?`,
  )
    .bind(v_ca1ec5, v_ca1ec5)
    .all<{ vectorize_id: string | null }>();
  const v_23dafb = v_61c797.results.map((v_cb35cb) => v_cb35cb.vectorize_id).filter((v_81e2ef): v_81e2ef is string => Boolean(v_81e2ef));

  if (v_23dafb.length) await v_a8d2cc(v_c9c489).deleteByIds(v_23dafb);

  const v_bee926 = Date.now();

  await v_c9c489.DB.batch([
    v_c9c489.DB.prepare("DELETE FROM face_embeddings WHERE person_id = ?").bind(v_ca1ec5),
    v_c9c489.DB.prepare("DELETE FROM clone_person_faces WHERE person_id = ?").bind(v_ca1ec5),

    v_c9c489.DB.prepare(
      `INSERT INTO persons_consent_log (person_id, state, terms_version, channel, changed_at)
       VALUES (?, 'revoked', NULL, 'face_delete', ?)`,
    ).bind(v_ca1ec5, v_bee926),
    v_c9c489.DB.prepare("UPDATE call_turns SET speaker_person_id = NULL WHERE speaker_person_id = ?").bind(v_ca1ec5),
    v_c9c489.DB.prepare("DELETE FROM clone_ont_person WHERE person_id = ?").bind(v_ca1ec5),

    v_c9c489.DB.prepare("UPDATE clones SET self_person_id = NULL WHERE self_person_id = ?").bind(v_ca1ec5),
    v_c9c489.DB.prepare("DELETE FROM persons WHERE id = ? AND user_id = ?").bind(v_ca1ec5, v_43e90c),
  ]);

  return { deletedEmbeddings: v_23dafb.length };
}

export interface CloneScopeDeleteResult {
  deletedPersons: number;
  deletedVectors: number;
}

export async function v_714639(
  env: v_273a0c,
  v_328259,
): Promise<CloneScopeDeleteResult> {
  const { userId: v_43e90c, cloneId: v_6e0fd3 } = v_328259;

  const v_fded81 = await v_c9c489.DB.prepare(
    `SELECT id FROM persons
      WHERE user_id = ? AND clone_id = ?
        AND id != COALESCE((SELECT self_person_id FROM clones WHERE id = ?), 0)`,
  )
    .bind(v_43e90c, v_6e0fd3, v_6e0fd3)
    .all<{ id: number }>();

  let v_834ce1 = 0;
  for (const v_e2a85c of v_fded81.results) {

    const v_495447 = await v_c9c489.DB.prepare(
      "SELECT vectorize_id FROM clone_person_faces WHERE clone_id = ? AND person_id = ?",
    )
      .bind(v_6e0fd3, v_e2a85c.id)
      .all<{ vectorize_id: string }>();
    const v_30b80f = v_495447.results.map((v_cb35cb) => v_cb35cb.vectorize_id).filter(Boolean);
    if (v_30b80f.length) await v_a8d2cc(v_c9c489).deleteByIds(v_30b80f);

    await v_c9c489.DB.prepare("DELETE FROM clone_person_faces WHERE clone_id = ? AND person_id = ?")
      .bind(v_6e0fd3, v_e2a85c.id)
      .run();

    const v_cb35cb = await v_430d2b(v_c9c489, v_e2a85c.id, v_43e90c);
    v_834ce1 += Math.max(v_30b80f.length, v_cb35cb.deletedEmbeddings);
  }

  return { deletedPersons: v_fded81.results.length, deletedVectors: v_834ce1 };
}
