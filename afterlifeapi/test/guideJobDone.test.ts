

import { describe, it, expect } from "vitest";
import { SELF, env } from "cloudflare:test";

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
  const key = `uploadedfiles/guide-${suffix}.jpg`;
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
       VALUES (?, 'GC', ?, 'friend', 'public', CURRENT_TIMESTAMP) RETURNING id`,
    )
    .bind(ownerId, username)
    .first<{ id: number }>();
  return r!.id;
}

async function seedGuideJob(
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
       VALUES (?, ?, 'guide', ?, 'pending', ?, ?)`,
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
    const uid = await seedUser("guide_403@test.com");
    const fid = await seedFile(uid, "guide-403");
    const cid = await seedClone(uid, "guide403");
    const { jobId } = await seedGuideJob(uid, fid, cid);
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
    const uid = await seedUser("guide_0file@test.com");
    const fid = await seedFile(uid, "guide-0file");
    const cid = await seedClone(uid, "guide0file");
    const { jobId, callbackToken } = await seedGuideJob(uid, fid, cid);
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

  it("file3 포함(4개, MAX 초과) → 400 too many", async () => {
    const uid = await seedUser("guide_4file@test.com");
    const fid = await seedFile(uid, "guide-4file");
    const cid = await seedClone(uid, "guide4file");
    const { jobId, callbackToken } = await seedGuideJob(uid, fid, cid);
    const fd = makeForm(jobId, callbackToken, [
      { data: TINY_MP4, name: "f0.mp4" },
      { data: TINY_MP4, name: "f1.mp4" },
      { data: TINY_MP4, name: "f2.mp4" },
    ]);
    fd.append("file3", new Blob([TINY_MP4], { type: "video/mp4" }), "f3.mp4");
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${SECRET()}` },
      body: fd,
    });
    expect(res.status).toBe(400);
    const body = await res.json<{ error: string }>();
    expect(body.error).toMatch(/too many/);
  });

  it("index gap(file0 + file2, file1 없음) → 400 gap", async () => {
    const uid = await seedUser("guide_gap@test.com");
    const fid = await seedFile(uid, "guide-gap");
    const cid = await seedClone(uid, "guidegap");
    const { jobId, callbackToken } = await seedGuideJob(uid, fid, cid);
    const fd = makeForm(jobId, callbackToken, [
      { data: TINY_MP4, name: "f0.mp4" },
    ]);
    fd.append("file2", new Blob([TINY_MP4], { type: "video/mp4" }), "f2.mp4");
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${SECRET()}` },
      body: fd,
    });
    expect(res.status).toBe(400);
    const body = await res.json<{ error: string }>();
    expect(body.error).toMatch(/gap/);
  });

  it("file0 크기 초과(50MB+1) → 400", async () => {
    const uid = await seedUser("guide_size@test.com");
    const fid = await seedFile(uid, "guide-size");
    const cid = await seedClone(uid, "guidesize");
    const { jobId, callbackToken } = await seedGuideJob(uid, fid, cid);
    const big = new Uint8Array(50 * 1024 * 1024 + 1); 
    const fd = makeForm(jobId, callbackToken, [
      { data: big, name: "f0.mp4" }, 
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

  it("file0 0바이트 → 400", async () => {
    const uid = await seedUser("guide_0byte@test.com");
    const fid = await seedFile(uid, "guide-0byte");
    const cid = await seedClone(uid, "guide0byte");
    const { jobId, callbackToken } = await seedGuideJob(uid, fid, cid);
    const fd = makeForm(jobId, callbackToken, [
      { data: new Uint8Array(0), name: "f0.mp4" }, 
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

describe("POST /oth-path — 정상 처리", () => {
  it("running 잡 + 2파일 → 200, guide_video_urls 길이2 · jobs done", async () => {
    const uid = await seedUser("guide_ok@test.com");
    const fid = await seedFile(uid, "guide-ok");
    const cid = await seedClone(uid, "guideok");
    const { jobId, callbackToken } = await seedGuideJob(uid, fid, cid);

    const dbPre = env.DB as unknown as D1Database;
    await dbPre
      .prepare(`UPDATE clone_asset_jobs SET status = 'running', updated_at = datetime('now') WHERE id = ?`)
      .bind(jobId)
      .run();

    const fd = makeForm(jobId, callbackToken, [
      { data: new Uint8Array([10, 20, 30]), name: "guide0.mp4" },
      { data: new Uint8Array([40, 50, 60]), name: "guide1.mp4" },
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
      guide_video_urls?: string[];
    }>();
    expect(body.ok).toBe(true);
    expect(body.idempotent).toBeUndefined();
    expect(body.guide_video_urls).toHaveLength(2);

    const db = env.DB as unknown as D1Database;
    const jobRow = await db
      .prepare(`SELECT status FROM clone_asset_jobs WHERE id = ?`)
      .bind(jobId)
      .first<{ status: string }>();
    expect(jobRow!.status).toBe("done");

    const cloneRow = await db
      .prepare(`SELECT guide_video_urls FROM clones WHERE id = ?`)
      .bind(cid)
      .first<{ guide_video_urls: string | null }>();
    expect(cloneRow!.guide_video_urls).not.toBeNull();
    const parsed = JSON.parse(cloneRow!.guide_video_urls!);
    expect(parsed).toHaveLength(2);

    const filesCount = await db
      .prepare(
        `SELECT COUNT(*) as cnt FROM files WHERE purpose = 'asset_guide' AND owner_user_id = ?`,
      )
      .bind(uid)
      .first<{ cnt: number }>();
    expect(filesCount!.cnt).toBeGreaterThanOrEqual(2);
  });

  it("1파일(최소치) → 200, guide_video_urls 길이1", async () => {
    const uid = await seedUser("guide_min@test.com");
    const fid = await seedFile(uid, "guide-min");
    const cid = await seedClone(uid, "guidemin");
    const { jobId, callbackToken } = await seedGuideJob(uid, fid, cid);

    const fd = makeForm(jobId, callbackToken, [
      { data: TINY_MP4, name: "f0.mp4" },
    ]);
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${SECRET()}` },
      body: fd,
    });
    expect(res.status).toBe(200);
    const body = await res.json<{ ok: boolean; guide_video_urls?: string[] }>();
    expect(body.ok).toBe(true);
    expect(body.guide_video_urls).toHaveLength(1);
  });

  it("clone_id 없는 잡 → 정상 처리·guide_video_urls UPDATE 없음", async () => {
    const uid = await seedUser("guide_nocid@test.com");
    const fid = await seedFile(uid, "guide-nocid");

    const { jobId, callbackToken } = await seedGuideJob(uid, fid, null);

    const fd = makeForm(jobId, callbackToken, [
      { data: TINY_MP4, name: "f0.mp4" },
    ]);
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
      .prepare(`SELECT status FROM clone_asset_jobs WHERE id = ?`)
      .bind(jobId)
      .first<{ status: string }>();
    expect(jobRow!.status).toBe("done");
  });
});

describe("POST /oth-path — 멱등", () => {
  it("이미 done 잡 → 200 idempotent (R2·files 재처리 안 함)", async () => {
    const uid = await seedUser("guide_idem@test.com");
    const fid = await seedFile(uid, "guide-idem");
    const cid = await seedClone(uid, "guideidem");
    const { jobId, callbackToken } = await seedGuideJob(uid, fid, cid);

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

  it("동일 콜백 재전송(중복) → 두 번째 응답도 200, 파일 중복 생성 없음", async () => {
    const uid = await seedUser("guide_dup@test.com");
    const fid = await seedFile(uid, "guide-dup");
    const cid = await seedClone(uid, "guidedup");
    const { jobId, callbackToken } = await seedGuideJob(uid, fid, cid);

    const makeFd = () =>
      makeForm(jobId, callbackToken, [
        { data: TINY_MP4, name: "f0.mp4" },
        { data: TINY_MP4, name: "f1.mp4" },
      ]);

    const res1 = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${SECRET()}` },
      body: makeFd(),
    });
    expect(res1.status).toBe(200);
    const body1 = await res1.json<{ ok: boolean; idempotent?: boolean }>();
    expect(body1.ok).toBe(true);
    expect(body1.idempotent).toBeUndefined();

    const res2 = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${SECRET()}` },
      body: makeFd(),
    });
    expect(res2.status).toBe(200);
    const body2 = await res2.json<{ ok: boolean; idempotent?: boolean }>();
    expect(body2.ok).toBe(true);
    expect(body2.idempotent).toBe(true);

    const db = env.DB as unknown as D1Database;
    const filesCount = await db
      .prepare(
        `SELECT COUNT(*) as cnt FROM files WHERE purpose = 'asset_guide' AND owner_user_id = ?`,
      )
      .bind(uid)
      .first<{ cnt: number }>();
    expect(filesCount!.cnt).toBe(2); 
  });
});

describe("POST /oth-path — 실패 통보", () => {
  it("status=failed 콜백 → failJob 호출(잡 status=failed·error 기록)", async () => {
    const uid = await seedUser("guide_fail@test.com");
    const fid = await seedFile(uid, "guide-fail");
    const cid = await seedClone(uid, "guidefail");
    const { jobId, callbackToken } = await seedGuideJob(uid, fid, cid);

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

describe("기존 /oth-path, /oth-path 회귀", () => {
  it("filler-job-done: ORCH_SECRET 불일치 여전히 401", async () => {
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
});
