
export type AssetKind = "idle_video" | "voice_clone" | "filler";
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

export async function v_c12e45(
  v_a1651b,
  v_04211c,
  v_1e6eca,
  v_43e90c,
  v_6e0fd3,
  v_f17108,
): Promise<string[]> {
  const v_942aa2 = [];
  const v_90403f = [];

  try {

    for (const { r2Key: v_0037e3, sizeBytes: v_27cd00 } of v_1e6eca) {
      const v_43af15 = await v_a1651b
        .prepare(
          `INSERT INTO files (r2_key, content_type, size_bytes, owner_user_id, purpose) VALUES (?,?,?,?,?) RETURNING id`,
        )
        .bind(v_0037e3, "video/mp4", v_27cd00, v_43e90c, "asset_filler")
        .first<{ id: number }>();
      v_90403f.push(v_43af15!.id);
      v_942aa2.push(`${v_f17108}/oth-path${v_43af15!.id}`);
    }

    const v_89094b = JSON.stringify(v_942aa2);
    const v_3e6264 = [];

    if (v_6e0fd3 !== null && v_6e0fd3 !== undefined) {
      v_3e6264.push(
        v_a1651b
          .prepare(`UPDATE clones SET filler_video_urls = ? WHERE id = ?`)
          .bind(v_89094b, v_6e0fd3),
      );
    }
    v_3e6264.push(
      v_a1651b
        .prepare(
          `UPDATE clone_asset_jobs SET status='done', out_url=?, updated_at=datetime('now') WHERE id=?`,
        )
        .bind(v_89094b, v_04211c),
    );
    await v_a1651b.batch(v_3e6264);
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
