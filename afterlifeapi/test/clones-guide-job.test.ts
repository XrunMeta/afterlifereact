

import { v_469bf2, v_23805a, v_4d37e3, v_ba7107, v_719203 } from "xualxe";
import { v_1df298, v_c9c489, v_8fd90d } from "lwkoweqmjbnvjqw";

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
  const v_b24339 = `uploadedfiles/guidejob-${v_ae8e76}.bin`;
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

const v_8fe3be = "http://orchestrator.test";

v_ba7107(() => {
  v_8fd90d.activate();
  v_8fd90d.disableNetConnect();
});
v_719203(() => v_8fd90d.assertNoPendingInterceptors());

v_469bf2("T-116 B Task4: guide 잡 트리거 — persona(L0/L1) 동봉", () => {
  v_23805a("idle_video_job_id + voice_clone_job_id 제공 → guide 잡 생성·running 선전환·payload에 persona 포함", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_0c8987 = await v_bfb240("guidejob_full@test.com");
    const v_8d41d7 = await v_21cc31(v_0c8987);

    const v_97745e = await v_c808bd(v_0c8987, "full-img");
    const v_296cc7 = await v_c808bd(v_0c8987, "full-wav");

    const v_ecfd5e = await v_67c7dc(v_0c8987, v_8d41d7, "idle_video", v_97745e);
    const v_e85271 = await v_67c7dc(v_0c8987, v_8d41d7, "voice_clone", v_296cc7);

    v_8fd90d
      .get(v_8fe3be)
      .intercept({ path: "/oth-path", method: "POST" })
      .reply(() => ({ statusCode: 202, data: { ok: true } }))
      .times(2);

    const v_4fab5a = `guidejob-full-${Date.now()}`;
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${v_8d41d7}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": v_4fab5a,
      },
      body: JSON.stringify({
        clone_type: "friend",
        name: "GuideJobTest",
        username: `guidejobfull${Date.now()}`,
        idle_video_job_id: v_ecfd5e,
        voice_clone_job_id: v_e85271,
      }),
    });
    v_4d37e3(v_8f00b9.status).toBe(201);
    const { clone: v_eb25ce } = await v_8f00b9.json<{ clone: { id: number } }>();
    const v_6e0fd3 = v_eb25ce.id;

    const v_ac5ea8 = await v_a1651b
      .prepare(
        `SELECT kind, src_file_id, clone_id, status FROM clone_asset_jobs WHERE clone_id=? AND kind='guide'`,
      )
      .bind(v_6e0fd3)
      .first<{ kind: string; src_file_id: number; clone_id: number; status: string }>();

    v_4d37e3(v_ac5ea8).toBeTruthy();
    v_4d37e3(v_ac5ea8!.kind).toBe("guide");

    v_4d37e3(v_ac5ea8!.src_file_id).toBe(v_97745e);

    v_4d37e3(v_ac5ea8!.clone_id).toBe(v_6e0fd3);

    v_4d37e3(v_ac5ea8!.status).toBe("running");

    const v_9f844e = await v_a1651b
      .prepare(`SELECT status FROM clone_asset_jobs WHERE clone_id=? AND kind='filler'`)
      .bind(v_6e0fd3)
      .first<{ status: string }>();
    v_4d37e3(v_9f844e).toBeTruthy();
    v_4d37e3(v_9f844e!.status).toBe("running");
  });

  v_23805a("guide 잡 orchestrator 중계 payload에 persona(l0/l1) 필드 포함", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_0c8987 = await v_bfb240("guidejob_persona@test.com");
    const v_8d41d7 = await v_21cc31(v_0c8987);

    const v_97745e = await v_c808bd(v_0c8987, "persona-img");
    const v_296cc7 = await v_c808bd(v_0c8987, "persona-wav");

    const v_ecfd5e = await v_67c7dc(v_0c8987, v_8d41d7, "idle_video", v_97745e);
    const v_e85271 = await v_67c7dc(v_0c8987, v_8d41d7, "voice_clone", v_296cc7);

    let v_10e7b2 = null;
    let v_81fc46 = null;
    v_8fd90d
      .get(v_8fe3be)
      .intercept({ path: "/oth-path", method: "POST" })
      .reply((v_328259) => {
        const v_8decf8 = JSON.parse(v_328259.body as string);
        if (v_8decf8.kind === "guide") v_81fc46 = v_328259.body as string;
        else v_10e7b2 = v_328259.body as string;
        return { statusCode: 202, data: { ok: true } };
      })
      .times(2);

    const v_4fab5a = `guidejob-persona-${Date.now()}`;
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${v_8d41d7}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": v_4fab5a,
      },
      body: JSON.stringify({
        clone_type: "friend",
        name: "GuideJobPersona",
        username: `guidejobpersona${Date.now()}`,
        idle_video_job_id: v_ecfd5e,
        voice_clone_job_id: v_e85271,
      }),
    });
    v_4d37e3(v_8f00b9.status).toBe(201);
    const { clone: v_eb25ce } = await v_8f00b9.json<{ clone: { id: number } }>();

    const v_ac5ea8 = await v_a1651b
      .prepare(`SELECT status FROM clone_asset_jobs WHERE clone_id=? AND kind='guide'`)
      .bind(v_eb25ce.id)
      .first<{ status: string }>();
    v_4d37e3(v_ac5ea8).toBeTruthy();

    v_4d37e3(v_81fc46).toBeTruthy();
    const v_5518a6 = JSON.parse(v_81fc46!);
    v_4d37e3(v_5518a6.kind).toBe("guide");
    v_4d37e3(v_5518a6.face_url).toBeTruthy();
    v_4d37e3(v_5518a6.voice_raw_url).toBeTruthy();
    v_4d37e3(v_5518a6.clone_id).toBe(String(v_eb25ce.id));

    v_4d37e3(v_5518a6.persona).toBeTruthy();
    v_4d37e3(v_5518a6.persona.l0).toBeTruthy();
    v_4d37e3(typeof v_5518a6.persona.l0.rules_text).toBe("string");

    v_4d37e3(v_10e7b2).toBeTruthy();
    const v_29b3d5 = JSON.parse(v_10e7b2!);
    v_4d37e3(v_29b3d5.persona).toBeUndefined();
  });

  v_23805a("voice_clone_job_id 미제공(idle만) → guide 잡 미생성(filler와 동일 fail-safe)", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_0c8987 = await v_bfb240("guidejob_novoice@test.com");
    const v_8d41d7 = await v_21cc31(v_0c8987);

    const v_97745e = await v_c808bd(v_0c8987, "novoice-img");
    const v_ecfd5e = await v_67c7dc(v_0c8987, v_8d41d7, "idle_video", v_97745e);

    const v_4fab5a = `guidejob-novoice-${Date.now()}`;
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${v_8d41d7}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": v_4fab5a,
      },
      body: JSON.stringify({
        clone_type: "friend",
        name: "GuideJobNoVoice",
        username: `guidejobnovoice${Date.now()}`,
        idle_video_job_id: v_ecfd5e,

      }),
    });
    v_4d37e3(v_8f00b9.status).toBe(201);
    const { clone: v_eb25ce } = await v_8f00b9.json<{ clone: { id: number } }>();

    const v_43c42e = await v_a1651b
      .prepare(`SELECT COUNT(*) AS n FROM clone_asset_jobs WHERE clone_id=? AND kind='guide'`)
      .bind(v_eb25ce.id)
      .first<{ n: number }>();
    v_4d37e3(v_43c42e!.n).toBe(0);
  });

  v_23805a("idle_video_job_id 미제공 → guide 잡 미생성(기존 fail-safe 유지)", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_0c8987 = await v_bfb240("guidejob_noidle@test.com");
    const v_8d41d7 = await v_21cc31(v_0c8987);

    const v_296cc7 = await v_c808bd(v_0c8987, "noidle-wav");
    const v_e85271 = await v_67c7dc(v_0c8987, v_8d41d7, "voice_clone", v_296cc7);

    const v_4fab5a = `guidejob-noidle-${Date.now()}`;
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${v_8d41d7}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": v_4fab5a,
      },
      body: JSON.stringify({
        clone_type: "friend",
        name: "GuideJobNoIdle",
        username: `guidejobnoidle${Date.now()}`,
        voice_clone_job_id: v_e85271,

      }),
    });
    v_4d37e3(v_8f00b9.status).toBe(201);
    const { clone: v_eb25ce } = await v_8f00b9.json<{ clone: { id: number } }>();

    const v_43c42e = await v_a1651b
      .prepare(`SELECT COUNT(*) AS n FROM clone_asset_jobs WHERE clone_id=? AND kind='guide'`)
      .bind(v_eb25ce.id)
      .first<{ n: number }>();
    v_4d37e3(v_43c42e!.n).toBe(0);
  });
});
