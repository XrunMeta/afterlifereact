import { v_469bf2, v_23805a, v_4d37e3, v_ba7107 } from "xualxe";
import { v_1df298, v_c9c489, v_8fd90d } from "lwkoweqmjbnvjqw";

const v_cafb6f = "https://oth-path-f0013c.example.invalid";
const v_2dd832 = "654321";
const v_a1651b = () => v_c9c489.DB as unknown as D1Database;

async function v_921b04(v_fd5f43): Promise<string> {
  const v_83ee53 = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(v_fd5f43));
  return Array.from(new Uint8Array(v_83ee53), (v_148ff6) => v_148ff6.toString(16).padStart(2, "0")).join("");
}

async function v_c98eca(v_e0c7e8) {
  const v_5c2f9f = Date.now();
  await v_c9c489.KV_AUTH.put(
    `signup_otp:${v_e0c7e8}`,
    JSON.stringify({ codeHash: await v_921b04(v_2dd832), expiresAt: v_5c2f9f + 300_000, attempts: 0, sentAt: v_5c2f9f, purpose: "login" }),
    { expirationTtl: 300 },
  );
}

function v_88fe80(v_e0c7e8, v_660822) {
  v_8fd90d
    .get(v_cafb6f)
    .intercept({ path: "/oth-path", query: { email: v_e0c7e8 }, method: "GET" })
    .reply(
      v_660822 ? 200 : 404,
      v_660822
        ? { status: "success", data: { member: v_660822, guid: "g-1", wallet: "0xabc" } }
        : { status: "failed", code: 404 },
    );
}

function v_826034(): { sent: () => boolean } {
  let v_f966e3 = false;
  v_8fd90d.get("https://oauth2.googleapis.com").intercept({ path: "/token", method: "POST" })
    .reply(200, { access_token: "t", expires_in: 3600 });
  v_8fd90d.get("https://gmail.googleapis.com").intercept({ path: /\/gmail\/v1\/oth-path\/me\/messages\/send/, method: "POST" })
    .reply(() => {
      v_f966e3 = true;
      return { statusCode: 200, data: { id: "m1" } };
    });
  return { sent: () => v_f966e3 };
}

const v_4f438a = async (v_9fe22d, v_4d33b2) => {
  const v_8f00b9 = await v_1df298.fetch(`https://x${v_9fe22d}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(v_4d33b2),
  });
  return { status: v_8f00b9.status, json: await v_8f00b9.json<Record<string, any>>() };
};

v_469bf2("이메일 OTP 로그인 — xrun 전용 계정 (AFL-1053)", () => {
  v_ba7107(() => {
    v_8fd90d.activate();
    v_8fd90d.disableNetConnect();

    v_8fd90d.get(v_cafb6f).intercept({ path: "/oth-path", method: "POST" })
      .reply(200, { status: "success" }).persist();
  });

  v_23805a("login-code: afterlife 행이 없어도 xrun 회원이면 코드 메일을 보낸다", async () => {
    const v_e0c7e8 = "xrun-otp-send@test.local";
    v_88fe80(v_e0c7e8, 7001);
    const v_4341de = v_826034();
    const v_cb35cb = await v_4f438a("/oth-path", { email: v_e0c7e8 });
    v_4d37e3(v_cb35cb.status).toBe(200);
    v_4d37e3(v_4341de.sent()).toBe(true);
    v_4d37e3(await v_c9c489.KV_AUTH.get(`signup_otp:${v_e0c7e8}`)).not.toBeNull();
  });

  v_23805a("login-code: 어디에도 없는 이메일은 메일 없이 200 (가입 여부 숨김 유지)", async () => {
    const v_e0c7e8 = "nobody-otp@test.local";
    v_88fe80(v_e0c7e8, null);
    const v_cb35cb = await v_4f438a("/oth-path", { email: v_e0c7e8 });
    v_4d37e3(v_cb35cb.status).toBe(200);
    v_4d37e3(await v_c9c489.KV_AUTH.get(`signup_otp:${v_e0c7e8}`)).toBeNull();
  });

  v_23805a("login: 코드 확인 후 xrun 연결된 afterlife 계정을 만들고 세션 발급", async () => {
    const v_e0c7e8 = "xrun-otp-login@test.local";
    await v_c98eca(v_e0c7e8);
    v_88fe80(v_e0c7e8, 7002);
    const v_cb35cb = await v_4f438a("/oth-path", { email: v_e0c7e8, verificationCode: v_2dd832 });
    v_4d37e3(v_cb35cb.status).toBe(200);
    v_4d37e3(v_cb35cb.json.accessToken).toBeTruthy();
    v_4d37e3(v_cb35cb.json.linkedFromXrun).toBe(true);
    const v_3ac7e7 = await v_a1651b()
      .prepare(`SELECT xrun_member_id, xrun_wallet, deletion_state, sso_consent_version FROM users WHERE email = ?`)
      .bind(v_e0c7e8)
      .first<Record<string, any>>();
    v_4d37e3(v_3ac7e7).toMatchObject({ xrun_member_id: 7002, xrun_wallet: "0xabc", deletion_state: "active" });
    v_4d37e3(v_3ac7e7?.sso_consent_version).toBeTruthy();

    await v_c98eca(v_e0c7e8);
    const v_826279 = await v_4f438a("/oth-path", { email: v_e0c7e8, verificationCode: v_2dd832 });
    v_4d37e3(v_826279.status).toBe(200);
    v_4d37e3(v_826279.json.linkedFromXrun).toBe(false);
    const v_f4e98d = await v_a1651b().prepare(`SELECT COUNT(*) AS n FROM users WHERE email = ?`).bind(v_e0c7e8).first<{ n: number }>();
    v_4d37e3(v_f4e98d?.n).toBe(1);
  });

  v_23805a("login: xrun 에도 없으면 NOT_FOUND (계정 생성 없음)", async () => {
    const v_e0c7e8 = "nobody-login@test.local";
    await v_c98eca(v_e0c7e8);
    v_88fe80(v_e0c7e8, null);
    const v_cb35cb = await v_4f438a("/oth-path", { email: v_e0c7e8, verificationCode: v_2dd832 });
    v_4d37e3(v_cb35cb.status).toBe(404);
    const v_f4e98d = await v_a1651b().prepare(`SELECT COUNT(*) AS n FROM users WHERE email = ?`).bind(v_e0c7e8).first<{ n: number }>();
    v_4d37e3(v_f4e98d?.n).toBe(0);
  });
});
