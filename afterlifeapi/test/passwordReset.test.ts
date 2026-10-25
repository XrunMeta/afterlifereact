import { v_469bf2, v_23805a, v_4d37e3, v_ba7107, v_719203 } from "xualxe";
import { v_1df298, v_c9c489, v_8fd90d } from "lwkoweqmjbnvjqw";

const v_cafb6f = "https://oth-path-f0013c.example.invalid";
const v_a40e49 = "/oth-path";
const v_371494 = "NewPass123";
const v_2dd832 = "123456";
const v_a1651b = () => v_c9c489.DB as unknown as D1Database;

async function v_921b04(v_fd5f43): Promise<string> {
  const v_83ee53 = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(v_fd5f43));
  return Array.from(new Uint8Array(v_83ee53), (v_148ff6) => v_148ff6.toString(16).padStart(2, "0")).join("");
}

async function v_c98eca(v_e0c7e8, v_fa63e0) {
  const v_5c2f9f = Date.now();
  await v_c9c489.KV_AUTH.put(
    `signup_otp:${v_e0c7e8}`,
    JSON.stringify({ codeHash: await v_921b04(v_2dd832), expiresAt: v_5c2f9f + 300_000, attempts: 0, sentAt: v_5c2f9f, purpose: v_fa63e0 }),
    { expirationTtl: 300 },
  );
}

async function v_bfb240(v_e0c7e8): Promise<number> {
  const v_cb35cb = await v_a1651b()
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'old-hash', 'U', CURRENT_TIMESTAMP)`)
    .bind(v_e0c7e8)
    .run();
  return v_cb35cb.meta.last_row_id as number;
}

async function v_487a25(v_e0c7e8) {
  const v_8f00b9 = await v_1df298.fetch("https://x/oth-path", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: v_e0c7e8, verificationCode: v_2dd832, newPassword: v_371494 }),
  });
  return { status: v_8f00b9.status, json: await v_8f00b9.json<Record<string, any>>() };
}

function v_443344(v_408297, v_9390e8, v_80120d) {
  v_8fd90d
    .get(v_cafb6f)
    .intercept({ path: v_a40e49, method: "POST" })
    .reply((v_328259) => {
      v_80120d?.(JSON.parse(String(v_328259.body)));
      return { statusCode: v_408297, data: v_9390e8 };
    });
}

const v_df7439 = async (v_389afb) =>
  (await v_a1651b().prepare(`SELECT password_hash FROM users WHERE id = ?`).bind(v_389afb).first<{ password_hash: string }>())!
    .password_hash;

v_469bf2("POST /oth-path (AFL-1053)", () => {
  v_ba7107(() => {
    v_8fd90d.activate();
    v_8fd90d.disableNetConnect();
  });
  v_719203(() => v_8fd90d.assertNoPendingInterceptors());

  v_23805a("xrun 전용 계정: xrun 비밀번호가 실제로 바뀌면 200 (이메일·새 비번 전달)", async () => {
    const v_e0c7e8 = "only-xrun@test.local";
    await v_c98eca(v_e0c7e8, "password_reset");
    let v_f966e3 = null;
    v_443344(200, { status: "success", data: { member: 9001, updated: 1 } }, (v_148ff6) => (v_f966e3 = v_148ff6));
    const v_cb35cb = await v_487a25(v_e0c7e8);
    v_4d37e3(v_cb35cb.status).toBe(200);
    v_4d37e3(v_f966e3).toEqual({ email: v_e0c7e8, pin: v_371494 });
  });

  v_23805a("xrun 이 success 인데 갱신 0건이면 성공으로 치지 않는다 (502)", async () => {
    const v_e0c7e8 = "zero-update@test.local";
    await v_c98eca(v_e0c7e8, "password_reset");
    v_443344(200, { status: "success", data: { member: 9002, updated: 0 } });
    const v_cb35cb = await v_487a25(v_e0c7e8);
    v_4d37e3(v_cb35cb.status).toBe(502);
    v_4d37e3(v_cb35cb.json.error?.code ?? v_cb35cb.json.code).toBe("UPSTREAM_FAILURE");
  });

  v_23805a("xrun 장애면 502 이고 afterlife 비번도 그대로", async () => {
    const v_e0c7e8 = "xrun-down@test.local";
    const v_0c8987 = await v_bfb240(v_e0c7e8);
    await v_c98eca(v_e0c7e8, "password_reset");
    v_443344(500, { status: "error", code: 500 });
    const v_cb35cb = await v_487a25(v_e0c7e8);
    v_4d37e3(v_cb35cb.status).toBe(502);
    v_4d37e3(await v_df7439(v_0c8987)).toBe("old-hash");
  });

  v_23805a("afterlife 전용 계정(xrun 회원 없음 404)은 afterlife 비번만 바꾸고 200", async () => {
    const v_e0c7e8 = "only-afterlife@test.local";
    const v_0c8987 = await v_bfb240(v_e0c7e8);
    await v_c98eca(v_e0c7e8, "password_reset");
    v_443344(404, { status: "failed", code: 404 });
    const v_cb35cb = await v_487a25(v_e0c7e8);
    v_4d37e3(v_cb35cb.status).toBe(200);
    const { verifyPassword: v_96aa7f } = await import("../src/lib/password");
    v_4d37e3(await v_96aa7f(v_371494, await v_df7439(v_0c8987))).toBe(true);
  });

  v_23805a("양쪽 다 계정이 없으면 404", async () => {
    const v_e0c7e8 = "nobody@test.local";
    await v_c98eca(v_e0c7e8, "password_reset");
    v_443344(404, { status: "failed", code: 404 });
    const v_cb35cb = await v_487a25(v_e0c7e8);
    v_4d37e3(v_cb35cb.status).toBe(404);
  });

  v_23805a("로그인용 OTP 로는 재설정 불가 — xrun 호출 없음", async () => {
    const v_e0c7e8 = "login-code@test.local";
    await v_bfb240(v_e0c7e8);
    await v_c98eca(v_e0c7e8, "login");
    const v_cb35cb = await v_487a25(v_e0c7e8);
    v_4d37e3(v_cb35cb.status).not.toBe(200);
    v_4d37e3(v_cb35cb.json.error?.code ?? v_cb35cb.json.code).toBe("OTP_REQUIRED");
  });
});
