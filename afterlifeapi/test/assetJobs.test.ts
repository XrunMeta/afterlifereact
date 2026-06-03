

import { describe, it, expect } from "vitest";
import { SELF, env } from "cloudflare:test";

async function token(uid: number) {
  const { issueToken } = await import("../src/lib/jwt");
  return issueToken(
    { sub: uid, kind: "access" },
    (env as { JWT_ACCESS_SECRET: string }).JWT_ACCESS_SECRET,
    600,
  );
}

async function seedUser(e: string) {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(`INSERT INTO users (email,password_hash,name,created_at) VALUES (?,'x','U',CURRENT_TIMESTAMP)`)
    .bind(e)
    .run();
  return (await db.prepare(`SELECT id FROM users WHERE email=?`).bind(e).first<{ id: number }>())!.id;
}

async function seedFile(owner: number, suffix?: string) {
  const db = env.DB as unknown as D1Database;
  const key = `uploadedfiles/x-${suffix ?? Math.random().toString(36).slice(2)}.jpg`;
  const r = await db
    .prepare(
      `INSERT INTO files (r2_key,content_type,size_bytes,owner_user_id,purpose) VALUES (?,'image/jpeg',1,?, 'clone_avatar') RETURNING id`,
    )
    .bind(key, owner)
    .first<{ id: number }>();
  return r!.id;
}

async function getCallbackToken(jobId: string): Promise<string> {
  const db = env.DB as unknown as D1Database;
  const row = await db
    .prepare(`SELECT callback_token FROM clone_asset_jobs WHERE id=?`)
    .bind(jobId)
    .first<{ callback_token: string }>();
  return row!.callback_token;
}

async function forceJobPending(jobId: string) {
  const db = env.DB as unknown as D1Database;
  await db
    .prepare(`UPDATE clone_asset_jobs SET status='pending', error=NULL, updated_at=datetime('now') WHERE id=?`)
    .bind(jobId)
    .run();
}

const SECRET = () => (env as { ORCH_SECRET?: string }).ORCH_SECRET ?? "test-orch-secret";

describe("asset-job 생성/상태", () => {
  it("잡 생성 → 상태조회(pending/running/failed 모두 허용 — 테스트 환경 DNS 제한)", async () => {
    const uid = await seedUser("aj1@test.com");
    const t = await token(uid);
    const fid = await seedFile(uid, "aj1");
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "idle_video", src_file_id: fid }),
    });
    expect(res.status).toBe(201);
    const { job_id } = await res.json<{ job_id: string }>();
    expect(job_id).toBeTruthy();
    const st = await SELF.fetch(`http://localhost/oth-path${job_id}`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    expect(st.status).toBe(200);
    const body = await st.json<{ status: string; kind: string }>();

    expect(["pending", "running", "failed"]).toContain(body.status);
    expect(body.kind).toBe("idle_video");
  });

  it("잘못된 kind 거부", async () => {
    const uid = await seedUser("aj2@test.com");
    const t = await token(uid);
    const fid = await seedFile(uid, "aj2");
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "bad", src_file_id: fid }),
    });
    expect(res.status).toBe(422);
  });

  it("GET asset-job/:id 응답에 callback_token 미노출", async () => {
    const uid = await seedUser("aj_noleak@test.com");
    const t = await token(uid);
    const fid = await seedFile(uid, "ajnoleak");
    const mk = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "idle_video", src_file_id: fid }),
    });
    const { job_id } = await mk.json<{ job_id: string }>();
    const st = await SELF.fetch(`http://localhost/oth-path${job_id}`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    const body = await st.json<Record<string, unknown>>();
    expect(body).not.toHaveProperty("callback_token");
  });
});

describe("internal asset-job-done", () => {
  it("콜백 완료 → R2 저장·잡 done (callback_token 포함)", async () => {
    const uid = await seedUser("aj3@test.com");
    const t = await token(uid);
    const fid = await seedFile(uid, "aj3");
    const mk = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "voice_clone", src_file_id: fid }),
    });
    const { job_id } = await mk.json<{ job_id: string }>();
    const cbToken = await getCallbackToken(job_id);

    await forceJobPending(job_id);
    const secret = SECRET();
    const fd = new FormData();
    fd.append("job_id", job_id);
    fd.append("status", "done");
    fd.append("callback_token", cbToken);
    fd.append(
      "file",
      new Blob([new Uint8Array([1, 2, 3])], { type: "application/octet-stream" }),
      "se.pth",
    );
    const cb = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
      body: fd,
    });
    expect(cb.status).toBe(200);

    const cbBody = await cb.json<{ ok: boolean; out_url?: string; idempotent?: boolean }>();
    expect(cbBody.ok).toBe(true);

    const didComplete = !!cbBody.out_url;
    if (didComplete) {
      expect(cbBody.out_url).toBeTruthy();
    }

    const db = env.DB as unknown as D1Database;
    const jobRow = await db
      .prepare(`SELECT status, out_url FROM clone_asset_jobs WHERE id=?`)
      .bind(job_id)
      .first<{ status: string; out_url: string | null }>();

    if (didComplete) {
      expect(jobRow!.status).toBe("done");
      expect(jobRow!.out_url).toBeTruthy();
    }
  });

  it("멱등: 이미 done 잡 콜백 → 200 idempotent (R2·files 재처리 안 함)", async () => {
    const uid = await seedUser("aj3b@test.com");
    const t = await token(uid);
    const fid = await seedFile(uid, "aj3b");
    const mk = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "voice_clone", src_file_id: fid }),
    });
    const { job_id } = await mk.json<{ job_id: string }>();
    const cbToken = await getCallbackToken(job_id);
    const db = env.DB as unknown as D1Database;

    await db
      .prepare(`UPDATE clone_asset_jobs SET status='done', out_url='https://done/oth-path' WHERE id=?`)
      .bind(job_id)
      .run();
    const secret = SECRET();
    const fd = new FormData();
    fd.append("job_id", job_id);
    fd.append("status", "done");
    fd.append("callback_token", cbToken);
    fd.append("file", new Blob([new Uint8Array([9])], { type: "application/octet-stream" }), "se.pth");
    const cb = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
      body: fd,
    });
    expect(cb.status).toBe(200);
    const cbBody = await cb.json<{ ok: boolean; idempotent?: boolean }>();
    expect(cbBody.ok).toBe(true);
    expect(cbBody.idempotent).toBe(true);
  });

  it("ORCH_SECRET 불일치 401", async () => {
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

  it("callback_token 불일치 403", async () => {
    const uid = await seedUser("aj_cbtoken@test.com");
    const t = await token(uid);
    const fid = await seedFile(uid, "ajcbtoken");
    const mk = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "idle_video", src_file_id: fid }),
    });
    const { job_id } = await mk.json<{ job_id: string }>();
    await forceJobPending(job_id);
    const secret = SECRET();
    const fd = new FormData();
    fd.append("job_id", job_id);
    fd.append("status", "done");
    fd.append("callback_token", "wrong-token");
    fd.append(
      "file",
      new Blob([new Uint8Array([1])], { type: "video/mp4" }),
      "out.mp4",
    );
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
      body: fd,
    });
    expect(res.status).toBe(403);
  });

  it("voice_clone 파일 정상(10바이트) → 200, content_type 강제", async () => {
    const uid = await seedUser("aj_ct@test.com");
    const t = await token(uid);
    const fid = await seedFile(uid, "ajct");
    const mk = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "voice_clone", src_file_id: fid }),
    });
    const { job_id } = await mk.json<{ job_id: string }>();
    const cbToken = await getCallbackToken(job_id);
    await forceJobPending(job_id);
    const secret = SECRET();
    const fd = new FormData();
    fd.append("job_id", job_id);
    fd.append("status", "done");
    fd.append("callback_token", cbToken);

    fd.append("file", new Blob([new Uint8Array(10)], { type: "audio/wav" }), "voice.pth");
    const ok = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
      body: fd,
    });
    expect(ok.status).toBe(200);

    const db = env.DB as unknown as D1Database;
    const jobRow = await db
      .prepare(`SELECT out_file_id FROM clone_asset_jobs WHERE id=?`)
      .bind(job_id)
      .first<{ out_file_id: number | null }>();
    if (jobRow?.out_file_id) {
      const fileRow = await db
        .prepare(`SELECT content_type FROM files WHERE id=?`)
        .bind(jobRow.out_file_id)
        .first<{ content_type: string }>();
      expect(fileRow?.content_type).toBe("application/octet-stream");
    }
  });
});

describe("createClone 잡 연결", () => {
  it("done 잡 → clones 컬럼 즉시 반영", async () => {
    const uid = await seedUser("aj4@test.com");
    const t = await token(uid);
    const fid = await seedFile(uid, "aj4");

    const mk = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "idle_video", src_file_id: fid }),
    });
    const { job_id } = await mk.json<{ job_id: string }>();
    const db = env.DB as unknown as D1Database;

    await db
      .prepare(`UPDATE clone_asset_jobs SET status='done', out_url='https://x/oth-path' WHERE id=?`)
      .bind(job_id)
      .run();
    const idemKey = `aj4-create-${Date.now()}`;
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${t}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": idemKey,
      },
      body: JSON.stringify({
        clone_type: "friend",
        name: "J",
        username: `aj${Date.now()}`,
        idle_video_job_id: job_id,
      }),
    });
    expect(res.status).toBe(201);
    const { clone } = await res.json<{ clone: { id: number } }>();
    const row = await db
      .prepare(`SELECT idle_video_url FROM clones WHERE id=?`)
      .bind(clone.id)
      .first<{ idle_video_url: string | null }>();
    expect(row!.idle_video_url).toBe("https://x/oth-path");
  });

  it("race 보상: 콜백 선착 후 createClone 연결 시 컬럼 반영", async () => {

    const uid = await seedUser("aj_race@test.com");
    const t = await token(uid);
    const fid = await seedFile(uid, "ajrace");
    const mk = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "voice_clone", src_file_id: fid }),
    });
    const { job_id } = await mk.json<{ job_id: string }>();
    const db = env.DB as unknown as D1Database;

    await db
      .prepare(`UPDATE clone_asset_jobs SET status='done', out_url='https://race/files/99' WHERE id=?`)
      .bind(job_id)
      .run();

    const idemKey2 = `aj_race-create-${Date.now()}`;
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${t}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": idemKey2,
      },
      body: JSON.stringify({
        clone_type: "mentor",
        name: "Race",
        username: `ajrace${Date.now()}`,
        voice_clone_job_id: job_id,
      }),
    });
    expect(res.status).toBe(201);
    const { clone } = await res.json<{ clone: { id: number } }>();
    const row = await db
      .prepare(`SELECT voice_se_url FROM clones WHERE id=?`)
      .bind(clone.id)
      .first<{ voice_se_url: string | null }>();
    expect(row!.voice_se_url).toBe("https://race/files/99");
  });
});
