

import type { v_273a0c } from "./env";
import { v_a8d2cc } from "./faceVectors";
import { v_862be2, v_0761b1 } from "./memoryStore";
import { v_430d2b } from "./personDelete";
import { v_3ebe58 } from "./errors";

export function v_929ead(v_43e90c, v_6e0fd3): string {
  return `${v_43e90c}:${v_6e0fd3}`;
}

export interface CloneScopeMatch {
  personId: number;
  score: number;

  landmarkRatiosList?: (Record<string, number> | null)[];
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

  const v_70f4f7 = [...v_8a69ab.keys()];

  const v_04f336 = new Map<number, (Record<string, number> | null)[]>();
  if (v_70f4f7.length) {
    try {
      const v_1cdc07 = v_70f4f7.map(() => "?").join(",");
      const v_315151 = await v_c9c489.DB.prepare(
        `SELECT person_id, landmark_ratios FROM clone_person_faces
          WHERE clone_id = ? AND person_id IN (${v_1cdc07})`,
      )
        .bind(v_6e0fd3, ...v_70f4f7)
        .all<{ person_id: number; landmark_ratios: string | null }>();
      for (const v_3ac7e7 of v_315151.results) {
        const v_d0c056 = v_04f336.get(v_3ac7e7.person_id) ?? [];
        if (v_3ac7e7.landmark_ratios) {
          try {
            const v_8decf8 = JSON.parse(v_3ac7e7.landmark_ratios);
            v_d0c056.push(v_8decf8);
          } catch {
            v_d0c056.push(null);
          }
        } else {
          v_d0c056.push(null);
        }
        v_04f336.set(v_3ac7e7.person_id, v_d0c056);
      }
    } catch {

    }
  }

  return [...v_8a69ab.entries()]
    .map(([v_ca1ec5, v_740dd8]) => ({
      personId: v_ca1ec5,
      score: v_740dd8,
      landmarkRatiosList: v_04f336.get(v_ca1ec5),
    }))
    .sort((v_779914, v_148ff6) => v_148ff6.score - v_779914.score);
}

export interface EnrollResult {
  enrolled: number;
}

export async function v_003ee1(
  env: v_273a0c,
  v_328259,
): Promise<EnrollResult> {
  const { userId: v_43e90c, cloneId: v_6e0fd3, personId: v_ca1ec5, vectors: v_f94e64, landmarkRatios: v_bef6f8, source: v_04e790 = "call" } = v_328259;

  const v_18b8bf = v_f94e64.map((v_6fea0b) => ({
    id: crypto.randomUUID(),
    values: v_6fea0b,
    namespace: v_929ead(v_43e90c, v_6e0fd3),
    metadata: { personId: String(v_ca1ec5) },
  }));

  const v_9e67a6 = Date.now();

  const v_9b9019 = v_04e790 === "self" ? "enroll" : v_04e790;

  const v_657f41 = v_c9c489.DB.prepare(
    `INSERT INTO face_embeddings (person_id, vectorize_id, model, dim, source, created_at)
     VALUES (?, ?, 'w600k_mbf', 512, ?, ?)`,
  );

  const v_eb55c5 = v_c9c489.DB.prepare(
    `INSERT INTO clone_person_faces (clone_id, person_id, vectorize_id, model, dim, source, created_at, landmark_ratios)
     VALUES (?, ?, ?, 'w600k_mbf', 512, ?, ?, ?)`,
  );
  const v_437cb0 = v_c9c489.DB.prepare(
    `INSERT INTO clone_person_faces (clone_id, person_id, vectorize_id, model, dim, source, created_at)
     VALUES (?, ?, ?, 'w600k_mbf', 512, ?, ?)`,
  );
  try {
    await v_c9c489.DB.batch([
      ...v_18b8bf.map((v_cb35cb) => v_657f41.bind(v_ca1ec5, v_cb35cb.id, v_9b9019, v_9e67a6)),
      ...v_18b8bf.map((v_cb35cb, v_ebec57) => {
        const v_8c6427 = v_bef6f8?.[v_ebec57];
        const v_4a4eb3 = v_8c6427 != null ? JSON.stringify(v_8c6427) : null;
        return v_eb55c5.bind(v_6e0fd3, v_ca1ec5, v_cb35cb.id, v_04e790, v_9e67a6, v_4a4eb3);
      }),
    ]);
  } catch {

    await v_c9c489.DB.batch([
      ...v_18b8bf.map((v_cb35cb) => v_657f41.bind(v_ca1ec5, v_cb35cb.id, v_9b9019, v_9e67a6)),
      ...v_18b8bf.map((v_cb35cb) => v_437cb0.bind(v_6e0fd3, v_ca1ec5, v_cb35cb.id, v_04e790, v_9e67a6)),
    ]);
  }

  try {
    await v_a8d2cc(v_c9c489).insert(v_18b8bf);
  } catch (v_9e86fd) {
    const v_1cdc07 = v_18b8bf.map(() => "?").join(",");
    const v_23dafb = v_18b8bf.map((v_cb35cb) => v_cb35cb.id);
    await v_c9c489.DB.batch([
      v_c9c489.DB.prepare(`DELETE FROM face_embeddings WHERE vectorize_id IN (${v_1cdc07})`).bind(...v_23dafb),
      v_c9c489.DB.prepare(`DELETE FROM clone_person_faces WHERE vectorize_id IN (${v_1cdc07})`).bind(...v_23dafb),
    ]);
    throw v_9e86fd; 
  }

  const v_3c8572 = await v_0761b1(v_c9c489, v_6e0fd3, v_ca1ec5);
  if (v_3c8572 === null) {
    await v_862be2(v_c9c489, v_6e0fd3, v_ca1ec5, JSON.stringify({}), false);
  }

  return { enrolled: v_18b8bf.length };
}

export interface SelfConfirmResult {
  personId: number;
  selfPersonId: number;
}

export async function v_4c5429(
  env: v_273a0c,
  v_328259,
): Promise<SelfConfirmResult> {
  const { userId: v_43e90c, cloneId: v_6e0fd3, vectors: v_f94e64, displayName: v_8a1355 = null } = v_328259;

  const v_5c2f9f = Date.now();
  const v_43af15 = await v_c9c489.DB.prepare(
    `INSERT INTO persons (user_id, clone_id, display_name, consent_state, consent_at, enrolled_via, created_at)
     VALUES (?, ?, ?, 'granted', ?, 'auto_biometric', ?)`,
  )
    .bind(v_43e90c, v_6e0fd3, v_8a1355, v_5c2f9f, v_5c2f9f)
    .run();
  const v_ca1ec5 = v_43af15.meta.last_row_id as number;

  try {
    await v_003ee1(v_c9c489, { userId: v_43e90c, cloneId: v_6e0fd3, personId: v_ca1ec5, vectors: v_f94e64, source: "self" });
  } catch (v_9e86fd) {
    await v_430d2b(v_c9c489, v_ca1ec5, v_43e90c);
    throw v_9e86fd; 
  }

  const v_b1eff4 = await v_c9c489.DB.prepare("UPDATE clones SET self_person_id = ? WHERE id = ? AND self_person_id IS NULL")
    .bind(v_ca1ec5, v_6e0fd3)
    .run();
  if (v_b1eff4.meta.changes === 0) {

    await v_430d2b(v_c9c489, v_ca1ec5, v_43e90c);
    throw new v_3ebe58("CONFLICT", "이미 self가 확정된 클론입니다.");
  }

  return { personId: v_ca1ec5, selfPersonId: v_ca1ec5 };
}

export async function v_840775(
  env: v_273a0c,
  v_328259,
): Promise<number> {
  const { userId: v_43e90c, cloneId: v_6e0fd3 } = v_328259;

  const v_3c8572 = await v_c9c489.DB.prepare(
    "SELECT id FROM persons WHERE user_id = ? AND clone_id = ? ORDER BY id ASC LIMIT 1",
  )
    .bind(v_43e90c, v_6e0fd3)
    .first<{ id: number }>();

  let v_ca1ec5;
  if (v_3c8572) {
    v_ca1ec5 = v_3c8572.id;
  } else {
    const v_5c2f9f = Date.now();
    const v_43af15 = await v_c9c489.DB.prepare(
      `INSERT INTO persons (user_id, clone_id, display_name, consent_state, consent_at, enrolled_via, created_at)
       VALUES (?, ?, NULL, 'none', NULL, 'card', ?)`,
    )
      .bind(v_43e90c, v_6e0fd3, v_5c2f9f)
      .run();
    const v_69586c = v_43af15.meta.last_row_id as number;

    const v_b8eaee = await v_c9c489.DB.prepare(
      "SELECT id FROM persons WHERE user_id = ? AND clone_id = ? ORDER BY id ASC LIMIT 1",
    )
      .bind(v_43e90c, v_6e0fd3)
      .first<{ id: number }>();
    v_ca1ec5 = v_b8eaee!.id;

    if (v_ca1ec5 !== v_69586c) {

      await v_c9c489.DB.prepare("DELETE FROM persons WHERE id = ?").bind(v_69586c).run();
    }
  }

  const v_d94e57 = await v_0761b1(v_c9c489, v_6e0fd3, v_ca1ec5);
  if (v_d94e57 === null) {
    await v_862be2(v_c9c489, v_6e0fd3, v_ca1ec5, JSON.stringify({}), false);
  }

  return v_ca1ec5;
}
