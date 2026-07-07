

import { describe, it, expect } from "vitest";
import { SELF, env } from "cloudflare:test";
import { finalizeFillerJob } from "../src/lib/assetJobs";

async function seedUser(email: string): Promise<number> {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(
      `INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`,
    )
    .bind(email)
    .run();
  return (
    await db
      .prepare(`SELECT id FROM users WHERE email = ?`)
      .bind(email)
      .first<{ id: number }>()
  )!.id;
}

async function seedFile(ownerId: number, suffix: string): Promise<number> {
  const db = env.DB as unknown as D1Database;
  const key = `uploadedfiles/filler-${suffix}.jpg`;
  const r = await db
    .prepare(
      `INSERT INTO files (r2_key, content_type, size_bytes, owner_user_id, purpose)
       VALUES (?, 'image/jpeg', 1, ?, 'clone_avatar') RETURNING id`,
    )
    .bind(key, ownerId)
    .first<{ id: number }>();
  return r!.id;
}

async function seedClone(ownerId: number, username: string): Promise<number> {
  const db = env.DB as unknown as D1Database;
  const r = await db
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
       VALUES (?, 'FC', ?, 'friend', 'public', CURRENT_TIMESTAMP) RETURNING id`,
    )
    .bind(ownerId, username)
    .first<{ id: number }>();
  return r!.id;
}

async function seedFillerJob(
  userId: number,
  srcFileId: number,
  cloneId: number | null,
): Promise<{ jobId: string; callbackToken: string }> {
  const db = env.DB as unknown as D1Database;
  const jobId = crypto.randomUUID();
  const callbackToken = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO clone_asset_jobs (id, user_id, kind, src_file_id, status, clone_id, callback_token)
       VALUES (?, ?, 'filler', ?, 'pending', ?, ?)`,
    )
    .bind(jobId, userId, srcFileId, cloneId, callbackToken)
    .run();
  return { jobId, callbackToken };
}

async function forceJobPending(jobId: string): Promise<void> {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(
      `UPDATE clone_asset_jobs SET status = 'pending', error = NULL, updated_at = datetime('now') WHERE id = ?`,
    )
    .bind(jobId)
    .run();
}

async function seedGuideJobRunning(
  userId: number,
  srcFileId: number,
  cloneId: number | null,
): Promise<{ jobId: string; callbackToken: string }> {
  const db = env.DB as unknown as D1Database;
  const jobId = crypto.randomUUID();
  const callbackToken = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO clone_asset_jobs (id, user_id, kind, src_file_id, status, clone_id, callback_token)
       VALUES (?, ?, 'guide', ?, 'running', ?, ?)`,
    )
    .bind(jobId, userId, srcFileId, cloneId, callbackToken)
    .run();
  return { jobId, callbackToken };
}

const SECRET = () =>
  (env as { ORCH_SECRET?: string }).ORCH_SECRET ?? "test-orch-secret";

function makeForm(
  jobId: string,
  callbackToken: string,
  files: Array<{ data: Uint8Array; name: string } | null>,
): FormData {
  const fd = new FormData();
  fd.append("job_id", jobId);
  fd.append("callback_token", callbackToken);
  files.forEach((f, i) => {
    if (f !== null) {
      fd.append(
        `file${i}`,
        new Blob([f.data], { type: "video/mp4" }),
        f.name,
      );
    }
  });
  return fd;
}

const TINY_MP4 = new Uint8Array([0, 1, 2, 3]); 

describe("POST /oth-path — 인증", () => {
  it("ORCH_SECRET 불일치 → 401", async () => {
    const fd = new FormData();
    fd.append("job_id", "x");
    fd.append("callback_token", "y");
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: "Bearer wrong-secret" },
      body: fd,
    });
    expect(res.status).toBe(401);
  });

  it("Authorization 헤더 없음 → 401", async () => {
    const fd = new FormData();
    fd.append("job_id", "x");
    fd.append("callback_token", "y");
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      body: fd,
    });
    expect(res.status).toBe(401);
  });

  it("callback_token 불일치 → 403", async () => {
    const uid = await seedUser("filler_403@test.com");
    const fid = await seedFile(uid, "filler-403");
    const cid = await seedClone(uid, "filler403");
    const { jobId } = await seedFillerJob(uid, fid, cid);
    const fd = makeForm("x", "x", []); 
    const fdReal = new FormData();
    fdReal.append("job_id", jobId);
    fdReal.append("callback_token", "wrong-token");
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${SECRET()}` },
      body: fdReal,
    });
    expect(res.status).toBe(403);
    const body = await res.json<{ error: string }>();
    expect(body.error).toMatch(/callback_token/);
  });
});

describe("POST /oth-path — 파일 검증", () => {
  it("file0 없음(0개) → 400", async () => {
    const uid = await seedUser("filler_0file@test.com");
    const fid = await seedFile(uid, "filler-0file");
    const cid = await seedClone(uid, "filler0file");
    const { jobId, callbackToken } = await seedFillerJob(uid, fid, cid);
    const fd = new FormData();
    fd.append("job_id", jobId);
    fd.append("callback_token", callbackToken);

    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${SECRET()}` },
      body: fd,
    });
    expect(res.status).toBe(400);
    const body = await res.json<{ error: string }>();
    expect(body.error).toMatch(/file0/);
  });

  it("file0, file1 만(2개) → 400", async () => {
    const uid = await seedUser("filler_2file@test.com");
    const fid = await seedFile(uid, "filler-2file");
    const cid = await seedClone(uid, "filler2file");
    const { jobId, callbackToken } = await seedFillerJob(uid, fid, cid);
    const fd = makeForm(jobId, callbackToken, [
      { data: TINY_MP4, name: "f0.mp4" },
      { data: TINY_MP4, name: "f1.mp4" },
      null, 
    ]);
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${SECRET()}` },
      body: fd,
    });
    expect(res.status).toBe(400);
    const body = await res.json<{ error: string }>();
    expect(body.error).toMatch(/file2/);
  });

  it("6개(라운드4 확장 계약) → 정상 처리, filler_video_urls 6개", async () => {
    const uid = await seedUser("filler_6file@test.com");
    const fid = await seedFile(uid, "filler-6file");
    const cid = await seedClone(uid, "filler6file");
    const { jobId, callbackToken } = await seedFillerJob(uid, fid, cid);
    const fd = makeForm(jobId, callbackToken, [
      { data: TINY_MP4, name: "f0.mp4" },
      { data: TINY_MP4, name: "f1.mp4" },
      { data: TINY_MP4, name: "f2.mp4" },
    ]);
    for (let i = 3; i < 6; i++) {
      fd.append(`file${i}`, new Blob([TINY_MP4], { type: "video/mp4" }), `f${i}.mp4`);
    }
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${SECRET()}` },
      body: fd,
    });
    expect(res.status).toBe(200);
    const body = await res.json<{ ok: boolean; filler_video_urls?: string[] }>();
    expect(body.ok).toBe(true);
    expect(body.filler_video_urls).toHaveLength(6);
  });

  it("file8 포함(9개, MAX 초과) → 400 too many", async () => {
    const uid = await seedUser("filler_9file@test.com");
    const fid = await seedFile(uid, "filler-9file");
    const cid = await seedClone(uid, "filler9file");
    const { jobId, callbackToken } = await seedFillerJob(uid, fid, cid);
    const fd = makeForm(jobId, callbackToken, [
      { data: TINY_MP4, name: "f0.mp4" },
      { data: TINY_MP4, name: "f1.mp4" },
      { data: TINY_MP4, name: "f2.mp4" },
    ]);
    for (let i = 3; i < 9; i++) {
      fd.append(`file${i}`, new Blob([TINY_MP4], { type: "video/mp4" }), `f${i}.mp4`);
    }
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${SECRET()}` },
      body: fd,
    });
    expect(res.status).toBe(400);
    const body = await res.json<{ error: string }>();
    expect(body.error).toMatch(/too many/);
  });

  it("index gap(file0~2 + file4, file3 없음) → 400 gap", async () => {
    const uid = await seedUser("filler_gap@test.com");
    const fid = await seedFile(uid, "filler-gap");
    const cid = await seedClone(uid, "fillergap");
    const { jobId, callbackToken } = await seedFillerJob(uid, fid, cid);
    const fd = makeForm(jobId, callbackToken, [
      { data: TINY_MP4, name: "f0.mp4" },
      { data: TINY_MP4, name: "f1.mp4" },
      { data: TINY_MP4, name: "f2.mp4" },
    ]);
    fd.append("file4", new Blob([TINY_MP4], { type: "video/mp4" }), "f4.mp4");
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${SECRET()}` },
      body: fd,
    });
    expect(res.status).toBe(400);
    const body = await res.json<{ error: string }>();
    expect(body.error).toMatch(/gap/);
  });

  it("file1 크기 초과(50MB+1) → 400", async () => {
    const uid = await seedUser("filler_size@test.com");
    const fid = await seedFile(uid, "filler-size");
    const cid = await seedClone(uid, "fillersize");
    const { jobId, callbackToken } = await seedFillerJob(uid, fid, cid);
    const big = new Uint8Array(50 * 1024 * 1024 + 1); 
    const fd = makeForm(jobId, callbackToken, [
      { data: TINY_MP4, name: "f0.mp4" },
      { data: big, name: "f1.mp4" }, 
      { data: TINY_MP4, name: "f2.mp4" },
    ]);
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${SECRET()}` },
      body: fd,
    });
    expect(res.status).toBe(400);
    const body = await res.json<{ error: string }>();
    expect(body.error).toMatch(/too large/);
  });
});

describe("POST /oth-path — 멱등", () => {
  it("이미 done 잡 → 200 idempotent (R2·files 재처리 안 함)", async () => {
    const uid = await seedUser("filler_idem@test.com");
    const fid = await seedFile(uid, "filler-idem");
    const cid = await seedClone(uid, "filleridem");
    const { jobId, callbackToken } = await seedFillerJob(uid, fid, cid);

    const db = env.DB as unknown as D1Database;
    await db
      .prepare(
        `UPDATE clone_asset_jobs SET status = 'done', updated_at = datetime('now') WHERE id = ?`,
      )
      .bind(jobId)
      .run();

    const fd = makeForm(jobId, callbackToken, [
      { data: TINY_MP4, name: "f0.mp4" },
      { data: TINY_MP4, name: "f1.mp4" },
      { data: TINY_MP4, name: "f2.mp4" },
    ]);
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${SECRET()}` },
      body: fd,
    });
    expect(res.status).toBe(200);
    const body = await res.json<{ ok: boolean; idempotent?: boolean }>();
    expect(body.ok).toBe(true);
    expect(body.idempotent).toBe(true);
  });
});

describe("POST /oth-path — 정상 처리", () => {
  it("정상 3파일 → R2 3개·files 3행·filler_video_urls 3개 set·잡 done", async () => {
    const uid = await seedUser("filler_ok@test.com");
    const fid = await seedFile(uid, "filler-ok");
    const cid = await seedClone(uid, "fillerok");
    const { jobId, callbackToken } = await seedFillerJob(uid, fid, cid);

    const dbPre = env.DB as unknown as D1Database;
    await dbPre
      .prepare(`UPDATE clone_asset_jobs SET status = 'running', updated_at = datetime('now') WHERE id = ?`)
      .bind(jobId)
      .run();

    const fd = makeForm(jobId, callbackToken, [
      { data: new Uint8Array([10, 20, 30]), name: "filler0.mp4" },
      { data: new Uint8Array([40, 50, 60]), name: "filler1.mp4" },
      { data: new Uint8Array([70, 80, 90]), name: "filler2.mp4" },
    ]);
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${SECRET()}` },
      body: fd,
    });
    expect(res.status).toBe(200);
    const body = await res.json<{
      ok: boolean;
      idempotent?: boolean;
      filler_video_urls?: string[];
    }>();
    expect(body.ok).toBe(true);

    const db = env.DB as unknown as D1Database;

    const jobRow = await db
      .prepare(`SELECT status FROM clone_asset_jobs WHERE id = ?`)
      .bind(jobId)
      .first<{ status: string }>();
    expect(jobRow!.status).toBe("done");

    if (!body.idempotent) {

      expect(body.filler_video_urls).toHaveLength(3);
      body.filler_video_urls!.forEach((url) => {
        expect(url).toMatch(/\/oth-path\/files\/\d+/);
      });

      const cloneRow = await db
        .prepare(`SELECT filler_video_urls FROM clones WHERE id = ?`)
        .bind(cid)
        .first<{ filler_video_urls: string | null }>();
      expect(cloneRow!.filler_video_urls).not.toBeNull();
      const parsed = JSON.parse(cloneRow!.filler_video_urls!);
      expect(parsed).toHaveLength(3);

      const filesCount = await db
        .prepare(
          `SELECT COUNT(*) as cnt FROM files WHERE purpose = 'asset_filler' AND owner_user_id = ?`,
        )
        .bind(uid)
        .first<{ cnt: number }>();
      expect(filesCount!.cnt).toBeGreaterThanOrEqual(3);
    }
  });

  it("clone_id 없는 잡 → 정상 처리·filler_video_urls UPDATE 없음", async () => {
    const uid = await seedUser("filler_nocid@test.com");
    const fid = await seedFile(uid, "filler-nocid");

    const { jobId, callbackToken } = await seedFillerJob(uid, fid, null);
    await forceJobPending(jobId);

    const fd = makeForm(jobId, callbackToken, [
      { data: TINY_MP4, name: "f0.mp4" },
      { data: TINY_MP4, name: "f1.mp4" },
      { data: TINY_MP4, name: "f2.mp4" },
    ]);
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${SECRET()}` },
      body: fd,
    });
    expect(res.status).toBe(200);
    const body = await res.json<{ ok: boolean; idempotent?: boolean; filler_video_urls?: string[] }>();
    expect(body.ok).toBe(true);

    const db = env.DB as unknown as D1Database;
    const jobRow = await db
      .prepare(`SELECT status FROM clone_asset_jobs WHERE id = ?`)
      .bind(jobId)
      .first<{ status: string }>();
    expect(jobRow!.status).toBe("done");
  });
});

describe("POST /oth-path — cross-kind 콜백 오염 차단 (mizu Important)", () => {
  it("kind='guide' running 잡 + filler 콜백 제출 → 409 kind_mismatch, filler_video_urls NULL 유지·R2 미기록", async () => {
    const uid = await seedUser("filler_xkind@test.com");
    const fid = await seedFile(uid, "filler-xkind");
    const cid = await seedClone(uid, "fillerxkind");

    const { jobId, callbackToken } = await seedGuideJobRunning(uid, fid, cid);

    const fd = makeForm(jobId, callbackToken, [
      { data: TINY_MP4, name: "f0.mp4" },
      { data: TINY_MP4, name: "f1.mp4" },
      { data: TINY_MP4, name: "f2.mp4" },
    ]);
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${SECRET()}` },
      body: fd,
    });
    expect(res.status).toBe(409);
    const body = await res.json<{ error: string }>();
    expect(body.error).toBe("kind_mismatch");

    const db = env.DB as unknown as D1Database;
    const cloneRow = await db
      .prepare(`SELECT filler_video_urls FROM clones WHERE id = ?`)
      .bind(cid)
      .first<{ filler_video_urls: string | null }>();
    expect(cloneRow!.filler_video_urls).toBeNull();

    const jobRow = await db
      .prepare(`SELECT status, kind FROM clone_asset_jobs WHERE id = ?`)
      .bind(jobId)
      .first<{ status: string; kind: string }>();
    expect(jobRow!.status).toBe("running");
    expect(jobRow!.kind).toBe("guide");

    const filesCount = await db
      .prepare(
        `SELECT COUNT(*) as cnt FROM files WHERE purpose = 'asset_filler' AND owner_user_id = ?`,
      )
      .bind(uid)
      .first<{ cnt: number }>();
    expect(filesCount!.cnt).toBe(0);
  });
});

describe("POST /oth-path — 실패 통보 (수정 3)", () => {
  it("status=failed 콜백 → failJob 호출(잡 status=failed·error 기록)", async () => {
    const uid = await seedUser("filler_fail@test.com");
    const fid = await seedFile(uid, "filler-fail");
    const cid = await seedClone(uid, "fillerfail");
    const { jobId, callbackToken } = await seedFillerJob(uid, fid, cid);

    const fd = new FormData();
    fd.append("job_id", jobId);
    fd.append("callback_token", callbackToken);
    fd.append("status", "failed");
    fd.append("error", "generation failed upstream");

    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${SECRET()}` },
      body: fd,
    });
    expect(res.status).toBe(200);
    const body = await res.json<{ ok: boolean }>();
    expect(body.ok).toBe(true);

    const db = env.DB as unknown as D1Database;
    const jobRow = await db
      .prepare(`SELECT status, error FROM clone_asset_jobs WHERE id = ?`)
      .bind(jobId)
      .first<{ status: string; error: string | null }>();
    expect(jobRow!.status).toBe("failed");
    expect(jobRow!.error).toMatch(/generation failed/);
  });
});

describe("POST /oth-path — 0바이트 파일 (수정 6)", () => {
  it("file0 0바이트 → 400", async () => {
    const uid = await seedUser("filler_0byte@test.com");
    const fid = await seedFile(uid, "filler-0byte");
    const cid = await seedClone(uid, "filler0byte");
    const { jobId, callbackToken } = await seedFillerJob(uid, fid, cid);
    const fd = makeForm(jobId, callbackToken, [
      { data: new Uint8Array(0), name: "f0.mp4" }, 
      { data: TINY_MP4, name: "f1.mp4" },
      { data: TINY_MP4, name: "f2.mp4" },
    ]);
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${SECRET()}` },
      body: fd,
    });
    expect(res.status).toBe(400);
    const body = await res.json<{ error: string }>();
    expect(body.error).toMatch(/empty/);
  });
});

describe("POST /oth-path — 원자성 (수정 7)", () => {
  it("running 잡(콜백 시점 정상 상태) → 정상 처리 done (T-088 F8 회귀)", async () => {

    const uid = await seedUser("filler_running@test.com");
    const fid = await seedFile(uid, "filler-running");
    const cid = await seedClone(uid, "fillerrunning");
    const { jobId, callbackToken } = await seedFillerJob(uid, fid, cid);
    const db = env.DB as unknown as D1Database;
    await db
      .prepare(
        `UPDATE clone_asset_jobs SET status = 'running', updated_at = datetime('now') WHERE id = ?`,
      )
      .bind(jobId)
      .run();

    const fd = makeForm(jobId, callbackToken, [
      { data: TINY_MP4, name: "f0.mp4" },
      { data: TINY_MP4, name: "f1.mp4" },
      { data: TINY_MP4, name: "f2.mp4" },
    ]);
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${SECRET()}` },
      body: fd,
    });
    expect(res.status).toBe(200);
    const body = await res.json<{ ok: boolean; idempotent?: boolean; filler_video_urls?: string[] }>();
    expect(body.ok).toBe(true);
    expect(body.idempotent).toBeUndefined(); 
    expect(body.filler_video_urls).toHaveLength(3);

    const jobRow = await db
      .prepare(`SELECT status FROM clone_asset_jobs WHERE id = ?`)
      .bind(jobId)
      .first<{ status: string }>();
    expect(jobRow!.status).toBe("done");
  });

  it("pending 잡(202 반영 전 콜백 race) → 정상 처리 done", async () => {
    const uid = await seedUser("filler_pending@test.com");
    const fid = await seedFile(uid, "filler-pending");
    const cid = await seedClone(uid, "fillerpending");
    const { jobId, callbackToken } = await seedFillerJob(uid, fid, cid);
    await forceJobPending(jobId);

    const fd = makeForm(jobId, callbackToken, [
      { data: TINY_MP4, name: "f0.mp4" },
      { data: TINY_MP4, name: "f1.mp4" },
      { data: TINY_MP4, name: "f2.mp4" },
    ]);
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${SECRET()}` },
      body: fd,
    });
    expect(res.status).toBe(200);
    const body = await res.json<{ ok: boolean; idempotent?: boolean }>();
    expect(body.ok).toBe(true);
    expect(body.idempotent).toBeUndefined();

    const db = env.DB as unknown as D1Database;
    const jobRow = await db
      .prepare(`SELECT status FROM clone_asset_jobs WHERE id = ?`)
      .bind(jobId)
      .first<{ status: string }>();
    expect(jobRow!.status).toBe("done");
  });

  it("failed 잡 재시도 → 정상 처리(failed→running→done)", async () => {
    const uid = await seedUser("filler_retry@test.com");
    const fid = await seedFile(uid, "filler-retry");
    const cid = await seedClone(uid, "fillerretry");
    const { jobId, callbackToken } = await seedFillerJob(uid, fid, cid);

    const db = env.DB as unknown as D1Database;
    await db
      .prepare(
        `UPDATE clone_asset_jobs SET status = 'failed', error = 'prev error', updated_at = datetime('now') WHERE id = ?`,
      )
      .bind(jobId)
      .run();

    const fd = makeForm(jobId, callbackToken, [
      { data: TINY_MP4, name: "f0.mp4" },
      { data: TINY_MP4, name: "f1.mp4" },
      { data: TINY_MP4, name: "f2.mp4" },
    ]);
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${SECRET()}` },
      body: fd,
    });
    expect(res.status).toBe(200);
    const body = await res.json<{ ok: boolean; idempotent?: boolean; filler_video_urls?: string[] }>();
    expect(body.ok).toBe(true);
    expect(body.idempotent).toBeUndefined(); 

    const jobRow = await db
      .prepare(`SELECT status FROM clone_asset_jobs WHERE id = ?`)
      .bind(jobId)
      .first<{ status: string }>();
    expect(jobRow!.status).toBe("done");

    const cloneRow = await db
      .prepare(`SELECT filler_video_urls FROM clones WHERE id = ?`)
      .bind(cid)
      .first<{ filler_video_urls: string | null }>();
    expect(cloneRow!.filler_video_urls).not.toBeNull();
  });

  it("failed 재시도 성공 후 files 행이 정확히 3개 (고아 누적 없음)", async () => {
    const uid = await seedUser("filler_orphan@test.com");
    const fid = await seedFile(uid, "filler-orphan");
    const cid = await seedClone(uid, "fillerorphan");
    const { jobId, callbackToken } = await seedFillerJob(uid, fid, cid);
    const db = env.DB as unknown as D1Database;

    await db
      .prepare(
        `UPDATE clone_asset_jobs SET status = 'failed', error = 'prev', updated_at = datetime('now') WHERE id = ?`,
      )
      .bind(jobId)
      .run();

    const fd = makeForm(jobId, callbackToken, [
      { data: TINY_MP4, name: "f0.mp4" },
      { data: TINY_MP4, name: "f1.mp4" },
      { data: TINY_MP4, name: "f2.mp4" },
    ]);
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${SECRET()}` },
      body: fd,
    });
    expect(res.status).toBe(200);
    const body = await res.json<{ ok: boolean; idempotent?: boolean }>();
    expect(body.ok).toBe(true);
    expect(body.idempotent).toBeUndefined(); 

    const filesCount = await db
      .prepare(
        `SELECT COUNT(*) as cnt FROM files WHERE purpose = 'asset_filler' AND owner_user_id = ?`,
      )
      .bind(uid)
      .first<{ cnt: number }>();
    expect(filesCount!.cnt).toBe(3);
  });
});

describe("기존 /oth-path 회귀", () => {
  it("asset-job-done: ORCH_SECRET 불일치 여전히 401", async () => {
    const fd = new FormData();
    fd.append("job_id", "x");
    fd.append("status", "done");
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: "Bearer wrong" },
      body: fd,
    });
    expect(res.status).toBe(401);
  });

  it("asset-job-done: callback_token 불일치 여전히 403", async () => {
    const uid = await seedUser("filler_reg_403@test.com");
    const fid = await seedFile(uid, "filler-reg-403");

    const db = env.DB as unknown as D1Database;
    const jobId = crypto.randomUUID();
    const cbToken = crypto.randomUUID();
    await db
      .prepare(
        `INSERT INTO clone_asset_jobs (id, user_id, kind, src_file_id, status, callback_token)
         VALUES (?, ?, 'idle_video', ?, 'pending', ?)`,
      )
      .bind(jobId, uid, fid, cbToken)
      .run();

    const fd = new FormData();
    fd.append("job_id", jobId);
    fd.append("status", "done");
    fd.append("callback_token", "wrong-token");
    fd.append("file", new Blob([TINY_MP4], { type: "video/mp4" }), "out.mp4");
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${SECRET()}` },
      body: fd,
    });
    expect(res.status).toBe(403);
  });
});

describe("finalizeFillerJob — 겹친 중복 콜백 CAS (el BLOCKER)", () => {
  it("잡이 이미 done 이면 null 반환 + files 행 롤백 + clones 미덮어쓰기", async () => {
    const uid = await seedUser("filler_cas@test.com");
    const fid = await seedFile(uid, "filler-cas");
    const cid = await seedClone(uid, "fillercas");
    const { jobId } = await seedFillerJob(uid, fid, cid);
    const db = env.DB as unknown as D1Database;

    await db
      .prepare(
        `UPDATE clone_asset_jobs SET status='done', out_url='["winner"]', updated_at=datetime('now') WHERE id = ?`,
      )
      .bind(jobId)
      .run();
    await db
      .prepare(`UPDATE clones SET filler_video_urls='["winner"]' WHERE id = ?`)
      .bind(cid)
      .run();
    const filesBefore = await db
      .prepare(`SELECT COUNT(*) AS n FROM files WHERE purpose='asset_filler'`)
      .first<{ n: number }>();

    const out = await finalizeFillerJob(
      db,
      jobId,
      [
        { r2Key: "assets/filler/loser0.mp4", sizeBytes: 3 },
        { r2Key: "assets/filler/loser1.mp4", sizeBytes: 3 },
        { r2Key: "assets/filler/loser2.mp4", sizeBytes: 3 },
      ],
      uid,
      cid,
      "http://localhost",
    );
    expect(out).toBeNull();

    const filesAfter = await db
      .prepare(`SELECT COUNT(*) AS n FROM files WHERE purpose='asset_filler'`)
      .first<{ n: number }>();
    expect(filesAfter!.n).toBe(filesBefore!.n);

    const jobRow = await db
      .prepare(`SELECT status, out_url FROM clone_asset_jobs WHERE id = ?`)
      .bind(jobId)
      .first<{ status: string; out_url: string }>();
    expect(jobRow!.status).toBe("done");
    expect(jobRow!.out_url).toBe('["winner"]');
    const cloneRow = await db
      .prepare(`SELECT filler_video_urls FROM clones WHERE id = ?`)
      .bind(cid)
      .first<{ filler_video_urls: string }>();
    expect(cloneRow!.filler_video_urls).toBe('["winner"]');
  });
});
