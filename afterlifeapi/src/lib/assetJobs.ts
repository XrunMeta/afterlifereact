
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

export async function createJob(
  db: D1Database,
  id: string,
  userId: number,
  kind: AssetKind,
  srcFileId: number,
): Promise<string> {
  const token = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO clone_asset_jobs (id, user_id, kind, src_file_id, status, callback_token) VALUES (?,?,?,?,'pending',?)`,
    )
    .bind(id, userId, kind, srcFileId, token)
    .run();
  return token;
}

export async function getJob(db: D1Database, id: string): Promise<AssetJob | null> {
  return db.prepare(`SELECT * FROM clone_asset_jobs WHERE id = ?`).bind(id).first<AssetJob>();
}

export async function setStatus(db: D1Database, id: string, status: JobStatus): Promise<void> {

  const guard =
    status === "running"
      ? `AND status = 'pending'`
      : status === "failed"
        ? `AND status NOT IN ('done')`
        : "";
  await db
    .prepare(`UPDATE clone_asset_jobs SET status = ?, updated_at = datetime('now') WHERE id = ? ${guard}`)
    .bind(status, id)
    .run();
}

export interface ClaimResult {
  clone_id: number | null;
  kind: AssetKind;
}

export async function claimJob(
  db: D1Database,
  id: string,
): Promise<ClaimResult | null> {

  const job = await db
    .prepare(`SELECT id, status, clone_id, kind FROM clone_asset_jobs WHERE id=?`)
    .bind(id)
    .first<{ id: string; status: string; clone_id: number | null; kind: string }>();
  if (!job) return null;
  if (job.status !== "pending" && job.status !== "running") return null; 

  const result = await db
    .prepare(
      `UPDATE clone_asset_jobs
          SET status='done', updated_at=datetime('now')
        WHERE id=? AND status IN ('pending','running')`,
    )
    .bind(id)
    .run();

  if (!result.success || (result.meta?.changes ?? 0) === 0) return null;

  return { clone_id: job.clone_id, kind: job.kind as AssetKind };
}

export async function finalizeJob(
  db: D1Database,
  id: string,
  outFileId: number,
  outUrl: string,
  cloneId: number | null,
  kind: AssetKind,
): Promise<void> {
  await db
    .prepare(
      `UPDATE clone_asset_jobs SET out_file_id=?, out_url=?, updated_at=datetime('now') WHERE id=?`,
    )
    .bind(outFileId, outUrl, id)
    .run();
  if (cloneId) {
    const col = kind === "idle_video" ? "idle_video_url" : "voice_se_url";
    await db
      .prepare(`UPDATE clones SET ${col} = ? WHERE id = ?`)
      .bind(outUrl, cloneId)
      .run();
  }
}

export async function failJob(db: D1Database, id: string, error: string): Promise<void> {
  await db
    .prepare(
      `UPDATE clone_asset_jobs SET status='failed', error=?, updated_at=datetime('now') WHERE id=? AND status NOT IN ('done')`,
    )
    .bind(error.slice(0, 500), id)
    .run();
}

export async function linkClone(db: D1Database, jobId: string, cloneId: number): Promise<void> {
  await db
    .prepare(
      `UPDATE clone_asset_jobs SET clone_id=?, updated_at=datetime('now') WHERE id=?`,
    )
    .bind(cloneId, jobId)
    .run();
}

export async function claimJobRunning(
  db: D1Database,
  id: string,
): Promise<ClaimResult | null> {

  const job = await db
    .prepare(`SELECT id, status, clone_id, kind FROM clone_asset_jobs WHERE id=?`)
    .bind(id)
    .first<{ id: string; status: string; clone_id: number | null; kind: string }>();
  if (!job) return null;

  if (job.status === "running" || job.status === "done") return null;

  const result = await db
    .prepare(
      `UPDATE clone_asset_jobs
          SET status='running', updated_at=datetime('now')
        WHERE id=? AND status IN ('pending','failed')`,
    )
    .bind(id)
    .run();
  if (!result.success || (result.meta?.changes ?? 0) === 0) return null;
  return { clone_id: job.clone_id, kind: job.kind as AssetKind };
}

export interface FillerEntry {
  r2Key: string;
  sizeBytes: number;
}

export async function finalizeFillerJob(
  db: D1Database,
  jobId: string,
  entries: FillerEntry[],
  userId: number,
  cloneId: number | null,
  origin: string,
): Promise<string[]> {
  const urls: string[] = [];
  const insertedFileIds: number[] = [];

  try {

    for (const { r2Key, sizeBytes } of entries) {
      const ins = await db
        .prepare(
          `INSERT INTO files (r2_key, content_type, size_bytes, owner_user_id, purpose) VALUES (?,?,?,?,?) RETURNING id`,
        )
        .bind(r2Key, "video/mp4", sizeBytes, userId, "asset_filler")
        .first<{ id: number }>();
      insertedFileIds.push(ins!.id);
      urls.push(`${origin}/oth-path${ins!.id}`);
    }

    const outUrlJson = JSON.stringify(urls);
    const stmts: D1PreparedStatement[] = [];

    if (cloneId !== null && cloneId !== undefined) {
      stmts.push(
        db
          .prepare(`UPDATE clones SET filler_video_urls = ? WHERE id = ?`)
          .bind(outUrlJson, cloneId),
      );
    }
    stmts.push(
      db
        .prepare(
          `UPDATE clone_asset_jobs SET status='done', out_url=?, updated_at=datetime('now') WHERE id=?`,
        )
        .bind(outUrlJson, jobId),
    );
    await db.batch(stmts);
  } catch (err) {

    if (insertedFileIds.length > 0) {
      await db
        .prepare(
          `DELETE FROM files WHERE id IN (${insertedFileIds.map(() => "?").join(",")})`,
        )
        .bind(...insertedFileIds)
        .run()
        .catch(() => {}); 
    }
    throw err; 
  }

  return urls;
}
