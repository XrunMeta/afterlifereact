

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
  const v_61c797 = await v_c9c489.DB.prepare("SELECT vectorize_id FROM face_embeddings WHERE person_id = ?")
    .bind(v_ca1ec5)
    .all<{ vectorize_id: string | null }>();
  const v_23dafb = v_61c797.results.map((v_cb35cb) => v_cb35cb.vectorize_id).filter((v_81e2ef): v_81e2ef is string => Boolean(v_81e2ef));

  if (v_23dafb.length) await v_a8d2cc(v_c9c489).deleteByIds(v_23dafb);

  const v_bee926 = Date.now();

  await v_c9c489.DB.batch([
    v_c9c489.DB.prepare("DELETE FROM face_embeddings WHERE person_id = ?").bind(v_ca1ec5),

    v_c9c489.DB.prepare(
      `INSERT INTO persons_consent_log (person_id, state, terms_version, channel, changed_at)
       VALUES (?, 'revoked', NULL, 'face_delete', ?)`,
    ).bind(v_ca1ec5, v_bee926),
    v_c9c489.DB.prepare("UPDATE call_turns SET speaker_person_id = NULL WHERE speaker_person_id = ?").bind(v_ca1ec5),
    v_c9c489.DB.prepare("DELETE FROM clone_ont_person WHERE person_id = ?").bind(v_ca1ec5),
    v_c9c489.DB.prepare("DELETE FROM persons WHERE id = ? AND user_id = ?").bind(v_ca1ec5, v_43e90c),
  ]);

  return { deletedEmbeddings: v_23dafb.length };
}
