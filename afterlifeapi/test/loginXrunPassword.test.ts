import { v_469bf2, v_23805a, v_4d37e3, v_ba7107, v_719203 } from "xualxe";
import { v_1df298, v_c9c489, v_8fd90d } from "lwkoweqmjbnvjqw";

const v_cafb6f = "https://oth-path-f0013c.example.invalid";
const v_a1651b = () => v_c9c489.DB as unknown as D1Database;

async function v_bfb240(v_e0c7e8, v_adc076): Promise<number> {
  const { hashPasswordUnchecked: v_1000e8 } = await import("../src/lib/password");
  const v_cb35cb = await v_a1651b()
    .prepare(`INSERT INTO users (name, email, password_hash) VALUES ('U', ?, ?)`)
    .bind(v_e0c7e8, await v_1000e8(v_adc076))
    .run();
  return v_cb35cb.meta.last_row_id as number;
}

function v_dd506d(v_ea6dff) {
  v_8fd90d
    .get(v_cafb6f)
    .intercept({ path: "/oth-path", method: "POST" })
    .reply(
      v_ea6dff ? 200 : 401,
      v_ea6dff
        ? { status: "success", data: { member: 8101, guid: "g", wallet: "0x1" } }
        : { status: "failed", code: 401, message: "Invalid credentials" },
    );
}

function v_10d821(v_e0c7e8, v_660822) {
  v_8fd90d
    .get(v_cafb6f)
    .intercept({ path: "/oth-path", query: { email: v_e0c7e8 }, method: "GET" })
    .reply(
      v_660822 ? 200 : 404,
      v_660822 ? { status: "success", data: { member: v_660822, guid: "g", wallet: "0x1" } } : { status: "failed", code: 404 },
    );
}

const v_182fdb = async (v_e0c7e8, v_adc076) => {
  const v_8f00b9 = await v_1df298.fetch("https://x/oth-path", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: v_e0c7e8, password: v_adc076 }),
  });
  return { status: v_8f00b9.status, json: await v_8f00b9.json<Record<string, any>>() };
};

v_469bf2("비밀번호 로그인 — XRUN 비밀번호 기준", () => {
  v_ba7107(() => {
    v_8fd90d.activate();
    v_8fd90d.disableNetConnect();
  });
  v_719203(() => v_8fd90d.assertNoPendingInterceptors());

  v_23805a("XRUN 회원이 있고 XRUN 비밀번호가 틀리면 afterlife 비밀번호가 맞아도 거절", async () => {
    const v_e0c7e8 = "xrun-wrong@test.local";
    await v_bfb240(v_e0c7e8, "OldPass123");
    v_dd506d(false);
    v_10d821(v_e0c7e8, 8101);
    const v_cb35cb = await v_182fdb(v_e0c7e8, "OldPass123");
    v_4d37e3(v_cb35cb.status).toBe(401);
  });

  v_23805a("XRUN 비밀번호가 맞으면 afterlife 해시가 달라도 통과하고 해시를 맞춘다", async () => {
    const v_e0c7e8 = "xrun-right@test.local";
    const v_389afb = await v_bfb240(v_e0c7e8, "OldPass123");
    v_dd506d(true);
    const v_cb35cb = await v_182fdb(v_e0c7e8, "NewPass456");
    v_4d37e3(v_cb35cb.status).toBe(200);
    v_4d37e3(v_cb35cb.json.accessToken).toBeTruthy();
    const { verifyPassword: v_96aa7f } = await import("../src/lib/password");
    const v_3ac7e7 = await v_a1651b().prepare(`SELECT password_hash FROM users WHERE id = ?`).bind(v_389afb).first<{ password_hash: string }>();
    v_4d37e3(await v_96aa7f("NewPass456", v_3ac7e7!.password_hash)).toBe(true);
  });

  v_23805a("XRUN 회원이 없으면 afterlife 비밀번호로 확인", async () => {
    const v_e0c7e8 = "afl-only@test.local";
    await v_bfb240(v_e0c7e8, "AflPass123");
    v_dd506d(false);
    v_10d821(v_e0c7e8, null);
    const v_cb35cb = await v_182fdb(v_e0c7e8, "AflPass123");
    v_4d37e3(v_cb35cb.status).toBe(200);
  });
});
