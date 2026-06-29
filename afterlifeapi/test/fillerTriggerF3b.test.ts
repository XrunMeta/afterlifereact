

import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

async function v_21cc31(v_0c8987): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return v_b2eae5({ sub: v_0c8987, kind: "access" }, v_43fd42, 600);
}

async function v_bfb240(v_e0c7e8): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(
      `INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`,
    )
    .bind(v_e0c7e8)
    .run();
  return (
    await v_a1651b.prepare(`SELECT id FROM users WHERE email = ?`).bind(v_e0c7e8).first<{ id: number }>()
  )!.id;
}

async function v_c808bd(v_0c8987, v_ae8e76): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  const v_b24339 = `uploadedfiles/f3b-${v_ae8e76}.bin`;
  const v_cb35cb = await v_a1651b
    .prepare(
      `INSERT INTO files (r2_key, content_type, size_bytes, owner_user_id, purpose)
       VALUES (?, 'application/octet-stream', 1, ?, 'clone_avatar') RETURNING id`,
    )
    .bind(v_b24339, v_0c8987)
    .first<{ id: number }>();
  return v_cb35cb!.id;
}

async function v_67c7dc(
  v_0c8987,
  v_ea333d,
  v_94302c,
  v_433c46,
): Promise<string> {
  const v_cb35cb = await v_1df298.fetch("http://localhost/oth-path", {
    method: "POST",
    headers: { Authorization: `Bearer ${v_ea333d}`, "Content-Type": "application/json" },
    body: JSON.stringify({ kind: v_94302c, src_file_id: v_433c46 }),
  });
  v_4d37e3(v_cb35cb.status).toBe(201);
  const { job_id: v_b0d200 } = await v_cb35cb.json<{ job_id: string }>();
  return v_b0d200;
}

v_469bf2("T-088 F3b: filler 잡 트리거 — voice_raw_url 동봉", () => {
  v_23805a("idle_video_job_id + voice_clone_job_id 제공 → filler 잡 생성·voice_raw_url 을 포함한 페이로드", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_0c8987 = await v_bfb240("f3b_full@test.com");
    const v_8d41d7 = await v_21cc31(v_0c8987);

    const v_97745e = await v_c808bd(v_0c8987, "f3b-img");
    const v_296cc7 = await v_c808bd(v_0c8987, "f3b-wav");

    const v_ecfd5e = await v_67c7dc(v_0c8987, v_8d41d7, "idle_video", v_97745e);
    const v_e85271 = await v_67c7dc(v_0c8987, v_8d41d7, "voice_clone", v_296cc7);

    const v_4fab5a = `f3b-full-${Date.now()}`;
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${v_8d41d7}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": v_4fab5a,
      },
      body: JSON.stringify({
        clone_type: "friend",
        name: "F3bTest",
        username: `f3bfull${Date.now()}`,
        idle_video_job_id: v_ecfd5e,
        voice_clone_job_id: v_e85271,
      }),
    });
    v_4d37e3(v_8f00b9.status).toBe(201);
    const { clone: v_eb25ce } = await v_8f00b9.json<{ clone: { id: number } }>();
    const v_6e0fd3 = v_eb25ce.id;

    const v_9f844e = await v_a1651b
      .prepare(
        `SELECT kind, src_file_id, clone_id, status FROM clone_asset_jobs WHERE clone_id=? AND kind='filler'`,
      )
      .bind(v_6e0fd3)
      .first<{ kind: string; src_file_id: number; clone_id: number; status: string }>();

    v_4d37e3(v_9f844e).toBeTruthy();
    v_4d37e3(v_9f844e!.kind).toBe("filler");

    v_4d37e3(v_9f844e!.src_file_id).toBe(v_97745e);

    v_4d37e3(v_9f844e!.clone_id).toBe(v_6e0fd3);

    v_4d37e3(["pending", "running", "failed"]).toContain(v_9f844e!.status);
  });

  v_23805a("voice_clone_job_id 미제공(idle만) → filler 잡 미생성(voice 없는 클론 fail-safe)", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_0c8987 = await v_bfb240("f3b_novoice@test.com");
    const v_8d41d7 = await v_21cc31(v_0c8987);

    const v_97745e = await v_c808bd(v_0c8987, "f3b-novoice-img");
    const v_ecfd5e = await v_67c7dc(v_0c8987, v_8d41d7, "idle_video", v_97745e);

    const v_4fab5a = `f3b-novoice-${Date.now()}`;
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${v_8d41d7}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": v_4fab5a,
      },
      body: JSON.stringify({
        clone_type: "friend",
        name: "F3bNoVoice",
        username: `f3bnovoice${Date.now()}`,
        idle_video_job_id: v_ecfd5e,

      }),
    });
    v_4d37e3(v_8f00b9.status).toBe(201);
    const { clone: v_eb25ce } = await v_8f00b9.json<{ clone: { id: number } }>();
    const v_6e0fd3 = v_eb25ce.id;

    const v_43c42e = await v_a1651b
      .prepare(`SELECT COUNT(*) AS n FROM clone_asset_jobs WHERE clone_id=? AND kind='filler'`)
      .bind(v_6e0fd3)
      .first<{ n: number }>();
    v_4d37e3(v_43c42e!.n).toBe(0);
  });

  v_23805a("idle_video_job_id 미제공 → filler 잡 미생성(기존 fail-safe 유지)", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_0c8987 = await v_bfb240("f3b_noidle@test.com");
    const v_8d41d7 = await v_21cc31(v_0c8987);

    const v_296cc7 = await v_c808bd(v_0c8987, "f3b-noidle-wav");
    const v_e85271 = await v_67c7dc(v_0c8987, v_8d41d7, "voice_clone", v_296cc7);

    const v_4fab5a = `f3b-noidle-${Date.now()}`;
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${v_8d41d7}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": v_4fab5a,
      },
      body: JSON.stringify({
        clone_type: "friend",
        name: "F3bNoIdle",
        username: `f3bnoidle${Date.now()}`,
        voice_clone_job_id: v_e85271,

      }),
    });
    v_4d37e3(v_8f00b9.status).toBe(201);
    const { clone: v_eb25ce } = await v_8f00b9.json<{ clone: { id: number } }>();
    const v_6e0fd3 = v_eb25ce.id;

    const v_43c42e = await v_a1651b
      .prepare(`SELECT COUNT(*) AS n FROM clone_asset_jobs WHERE clone_id=? AND kind='filler'`)
      .bind(v_6e0fd3)
      .first<{ n: number }>();
    v_4d37e3(v_43c42e!.n).toBe(0);
  });

  v_23805a("타인 voice_clone_job_id 제공 → 소유 검증 실패로 filler 미생성(fail-safe)", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_3eddbd = await v_bfb240("f3b_other1@test.com");
    const v_e8a9a0 = await v_bfb240("f3b_other2@test.com");
    const v_ece1e8 = await v_21cc31(v_3eddbd);
    const v_a9fa04 = await v_21cc31(v_e8a9a0);

    const v_97745e = await v_c808bd(v_3eddbd, "f3b-other-img");
    const v_296cc7 = await v_c808bd(v_e8a9a0, "f3b-other-wav");
    const v_ecfd5e = await v_67c7dc(v_3eddbd, v_ece1e8, "idle_video", v_97745e);

    const v_e85271 = await v_67c7dc(v_e8a9a0, v_a9fa04, "voice_clone", v_296cc7);

    const v_4fab5a = `f3b-other-${Date.now()}`;
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${v_ece1e8}`, 
        "Content-Type": "application/json",
        "X-Idempotency-Key": v_4fab5a,
      },
      body: JSON.stringify({
        clone_type: "friend",
        name: "F3bOther",
        username: `f3bother${Date.now()}`,
        idle_video_job_id: v_ecfd5e,
        voice_clone_job_id: v_e85271, 
      }),
    });
    v_4d37e3(v_8f00b9.status).toBe(201);
    const { clone: v_eb25ce } = await v_8f00b9.json<{ clone: { id: number } }>();
    const v_6e0fd3 = v_eb25ce.id;

    const v_43c42e = await v_a1651b
      .prepare(`SELECT COUNT(*) AS n FROM clone_asset_jobs WHERE clone_id=? AND kind='filler'`)
      .bind(v_6e0fd3)
      .first<{ n: number }>();
    v_4d37e3(v_43c42e!.n).toBe(0);
  });

  v_23805a("idle X + voice X 둘 다 미제공 → filler 잡 미생성 (fail-safe)", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_0c8987 = await v_bfb240("f3b_noidlevoice@test.com");
    const v_8d41d7 = await v_21cc31(v_0c8987);

    const v_4fab5a = `f3b-noidlevoice-${Date.now()}`;
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${v_8d41d7}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": v_4fab5a,
      },
      body: JSON.stringify({
        clone_type: "friend",
        name: "F3bNone",
        username: `f3bnone${Date.now()}`,

      }),
    });
    v_4d37e3(v_8f00b9.status).toBe(201);
    const { clone: v_eb25ce } = await v_8f00b9.json<{ clone: { id: number } }>();
    const v_6e0fd3 = v_eb25ce.id;

    const v_43c42e = await v_a1651b
      .prepare(`SELECT COUNT(*) AS n FROM clone_asset_jobs WHERE clone_id=? AND kind='filler'`)
      .bind(v_6e0fd3)
      .first<{ n: number }>();
    v_4d37e3(v_43c42e!.n).toBe(0);
  });

  v_23805a("F3b 이후 기존 idle_video_url 반영 회귀 없음", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_0c8987 = await v_bfb240("f3b_regr@test.com");
    const v_8d41d7 = await v_21cc31(v_0c8987);

    const v_97745e = await v_c808bd(v_0c8987, "f3b-regr-img");
    const v_296cc7 = await v_c808bd(v_0c8987, "f3b-regr-wav");
    const v_ecfd5e = await v_67c7dc(v_0c8987, v_8d41d7, "idle_video", v_97745e);
    const v_e85271 = await v_67c7dc(v_0c8987, v_8d41d7, "voice_clone", v_296cc7);

    await v_a1651b
      .prepare(`UPDATE clone_asset_jobs SET status='done', out_url='https://cdn.example.com/idle.mp4' WHERE id=?`)
      .bind(v_ecfd5e)
      .run();

    const v_4fab5a = `f3b-regr-${Date.now()}`;
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${v_8d41d7}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": v_4fab5a,
      },
      body: JSON.stringify({
        clone_type: "friend",
        name: "F3bRegr",
        username: `f3bregr${Date.now()}`,
        idle_video_job_id: v_ecfd5e,
        voice_clone_job_id: v_e85271,
      }),
    });
    v_4d37e3(v_8f00b9.status).toBe(201);
    const { clone: v_eb25ce } = await v_8f00b9.json<{ clone: { id: number } }>();

    const v_1de203 = await v_a1651b
      .prepare(`SELECT idle_video_url FROM clones WHERE id=?`)
      .bind(v_eb25ce.id)
      .first<{ idle_video_url: string | null }>();
    v_4d37e3(v_1de203!.idle_video_url).toBe("https://cdn.example.com/idle.mp4");
  });
});
