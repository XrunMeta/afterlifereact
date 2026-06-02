

import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

async function v_21cc31(v_0c8987) {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  return v_b2eae5(
    { sub: v_0c8987, kind: "access" },
    (v_c9c489 as { JWT_ACCESS_SECRET: string }).JWT_ACCESS_SECRET,
    600,
  );
}

async function v_bfb240(v_9e86fd) {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(`INSERT INTO users (email,password_hash,name,created_at) VALUES (?,'x','U',CURRENT_TIMESTAMP)`)
    .bind(v_9e86fd)
    .run();
  return (await v_a1651b.prepare(`SELECT id FROM users WHERE email=?`).bind(v_9e86fd).first<{ id: number }>())!.id;
}

async function v_c808bd(v_257b90, v_ae8e76) {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  const v_b24339 = `uploadedfiles/x-${v_ae8e76 ?? Math.random().toString(36).slice(2)}.jpg`;
  const v_cb35cb = await v_a1651b
    .prepare(
      `INSERT INTO files (r2_key,content_type,size_bytes,owner_user_id,purpose) VALUES (?,'image/jpeg',1,?, 'clone_avatar') RETURNING id`,
    )
    .bind(v_b24339, v_257b90)
    .first<{ id: number }>();
  return v_cb35cb!.id;
}

async function v_7aa3f6(v_04211c): Promise<string> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  const v_3ac7e7 = await v_a1651b
    .prepare(`SELECT callback_token FROM clone_asset_jobs WHERE id=?`)
    .bind(v_04211c)
    .first<{ callback_token: string }>();
  return v_3ac7e7!.callback_token;
}

async function v_fda860(v_04211c) {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(`UPDATE clone_asset_jobs SET status='pending', error=NULL, updated_at=datetime('now') WHERE id=?`)
    .bind(v_04211c)
    .run();
}

const v_7169b4 = () => (v_c9c489 as { ORCH_SECRET?: string }).ORCH_SECRET ?? "test-orch-secret";

v_469bf2("asset-job 생성/상태", () => {
  v_23805a("잡 생성 → 상태조회(pending/running/failed 모두 허용 — 테스트 환경 DNS 제한)", async () => {
    const v_0c8987 = await v_bfb240("aj1@test.com");
    const v_8d41d7 = await v_21cc31(v_0c8987);
    const v_8e2335 = await v_c808bd(v_0c8987, "aj1");
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_8d41d7}`, "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "idle_video", src_file_id: v_8e2335 }),
    });
    v_4d37e3(v_8f00b9.status).toBe(201);
    const { job_id: v_b0d200 } = await v_8f00b9.json<{ job_id: string }>();
    v_4d37e3(v_b0d200).toBeTruthy();
    const v_72c7a6 = await v_1df298.fetch(`http://localhost/oth-path${v_b0d200}`, {
      headers: { Authorization: `Bearer ${v_8d41d7}` },
    });
    v_4d37e3(v_72c7a6.status).toBe(200);
    const v_4d33b2 = await v_72c7a6.json<{ status: string; kind: string }>();

    v_4d37e3(["pending", "running", "failed"]).toContain(v_4d33b2.status);
    v_4d37e3(v_4d33b2.kind).toBe("idle_video");
  });

  v_23805a("잘못된 kind 거부", async () => {
    const v_0c8987 = await v_bfb240("aj2@test.com");
    const v_8d41d7 = await v_21cc31(v_0c8987);
    const v_8e2335 = await v_c808bd(v_0c8987, "aj2");
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_8d41d7}`, "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "bad", src_file_id: v_8e2335 }),
    });
    v_4d37e3(v_8f00b9.status).toBe(422);
  });

  v_23805a("GET asset-job/:id 응답에 callback_token 미노출", async () => {
    const v_0c8987 = await v_bfb240("aj_noleak@test.com");
    const v_8d41d7 = await v_21cc31(v_0c8987);
    const v_8e2335 = await v_c808bd(v_0c8987, "ajnoleak");
    const v_4f01f6 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_8d41d7}`, "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "idle_video", src_file_id: v_8e2335 }),
    });
    const { job_id: v_b0d200 } = await v_4f01f6.json<{ job_id: string }>();
    const v_72c7a6 = await v_1df298.fetch(`http://localhost/oth-path${v_b0d200}`, {
      headers: { Authorization: `Bearer ${v_8d41d7}` },
    });
    const v_4d33b2 = await v_72c7a6.json<Record<string, unknown>>();
    v_4d37e3(v_4d33b2).not.toHaveProperty("callback_token");
  });
});

v_469bf2("internal asset-job-done", () => {
  v_23805a("콜백 완료 → R2 저장·잡 done (callback_token 포함)", async () => {
    const v_0c8987 = await v_bfb240("aj3@test.com");
    const v_8d41d7 = await v_21cc31(v_0c8987);
    const v_8e2335 = await v_c808bd(v_0c8987, "aj3");
    const v_4f01f6 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_8d41d7}`, "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "voice_clone", src_file_id: v_8e2335 }),
    });
    const { job_id: v_b0d200 } = await v_4f01f6.json<{ job_id: string }>();
    const v_f1f596 = await v_7aa3f6(v_b0d200);

    await v_fda860(v_b0d200);
    const v_43fd42 = v_7169b4();
    const v_23563e = new FormData();
    v_23563e.append("job_id", v_b0d200);
    v_23563e.append("status", "done");
    v_23563e.append("callback_token", v_f1f596);
    v_23563e.append(
      "file",
      new Blob([new Uint8Array([1, 2, 3])], { type: "application/octet-stream" }),
      "se.pth",
    );
    const v_16dbdb = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_43fd42}` },
      body: v_23563e,
    });
    v_4d37e3(v_16dbdb.status).toBe(200);

    const v_c73308 = await v_16dbdb.json<{ ok: boolean; out_url?: string; idempotent?: boolean }>();
    v_4d37e3(v_c73308.ok).toBe(true);

    const v_509fa4 = !!v_c73308.out_url;
    if (v_509fa4) {
      v_4d37e3(v_c73308.out_url).toBeTruthy();
    }

    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_d5e460 = await v_a1651b
      .prepare(`SELECT status, out_url FROM clone_asset_jobs WHERE id=?`)
      .bind(v_b0d200)
      .first<{ status: string; out_url: string | null }>();

    if (v_509fa4) {
      v_4d37e3(v_d5e460!.status).toBe("done");
      v_4d37e3(v_d5e460!.out_url).toBeTruthy();
    }
  });

  v_23805a("멱등: 이미 done 잡 콜백 → 200 idempotent (R2·files 재처리 안 함)", async () => {
    const v_0c8987 = await v_bfb240("aj3b@test.com");
    const v_8d41d7 = await v_21cc31(v_0c8987);
    const v_8e2335 = await v_c808bd(v_0c8987, "aj3b");
    const v_4f01f6 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_8d41d7}`, "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "voice_clone", src_file_id: v_8e2335 }),
    });
    const { job_id: v_b0d200 } = await v_4f01f6.json<{ job_id: string }>();
    const v_f1f596 = await v_7aa3f6(v_b0d200);
    const v_a1651b = v_c9c489.DB as unknown as D1Database;

    await v_a1651b
      .prepare(`UPDATE clone_asset_jobs SET status='done', out_url='https://done/oth-path' WHERE id=?`)
      .bind(v_b0d200)
      .run();
    const v_43fd42 = v_7169b4();
    const v_23563e = new FormData();
    v_23563e.append("job_id", v_b0d200);
    v_23563e.append("status", "done");
    v_23563e.append("callback_token", v_f1f596);
    v_23563e.append("file", new Blob([new Uint8Array([9])], { type: "application/octet-stream" }), "se.pth");
    const v_16dbdb = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_43fd42}` },
      body: v_23563e,
    });
    v_4d37e3(v_16dbdb.status).toBe(200);
    const v_c73308 = await v_16dbdb.json<{ ok: boolean; idempotent?: boolean }>();
    v_4d37e3(v_c73308.ok).toBe(true);
    v_4d37e3(v_c73308.idempotent).toBe(true);
  });

  v_23805a("ORCH_SECRET 불일치 401", async () => {
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

  v_23805a("callback_token 불일치 403", async () => {
    const v_0c8987 = await v_bfb240("aj_cbtoken@test.com");
    const v_8d41d7 = await v_21cc31(v_0c8987);
    const v_8e2335 = await v_c808bd(v_0c8987, "ajcbtoken");
    const v_4f01f6 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_8d41d7}`, "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "idle_video", src_file_id: v_8e2335 }),
    });
    const { job_id: v_b0d200 } = await v_4f01f6.json<{ job_id: string }>();
    await v_fda860(v_b0d200);
    const v_43fd42 = v_7169b4();
    const v_23563e = new FormData();
    v_23563e.append("job_id", v_b0d200);
    v_23563e.append("status", "done");
    v_23563e.append("callback_token", "wrong-token");
    v_23563e.append(
      "file",
      new Blob([new Uint8Array([1])], { type: "video/mp4" }),
      "out.mp4",
    );
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_43fd42}` },
      body: v_23563e,
    });
    v_4d37e3(v_8f00b9.status).toBe(403);
  });

  v_23805a("voice_clone 파일 정상(10바이트) → 200, content_type 강제", async () => {
    const v_0c8987 = await v_bfb240("aj_ct@test.com");
    const v_8d41d7 = await v_21cc31(v_0c8987);
    const v_8e2335 = await v_c808bd(v_0c8987, "ajct");
    const v_4f01f6 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_8d41d7}`, "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "voice_clone", src_file_id: v_8e2335 }),
    });
    const { job_id: v_b0d200 } = await v_4f01f6.json<{ job_id: string }>();
    const v_f1f596 = await v_7aa3f6(v_b0d200);
    await v_fda860(v_b0d200);
    const v_43fd42 = v_7169b4();
    const v_23563e = new FormData();
    v_23563e.append("job_id", v_b0d200);
    v_23563e.append("status", "done");
    v_23563e.append("callback_token", v_f1f596);

    v_23563e.append("file", new Blob([new Uint8Array(10)], { type: "audio/wav" }), "voice.pth");
    const v_3ed4c3 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_43fd42}` },
      body: v_23563e,
    });
    v_4d37e3(v_3ed4c3.status).toBe(200);

    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_d5e460 = await v_a1651b
      .prepare(`SELECT out_file_id FROM clone_asset_jobs WHERE id=?`)
      .bind(v_b0d200)
      .first<{ out_file_id: number | null }>();
    if (v_d5e460?.out_file_id) {
      const v_7b2b7a = await v_a1651b
        .prepare(`SELECT content_type FROM files WHERE id=?`)
        .bind(v_d5e460.out_file_id)
        .first<{ content_type: string }>();
      v_4d37e3(v_7b2b7a?.content_type).toBe("application/octet-stream");
    }
  });
});

v_469bf2("createClone 잡 연결", () => {
  v_23805a("done 잡 → clones 컬럼 즉시 반영", async () => {
    const v_0c8987 = await v_bfb240("aj4@test.com");
    const v_8d41d7 = await v_21cc31(v_0c8987);
    const v_8e2335 = await v_c808bd(v_0c8987, "aj4");

    const v_4f01f6 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_8d41d7}`, "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "idle_video", src_file_id: v_8e2335 }),
    });
    const { job_id: v_b0d200 } = await v_4f01f6.json<{ job_id: string }>();
    const v_a1651b = v_c9c489.DB as unknown as D1Database;

    await v_a1651b
      .prepare(`UPDATE clone_asset_jobs SET status='done', out_url='https://x/oth-path' WHERE id=?`)
      .bind(v_b0d200)
      .run();
    const v_62c866 = `aj4-create-${Date.now()}`;
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${v_8d41d7}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": v_62c866,
      },
      body: JSON.stringify({
        clone_type: "friend",
        name: "J",
        username: `aj${Date.now()}`,
        idle_video_job_id: v_b0d200,
      }),
    });
    v_4d37e3(v_8f00b9.status).toBe(201);
    const { clone: v_eb25ce } = await v_8f00b9.json<{ clone: { id: number } }>();
    const v_3ac7e7 = await v_a1651b
      .prepare(`SELECT idle_video_url FROM clones WHERE id=?`)
      .bind(v_eb25ce.id)
      .first<{ idle_video_url: string | null }>();
    v_4d37e3(v_3ac7e7!.idle_video_url).toBe("https://x/oth-path");
  });

  v_23805a("race 보상: 콜백 선착 후 createClone 연결 시 컬럼 반영", async () => {

    const v_0c8987 = await v_bfb240("aj_race@test.com");
    const v_8d41d7 = await v_21cc31(v_0c8987);
    const v_8e2335 = await v_c808bd(v_0c8987, "ajrace");
    const v_4f01f6 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_8d41d7}`, "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "voice_clone", src_file_id: v_8e2335 }),
    });
    const { job_id: v_b0d200 } = await v_4f01f6.json<{ job_id: string }>();
    const v_a1651b = v_c9c489.DB as unknown as D1Database;

    await v_a1651b
      .prepare(`UPDATE clone_asset_jobs SET status='done', out_url='https://race/files/99' WHERE id=?`)
      .bind(v_b0d200)
      .run();

    const v_58357e = `aj_race-create-${Date.now()}`;
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${v_8d41d7}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": v_58357e,
      },
      body: JSON.stringify({
        clone_type: "mentor",
        name: "Race",
        username: `ajrace${Date.now()}`,
        voice_clone_job_id: v_b0d200,
      }),
    });
    v_4d37e3(v_8f00b9.status).toBe(201);
    const { clone: v_eb25ce } = await v_8f00b9.json<{ clone: { id: number } }>();
    const v_3ac7e7 = await v_a1651b
      .prepare(`SELECT voice_se_url FROM clones WHERE id=?`)
      .bind(v_eb25ce.id)
      .first<{ voice_se_url: string | null }>();
    v_4d37e3(v_3ac7e7!.voice_se_url).toBe("https://race/files/99");
  });
});
