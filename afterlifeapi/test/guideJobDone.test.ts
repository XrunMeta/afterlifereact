

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
  const v_b24339 = `uploadedfiles/guide-${v_ae8e76}.jpg`;
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
       VALUES (?, 'GC', ?, 'friend', 'public', CURRENT_TIMESTAMP) RETURNING id`,
    )
    .bind(v_1badb6, v_556427)
    .first<{ id: number }>();
  return v_cb35cb!.id;
}

async function v_c0d4d8(
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
       VALUES (?, ?, 'guide', ?, 'pending', ?, ?)`,
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
  v_ff9685,
): FormData {
  const v_23563e = new FormData();
  v_23563e.append("job_id", v_04211c);
  v_23563e.append("callback_token", v_59b4e0);
  v_ff9685.forEach((v_8b5cd8, v_ebec57) => {
    if (v_8b5cd8 !== null) {
      v_23563e.append(
        `file${v_ebec57}`,
        new Blob([v_8b5cd8.data], { type: "video/mp4" }),
        v_8b5cd8.name,
      );
    }
  });
  return v_23563e;
}

const v_070a47 = new Uint8Array([0, 1, 2, 3]); 

v_469bf2("POST /oth-path — 인증", () => {
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

  v_23805a("Authorization 헤더 없음 → 401", async () => {
    const v_23563e = new FormData();
    v_23563e.append("job_id", "x");
    v_23563e.append("callback_token", "y");
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      body: v_23563e,
    });
    v_4d37e3(v_8f00b9.status).toBe(401);
  });

  v_23805a("callback_token 불일치 → 403", async () => {
    const v_0c8987 = await v_bfb240("guide_403@test.com");
    const v_8e2335 = await v_c808bd(v_0c8987, "guide-403");
    const v_062ae9 = await v_4d24a9(v_0c8987, "guide403");
    const { jobId: v_04211c } = await v_c0d4d8(v_0c8987, v_8e2335, v_062ae9);
    const v_840909 = new FormData();
    v_840909.append("job_id", v_04211c);
    v_840909.append("callback_token", "wrong-token");
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_7169b4()}` },
      body: v_840909,
    });
    v_4d37e3(v_8f00b9.status).toBe(403);
    const v_4d33b2 = await v_8f00b9.json<{ error: string }>();
    v_4d37e3(v_4d33b2.error).toMatch(/callback_token/);
  });
});

v_469bf2("POST /oth-path — 파일 검증", () => {
  v_23805a("file0 없음(0개) → 400", async () => {
    const v_0c8987 = await v_bfb240("guide_0file@test.com");
    const v_8e2335 = await v_c808bd(v_0c8987, "guide-0file");
    const v_062ae9 = await v_4d24a9(v_0c8987, "guide0file");
    const { jobId: v_04211c, callbackToken: v_59b4e0 } = await v_c0d4d8(v_0c8987, v_8e2335, v_062ae9);
    const v_23563e = new FormData();
    v_23563e.append("job_id", v_04211c);
    v_23563e.append("callback_token", v_59b4e0);

    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_7169b4()}` },
      body: v_23563e,
    });
    v_4d37e3(v_8f00b9.status).toBe(400);
    const v_4d33b2 = await v_8f00b9.json<{ error: string }>();
    v_4d37e3(v_4d33b2.error).toMatch(/file0/);
  });

  v_23805a("file3 포함(4개, MAX 초과) → 400 too many", async () => {
    const v_0c8987 = await v_bfb240("guide_4file@test.com");
    const v_8e2335 = await v_c808bd(v_0c8987, "guide-4file");
    const v_062ae9 = await v_4d24a9(v_0c8987, "guide4file");
    const { jobId: v_04211c, callbackToken: v_59b4e0 } = await v_c0d4d8(v_0c8987, v_8e2335, v_062ae9);
    const v_23563e = v_a64c40(v_04211c, v_59b4e0, [
      { data: v_070a47, name: "f0.mp4" },
      { data: v_070a47, name: "f1.mp4" },
      { data: v_070a47, name: "f2.mp4" },
    ]);
    v_23563e.append("file3", new Blob([v_070a47], { type: "video/mp4" }), "f3.mp4");
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_7169b4()}` },
      body: v_23563e,
    });
    v_4d37e3(v_8f00b9.status).toBe(400);
    const v_4d33b2 = await v_8f00b9.json<{ error: string }>();
    v_4d37e3(v_4d33b2.error).toMatch(/too many/);
  });

  v_23805a("index gap(file0 + file2, file1 없음) → 400 gap", async () => {
    const v_0c8987 = await v_bfb240("guide_gap@test.com");
    const v_8e2335 = await v_c808bd(v_0c8987, "guide-gap");
    const v_062ae9 = await v_4d24a9(v_0c8987, "guidegap");
    const { jobId: v_04211c, callbackToken: v_59b4e0 } = await v_c0d4d8(v_0c8987, v_8e2335, v_062ae9);
    const v_23563e = v_a64c40(v_04211c, v_59b4e0, [
      { data: v_070a47, name: "f0.mp4" },
    ]);
    v_23563e.append("file2", new Blob([v_070a47], { type: "video/mp4" }), "f2.mp4");
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_7169b4()}` },
      body: v_23563e,
    });
    v_4d37e3(v_8f00b9.status).toBe(400);
    const v_4d33b2 = await v_8f00b9.json<{ error: string }>();
    v_4d37e3(v_4d33b2.error).toMatch(/gap/);
  });

  v_23805a("file0 크기 초과(50MB+1) → 400", async () => {
    const v_0c8987 = await v_bfb240("guide_size@test.com");
    const v_8e2335 = await v_c808bd(v_0c8987, "guide-size");
    const v_062ae9 = await v_4d24a9(v_0c8987, "guidesize");
    const { jobId: v_04211c, callbackToken: v_59b4e0 } = await v_c0d4d8(v_0c8987, v_8e2335, v_062ae9);
    const v_fdfe85 = new Uint8Array(50 * 1024 * 1024 + 1); 
    const v_23563e = v_a64c40(v_04211c, v_59b4e0, [
      { data: v_fdfe85, name: "f0.mp4" }, 
    ]);
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_7169b4()}` },
      body: v_23563e,
    });
    v_4d37e3(v_8f00b9.status).toBe(400);
    const v_4d33b2 = await v_8f00b9.json<{ error: string }>();
    v_4d37e3(v_4d33b2.error).toMatch(/too large/);
  });

  v_23805a("file0 0바이트 → 400", async () => {
    const v_0c8987 = await v_bfb240("guide_0byte@test.com");
    const v_8e2335 = await v_c808bd(v_0c8987, "guide-0byte");
    const v_062ae9 = await v_4d24a9(v_0c8987, "guide0byte");
    const { jobId: v_04211c, callbackToken: v_59b4e0 } = await v_c0d4d8(v_0c8987, v_8e2335, v_062ae9);
    const v_23563e = v_a64c40(v_04211c, v_59b4e0, [
      { data: new Uint8Array(0), name: "f0.mp4" }, 
    ]);
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_7169b4()}` },
      body: v_23563e,
    });
    v_4d37e3(v_8f00b9.status).toBe(400);
    const v_4d33b2 = await v_8f00b9.json<{ error: string }>();
    v_4d37e3(v_4d33b2.error).toMatch(/empty/);
  });
});

v_469bf2("POST /oth-path — 정상 처리", () => {
  v_23805a("running 잡 + 2파일 → 200, guide_video_urls 길이2 · jobs done", async () => {
    const v_0c8987 = await v_bfb240("guide_ok@test.com");
    const v_8e2335 = await v_c808bd(v_0c8987, "guide-ok");
    const v_062ae9 = await v_4d24a9(v_0c8987, "guideok");
    const { jobId: v_04211c, callbackToken: v_59b4e0 } = await v_c0d4d8(v_0c8987, v_8e2335, v_062ae9);

    const v_09ad9c = v_c9c489.DB as unknown as D1Database;
    await v_09ad9c
      .prepare(`UPDATE clone_asset_jobs SET status = 'running', updated_at = datetime('now') WHERE id = ?`)
      .bind(v_04211c)
      .run();

    const v_23563e = v_a64c40(v_04211c, v_59b4e0, [
      { data: new Uint8Array([10, 20, 30]), name: "guide0.mp4" },
      { data: new Uint8Array([40, 50, 60]), name: "guide1.mp4" },
    ]);
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_7169b4()}` },
      body: v_23563e,
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = await v_8f00b9.json<{
      ok: boolean;
      idempotent?: boolean;
      guide_video_urls?: string[];
    }>();
    v_4d37e3(v_4d33b2.ok).toBe(true);
    v_4d37e3(v_4d33b2.idempotent).toBeUndefined();
    v_4d37e3(v_4d33b2.guide_video_urls).toHaveLength(2);

    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_d5e460 = await v_a1651b
      .prepare(`SELECT status FROM clone_asset_jobs WHERE id = ?`)
      .bind(v_04211c)
      .first<{ status: string }>();
    v_4d37e3(v_d5e460!.status).toBe("done");

    const v_1de203 = await v_a1651b
      .prepare(`SELECT guide_video_urls FROM clones WHERE id = ?`)
      .bind(v_062ae9)
      .first<{ guide_video_urls: string | null }>();
    v_4d37e3(v_1de203!.guide_video_urls).not.toBeNull();
    const v_8decf8 = JSON.parse(v_1de203!.guide_video_urls!);
    v_4d37e3(v_8decf8).toHaveLength(2);

    const v_904217 = await v_a1651b
      .prepare(
        `SELECT COUNT(*) as cnt FROM files WHERE purpose = 'asset_guide' AND owner_user_id = ?`,
      )
      .bind(v_0c8987)
      .first<{ cnt: number }>();
    v_4d37e3(v_904217!.cnt).toBeGreaterThanOrEqual(2);
  });

  v_23805a("1파일(최소치) → 200, guide_video_urls 길이1", async () => {
    const v_0c8987 = await v_bfb240("guide_min@test.com");
    const v_8e2335 = await v_c808bd(v_0c8987, "guide-min");
    const v_062ae9 = await v_4d24a9(v_0c8987, "guidemin");
    const { jobId: v_04211c, callbackToken: v_59b4e0 } = await v_c0d4d8(v_0c8987, v_8e2335, v_062ae9);

    const v_23563e = v_a64c40(v_04211c, v_59b4e0, [
      { data: v_070a47, name: "f0.mp4" },
    ]);
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_7169b4()}` },
      body: v_23563e,
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = await v_8f00b9.json<{ ok: boolean; guide_video_urls?: string[] }>();
    v_4d37e3(v_4d33b2.ok).toBe(true);
    v_4d37e3(v_4d33b2.guide_video_urls).toHaveLength(1);
  });

  v_23805a("clone_id 없는 잡 → 정상 처리·guide_video_urls UPDATE 없음", async () => {
    const v_0c8987 = await v_bfb240("guide_nocid@test.com");
    const v_8e2335 = await v_c808bd(v_0c8987, "guide-nocid");

    const { jobId: v_04211c, callbackToken: v_59b4e0 } = await v_c0d4d8(v_0c8987, v_8e2335, null);

    const v_23563e = v_a64c40(v_04211c, v_59b4e0, [
      { data: v_070a47, name: "f0.mp4" },
    ]);
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_7169b4()}` },
      body: v_23563e,
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = await v_8f00b9.json<{ ok: boolean }>();
    v_4d37e3(v_4d33b2.ok).toBe(true);

    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_d5e460 = await v_a1651b
      .prepare(`SELECT status FROM clone_asset_jobs WHERE id = ?`)
      .bind(v_04211c)
      .first<{ status: string }>();
    v_4d37e3(v_d5e460!.status).toBe("done");
  });
});

v_469bf2("POST /oth-path — 멱등", () => {
  v_23805a("이미 done 잡 → 200 idempotent (R2·files 재처리 안 함)", async () => {
    const v_0c8987 = await v_bfb240("guide_idem@test.com");
    const v_8e2335 = await v_c808bd(v_0c8987, "guide-idem");
    const v_062ae9 = await v_4d24a9(v_0c8987, "guideidem");
    const { jobId: v_04211c, callbackToken: v_59b4e0 } = await v_c0d4d8(v_0c8987, v_8e2335, v_062ae9);

    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    await v_a1651b
      .prepare(
        `UPDATE clone_asset_jobs SET status = 'done', updated_at = datetime('now') WHERE id = ?`,
      )
      .bind(v_04211c)
      .run();

    const v_23563e = v_a64c40(v_04211c, v_59b4e0, [
      { data: v_070a47, name: "f0.mp4" },
      { data: v_070a47, name: "f1.mp4" },
    ]);
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_7169b4()}` },
      body: v_23563e,
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = await v_8f00b9.json<{ ok: boolean; idempotent?: boolean }>();
    v_4d37e3(v_4d33b2.ok).toBe(true);
    v_4d37e3(v_4d33b2.idempotent).toBe(true);
  });

  v_23805a("동일 콜백 재전송(중복) → 두 번째 응답도 200, 파일 중복 생성 없음", async () => {
    const v_0c8987 = await v_bfb240("guide_dup@test.com");
    const v_8e2335 = await v_c808bd(v_0c8987, "guide-dup");
    const v_062ae9 = await v_4d24a9(v_0c8987, "guidedup");
    const { jobId: v_04211c, callbackToken: v_59b4e0 } = await v_c0d4d8(v_0c8987, v_8e2335, v_062ae9);

    const v_f9b790 = () =>
      v_a64c40(v_04211c, v_59b4e0, [
        { data: v_070a47, name: "f0.mp4" },
        { data: v_070a47, name: "f1.mp4" },
      ]);

    const v_1d5e5f = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_7169b4()}` },
      body: v_f9b790(),
    });
    v_4d37e3(v_1d5e5f.status).toBe(200);
    const v_177c9d = await v_1d5e5f.json<{ ok: boolean; idempotent?: boolean }>();
    v_4d37e3(v_177c9d.ok).toBe(true);
    v_4d37e3(v_177c9d.idempotent).toBeUndefined();

    const v_48bbbd = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_7169b4()}` },
      body: v_f9b790(),
    });
    v_4d37e3(v_48bbbd.status).toBe(200);
    const v_ef157f = await v_48bbbd.json<{ ok: boolean; idempotent?: boolean }>();
    v_4d37e3(v_ef157f.ok).toBe(true);
    v_4d37e3(v_ef157f.idempotent).toBe(true);

    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_904217 = await v_a1651b
      .prepare(
        `SELECT COUNT(*) as cnt FROM files WHERE purpose = 'asset_guide' AND owner_user_id = ?`,
      )
      .bind(v_0c8987)
      .first<{ cnt: number }>();
    v_4d37e3(v_904217!.cnt).toBe(2); 
  });
});

v_469bf2("POST /oth-path — 실패 통보", () => {
  v_23805a("status=failed 콜백 → failJob 호출(잡 status=failed·error 기록)", async () => {
    const v_0c8987 = await v_bfb240("guide_fail@test.com");
    const v_8e2335 = await v_c808bd(v_0c8987, "guide-fail");
    const v_062ae9 = await v_4d24a9(v_0c8987, "guidefail");
    const { jobId: v_04211c, callbackToken: v_59b4e0 } = await v_c0d4d8(v_0c8987, v_8e2335, v_062ae9);

    const v_23563e = new FormData();
    v_23563e.append("job_id", v_04211c);
    v_23563e.append("callback_token", v_59b4e0);
    v_23563e.append("status", "failed");
    v_23563e.append("error", "generation failed upstream");

    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_7169b4()}` },
      body: v_23563e,
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = await v_8f00b9.json<{ ok: boolean }>();
    v_4d37e3(v_4d33b2.ok).toBe(true);

    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_d5e460 = await v_a1651b
      .prepare(`SELECT status, error FROM clone_asset_jobs WHERE id = ?`)
      .bind(v_04211c)
      .first<{ status: string; error: string | null }>();
    v_4d37e3(v_d5e460!.status).toBe("failed");
    v_4d37e3(v_d5e460!.error).toMatch(/generation failed/);
  });
});

v_469bf2("기존 /oth-path, /oth-path 회귀", () => {
  v_23805a("filler-job-done: ORCH_SECRET 불일치 여전히 401", async () => {
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

  v_23805a("asset-job-done: ORCH_SECRET 불일치 여전히 401", async () => {
    const v_23563e = new FormData();
    v_23563e.append("job_id", "x");
    v_23563e.append("status", "done");
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: "Bearer wrong" },
      body: v_23563e,
    });
    v_4d37e3(v_8f00b9.status).toBe(401);
  });
});
