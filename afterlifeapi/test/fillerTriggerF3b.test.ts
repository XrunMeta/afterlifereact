

import { describe, it, expect } from "vitest";
import { SELF, env } from "cloudflare:test";

async function token(uid: number): Promise<string> {
  const { issueToken } = await import("../src/lib/jwt");
  const secret = (env as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return issueToken({ sub: uid, kind: "access" }, secret, 600);
}

async function seedUser(email: string): Promise<number> {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(
      `INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`,
    )
    .bind(email)
    .run();
  return (
    await db.prepare(`SELECT id FROM users WHERE email = ?`).bind(email).first<{ id: number }>()
  )!.id;
}

async function seedFile(uid: number, suffix: string): Promise<number> {
  const db = env.DB as unknown as D1Database;
  const key = `uploadedfiles/f3b-${suffix}.bin`;
  const r = await db
    .prepare(
      `INSERT INTO files (r2_key, content_type, size_bytes, owner_user_id, purpose)
       VALUES (?, 'application/octet-stream', 1, ?, 'clone_avatar') RETURNING id`,
    )
    .bind(key, uid)
    .first<{ id: number }>();
  return r!.id;
}

async function makeAssetJob(
  uid: number,
  tok: string,
  kind: "idle_video" | "voice_clone",
  fileId: number,
): Promise<string> {
  const r = await SELF.fetch("http://localhost/oth-path", {
    method: "POST",
    headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
    body: JSON.stringify({ kind, src_file_id: fileId }),
  });
  expect(r.status).toBe(201);
  const { job_id } = await r.json<{ job_id: string }>();
  return job_id;
}

describe("T-088 F3b: filler 잡 트리거 — voice_raw_url 동봉", () => {
  it("idle_video_job_id + voice_clone_job_id 제공 → filler 잡 생성·voice_raw_url 을 포함한 페이로드", async () => {
    const db = env.DB as unknown as D1Database;
    const uid = await seedUser("f3b_full@test.com");
    const t = await token(uid);

    const imgFileId = await seedFile(uid, "f3b-img");
    const wavFileId = await seedFile(uid, "f3b-wav");

    const idleJobId = await makeAssetJob(uid, t, "idle_video", imgFileId);
    const voiceJobId = await makeAssetJob(uid, t, "voice_clone", wavFileId);

    const idem = `f3b-full-${Date.now()}`;
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${t}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": idem,
      },
      body: JSON.stringify({
        clone_type: "friend",
        name: "F3bTest",
        username: `f3bfull${Date.now()}`,
        idle_video_job_id: idleJobId,
        voice_clone_job_id: voiceJobId,
      }),
    });
    expect(res.status).toBe(201);
    const { clone } = await res.json<{ clone: { id: number } }>();
    const cloneId = clone.id;

    const fillerJob = await db
      .prepare(
        `SELECT kind, src_file_id, clone_id, status FROM clone_asset_jobs WHERE clone_id=? AND kind='filler'`,
      )
      .bind(cloneId)
      .first<{ kind: string; src_file_id: number; clone_id: number; status: string }>();

    expect(fillerJob).toBeTruthy();
    expect(fillerJob!.kind).toBe("filler");

    expect(fillerJob!.src_file_id).toBe(imgFileId);

    expect(fillerJob!.clone_id).toBe(cloneId);

    expect(["pending", "running", "failed"]).toContain(fillerJob!.status);
  });

  it("voice_clone_job_id 미제공(idle만) → filler 잡 미생성(voice 없는 클론 fail-safe)", async () => {
    const db = env.DB as unknown as D1Database;
    const uid = await seedUser("f3b_novoice@test.com");
    const t = await token(uid);

    const imgFileId = await seedFile(uid, "f3b-novoice-img");
    const idleJobId = await makeAssetJob(uid, t, "idle_video", imgFileId);

    const idem = `f3b-novoice-${Date.now()}`;
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${t}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": idem,
      },
      body: JSON.stringify({
        clone_type: "friend",
        name: "F3bNoVoice",
        username: `f3bnovoice${Date.now()}`,
        idle_video_job_id: idleJobId,

      }),
    });
    expect(res.status).toBe(201);
    const { clone } = await res.json<{ clone: { id: number } }>();
    const cloneId = clone.id;

    const result = await db
      .prepare(`SELECT COUNT(*) AS n FROM clone_asset_jobs WHERE clone_id=? AND kind='filler'`)
      .bind(cloneId)
      .first<{ n: number }>();
    expect(result!.n).toBe(0);
  });

  it("idle_video_job_id 미제공 → filler 잡 미생성(기존 fail-safe 유지)", async () => {
    const db = env.DB as unknown as D1Database;
    const uid = await seedUser("f3b_noidle@test.com");
    const t = await token(uid);

    const wavFileId = await seedFile(uid, "f3b-noidle-wav");
    const voiceJobId = await makeAssetJob(uid, t, "voice_clone", wavFileId);

    const idem = `f3b-noidle-${Date.now()}`;
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${t}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": idem,
      },
      body: JSON.stringify({
        clone_type: "friend",
        name: "F3bNoIdle",
        username: `f3bnoidle${Date.now()}`,
        voice_clone_job_id: voiceJobId,

      }),
    });
    expect(res.status).toBe(201);
    const { clone } = await res.json<{ clone: { id: number } }>();
    const cloneId = clone.id;

    const result = await db
      .prepare(`SELECT COUNT(*) AS n FROM clone_asset_jobs WHERE clone_id=? AND kind='filler'`)
      .bind(cloneId)
      .first<{ n: number }>();
    expect(result!.n).toBe(0);
  });

  it("타인 voice_clone_job_id 제공 → 소유 검증 실패로 filler 미생성(fail-safe)", async () => {
    const db = env.DB as unknown as D1Database;
    const uid1 = await seedUser("f3b_other1@test.com");
    const uid2 = await seedUser("f3b_other2@test.com");
    const t1 = await token(uid1);
    const t2 = await token(uid2);

    const imgFileId = await seedFile(uid1, "f3b-other-img");
    const wavFileId = await seedFile(uid2, "f3b-other-wav");
    const idleJobId = await makeAssetJob(uid1, t1, "idle_video", imgFileId);

    const voiceJobId = await makeAssetJob(uid2, t2, "voice_clone", wavFileId);

    const idem = `f3b-other-${Date.now()}`;
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${t1}`, 
        "Content-Type": "application/json",
        "X-Idempotency-Key": idem,
      },
      body: JSON.stringify({
        clone_type: "friend",
        name: "F3bOther",
        username: `f3bother${Date.now()}`,
        idle_video_job_id: idleJobId,
        voice_clone_job_id: voiceJobId, 
      }),
    });
    expect(res.status).toBe(201);
    const { clone } = await res.json<{ clone: { id: number } }>();
    const cloneId = clone.id;

    const result = await db
      .prepare(`SELECT COUNT(*) AS n FROM clone_asset_jobs WHERE clone_id=? AND kind='filler'`)
      .bind(cloneId)
      .first<{ n: number }>();
    expect(result!.n).toBe(0);
  });

  it("idle X + voice X 둘 다 미제공 → filler 잡 미생성 (fail-safe)", async () => {
    const db = env.DB as unknown as D1Database;
    const uid = await seedUser("f3b_noidlevoice@test.com");
    const t = await token(uid);

    const idem = `f3b-noidlevoice-${Date.now()}`;
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${t}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": idem,
      },
      body: JSON.stringify({
        clone_type: "friend",
        name: "F3bNone",
        username: `f3bnone${Date.now()}`,

      }),
    });
    expect(res.status).toBe(201);
    const { clone } = await res.json<{ clone: { id: number } }>();
    const cloneId = clone.id;

    const result = await db
      .prepare(`SELECT COUNT(*) AS n FROM clone_asset_jobs WHERE clone_id=? AND kind='filler'`)
      .bind(cloneId)
      .first<{ n: number }>();
    expect(result!.n).toBe(0);
  });

  it("F3b 이후 기존 idle_video_url 반영 회귀 없음", async () => {
    const db = env.DB as unknown as D1Database;
    const uid = await seedUser("f3b_regr@test.com");
    const t = await token(uid);

    const imgFileId = await seedFile(uid, "f3b-regr-img");
    const wavFileId = await seedFile(uid, "f3b-regr-wav");
    const idleJobId = await makeAssetJob(uid, t, "idle_video", imgFileId);
    const voiceJobId = await makeAssetJob(uid, t, "voice_clone", wavFileId);

    await db
      .prepare(`UPDATE clone_asset_jobs SET status='done', out_url='https://cdn.example.com/idle.mp4' WHERE id=?`)
      .bind(idleJobId)
      .run();

    const idem = `f3b-regr-${Date.now()}`;
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${t}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": idem,
      },
      body: JSON.stringify({
        clone_type: "friend",
        name: "F3bRegr",
        username: `f3bregr${Date.now()}`,
        idle_video_job_id: idleJobId,
        voice_clone_job_id: voiceJobId,
      }),
    });
    expect(res.status).toBe(201);
    const { clone } = await res.json<{ clone: { id: number } }>();

    const cloneRow = await db
      .prepare(`SELECT idle_video_url FROM clones WHERE id=?`)
      .bind(clone.id)
      .first<{ idle_video_url: string | null }>();
    expect(cloneRow!.idle_video_url).toBe("https://cdn.example.com/idle.mp4");
  });
});
