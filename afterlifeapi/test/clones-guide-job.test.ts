

import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { SELF, env, fetchMock } from "cloudflare:test";

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
  const key = `uploadedfiles/guidejob-${suffix}.bin`;
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

const ORCH = "http://orchestrator.test";

beforeAll(() => {
  fetchMock.activate();
  fetchMock.disableNetConnect();
});
afterEach(() => fetchMock.assertNoPendingInterceptors());

describe("T-116 B Task4: guide 잡 트리거 — persona(L0/L1) 동봉", () => {
  it("idle_video_job_id + voice_clone_job_id 제공 → guide 잡 생성·running 선전환·payload에 persona 포함", async () => {
    const db = env.DB as unknown as D1Database;
    const uid = await seedUser("guidejob_full@test.com");
    const t = await token(uid);

    const imgFileId = await seedFile(uid, "full-img");
    const wavFileId = await seedFile(uid, "full-wav");

    const idleJobId = await makeAssetJob(uid, t, "idle_video", imgFileId);
    const voiceJobId = await makeAssetJob(uid, t, "voice_clone", wavFileId);

    fetchMock
      .get(ORCH)
      .intercept({ path: "/oth-path", method: "POST" })
      .reply(() => ({ statusCode: 202, data: { ok: true } }))
      .times(2);

    const idem = `guidejob-full-${Date.now()}`;
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${t}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": idem,
      },
      body: JSON.stringify({
        clone_type: "friend",
        name: "GuideJobTest",
        username: `guidejobfull${Date.now()}`,
        idle_video_job_id: idleJobId,
        voice_clone_job_id: voiceJobId,
      }),
    });
    expect(res.status).toBe(201);
    const { clone } = await res.json<{ clone: { id: number } }>();
    const cloneId = clone.id;

    const guideJob = await db
      .prepare(
        `SELECT kind, src_file_id, clone_id, status FROM clone_asset_jobs WHERE clone_id=? AND kind='guide'`,
      )
      .bind(cloneId)
      .first<{ kind: string; src_file_id: number; clone_id: number; status: string }>();

    expect(guideJob).toBeTruthy();
    expect(guideJob!.kind).toBe("guide");

    expect(guideJob!.src_file_id).toBe(imgFileId);

    expect(guideJob!.clone_id).toBe(cloneId);

    expect(guideJob!.status).toBe("running");

    const fillerJob = await db
      .prepare(`SELECT status FROM clone_asset_jobs WHERE clone_id=? AND kind='filler'`)
      .bind(cloneId)
      .first<{ status: string }>();
    expect(fillerJob).toBeTruthy();
    expect(fillerJob!.status).toBe("running");
  });

  it("guide 잡 orchestrator 중계 payload에 persona(l0/l1) 필드 포함", async () => {
    const db = env.DB as unknown as D1Database;
    const uid = await seedUser("guidejob_persona@test.com");
    const t = await token(uid);

    const imgFileId = await seedFile(uid, "persona-img");
    const wavFileId = await seedFile(uid, "persona-wav");

    const idleJobId = await makeAssetJob(uid, t, "idle_video", imgFileId);
    const voiceJobId = await makeAssetJob(uid, t, "voice_clone", wavFileId);

    let fillerBody: string | null = null;
    let guideBody: string | null = null;
    fetchMock
      .get(ORCH)
      .intercept({ path: "/oth-path", method: "POST" })
      .reply((opts) => {
        const parsed = JSON.parse(opts.body as string);
        if (parsed.kind === "guide") guideBody = opts.body as string;
        else fillerBody = opts.body as string;
        return { statusCode: 202, data: { ok: true } };
      })
      .times(2);

    const idem = `guidejob-persona-${Date.now()}`;
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${t}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": idem,
      },
      body: JSON.stringify({
        clone_type: "friend",
        name: "GuideJobPersona",
        username: `guidejobpersona${Date.now()}`,
        idle_video_job_id: idleJobId,
        voice_clone_job_id: voiceJobId,
      }),
    });
    expect(res.status).toBe(201);
    const { clone } = await res.json<{ clone: { id: number } }>();

    const guideJob = await db
      .prepare(`SELECT status FROM clone_asset_jobs WHERE clone_id=? AND kind='guide'`)
      .bind(clone.id)
      .first<{ status: string }>();
    expect(guideJob).toBeTruthy();

    expect(guideBody).toBeTruthy();
    const parsedGuide = JSON.parse(guideBody!);
    expect(parsedGuide.kind).toBe("guide");
    expect(parsedGuide.face_url).toBeTruthy();
    expect(parsedGuide.voice_raw_url).toBeTruthy();
    expect(parsedGuide.clone_id).toBe(String(clone.id));

    expect(parsedGuide.persona).toBeTruthy();
    expect(parsedGuide.persona.l0).toBeTruthy();
    expect(typeof parsedGuide.persona.l0.rules_text).toBe("string");

    expect(fillerBody).toBeTruthy();
    const parsedFiller = JSON.parse(fillerBody!);
    expect(parsedFiller.persona).toBeUndefined();
  });

  it("voice_clone_job_id 미제공(idle만) → guide 잡 미생성(filler와 동일 fail-safe)", async () => {
    const db = env.DB as unknown as D1Database;
    const uid = await seedUser("guidejob_novoice@test.com");
    const t = await token(uid);

    const imgFileId = await seedFile(uid, "novoice-img");
    const idleJobId = await makeAssetJob(uid, t, "idle_video", imgFileId);

    const idem = `guidejob-novoice-${Date.now()}`;
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${t}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": idem,
      },
      body: JSON.stringify({
        clone_type: "friend",
        name: "GuideJobNoVoice",
        username: `guidejobnovoice${Date.now()}`,
        idle_video_job_id: idleJobId,

      }),
    });
    expect(res.status).toBe(201);
    const { clone } = await res.json<{ clone: { id: number } }>();

    const result = await db
      .prepare(`SELECT COUNT(*) AS n FROM clone_asset_jobs WHERE clone_id=? AND kind='guide'`)
      .bind(clone.id)
      .first<{ n: number }>();
    expect(result!.n).toBe(0);
  });

  it("idle_video_job_id 미제공 → guide 잡 미생성(기존 fail-safe 유지)", async () => {
    const db = env.DB as unknown as D1Database;
    const uid = await seedUser("guidejob_noidle@test.com");
    const t = await token(uid);

    const wavFileId = await seedFile(uid, "noidle-wav");
    const voiceJobId = await makeAssetJob(uid, t, "voice_clone", wavFileId);

    const idem = `guidejob-noidle-${Date.now()}`;
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${t}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": idem,
      },
      body: JSON.stringify({
        clone_type: "friend",
        name: "GuideJobNoIdle",
        username: `guidejobnoidle${Date.now()}`,
        voice_clone_job_id: voiceJobId,

      }),
    });
    expect(res.status).toBe(201);
    const { clone } = await res.json<{ clone: { id: number } }>();

    const result = await db
      .prepare(`SELECT COUNT(*) AS n FROM clone_asset_jobs WHERE clone_id=? AND kind='guide'`)
      .bind(clone.id)
      .first<{ n: number }>();
    expect(result!.n).toBe(0);
  });
});
