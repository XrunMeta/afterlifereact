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
    .bind(v_433c46, `k${v_433c46}`, "audio/m4a", 50000, v_43e90c, "clone_voice")
    .run();
}

function v_4f438a(v_ea333d, v_433c46) {
  return v_1df298.fetch("http://localhost/oth-path", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(v_ea333d ? { Authorization: `Bearer ${v_ea333d}` } : {}),
    },
    body: JSON.stringify({ src_file_id: v_433c46 }),
  });
}

v_ba7107(() => {
  v_8fd90d.activate();
  v_8fd90d.disableNetConnect();
});
v_719203(() => v_8fd90d.assertNoPendingInterceptors());

v_469bf2("POST /oth-path", () => {
  v_23805a("401 토큰 없음", async () => {
    v_4d37e3((await v_4f438a(null, 1)).status).toBe(401);
  });

  v_23805a("200 ok — prethird 통과 verdict 전달", async () => {
    await v_c808bd(1001, 5001);
    v_8fd90d
      .get(v_ff7e4d)
      .intercept({ path: "/prethird/voice-analyze", method: "POST" })
      .reply(200, { ok: true });
    const v_8f00b9 = await v_4f438a(await v_2c6218(1001), 5001);
    v_4d37e3(v_8f00b9.status).toBe(200);
    v_4d37e3(await v_8f00b9.json()).toEqual({ ok: true });
  });

  v_23805a("200 fail — reason 전달", async () => {
    await v_c808bd(1002, 5002);
    v_8fd90d
      .get(v_ff7e4d)
      .intercept({ path: "/prethird/voice-analyze", method: "POST" })
      .reply(200, { ok: false, reason: "NO_PAUSE" });
    const v_8f00b9 = await v_4f438a(await v_2c6218(1002), 5002);
    v_4d37e3(await v_8f00b9.json()).toEqual({ ok: false, reason: "NO_PAUSE" });
  });

  v_23805a("ANALYZE_FAILED — prethird 5xx 시 fail-closed", async () => {
    await v_c808bd(1003, 5003);
    v_8fd90d
      .get(v_ff7e4d)
      .intercept({ path: "/prethird/voice-analyze", method: "POST" })
      .reply(500, { error: "x" });
    const v_8f00b9 = await v_4f438a(await v_2c6218(1003), 5003);
    v_4d37e3(await v_8f00b9.json()).toEqual({ ok: false, reason: "ANALYZE_FAILED" });
  });

  v_23805a("타인 소유 파일 거부 (IDOR)", async () => {
    await v_c808bd(1004, 5004);
    await v_c808bd(9999, 5999);

    const v_8f00b9 = await v_4f438a(await v_2c6218(9999), 5004);
    v_4d37e3(v_8f00b9.status).toBe(404);
    const v_b75e36 = await v_8f00b9.json<{ ok?: unknown }>();
    v_4d37e3(v_b75e36.ok).toBeUndefined();
  });
});
