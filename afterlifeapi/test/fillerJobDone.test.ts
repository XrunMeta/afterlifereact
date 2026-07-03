

import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";
import { v_c12e45 } from "../src/lib/assetJobs";

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
  const v_b24339 = `uploadedfiles/filler-${v_ae8e76}.jpg`;
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
       VALUES (?, 'FC', ?, 'friend', 'public', CURRENT_TIMESTAMP) RETURNING id`,
    )
    .bind(v_1badb6, v_556427)
    .first<{ id: number }>();
  return v_cb35cb!.id;
}

async function v_a5cf27(
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
       VALUES (?, ?, 'filler', ?, 'pending', ?, ?)`,
    )
    .bind(v_04211c, v_43e90c, v_2fa661, v_6e0fd3, v_59b4e0)
    .run();
  return { jobId: v_04211c, callbackToken: v_59b4e0 };
}

async function v_fda860(v_04211c): Promise<void> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(
      `UPDATE clone_asset_jobs SET status = 'pending', error = NULL, updated_at = datetime('now') WHERE id = ?`,
    )
    .bind(v_04211c)
    .run();
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
    const v_0c8987 = await v_bfb240("filler_403@test.com");
    const v_8e2335 = await v_c808bd(v_0c8987, "filler-403");
    const v_062ae9 = await v_4d24a9(v_0c8987, "filler403");
    const { jobId: v_04211c } = await v_a5cf27(v_0c8987, v_8e2335, v_062ae9);
    const v_23563e = v_a64c40("x", "x", []); 
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
    const v_0c8987 = await v_bfb240("filler_0file@test.com");
    const v_8e2335 = await v_c808bd(v_0c8987, "filler-0file");
    const v_062ae9 = await v_4d24a9(v_0c8987, "filler0file");
    const { jobId: v_04211c, callbackToken: v_59b4e0 } = await v_a5cf27(v_0c8987, v_8e2335, v_062ae9);
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

  v_23805a("file0, file1 만(2개) → 400", async () => {
    const v_0c8987 = await v_bfb240("filler_2file@test.com");
    const v_8e2335 = await v_c808bd(v_0c8987, "filler-2file");
    const v_062ae9 = await v_4d24a9(v_0c8987, "filler2file");
    const { jobId: v_04211c, callbackToken: v_59b4e0 } = await v_a5cf27(v_0c8987, v_8e2335, v_062ae9);
    const v_23563e = v_a64c40(v_04211c, v_59b4e0, [
      { data: v_070a47, name: "f0.mp4" },
      { data: v_070a47, name: "f1.mp4" },
      null, 
    ]);
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_7169b4()}` },
      body: v_23563e,
    });
    v_4d37e3(v_8f00b9.status).toBe(400);
    const v_4d33b2 = await v_8f00b9.json<{ error: string }>();
    v_4d37e3(v_4d33b2.error).toMatch(/file2/);
  });

  v_23805a("file3 포함(4개) → 400", async () => {
    const v_0c8987 = await v_bfb240("filler_4file@test.com");
    const v_8e2335 = await v_c808bd(v_0c8987, "filler-4file");
    const v_062ae9 = await v_4d24a9(v_0c8987, "filler4file");
    const { jobId: v_04211c, callbackToken: v_59b4e0 } = await v_a5cf27(v_0c8987, v_8e2335, v_062ae9);
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

  v_23805a("file1 크기 초과(50MB+1) → 400", async () => {
    const v_0c8987 = await v_bfb240("filler_size@test.com");
    const v_8e2335 = await v_c808bd(v_0c8987, "filler-size");
    const v_062ae9 = await v_4d24a9(v_0c8987, "fillersize");
    const { jobId: v_04211c, callbackToken: v_59b4e0 } = await v_a5cf27(v_0c8987, v_8e2335, v_062ae9);
    const v_fdfe85 = new Uint8Array(50 * 1024 * 1024 + 1); 
    const v_23563e = v_a64c40(v_04211c, v_59b4e0, [
      { data: v_070a47, name: "f0.mp4" },
      { data: v_fdfe85, name: "f1.mp4" }, 
      { data: v_070a47, name: "f2.mp4" },
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
});

v_469bf2("POST /oth-path — 멱등", () => {
  v_23805a("이미 done 잡 → 200 idempotent (R2·files 재처리 안 함)", async () => {
    const v_0c8987 = await v_bfb240("filler_idem@test.com");
    const v_8e2335 = await v_c808bd(v_0c8987, "filler-idem");
    const v_062ae9 = await v_4d24a9(v_0c8987, "filleridem");
    const { jobId: v_04211c, callbackToken: v_59b4e0 } = await v_a5cf27(v_0c8987, v_8e2335, v_062ae9);

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
      { data: v_070a47, name: "f2.mp4" },
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
});

v_469bf2("POST /oth-path — 정상 처리", () => {
  v_23805a("정상 3파일 → R2 3개·files 3행·filler_video_urls 3개 set·잡 done", async () => {
    const v_0c8987 = await v_bfb240("filler_ok@test.com");
    const v_8e2335 = await v_c808bd(v_0c8987, "filler-ok");
    const v_062ae9 = await v_4d24a9(v_0c8987, "fillerok");
    const { jobId: v_04211c, callbackToken: v_59b4e0 } = await v_a5cf27(v_0c8987, v_8e2335, v_062ae9);

    const v_09ad9c = v_c9c489.DB as unknown as D1Database;
    await v_09ad9c
      .prepare(`UPDATE clone_asset_jobs SET status = 'running', updated_at = datetime('now') WHERE id = ?`)
      .bind(v_04211c)
      .run();

    const v_23563e = v_a64c40(v_04211c, v_59b4e0, [
      { data: new Uint8Array([10, 20, 30]), name: "filler0.mp4" },
      { data: new Uint8Array([40, 50, 60]), name: "filler1.mp4" },
      { data: new Uint8Array([70, 80, 90]), name: "filler2.mp4" },
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
      filler_video_urls?: string[];
    }>();
    v_4d37e3(v_4d33b2.ok).toBe(true);

    const v_a1651b = v_c9c489.DB as unknown as D1Database;

    const v_d5e460 = await v_a1651b
      .prepare(`SELECT status FROM clone_asset_jobs WHERE id = ?`)
      .bind(v_04211c)
      .first<{ status: string }>();
    v_4d37e3(v_d5e460!.status).toBe("done");

    if (!v_4d33b2.idempotent) {

      v_4d37e3(v_4d33b2.filler_video_urls).toHaveLength(3);
      v_4d33b2.filler_video_urls!.forEach((v_f71b56) => {
        v_4d37e3(v_f71b56).toMatch(/\/oth-path\/files\/\d+/);
      });

      const v_1de203 = await v_a1651b
        .prepare(`SELECT filler_video_urls FROM clones WHERE id = ?`)
        .bind(v_062ae9)
        .first<{ filler_video_urls: string | null }>();
      v_4d37e3(v_1de203!.filler_video_urls).not.toBeNull();
      const v_8decf8 = JSON.parse(v_1de203!.filler_video_urls!);
      v_4d37e3(v_8decf8).toHaveLength(3);

      const v_904217 = await v_a1651b
        .prepare(
          `SELECT COUNT(*) as cnt FROM files WHERE purpose = 'asset_filler' AND owner_user_id = ?`,
        )
        .bind(v_0c8987)
        .first<{ cnt: number }>();
      v_4d37e3(v_904217!.cnt).toBeGreaterThanOrEqual(3);
    }
  });

  v_23805a("clone_id 없는 잡 → 정상 처리·filler_video_urls UPDATE 없음", async () => {
    const v_0c8987 = await v_bfb240("filler_nocid@test.com");
    const v_8e2335 = await v_c808bd(v_0c8987, "filler-nocid");

    const { jobId: v_04211c, callbackToken: v_59b4e0 } = await v_a5cf27(v_0c8987, v_8e2335, null);
    await v_fda860(v_04211c);

    const v_23563e = v_a64c40(v_04211c, v_59b4e0, [
      { data: v_070a47, name: "f0.mp4" },
      { data: v_070a47, name: "f1.mp4" },
      { data: v_070a47, name: "f2.mp4" },
    ]);
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_7169b4()}` },
      body: v_23563e,
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = await v_8f00b9.json<{ ok: boolean; idempotent?: boolean; filler_video_urls?: string[] }>();
    v_4d37e3(v_4d33b2.ok).toBe(true);

    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_d5e460 = await v_a1651b
      .prepare(`SELECT status FROM clone_asset_jobs WHERE id = ?`)
      .bind(v_04211c)
      .first<{ status: string }>();
    v_4d37e3(v_d5e460!.status).toBe("done");
  });
});

v_469bf2("POST /oth-path — 실패 통보 (수정 3)", () => {
  v_23805a("status=failed 콜백 → failJob 호출(잡 status=failed·error 기록)", async () => {
    const v_0c8987 = await v_bfb240("filler_fail@test.com");
    const v_8e2335 = await v_c808bd(v_0c8987, "filler-fail");
    const v_062ae9 = await v_4d24a9(v_0c8987, "fillerfail");
    const { jobId: v_04211c, callbackToken: v_59b4e0 } = await v_a5cf27(v_0c8987, v_8e2335, v_062ae9);

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

v_469bf2("POST /oth-path — 0바이트 파일 (수정 6)", () => {
  v_23805a("file0 0바이트 → 400", async () => {
    const v_0c8987 = await v_bfb240("filler_0byte@test.com");
    const v_8e2335 = await v_c808bd(v_0c8987, "filler-0byte");
    const v_062ae9 = await v_4d24a9(v_0c8987, "filler0byte");
    const { jobId: v_04211c, callbackToken: v_59b4e0 } = await v_a5cf27(v_0c8987, v_8e2335, v_062ae9);
    const v_23563e = v_a64c40(v_04211c, v_59b4e0, [
      { data: new Uint8Array(0), name: "f0.mp4" }, 
      { data: v_070a47, name: "f1.mp4" },
      { data: v_070a47, name: "f2.mp4" },
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

v_469bf2("POST /oth-path — 원자성 (수정 7)", () => {
  v_23805a("running 잡(콜백 시점 정상 상태) → 정상 처리 done (T-088 F8 회귀)", async () => {

    const v_0c8987 = await v_bfb240("filler_running@test.com");
    const v_8e2335 = await v_c808bd(v_0c8987, "filler-running");
    const v_062ae9 = await v_4d24a9(v_0c8987, "fillerrunning");
    const { jobId: v_04211c, callbackToken: v_59b4e0 } = await v_a5cf27(v_0c8987, v_8e2335, v_062ae9);
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    await v_a1651b
      .prepare(
        `UPDATE clone_asset_jobs SET status = 'running', updated_at = datetime('now') WHERE id = ?`,
      )
      .bind(v_04211c)
      .run();

    const v_23563e = v_a64c40(v_04211c, v_59b4e0, [
      { data: v_070a47, name: "f0.mp4" },
      { data: v_070a47, name: "f1.mp4" },
      { data: v_070a47, name: "f2.mp4" },
    ]);
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_7169b4()}` },
      body: v_23563e,
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = await v_8f00b9.json<{ ok: boolean; idempotent?: boolean; filler_video_urls?: string[] }>();
    v_4d37e3(v_4d33b2.ok).toBe(true);
    v_4d37e3(v_4d33b2.idempotent).toBeUndefined(); 
    v_4d37e3(v_4d33b2.filler_video_urls).toHaveLength(3);

    const v_d5e460 = await v_a1651b
      .prepare(`SELECT status FROM clone_asset_jobs WHERE id = ?`)
      .bind(v_04211c)
      .first<{ status: string }>();
    v_4d37e3(v_d5e460!.status).toBe("done");
  });

  v_23805a("pending 잡(202 반영 전 콜백 race) → 정상 처리 done", async () => {
    const v_0c8987 = await v_bfb240("filler_pending@test.com");
    const v_8e2335 = await v_c808bd(v_0c8987, "filler-pending");
    const v_062ae9 = await v_4d24a9(v_0c8987, "fillerpending");
    const { jobId: v_04211c, callbackToken: v_59b4e0 } = await v_a5cf27(v_0c8987, v_8e2335, v_062ae9);
    await v_fda860(v_04211c);

    const v_23563e = v_a64c40(v_04211c, v_59b4e0, [
      { data: v_070a47, name: "f0.mp4" },
      { data: v_070a47, name: "f1.mp4" },
      { data: v_070a47, name: "f2.mp4" },
    ]);
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_7169b4()}` },
      body: v_23563e,
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = await v_8f00b9.json<{ ok: boolean; idempotent?: boolean }>();
    v_4d37e3(v_4d33b2.ok).toBe(true);
    v_4d37e3(v_4d33b2.idempotent).toBeUndefined();

    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_d5e460 = await v_a1651b
      .prepare(`SELECT status FROM clone_asset_jobs WHERE id = ?`)
      .bind(v_04211c)
      .first<{ status: string }>();
    v_4d37e3(v_d5e460!.status).toBe("done");
  });

  v_23805a("failed 잡 재시도 → 정상 처리(failed→running→done)", async () => {
    const v_0c8987 = await v_bfb240("filler_retry@test.com");
    const v_8e2335 = await v_c808bd(v_0c8987, "filler-retry");
    const v_062ae9 = await v_4d24a9(v_0c8987, "fillerretry");
    const { jobId: v_04211c, callbackToken: v_59b4e0 } = await v_a5cf27(v_0c8987, v_8e2335, v_062ae9);

    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    await v_a1651b
      .prepare(
        `UPDATE clone_asset_jobs SET status = 'failed', error = 'prev error', updated_at = datetime('now') WHERE id = ?`,
      )
      .bind(v_04211c)
      .run();

    const v_23563e = v_a64c40(v_04211c, v_59b4e0, [
      { data: v_070a47, name: "f0.mp4" },
      { data: v_070a47, name: "f1.mp4" },
      { data: v_070a47, name: "f2.mp4" },
    ]);
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_7169b4()}` },
      body: v_23563e,
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = await v_8f00b9.json<{ ok: boolean; idempotent?: boolean; filler_video_urls?: string[] }>();
    v_4d37e3(v_4d33b2.ok).toBe(true);
    v_4d37e3(v_4d33b2.idempotent).toBeUndefined(); 

    const v_d5e460 = await v_a1651b
      .prepare(`SELECT status FROM clone_asset_jobs WHERE id = ?`)
      .bind(v_04211c)
      .first<{ status: string }>();
    v_4d37e3(v_d5e460!.status).toBe("done");

    const v_1de203 = await v_a1651b
      .prepare(`SELECT filler_video_urls FROM clones WHERE id = ?`)
      .bind(v_062ae9)
      .first<{ filler_video_urls: string | null }>();
    v_4d37e3(v_1de203!.filler_video_urls).not.toBeNull();
  });

  v_23805a("failed 재시도 성공 후 files 행이 정확히 3개 (고아 누적 없음)", async () => {
    const v_0c8987 = await v_bfb240("filler_orphan@test.com");
    const v_8e2335 = await v_c808bd(v_0c8987, "filler-orphan");
    const v_062ae9 = await v_4d24a9(v_0c8987, "fillerorphan");
    const { jobId: v_04211c, callbackToken: v_59b4e0 } = await v_a5cf27(v_0c8987, v_8e2335, v_062ae9);
    const v_a1651b = v_c9c489.DB as unknown as D1Database;

    await v_a1651b
      .prepare(
        `UPDATE clone_asset_jobs SET status = 'failed', error = 'prev', updated_at = datetime('now') WHERE id = ?`,
      )
      .bind(v_04211c)
      .run();

    const v_23563e = v_a64c40(v_04211c, v_59b4e0, [
      { data: v_070a47, name: "f0.mp4" },
      { data: v_070a47, name: "f1.mp4" },
      { data: v_070a47, name: "f2.mp4" },
    ]);
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_7169b4()}` },
      body: v_23563e,
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = await v_8f00b9.json<{ ok: boolean; idempotent?: boolean }>();
    v_4d37e3(v_4d33b2.ok).toBe(true);
    v_4d37e3(v_4d33b2.idempotent).toBeUndefined(); 

    const v_904217 = await v_a1651b
      .prepare(
        `SELECT COUNT(*) as cnt FROM files WHERE purpose = 'asset_filler' AND owner_user_id = ?`,
      )
      .bind(v_0c8987)
      .first<{ cnt: number }>();
    v_4d37e3(v_904217!.cnt).toBe(3);
  });
});

v_469bf2("기존 /oth-path 회귀", () => {
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

  v_23805a("asset-job-done: callback_token 불일치 여전히 403", async () => {
    const v_0c8987 = await v_bfb240("filler_reg_403@test.com");
    const v_8e2335 = await v_c808bd(v_0c8987, "filler-reg-403");

    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_04211c = crypto.randomUUID();
    const v_f1f596 = crypto.randomUUID();
    await v_a1651b
      .prepare(
        `INSERT INTO clone_asset_jobs (id, user_id, kind, src_file_id, status, callback_token)
         VALUES (?, ?, 'idle_video', ?, 'pending', ?)`,
      )
      .bind(v_04211c, v_0c8987, v_8e2335, v_f1f596)
      .run();

    const v_23563e = new FormData();
    v_23563e.append("job_id", v_04211c);
    v_23563e.append("status", "done");
    v_23563e.append("callback_token", "wrong-token");
    v_23563e.append("file", new Blob([v_070a47], { type: "video/mp4" }), "out.mp4");
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_7169b4()}` },
      body: v_23563e,
    });
    v_4d37e3(v_8f00b9.status).toBe(403);
  });
});

v_469bf2("finalizeFillerJob — 겹친 중복 콜백 CAS (el BLOCKER)", () => {
  v_23805a("잡이 이미 done 이면 null 반환 + files 행 롤백 + clones 미덮어쓰기", async () => {
    const v_0c8987 = await v_bfb240("filler_cas@test.com");
    const v_8e2335 = await v_c808bd(v_0c8987, "filler-cas");
    const v_062ae9 = await v_4d24a9(v_0c8987, "fillercas");
    const { jobId: v_04211c } = await v_a5cf27(v_0c8987, v_8e2335, v_062ae9);
    const v_a1651b = v_c9c489.DB as unknown as D1Database;

    await v_a1651b
      .prepare(
        `UPDATE clone_asset_jobs SET status='done', out_url='["winner"]', updated_at=datetime('now') WHERE id = ?`,
      )
      .bind(v_04211c)
      .run();
    await v_a1651b
      .prepare(`UPDATE clones SET filler_video_urls='["winner"]' WHERE id = ?`)
      .bind(v_062ae9)
      .run();
    const v_2cd5bc = await v_a1651b
      .prepare(`SELECT COUNT(*) AS n FROM files WHERE purpose='asset_filler'`)
      .first<{ n: number }>();

    const v_8d4337 = await v_c12e45(
      v_a1651b,
      v_04211c,
      [
        { r2Key: "assets/filler/loser0.mp4", sizeBytes: 3 },
        { r2Key: "assets/filler/loser1.mp4", sizeBytes: 3 },
        { r2Key: "assets/filler/loser2.mp4", sizeBytes: 3 },
      ],
      v_0c8987,
      v_062ae9,
      "http://localhost",
    );
    v_4d37e3(v_8d4337).toBeNull();

    const v_49b364 = await v_a1651b
      .prepare(`SELECT COUNT(*) AS n FROM files WHERE purpose='asset_filler'`)
      .first<{ n: number }>();
    v_4d37e3(v_49b364!.n).toBe(v_2cd5bc!.n);

    const v_d5e460 = await v_a1651b
      .prepare(`SELECT status, out_url FROM clone_asset_jobs WHERE id = ?`)
      .bind(v_04211c)
      .first<{ status: string; out_url: string }>();
    v_4d37e3(v_d5e460!.status).toBe("done");
    v_4d37e3(v_d5e460!.out_url).toBe('["winner"]');
    const v_1de203 = await v_a1651b
      .prepare(`SELECT filler_video_urls FROM clones WHERE id = ?`)
      .bind(v_062ae9)
      .first<{ filler_video_urls: string }>();
    v_4d37e3(v_1de203!.filler_video_urls).toBe('["winner"]');
  });
});
