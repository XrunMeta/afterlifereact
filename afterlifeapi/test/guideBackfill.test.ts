

import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { SELF, env, fetchMock } from "cloudflare:test";
import type { Bindings } from "../src/lib/env";

const E = env as unknown as Bindings;
const SECRET = E.DEV_SECRET;
const ORCH = "http://orchestrator.test";

async function seedUser(email: string): Promise<number> {
  const db = E.DB;
  await db
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(email)
    .run();
  return (await db.prepare(`SELECT id FROM users WHERE email = ?`).bind(email).first<{ id: number }>())!.id;
}

async function seedFile(ownerId: number, suffix: string): Promise<number> {
  const db = E.DB;
  const key = `uploadedfiles/guidebackfill-${suffix}.bin`;
  const r = await db
    .prepare(
      `INSERT INTO files (r2_key, content_type, size_bytes, owner_user_id, purpose)
       VALUES (?, 'application/octet-stream', 1, ?, 'clone_avatar') RETURNING id`,
    )
    .bind(key, ownerId)
    .first<{ id: number }>();
  return r!.id;
}

async function seedClone(ownerId: number, username: string, guideVideoUrls: string | null = null): Promise<number> {
  const db = E.DB;
  const r = await db
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, guide_video_urls)
       VALUES (?, ?, ?, 'friend', 'public', ?) RETURNING id`,
    )
    .bind(ownerId, "백필테스트클론", username, guideVideoUrls)
    .first<{ id: number }>();
  return r!.id;
}

async function seedAssetJob(
  ownerId: number,
  cloneId: number,
  kind: "idle_video" | "voice_clone",
  fileId: number,
  status: "done" | "pending" = "done",
): Promise<string> {
  const db = E.DB;
  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO clone_asset_jobs (id, user_id, kind, src_file_id, status, clone_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(id, ownerId, kind, fileId, status, cloneId)
    .run();
  return id;
}

const getTargets = (tok?: string) =>
  SELF.fetch("https://x/oth-path", {
    headers: tok ? { Authorization: `Bearer ${tok}` } : {},
  });

const postGuideJob = (cloneId: number, tok?: string) =>
  SELF.fetch(`https://x/oth-path${cloneId}/guide-job`, {
    method: "POST",
    headers: tok ? { Authorization: `Bearer ${tok}` } : {},
  });

beforeAll(() => {
  fetchMock.activate();
  fetchMock.disableNetConnect();
});
afterEach(() => fetchMock.assertNoPendingInterceptors());

describe("GET /oth-path", () => {
  it("시크릿 없음/불일치 → 401", async () => {
    expect((await getTargets()).status).toBe(401);
    expect((await getTargets("wrong")).status).toBe(401);
  });

  it("guide_video_urls NULL + idle_video·voice_clone done 잡 둘 다 있는 클론만 반환", async () => {
    const uid = await seedUser(`backfill_targets_${Date.now()}@test.com`);
    const imgFileId = await seedFile(uid, "targets-img");
    const wavFileId = await seedFile(uid, "targets-wav");

    const cloneOk = await seedClone(uid, `bftarget-ok-${Date.now()}`, null);
    await seedAssetJob(uid, cloneOk, "idle_video", imgFileId, "done");
    await seedAssetJob(uid, cloneOk, "voice_clone", wavFileId, "done");

    const cloneHasGuide = await seedClone(uid, `bftarget-hasguide-${Date.now()}`, '["u"]');
    await seedAssetJob(uid, cloneHasGuide, "idle_video", imgFileId, "done");
    await seedAssetJob(uid, cloneHasGuide, "voice_clone", wavFileId, "done");

    const cloneNoVoice = await seedClone(uid, `bftarget-novoice-${Date.now()}`, null);
    await seedAssetJob(uid, cloneNoVoice, "idle_video", imgFileId, "done");

    const clonePendingVoice = await seedClone(uid, `bftarget-pending-${Date.now()}`, null);
    await seedAssetJob(uid, clonePendingVoice, "idle_video", imgFileId, "done");
    await seedAssetJob(uid, clonePendingVoice, "voice_clone", wavFileId, "pending");

    const res = await getTargets(SECRET);
    expect(res.status).toBe(200);
    const body = await res.json<{ data: Array<{ id: number; user_id: number; face_src_file_id: number; voice_src_file_id: number }> }>();
    const ids = body.data.map((d) => d.id);
    expect(ids).toContain(cloneOk);
    expect(ids).not.toContain(cloneHasGuide);
    expect(ids).not.toContain(cloneNoVoice);
    expect(ids).not.toContain(clonePendingVoice);

    const target = body.data.find((d) => d.id === cloneOk)!;
    expect(target.user_id).toBe(uid);
    expect(target.face_src_file_id).toBe(imgFileId);
    expect(target.voice_src_file_id).toBe(wavFileId);
  });
});

describe("POST /oth-path", () => {
  it("시크릿 없음/불일치 → 401", async () => {
    expect((await postGuideJob(1)).status).toBe(401);
    expect((await postGuideJob(1, "wrong")).status).toBe(401);
  });

  it("clone 없음 → 404", async () => {
    const res = await postGuideJob(999999999, SECRET);
    expect(res.status).toBe(404);
  });

  it("idle_video/voice_clone done 잡 존재 → guide 잡 트리거·201·orchestrator 중계", async () => {
    const uid = await seedUser(`backfill_trigger_${Date.now()}@test.com`);
    const imgFileId = await seedFile(uid, "trigger-img");
    const wavFileId = await seedFile(uid, "trigger-wav");
    const cloneId = await seedClone(uid, `bftrigger-${Date.now()}`, null);
    await seedAssetJob(uid, cloneId, "idle_video", imgFileId, "done");
    await seedAssetJob(uid, cloneId, "voice_clone", wavFileId, "done");

    fetchMock
      .get(ORCH)
      .intercept({ path: "/oth-path", method: "POST" })
      .reply(() => ({ statusCode: 202, data: { ok: true } }));

    const res = await postGuideJob(cloneId, SECRET);
    expect(res.status).toBe(201);
    const body = await res.json<{ guideJobId: string }>();
    expect(body.guideJobId).toBeTruthy();

    const job = await E.DB
      .prepare(`SELECT kind, src_file_id, clone_id, status FROM clone_asset_jobs WHERE id = ?`)
      .bind(body.guideJobId)
      .first<{ kind: string; src_file_id: number; clone_id: number; status: string }>();
    expect(job).toBeTruthy();
    expect(job!.kind).toBe("guide");
    expect(job!.src_file_id).toBe(imgFileId);
    expect(job!.clone_id).toBe(cloneId);
    expect(job!.status).toBe("running");
  });

  it("voice_clone done 잡 없음 → 400", async () => {
    const uid = await seedUser(`backfill_novoice_${Date.now()}@test.com`);
    const imgFileId = await seedFile(uid, "novoice-img");
    const cloneId = await seedClone(uid, `bfnovoice-${Date.now()}`, null);
    await seedAssetJob(uid, cloneId, "idle_video", imgFileId, "done");

    const res = await postGuideJob(cloneId, SECRET);
    expect(res.status).toBe(400);
  });

  it("이미 guide_video_urls 있음(재실행) → 200 skip, 잡 재생성 없음", async () => {
    const uid = await seedUser(`backfill_idem_${Date.now()}@test.com`);
    const imgFileId = await seedFile(uid, "idem-img");
    const wavFileId = await seedFile(uid, "idem-wav");
    const cloneId = await seedClone(uid, `bfidem-${Date.now()}`, '["https://x/existing.mp4"]');
    await seedAssetJob(uid, cloneId, "idle_video", imgFileId, "done");
    await seedAssetJob(uid, cloneId, "voice_clone", wavFileId, "done");

    const res = await postGuideJob(cloneId, SECRET);
    expect(res.status).toBe(200);
    const body = await res.json<{ skipped: boolean }>();
    expect(body.skipped).toBe(true);

    const count = await E.DB
      .prepare(`SELECT COUNT(*) AS n FROM clone_asset_jobs WHERE clone_id = ? AND kind = 'guide'`)
      .bind(cloneId)
      .first<{ n: number }>();
    expect(count!.n).toBe(0);
  });
});
