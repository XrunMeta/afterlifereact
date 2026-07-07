

import { v_469bf2, v_23805a, v_4d37e3, v_ba7107, v_719203 } from "xualxe";
import { v_1df298, v_c9c489, v_8fd90d } from "lwkoweqmjbnvjqw";
import type { v_273a0c } from "../src/lib/env";

const v_9542f7 = v_c9c489 as unknown as v_273a0c;
const v_7169b4 = v_9542f7.DEV_SECRET;
const v_8fe3be = "http://orchestrator.test";

async function v_bfb240(v_e0c7e8): Promise<number> {
  const v_a1651b = v_9542f7.DB;
  await v_a1651b
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(v_e0c7e8)
    .run();
  return (await v_a1651b.prepare(`SELECT id FROM users WHERE email = ?`).bind(v_e0c7e8).first<{ id: number }>())!.id;
}

async function v_c808bd(v_1badb6, v_ae8e76): Promise<number> {
  const v_a1651b = v_9542f7.DB;
  const v_b24339 = `uploadedfiles/guidebackfill-${v_ae8e76}.bin`;
  const v_cb35cb = await v_a1651b
    .prepare(
      `INSERT INTO files (r2_key, content_type, size_bytes, owner_user_id, purpose)
       VALUES (?, 'application/octet-stream', 1, ?, 'clone_avatar') RETURNING id`,
    )
    .bind(v_b24339, v_1badb6)
    .first<{ id: number }>();
  return v_cb35cb!.id;
}

async function v_4d24a9(v_1badb6, v_556427, v_fa8b40 = null): Promise<number> {
  const v_a1651b = v_9542f7.DB;
  const v_cb35cb = await v_a1651b
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, guide_video_urls)
       VALUES (?, ?, ?, 'friend', 'public', ?) RETURNING id`,
    )
    .bind(v_1badb6, "백필테스트클론", v_556427, v_fa8b40)
    .first<{ id: number }>();
  return v_cb35cb!.id;
}

async function v_1d8d31(
  v_1badb6,
  v_6e0fd3,
  v_94302c,
  v_433c46,
  v_d308b5 = "done",
): Promise<string> {
  const v_a1651b = v_9542f7.DB;
  const v_389afb = crypto.randomUUID();
  await v_a1651b
    .prepare(
      `INSERT INTO clone_asset_jobs (id, user_id, kind, src_file_id, status, clone_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(v_389afb, v_1badb6, v_94302c, v_433c46, v_d308b5, v_6e0fd3)
    .run();
  return v_389afb;
}

const v_d7f9fe = (v_ea333d) =>
  v_1df298.fetch("https://x/oth-path", {
    headers: v_ea333d ? { Authorization: `Bearer ${v_ea333d}` } : {},
  });

const v_cd506e = (v_6e0fd3, v_ea333d) =>
  v_1df298.fetch(`https://x/oth-path${v_6e0fd3}/guide-job`, {
    method: "POST",
    headers: v_ea333d ? { Authorization: `Bearer ${v_ea333d}` } : {},
  });

v_ba7107(() => {
  v_8fd90d.activate();
  v_8fd90d.disableNetConnect();
});
v_719203(() => v_8fd90d.assertNoPendingInterceptors());

v_469bf2("GET /oth-path", () => {
  v_23805a("시크릿 없음/불일치 → 401", async () => {
    v_4d37e3((await v_d7f9fe()).status).toBe(401);
    v_4d37e3((await v_d7f9fe("wrong")).status).toBe(401);
  });

  v_23805a("guide_video_urls NULL + idle_video·voice_clone done 잡 둘 다 있는 클론만 반환", async () => {
    const v_0c8987 = await v_bfb240(`backfill_targets_${Date.now()}@test.com`);
    const v_97745e = await v_c808bd(v_0c8987, "targets-img");
    const v_296cc7 = await v_c808bd(v_0c8987, "targets-wav");

    const v_21a7ca = await v_4d24a9(v_0c8987, `bftarget-ok-${Date.now()}`, null);
    await v_1d8d31(v_0c8987, v_21a7ca, "idle_video", v_97745e, "done");
    await v_1d8d31(v_0c8987, v_21a7ca, "voice_clone", v_296cc7, "done");

    const v_bb87b0 = await v_4d24a9(v_0c8987, `bftarget-hasguide-${Date.now()}`, '["u"]');
    await v_1d8d31(v_0c8987, v_bb87b0, "idle_video", v_97745e, "done");
    await v_1d8d31(v_0c8987, v_bb87b0, "voice_clone", v_296cc7, "done");

    const v_f47eba = await v_4d24a9(v_0c8987, `bftarget-novoice-${Date.now()}`, null);
    await v_1d8d31(v_0c8987, v_f47eba, "idle_video", v_97745e, "done");

    const v_830d0a = await v_4d24a9(v_0c8987, `bftarget-pending-${Date.now()}`, null);
    await v_1d8d31(v_0c8987, v_830d0a, "idle_video", v_97745e, "done");
    await v_1d8d31(v_0c8987, v_830d0a, "voice_clone", v_296cc7, "pending");

    const v_8f00b9 = await v_d7f9fe(v_7169b4);
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = await v_8f00b9.json<{ data: Array<{ id: number; user_id: number; face_src_file_id: number; voice_src_file_id: number }> }>();
    const v_52e08b = v_4d33b2.data.map((v_d5dda0) => v_d5dda0.id);
    v_4d37e3(v_52e08b).toContain(v_21a7ca);
    v_4d37e3(v_52e08b).not.toContain(v_bb87b0);
    v_4d37e3(v_52e08b).not.toContain(v_f47eba);
    v_4d37e3(v_52e08b).not.toContain(v_830d0a);

    const v_5f5d6d = v_4d33b2.data.find((v_d5dda0) => v_d5dda0.id === v_21a7ca)!;
    v_4d37e3(v_5f5d6d.user_id).toBe(v_0c8987);
    v_4d37e3(v_5f5d6d.face_src_file_id).toBe(v_97745e);
    v_4d37e3(v_5f5d6d.voice_src_file_id).toBe(v_296cc7);
  });
});

v_469bf2("POST /oth-path", () => {
  v_23805a("시크릿 없음/불일치 → 401", async () => {
    v_4d37e3((await v_cd506e(1)).status).toBe(401);
    v_4d37e3((await v_cd506e(1, "wrong")).status).toBe(401);
  });

  v_23805a("clone 없음 → 404", async () => {
    const v_8f00b9 = await v_cd506e(999999999, v_7169b4);
    v_4d37e3(v_8f00b9.status).toBe(404);
  });

  v_23805a("idle_video/voice_clone done 잡 존재 → guide 잡 트리거·201·orchestrator 중계", async () => {
    const v_0c8987 = await v_bfb240(`backfill_trigger_${Date.now()}@test.com`);
    const v_97745e = await v_c808bd(v_0c8987, "trigger-img");
    const v_296cc7 = await v_c808bd(v_0c8987, "trigger-wav");
    const v_6e0fd3 = await v_4d24a9(v_0c8987, `bftrigger-${Date.now()}`, null);
    await v_1d8d31(v_0c8987, v_6e0fd3, "idle_video", v_97745e, "done");
    await v_1d8d31(v_0c8987, v_6e0fd3, "voice_clone", v_296cc7, "done");

    v_8fd90d
      .get(v_8fe3be)
      .intercept({ path: "/oth-path", method: "POST" })
      .reply(() => ({ statusCode: 202, data: { ok: true } }));

    const v_8f00b9 = await v_cd506e(v_6e0fd3, v_7169b4);
    v_4d37e3(v_8f00b9.status).toBe(201);
    const v_4d33b2 = await v_8f00b9.json<{ guideJobId: string }>();
    v_4d37e3(v_4d33b2.guideJobId).toBeTruthy();

    const v_d5ec97 = await v_9542f7.DB
      .prepare(`SELECT kind, src_file_id, clone_id, status FROM clone_asset_jobs WHERE id = ?`)
      .bind(v_4d33b2.guideJobId)
      .first<{ kind: string; src_file_id: number; clone_id: number; status: string }>();
    v_4d37e3(v_d5ec97).toBeTruthy();
    v_4d37e3(v_d5ec97!.kind).toBe("guide");
    v_4d37e3(v_d5ec97!.src_file_id).toBe(v_97745e);
    v_4d37e3(v_d5ec97!.clone_id).toBe(v_6e0fd3);
    v_4d37e3(v_d5ec97!.status).toBe("running");
  });

  v_23805a("voice_clone done 잡 없음 → 400", async () => {
    const v_0c8987 = await v_bfb240(`backfill_novoice_${Date.now()}@test.com`);
    const v_97745e = await v_c808bd(v_0c8987, "novoice-img");
    const v_6e0fd3 = await v_4d24a9(v_0c8987, `bfnovoice-${Date.now()}`, null);
    await v_1d8d31(v_0c8987, v_6e0fd3, "idle_video", v_97745e, "done");

    const v_8f00b9 = await v_cd506e(v_6e0fd3, v_7169b4);
    v_4d37e3(v_8f00b9.status).toBe(400);
  });

  v_23805a("이미 guide_video_urls 있음(재실행) → 200 skip, 잡 재생성 없음", async () => {
    const v_0c8987 = await v_bfb240(`backfill_idem_${Date.now()}@test.com`);
    const v_97745e = await v_c808bd(v_0c8987, "idem-img");
    const v_296cc7 = await v_c808bd(v_0c8987, "idem-wav");
    const v_6e0fd3 = await v_4d24a9(v_0c8987, `bfidem-${Date.now()}`, '["https://x/existing.mp4"]');
    await v_1d8d31(v_0c8987, v_6e0fd3, "idle_video", v_97745e, "done");
    await v_1d8d31(v_0c8987, v_6e0fd3, "voice_clone", v_296cc7, "done");

    const v_8f00b9 = await v_cd506e(v_6e0fd3, v_7169b4);
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = await v_8f00b9.json<{ skipped: boolean }>();
    v_4d37e3(v_4d33b2.skipped).toBe(true);

    const v_9e8c70 = await v_9542f7.DB
      .prepare(`SELECT COUNT(*) AS n FROM clone_asset_jobs WHERE clone_id = ? AND kind = 'guide'`)
      .bind(v_6e0fd3)
      .first<{ n: number }>();
    v_4d37e3(v_9e8c70!.n).toBe(0);
  });
});
