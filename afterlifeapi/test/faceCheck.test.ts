import { v_1df298, v_c9c489, v_8fd90d } from "lwkoweqmjbnvjqw";
import { v_ba7107, v_719203, v_469bf2, v_4d37e3, v_23805a } from "xualxe";

const v_ff7e4d = "http://prethird.test";

async function v_2c6218(v_0c8987): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return await v_b2eae5({ sub: v_0c8987, kind: "access" }, v_43fd42, 600);
}

async function v_c808bd(v_43e90c, v_433c46, v_fa63e0 = "clone_avatar") {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(
      "INSERT OR IGNORE INTO users (id,email,password_hash,name,created_at) VALUES (?,?,'x','U',CURRENT_TIMESTAMP)",
    )
    .bind(v_43e90c, `u${v_43e90c}@test`)
    .run();
  await v_a1651b
    .prepare(
      "INSERT OR IGNORE INTO files (id, r2_key, content_type, size_bytes, owner_user_id, purpose) VALUES (?,?,?,?,?,?)",
    )
    .bind(v_433c46, `k${v_433c46}`, "image/jpeg", 50000, v_43e90c, v_fa63e0)
    .run();
  await v_b96973().put(`k${v_433c46}`, new Uint8Array([1, 2, 3]));
}

const v_b96973 = () => (v_c9c489 as unknown as { R2_ARCHIVE: R2Bucket }).R2_ARCHIVE;

async function v_7b2b7a(v_433c46) {
  return (v_c9c489.DB as unknown as D1Database).prepare("SELECT id FROM files WHERE id = ?").bind(v_433c46).first();
}

async function v_20902a(v_433c46): Promise<{ row: unknown; obj: unknown }> {
  for (let v_ebec57 = 0; v_ebec57 < 40; v_ebec57++) {
    const v_3ac7e7 = await v_7b2b7a(v_433c46);
    const v_8839e3 = await v_b96973().head(`k${v_433c46}`);
    if (!v_3ac7e7 && !v_8839e3) return { row: v_3ac7e7, obj: v_8839e3 };
    await new Promise((v_cb35cb) => setTimeout(v_cb35cb, 50));
  }
  return { row: await v_7b2b7a(v_433c46), obj: await v_b96973().head(`k${v_433c46}`) };
}

function v_4f438a(v_ea333d, v_4d33b2) {
  return v_1df298.fetch("http://localhost/oth-path", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(v_ea333d ? { Authorization: `Bearer ${v_ea333d}` } : {}),
    },
    body: JSON.stringify(v_4d33b2),
  });
}

function v_1a2a5d() {
  return v_8fd90d
    .get(v_ff7e4d)
    .intercept({ path: "/prethird/face-check", method: "POST" });
}

v_ba7107(() => {
  v_8fd90d.activate();
  v_8fd90d.disableNetConnect();
});
v_719203(() => v_8fd90d.assertNoPendingInterceptors());

v_469bf2("POST /oth-path", () => {
  v_23805a("401 토큰 없음", async () => {
    v_4d37e3((await v_4f438a(null, { src_file_id: 1 })).status).toBe(401);
  });

  v_23805a("422 src_file_id 누락", async () => {
    const v_8f00b9 = await v_4f438a(await v_2c6218(2001), {});
    v_4d37e3(v_8f00b9.status).toBe(422); 
  });

  v_23805a("404 타인 소유 파일 (prethird 미호출)", async () => {
    await v_c808bd(2002, 6002);
    await v_c808bd(2999, 6999);
    const v_8f00b9 = await v_4f438a(await v_2c6218(2999), { src_file_id: 6002 });
    v_4d37e3(v_8f00b9.status).toBe(404);
  });

  v_23805a("ok:true 중계", async () => {
    await v_c808bd(2003, 6003);
    v_1a2a5d().reply(200, { ok: true });
    const v_8f00b9 = await v_4f438a(await v_2c6218(2003), { src_file_id: 6003 });
    v_4d37e3(v_8f00b9.status).toBe(200);
    v_4d37e3(await v_8f00b9.json()).toEqual({ ok: true });
  });

  v_23805a("NO_FACE 중계", async () => {
    await v_c808bd(2004, 6004);
    v_1a2a5d().reply(200, { ok: false, reason: "NO_FACE" });
    const v_8f00b9 = await v_4f438a(await v_2c6218(2004), { src_file_id: 6004 });
    v_4d37e3(await v_8f00b9.json()).toEqual({ ok: false, reason: "NO_FACE" });
  });

  v_23805a("prethird 500 -> CHECK_FAILED", async () => {
    await v_c808bd(2005, 6005);
    v_1a2a5d().reply(500, { error: "x" });
    const v_8f00b9 = await v_4f438a(await v_2c6218(2005), { src_file_id: 6005 });
    v_4d37e3(await v_8f00b9.json()).toEqual({ ok: false, reason: "CHECK_FAILED" });
  });

  v_23805a("응답 형식 이상 -> CHECK_FAILED", async () => {
    await v_c808bd(2006, 6006);
    v_1a2a5d().reply(200, { ok: "yes" });
    const v_8f00b9 = await v_4f438a(await v_2c6218(2006), { src_file_id: 6006 });
    v_4d37e3(await v_8f00b9.json()).toEqual({ ok: false, reason: "CHECK_FAILED" });
  });

  v_23805a("알 수 없는 reason -> CHECK_FAILED", async () => {
    await v_c808bd(2008, 6008);
    v_1a2a5d().reply(200, { ok: false, reason: "WHATEVER" });
    const v_8f00b9 = await v_4f438a(await v_2c6218(2008), { src_file_id: 6008 });
    v_4d37e3(await v_8f00b9.json()).toEqual({ ok: false, reason: "CHECK_FAILED" });
  });

  v_23805a("env 없음 -> CHECK_FAILED", async () => {
    await v_c808bd(2007, 6007);
    const v_9e86fd = v_c9c489 as { PRETHIRD_PUBLIC_BASE?: string; PREBUILD_SECRET?: string };
    const v_39de0e = { b: v_9e86fd.PRETHIRD_PUBLIC_BASE, s: v_9e86fd.PREBUILD_SECRET };
    v_9e86fd.PRETHIRD_PUBLIC_BASE = undefined;
    v_9e86fd.PREBUILD_SECRET = undefined;
    try {
      const v_8f00b9 = await v_4f438a(await v_2c6218(2007), { src_file_id: 6007 });
      v_4d37e3(await v_8f00b9.json()).toEqual({ ok: false, reason: "CHECK_FAILED" });
    } finally {
      v_9e86fd.PRETHIRD_PUBLIC_BASE = v_39de0e.b;
      v_9e86fd.PREBUILD_SECRET = v_39de0e.s;
    }
  });

  v_23805a("ok:true 후 검사 파일(R2·files 행) 삭제", async () => {
    await v_c808bd(2101, 6101);
    v_1a2a5d().reply(200, { ok: true });
    const v_8f00b9 = await v_4f438a(await v_2c6218(2101), { src_file_id: 6101 });
    v_4d37e3(await v_8f00b9.json()).toEqual({ ok: true });
    v_4d37e3(await v_20902a(6101)).toEqual({ row: null, obj: null });
  });

  v_23805a("NO_FACE 후에도 삭제", async () => {
    await v_c808bd(2102, 6102);
    v_1a2a5d().reply(200, { ok: false, reason: "NO_FACE" });
    await v_4f438a(await v_2c6218(2102), { src_file_id: 6102 });
    v_4d37e3(await v_20902a(6102)).toEqual({ row: null, obj: null });
  });

  v_23805a("prethird 500 후에도 삭제", async () => {
    await v_c808bd(2103, 6103);
    v_1a2a5d().reply(500, { error: "x" });
    const v_8f00b9 = await v_4f438a(await v_2c6218(2103), { src_file_id: 6103 });
    v_4d37e3(await v_8f00b9.json()).toEqual({ ok: false, reason: "CHECK_FAILED" });
    v_4d37e3(await v_20902a(6103)).toEqual({ row: null, obj: null });
  });

  v_23805a("prethird 연결 예외 후에도 삭제", async () => {
    await v_c808bd(2104, 6104);
    v_1a2a5d().replyWithError(new Error("boom"));
    const v_8f00b9 = await v_4f438a(await v_2c6218(2104), { src_file_id: 6104 });
    v_4d37e3(await v_8f00b9.json()).toEqual({ ok: false, reason: "CHECK_FAILED" });
    v_4d37e3(await v_20902a(6104)).toEqual({ row: null, obj: null });
  });

  v_23805a("purpose 가 clone_avatar 가 아니면 지우지 않는다", async () => {
    await v_c808bd(2105, 6105, "voice_sample");
    v_1a2a5d().reply(200, { ok: true });
    const v_8f00b9 = await v_4f438a(await v_2c6218(2105), { src_file_id: 6105 });
    v_4d37e3(await v_8f00b9.json()).toEqual({ ok: true });
    await new Promise((v_cb35cb) => setTimeout(v_cb35cb, 300));
    v_4d37e3(await v_7b2b7a(6105)).not.toBeNull();
    v_4d37e3(await v_b96973().head("k6105")).not.toBeNull();
  });

  v_23805a("다른 기록이 붙잡은 파일(행 삭제 거부)은 R2 도 지우지 않는다", async () => {
    await v_c808bd(2106, 6106);
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    await v_a1651b
      .prepare(
        "INSERT INTO clone_asset_jobs (id, user_id, kind, src_file_id, status) VALUES ('j6106', 2106, 'idle_video', 6106, 'pending')",
      )
      .run();
    v_1a2a5d().reply(200, { ok: true });
    const v_8f00b9 = await v_4f438a(await v_2c6218(2106), { src_file_id: 6106 });
    v_4d37e3(await v_8f00b9.json()).toEqual({ ok: true });
    await new Promise((v_cb35cb) => setTimeout(v_cb35cb, 300));
    v_4d37e3(await v_7b2b7a(6106)).not.toBeNull();
    v_4d37e3(await v_b96973().head("k6106")).not.toBeNull();
  });

  v_23805a("11번째 요청은 429", async () => {
    const v_ea333d = await v_2c6218(2201);
    const v_6460d1 = [];
    for (let v_ebec57 = 0; v_ebec57 < 11; v_ebec57++) v_6460d1.push((await v_4f438a(v_ea333d, {})).status);
    v_4d37e3(v_6460d1.slice(0, 10)).toEqual(Array(10).fill(422));
    v_4d37e3(v_6460d1[10]).toBe(429);
  });
});
