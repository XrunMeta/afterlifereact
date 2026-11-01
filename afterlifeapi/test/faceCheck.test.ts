import { v_1df298, v_c9c489, v_8fd90d } from "lwkoweqmjbnvjqw";
import { v_ba7107, v_719203, v_469bf2, v_4d37e3, v_23805a } from "xualxe";

const v_ff7e4d = "http://prethird.test";

async function v_2c6218(v_0c8987): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return await v_b2eae5({ sub: v_0c8987, kind: "access" }, v_43fd42, 600);
}

async function v_c808bd(v_43e90c, v_433c46) {
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
    .bind(v_433c46, `k${v_433c46}`, "image/jpeg", 50000, v_43e90c, "clone_avatar")
    .run();
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
});
