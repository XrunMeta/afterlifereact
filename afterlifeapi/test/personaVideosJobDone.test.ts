

import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

async function v_bfb240(v_e0c7e8): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(
      `INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`,
    )
    .bind(v_e0c7e8)
    .run();
  return (
    await v_a1651b
      .prepare(`SELECT id FROM users WHERE email = ?`)
      .bind(v_e0c7e8)
      .first<{ id: number }>()
  )!.id;
}

async function v_c808bd(v_1badb6, v_ae8e76): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  const v_b24339 = `uploadedfiles/pv-${v_ae8e76}.jpg`;
  const v_cb35cb = await v_a1651b
    .prepare(
      `INSERT INTO files (r2_key, content_type, size_bytes, owner_user_id, purpose)
       VALUES (?, 'image/jpeg', 1, ?, 'clone_avatar') RETURNING id`,
    )
    .bind(v_b24339, v_1badb6)
    .first<{ id: number }>();
  return v_cb35cb!.id;
}

async function v_4d24a9(v_1badb6, v_556427): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  const v_cb35cb = await v_a1651b
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
       VALUES (?, 'PV', ?, 'friend', 'public', CURRENT_TIMESTAMP) RETURNING id`,
    )
    .bind(v_1badb6, v_556427)
    .first<{ id: number }>();
  return v_cb35cb!.id;
}

async function v_8973ff(
  v_43e90c,
  v_2fa661,
  v_6e0fd3,
): Promise<{ jobId: string; callbackToken: string }> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  const v_04211c = crypto.randomUUID();
  const v_59b4e0 = crypto.randomUUID();
  await v_a1651b
    .prepare(
      `INSERT INTO clone_asset_jobs (id, user_id, kind, src_file_id, status, clone_id, callback_token)
       VALUES (?, ?, 'persona_videos', ?, 'pending', ?, ?)`,
    )
    .bind(v_04211c, v_43e90c, v_2fa661, v_6e0fd3, v_59b4e0)
    .run();
  return { jobId: v_04211c, callbackToken: v_59b4e0 };
}

async function v_2f8a78(
  v_43e90c,
  v_2fa661,
  v_6e0fd3,
): Promise<{ jobId: string; callbackToken: string }> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  const v_04211c = crypto.randomUUID();
  const v_59b4e0 = crypto.randomUUID();
  await v_a1651b
    .prepare(
      `INSERT INTO clone_asset_jobs (id, user_id, kind, src_file_id, status, clone_id, callback_token)
       VALUES (?, ?, 'filler', ?, 'running', ?, ?)`,
    )
    .bind(v_04211c, v_43e90c, v_2fa661, v_6e0fd3, v_59b4e0)
    .run();
  return { jobId: v_04211c, callbackToken: v_59b4e0 };
}

const v_7169b4 = () =>
  (v_c9c489 as { ORCH_SECRET?: string }).ORCH_SECRET ?? "test-orch-secret";

function v_a64c40(
  v_04211c,
  v_59b4e0,
  v_cd9d29,
  v_2ae4e7,
): FormData {
  const v_23563e = new FormData();
  v_23563e.append("job_id", v_04211c);
  v_23563e.append("callback_token", v_59b4e0);
  if (v_2ae4e7) v_23563e.append("stage", v_2ae4e7);
  const v_9390e8 = new Uint8Array([0, 1, 2, 3]);
  for (let v_ebec57 = 0; v_ebec57 < v_cd9d29; v_ebec57++) {
    v_23563e.append(
      `file${v_ebec57}`,
      new Blob([v_9390e8], { type: "video/mp4" }),
      `f${v_ebec57}.mp4`,
    );
  }
  return v_23563e;
}

v_469bf2("POST /oth-path — 인증 (T-927)", () => {
  v_23805a("ORCH_SECRET 불일치 → 401", async () => {
    const v_23563e = new FormData();
    v_23563e.append("job_id", "x");
    v_23563e.append("callback_token", "y");
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: "Bearer wrong-secret" },
      body: v_23563e,
    });
    v_4d37e3(v_8f00b9.status).toBe(401);
  });

  v_23805a("callback_token 불일치 → 403", async () => {
    const v_0c8987 = await v_bfb240("pv_403@test.com");
    const v_8e2335 = await v_c808bd(v_0c8987, "pv-403");
    const v_062ae9 = await v_4d24a9(v_0c8987, "pv403");
    const { jobId: v_04211c } = await v_8973ff(v_0c8987, v_8e2335, v_062ae9);
    const v_23563e = new FormData();
    v_23563e.append("job_id", v_04211c);
    v_23563e.append("callback_token", "wrong-token");
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_7169b4()}` },
      body: v_23563e,
    });
    v_4d37e3(v_8f00b9.status).toBe(403);
  });
});

v_469bf2("POST /oth-path — stage 검증 (T-938)", () => {
  v_23805a("stage 누락 → 400 invalid stage", async () => {
    const v_0c8987 = await v_bfb240("pv_nostage@test.com");
    const v_8e2335 = await v_c808bd(v_0c8987, "pv-nostage");
    const v_062ae9 = await v_4d24a9(v_0c8987, "pvnostage");
    const { jobId: v_04211c, callbackToken: v_59b4e0 } = await v_8973ff(v_0c8987, v_8e2335, v_062ae9);
    const v_23563e = v_a64c40(v_04211c, v_59b4e0, 1); 
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_7169b4()}` },
      body: v_23563e,
    });
    v_4d37e3(v_8f00b9.status).toBe(400);
    const v_4d33b2 = await v_8f00b9.json<{ error: string }>();
    v_4d37e3(v_4d33b2.error).toMatch(/stage/);
  });

  v_23805a("stage=idle · 파일 2개 → 400 too many", async () => {
    const v_0c8987 = await v_bfb240("pv_idle2@test.com");
    const v_8e2335 = await v_c808bd(v_0c8987, "pv-idle2");
    const v_062ae9 = await v_4d24a9(v_0c8987, "pvidle2");
    const { jobId: v_04211c, callbackToken: v_59b4e0 } = await v_8973ff(v_0c8987, v_8e2335, v_062ae9);
    const v_23563e = v_a64c40(v_04211c, v_59b4e0, 2, "idle");
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_7169b4()}` },
      body: v_23563e,
    });
    v_4d37e3(v_8f00b9.status).toBe(400);
  });

  v_23805a("stage=bridges · 파일 4개(부족) → 400", async () => {
    const v_0c8987 = await v_bfb240("pv_br4@test.com");
    const v_8e2335 = await v_c808bd(v_0c8987, "pv-br4");
    const v_062ae9 = await v_4d24a9(v_0c8987, "pvbr4");
    const { jobId: v_04211c, callbackToken: v_59b4e0 } = await v_8973ff(v_0c8987, v_8e2335, v_062ae9);
    const v_23563e = v_a64c40(v_04211c, v_59b4e0, 4, "bridges");
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_7169b4()}` },
      body: v_23563e,
    });
    v_4d37e3(v_8f00b9.status).toBe(400);
  });
});

v_469bf2("POST /oth-path — 정상 흐름 2단계 (T-938)", () => {
  v_23805a("stage=idle 1파일 → 200, idle_video_url 세팅, 잡 running 유지", async () => {
    const v_0c8987 = await v_bfb240("pv_idle_ok@test.com");
    const v_8e2335 = await v_c808bd(v_0c8987, "pv-idle-ok");
    const v_062ae9 = await v_4d24a9(v_0c8987, "pvidleok");
    const { jobId: v_04211c, callbackToken: v_59b4e0 } = await v_8973ff(v_0c8987, v_8e2335, v_062ae9);
    const v_23563e = v_a64c40(v_04211c, v_59b4e0, 1, "idle");
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_7169b4()}` },
      body: v_23563e,
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = await v_8f00b9.json<{ ok: boolean; stage: string; idle_video_url: string }>();
    v_4d37e3(v_4d33b2.stage).toBe("idle");
    v_4d37e3(v_4d33b2.idle_video_url).toMatch(/\/oth-path\/files\/\d+$/);

    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_3ac7e7 = await v_a1651b
      .prepare(`SELECT idle_video_url, bridge_video_urls FROM clones WHERE id = ?`)
      .bind(v_062ae9)
      .first<{ idle_video_url: string; bridge_video_urls: string | null }>();
    v_4d37e3(v_3ac7e7?.idle_video_url).toBe(v_4d33b2.idle_video_url);
    v_4d37e3(v_3ac7e7?.bridge_video_urls).toBeNull();
    const v_d5e460 = await v_a1651b
      .prepare(`SELECT status FROM clone_asset_jobs WHERE id = ?`)
      .bind(v_04211c)
      .first<{ status: string }>();
    v_4d37e3(v_d5e460?.status).toBe("running");
  });

  v_23805a("stage=idle 다음 stage=bridges 5파일 → 200, bridge_video_urls 세팅, 잡 done", async () => {
    const v_0c8987 = await v_bfb240("pv_full@test.com");
    const v_8e2335 = await v_c808bd(v_0c8987, "pv-full");
    const v_062ae9 = await v_4d24a9(v_0c8987, "pvfull");
    const { jobId: v_04211c, callbackToken: v_59b4e0 } = await v_8973ff(v_0c8987, v_8e2335, v_062ae9);

    const v_7c5210 = v_a64c40(v_04211c, v_59b4e0, 1, "idle");
    const v_1d5e5f = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_7169b4()}` },
      body: v_7c5210,
    });
    v_4d37e3(v_1d5e5f.status).toBe(200);

    const v_616d3d = v_a64c40(v_04211c, v_59b4e0, 5, "bridges");
    const v_48bbbd = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_7169b4()}` },
      body: v_616d3d,
    });
    v_4d37e3(v_48bbbd.status).toBe(200);
    const v_ef157f = await v_48bbbd.json<{ ok: boolean; stage: string; bridge_video_urls: string[] }>();
    v_4d37e3(v_ef157f.stage).toBe("bridges");
    v_4d37e3(v_ef157f.bridge_video_urls).toHaveLength(5);

    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_3ac7e7 = await v_a1651b
      .prepare(`SELECT idle_video_url, bridge_video_urls FROM clones WHERE id = ?`)
      .bind(v_062ae9)
      .first<{ idle_video_url: string; bridge_video_urls: string }>();
    v_4d37e3(v_3ac7e7?.idle_video_url).toMatch(/\/oth-path\/files\/\d+$/);
    const v_8decf8 = JSON.parse(v_3ac7e7!.bridge_video_urls) as Record<string, string>;
    v_4d37e3(Object.keys(v_8decf8).sort()).toEqual([
      "bridge_challenge",
      "bridge_complex",
      "bridge_emotion_pos",
      "bridge_fact",
      "bridge_generic",
    ]);
    const v_d5e460 = await v_a1651b
      .prepare(`SELECT status FROM clone_asset_jobs WHERE id = ?`)
      .bind(v_04211c)
      .first<{ status: string }>();
    v_4d37e3(v_d5e460?.status).toBe("done");
  });

  v_23805a("status=failed → failJob 처리, 200 반환", async () => {
    const v_0c8987 = await v_bfb240("pv_failed@test.com");
    const v_8e2335 = await v_c808bd(v_0c8987, "pv-failed");
    const v_062ae9 = await v_4d24a9(v_0c8987, "pvfailed");
    const { jobId: v_04211c, callbackToken: v_59b4e0 } = await v_8973ff(v_0c8987, v_8e2335, v_062ae9);
    const v_23563e = new FormData();
    v_23563e.append("job_id", v_04211c);
    v_23563e.append("callback_token", v_59b4e0);
    v_23563e.append("status", "failed");
    v_23563e.append("error", "MuseTalk timeout");
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_7169b4()}` },
      body: v_23563e,
    });
    v_4d37e3(v_8f00b9.status).toBe(200);

    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_3ac7e7 = await v_a1651b
      .prepare(`SELECT status, error FROM clone_asset_jobs WHERE id = ?`)
      .bind(v_04211c)
      .first<{ status: string; error: string }>();
    v_4d37e3(v_3ac7e7?.status).toBe("failed");
    v_4d37e3(v_3ac7e7?.error).toMatch(/MuseTalk timeout/);
  });
});

v_469bf2("POST /oth-path — cross-kind 가드 (T-927)", () => {
  v_23805a("filler 잡 ID + token 으로 persona-videos-job-done 호출 → 409 kind_mismatch (claim 전 차단)", async () => {
    const v_0c8987 = await v_bfb240("pv_xkind@test.com");
    const v_8e2335 = await v_c808bd(v_0c8987, "pv-xkind");
    const v_062ae9 = await v_4d24a9(v_0c8987, "pvxkind");
    const { jobId: v_04211c, callbackToken: v_59b4e0 } = await v_2f8a78(v_0c8987, v_8e2335, v_062ae9);
    const v_23563e = v_a64c40(v_04211c, v_59b4e0, 1, "idle");
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_7169b4()}` },
      body: v_23563e,
    });
    v_4d37e3(v_8f00b9.status).toBe(409);

    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_3ac7e7 = await v_a1651b
      .prepare(`SELECT status FROM clone_asset_jobs WHERE id = ?`)
      .bind(v_04211c)
      .first<{ status: string }>();
    v_4d37e3(v_3ac7e7?.status).toBe("running");
  });
});
