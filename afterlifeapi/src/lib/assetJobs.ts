
export type AssetKind = "idle_video" | "voice_clone" | "filler" | "guide" | "persona_videos";

export const v_a7025e = [
  "bridge_generic",
  "bridge_fact",
  "bridge_emotion_pos",
  "bridge_complex",
  "bridge_challenge",
] as const;
export const v_1a00b7 = 1 + v_a7025e.length; 
export type JobStatus = "pending" | "running" | "done" | "failed";

export interface AssetJob {
  id: string;
  user_id: number;
  kind: AssetKind;
  src_file_id: number;
  status: JobStatus;
  out_file_id: number | null;
  out_url: string | null;
  clone_id: number | null;
  callback_token: string | null;
  error: string | null;
}

export async function v_041f8e(
  v_a1651b,
  v_389afb,
  v_43e90c,
  v_94302c,
  v_2fa661,
): Promise<string> {
  const v_21cc31 = crypto.randomUUID();
  await v_a1651b
    .prepare(
      `INSERT INTO clone_asset_jobs (id, user_id, kind, src_file_id, status, callback_token) VALUES (?,?,?,?,'pending',?)`,
    )
    .bind(v_389afb, v_43e90c, v_94302c, v_2fa661, v_21cc31)
    .run();
  return v_21cc31;
}

export async function v_4b949c(v_a1651b, v_389afb): Promise<AssetJob | null> {
  return v_a1651b.prepare(`SELECT * FROM clone_asset_jobs WHERE id = ?`).bind(v_389afb).first<AssetJob>();
}

export async function v_5193f8(v_a1651b, v_389afb, v_d308b5): Promise<void> {

  const v_68d2b9 =
    v_d308b5 === "running"
      ? `AND status = 'pending'`
      : v_d308b5 === "failed"
        ? `AND status NOT IN ('done')`
        : "";
  await v_a1651b
    .prepare(`UPDATE clone_asset_jobs SET status = ?, updated_at = datetime('now') WHERE id = ? ${v_68d2b9}`)
    .bind(v_d308b5, v_389afb)
    .run();
}

export interface ClaimResult {
  clone_id: number | null;
  kind: AssetKind;
}

export async function v_278a53(
  v_a1651b,
  v_389afb,
): Promise<ClaimResult | null> {

  const v_d5ec97 = await v_a1651b
    .prepare(`SELECT id, status, clone_id, kind FROM clone_asset_jobs WHERE id=?`)
    .bind(v_389afb)
    .first<{ id: string; status: string; clone_id: number | null; kind: string }>();
  if (!v_d5ec97) return null;
  if (v_d5ec97.status !== "pending" && v_d5ec97.status !== "running") return null; 

  const v_43c42e = await v_a1651b
    .prepare(
      `UPDATE clone_asset_jobs
          SET status='done', updated_at=datetime('now')
        WHERE id=? AND status IN ('pending','running')`,
    )
    .bind(v_389afb)
    .run();

  if (!v_43c42e.success || (v_43c42e.meta?.changes ?? 0) === 0) return null;

  return { clone_id: v_d5ec97.clone_id, kind: v_d5ec97.kind as AssetKind };
}

export async function v_2fb81a(
  v_a1651b,
  v_389afb,
  v_900c05,
  v_7ce8a7,
  v_6e0fd3,
  v_94302c,
): Promise<void> {
  await v_a1651b
    .prepare(
      `UPDATE clone_asset_jobs SET out_file_id=?, out_url=?, updated_at=datetime('now') WHERE id=?`,
    )
    .bind(v_900c05, v_7ce8a7, v_389afb)
    .run();
  if (v_6e0fd3) {
    const v_c8b83f = v_94302c === "idle_video" ? "idle_video_url" : "voice_se_url";
    await v_a1651b
      .prepare(`UPDATE clones SET ${v_c8b83f} = ? WHERE id = ?`)
      .bind(v_7ce8a7, v_6e0fd3)
      .run();
  }
}

export async function v_689a90(v_a1651b, v_389afb, v_d1a0d1): Promise<void> {
  await v_a1651b
    .prepare(
      `UPDATE clone_asset_jobs SET status='done', out_url=?, updated_at=datetime('now') WHERE id=? AND kind='voice_clone' AND status='pending'`,
    )
    .bind(v_d1a0d1, v_389afb)
    .run();
}

export async function v_7a6ff6(v_a1651b, v_389afb, v_5e9bfe): Promise<void> {
  await v_a1651b
    .prepare(
      `UPDATE clone_asset_jobs SET status='failed', error=?, updated_at=datetime('now') WHERE id=? AND status NOT IN ('done')`,
    )
    .bind(v_5e9bfe.slice(0, 500), v_389afb)
    .run();
}

export async function v_f64843(v_a1651b, v_04211c, v_6e0fd3): Promise<void> {
  await v_a1651b
    .prepare(
      `UPDATE clone_asset_jobs SET clone_id=?, updated_at=datetime('now') WHERE id=?`,
    )
    .bind(v_6e0fd3, v_04211c)
    .run();
}

export async function v_80401b(
  v_a1651b,
  v_389afb,
): Promise<ClaimResult | null> {

  const v_d5ec97 = await v_a1651b
    .prepare(`SELECT id, status, clone_id, kind FROM clone_asset_jobs WHERE id=?`)
    .bind(v_389afb)
    .first<{ id: string; status: string; clone_id: number | null; kind: string }>();
  if (!v_d5ec97) return null;

  if (v_d5ec97.status === "done") return null;
  const v_43c42e = await v_a1651b
    .prepare(
      `UPDATE clone_asset_jobs
          SET status='running', updated_at=datetime('now')
        WHERE id=? AND status IN ('pending','running','failed')`,
    )
    .bind(v_389afb)
    .run();
  if (!v_43c42e.success || (v_43c42e.meta?.changes ?? 0) === 0) return null;
  return { clone_id: v_d5ec97.clone_id, kind: v_d5ec97.kind as AssetKind };
}

export interface FillerEntry {
  r2Key: string;
  sizeBytes: number;
}

export async function v_12ade7(
  v_a1651b,
  v_04211c,
  v_1e6eca,
  v_43e90c,
  v_6e0fd3,
  v_f17108,
  v_94302c,
): Promise<string[] | null> {

  const v_c8b83f = v_94302c === "guide" ? "guide_video_urls" : "filler_video_urls";
  const v_fa63e0 = v_94302c === "guide" ? "asset_guide" : "asset_filler";
  const v_942aa2 = [];
  const v_90403f = [];

  try {

    for (const { r2Key: v_0037e3, sizeBytes: v_27cd00 } of v_1e6eca) {
      const v_43af15 = await v_a1651b
        .prepare(
          `INSERT INTO files (r2_key, content_type, size_bytes, owner_user_id, purpose) VALUES (?,?,?,?,?) RETURNING id`,
        )
        .bind(v_0037e3, "video/mp4", v_27cd00, v_43e90c, v_fa63e0)
        .first<{ id: number }>();
      v_90403f.push(v_43af15!.id);
      v_942aa2.push(`${v_f17108}/oth-path${v_43af15!.id}`);
    }

    const v_89094b = JSON.stringify(v_942aa2);
    const v_3e6264 = [];

    if (v_6e0fd3 !== null && v_6e0fd3 !== undefined) {
      v_3e6264.push(
        v_a1651b
          .prepare(
            `UPDATE clones SET ${v_c8b83f} = ?
              WHERE id = ?
                AND (SELECT status FROM clone_asset_jobs WHERE id = ?) = 'running'`,
          )
          .bind(v_89094b, v_6e0fd3, v_04211c),
      );
    }
    const v_1d82d8 = v_3e6264.length;
    v_3e6264.push(
      v_a1651b
        .prepare(
          `UPDATE clone_asset_jobs SET status='done', out_url=?, updated_at=datetime('now')
            WHERE id=? AND status='running'`,
        )
        .bind(v_89094b, v_04211c),
    );
    const v_a7f568 = await v_a1651b.batch(v_3e6264);
    const v_0be20a = v_a7f568[v_1d82d8]?.meta?.changes ?? 0;
    if (v_0be20a === 0) {

      if (v_90403f.length > 0) {
        await v_a1651b
          .prepare(
            `DELETE FROM files WHERE id IN (${v_90403f.map(() => "?").join(",")})`,
          )
          .bind(...v_90403f)
          .run()
          .catch(() => {});
      }
      return null;
    }
  } catch (v_49263d) {

    if (v_90403f.length > 0) {
      await v_a1651b
        .prepare(
          `DELETE FROM files WHERE id IN (${v_90403f.map(() => "?").join(",")})`,
        )
        .bind(...v_90403f)
        .run()
        .catch(() => {}); 
    }
    throw v_49263d; 
  }

  return v_942aa2;
}

export async function v_c12e45(
  v_a1651b,
  v_04211c,
  v_1e6eca,
  v_43e90c,
  v_6e0fd3,
  v_f17108,
): Promise<string[] | null> {
  return v_12ade7(v_a1651b, v_04211c, v_1e6eca, v_43e90c, v_6e0fd3, v_f17108, "filler");
}

export async function v_f9d88f(
  v_a1651b,
  v_04211c,
  v_2b8338,
  v_43e90c,
  v_6e0fd3,
  v_f17108,
): Promise<string | null> {
  let v_8c65c3 = null;
  try {
    const v_43af15 = await v_a1651b
      .prepare(
        `INSERT INTO files (r2_key, content_type, size_bytes, owner_user_id, purpose) VALUES (?,?,?,?,?) RETURNING id`,
      )
      .bind(v_2b8338.r2Key, "video/mp4", v_2b8338.sizeBytes, v_43e90c, "asset_persona_video")
      .first<{ id: number }>();
    v_8c65c3 = v_43af15!.id;
    const v_f71b56 = `${v_f17108}/oth-path${v_8c65c3}`;

    const v_3e6264 = [];
    if (v_6e0fd3 !== null && v_6e0fd3 !== undefined) {
      v_3e6264.push(
        v_a1651b
          .prepare(
            `UPDATE clones SET idle_video_url = ?
              WHERE id = ?
                AND (SELECT status FROM clone_asset_jobs WHERE id = ?) = 'running'`,
          )
          .bind(v_f71b56, v_6e0fd3, v_04211c),
      );
    }

    const v_1d82d8 = v_3e6264.length;
    v_3e6264.push(
      v_a1651b
        .prepare(
          `UPDATE clone_asset_jobs SET status='done', out_url=?, updated_at=datetime('now')
            WHERE id=? AND status='running'`,
        )
        .bind(JSON.stringify([v_f71b56]), v_04211c),
    );
    const v_a7f568 = await v_a1651b.batch(v_3e6264);
    const v_0be20a = v_a7f568[v_1d82d8]?.meta?.changes ?? 0;
    if (v_0be20a === 0) {

      if (v_8c65c3 !== null) {
        await v_a1651b.prepare(`DELETE FROM files WHERE id = ?`).bind(v_8c65c3).run().catch(() => {});
      }
      return null;
    }
    return v_f71b56;
  } catch (v_49263d) {
    if (v_8c65c3 !== null) {
      await v_a1651b.prepare(`DELETE FROM files WHERE id = ?`).bind(v_8c65c3).run().catch(() => {});
    }
    throw v_49263d;
  }
}

export async function v_dec905(
  v_a1651b,
  v_04211c,
  v_1e6eca,
  v_43e90c,
  v_6e0fd3,
  v_f17108,
): Promise<string[] | null> {
  if (v_1e6eca.length !== v_a7025e.length) {
    throw new Error(
      `persona_videos bridges: expected ${v_a7025e.length} entries, got ${v_1e6eca.length}`,
    );
  }
  const v_942aa2 = [];
  const v_90403f = [];

  try {
    for (const { r2Key: v_0037e3, sizeBytes: v_27cd00 } of v_1e6eca) {
      const v_43af15 = await v_a1651b
        .prepare(
          `INSERT INTO files (r2_key, content_type, size_bytes, owner_user_id, purpose) VALUES (?,?,?,?,?) RETURNING id`,
        )
        .bind(v_0037e3, "video/mp4", v_27cd00, v_43e90c, "asset_persona_video")
        .first<{ id: number }>();
      v_90403f.push(v_43af15!.id);
      v_942aa2.push(`${v_f17108}/oth-path${v_43af15!.id}`);
    }

    const v_a8b0d9 = {};
    v_a7025e.forEach((v_b24339, v_ebec57) => {
      v_a8b0d9[v_b24339] = v_942aa2[v_ebec57]!;
    });
    const v_564ed2 = JSON.stringify(v_a8b0d9);

    const v_3e6264 = [];
    if (v_6e0fd3 !== null && v_6e0fd3 !== undefined) {
      v_3e6264.push(
        v_a1651b
          .prepare(
            `UPDATE clones SET bridge_video_urls = ?
              WHERE id = ?
                AND (SELECT status FROM clone_asset_jobs WHERE id = ?) = 'running'`,
          )
          .bind(v_564ed2, v_6e0fd3, v_04211c),
      );
    }
    const v_1d82d8 = v_3e6264.length;
    v_3e6264.push(
      v_a1651b
        .prepare(
          `UPDATE clone_asset_jobs SET status='done', out_url=?, updated_at=datetime('now')
            WHERE id=? AND status='running'`,
        )
        .bind(JSON.stringify(v_942aa2), v_04211c),
    );
    const v_a7f568 = await v_a1651b.batch(v_3e6264);
    const v_0be20a = v_a7f568[v_1d82d8]?.meta?.changes ?? 0;
    if (v_0be20a === 0) {
      if (v_90403f.length > 0) {
        await v_a1651b
          .prepare(
            `DELETE FROM files WHERE id IN (${v_90403f.map(() => "?").join(",")})`,
          )
          .bind(...v_90403f)
          .run()
          .catch(() => {});
      }
      return null;
    }
    return v_942aa2;
  } catch (v_49263d) {
    if (v_90403f.length > 0) {
      await v_a1651b
        .prepare(
          `DELETE FROM files WHERE id IN (${v_90403f.map(() => "?").join(",")})`,
        )
        .bind(...v_90403f)
        .run()
        .catch(() => {});
    }
    throw v_49263d;
  }
}

export async function v_7d2f16(
  v_a1651b,
  v_04211c,
  v_1e6eca,
  v_43e90c,
  v_6e0fd3,
  v_f17108,
): Promise<string[] | null> {
  if (v_1e6eca.length !== v_1a00b7) {
    throw new Error(
      `persona_videos: expected ${v_1a00b7} entries, got ${v_1e6eca.length}`,
    );
  }
  const v_942aa2 = [];
  const v_90403f = [];

  try {
    for (const { r2Key: v_0037e3, sizeBytes: v_27cd00 } of v_1e6eca) {
      const v_43af15 = await v_a1651b
        .prepare(
          `INSERT INTO files (r2_key, content_type, size_bytes, owner_user_id, purpose) VALUES (?,?,?,?,?) RETURNING id`,
        )
        .bind(v_0037e3, "video/mp4", v_27cd00, v_43e90c, "asset_persona_video")
        .first<{ id: number }>();
      v_90403f.push(v_43af15!.id);
      v_942aa2.push(`${v_f17108}/oth-path${v_43af15!.id}`);
    }

    const v_89094b = JSON.stringify(v_942aa2);
    const v_a8b0d9 = {};
    v_a7025e.forEach((v_b24339, v_ebec57) => {
      v_a8b0d9[v_b24339] = v_942aa2[v_ebec57 + 1]!;
    });
    const v_564ed2 = JSON.stringify(v_a8b0d9);
    const v_c95239 = v_942aa2[0]!;

    const v_3e6264 = [];
    if (v_6e0fd3 !== null && v_6e0fd3 !== undefined) {
      v_3e6264.push(
        v_a1651b
          .prepare(
            `UPDATE clones SET idle_video_url = ?, bridge_video_urls = ?
              WHERE id = ?
                AND (SELECT status FROM clone_asset_jobs WHERE id = ?) = 'running'`,
          )
          .bind(v_c95239, v_564ed2, v_6e0fd3, v_04211c),
      );
    }
    const v_1d82d8 = v_3e6264.length;
    v_3e6264.push(
      v_a1651b
        .prepare(
          `UPDATE clone_asset_jobs SET status='done', out_url=?, updated_at=datetime('now')
            WHERE id=? AND status='running'`,
        )
        .bind(v_89094b, v_04211c),
    );
    const v_a7f568 = await v_a1651b.batch(v_3e6264);
    const v_0be20a = v_a7f568[v_1d82d8]?.meta?.changes ?? 0;
    if (v_0be20a === 0) {
      if (v_90403f.length > 0) {
        await v_a1651b
          .prepare(
            `DELETE FROM files WHERE id IN (${v_90403f.map(() => "?").join(",")})`,
          )
          .bind(...v_90403f)
          .run()
          .catch(() => {});
      }
      return null;
    }
  } catch (v_49263d) {
    if (v_90403f.length > 0) {
      await v_a1651b
        .prepare(
          `DELETE FROM files WHERE id IN (${v_90403f.map(() => "?").join(",")})`,
        )
        .bind(...v_90403f)
        .run()
        .catch(() => {});
    }
    throw v_49263d;
  }

  return v_942aa2;
}
