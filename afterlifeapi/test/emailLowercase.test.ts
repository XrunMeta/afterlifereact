import { v_469bf2, v_23805a, v_4d37e3, v_ba7107 } from "xualxe";
import { v_1df298, v_c9c489, v_8fd90d } from "lwkoweqmjbnvjqw";

const v_a1651b = () => v_c9c489.DB as unknown as D1Database;

const v_4f438a = async (v_9fe22d, v_4d33b2) => {
  const v_8f00b9 = await v_1df298.fetch(`https://x${v_9fe22d}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(v_4d33b2),
  });
  return { status: v_8f00b9.status, json: await v_8f00b9.json<Record<string, any>>() };
};

v_469bf2("이메일 소문자 통일 (AFL-1054)", () => {
  v_ba7107(() => {
    v_8fd90d.activate();
    v_8fd90d.disableNetConnect();
  });

  v_23805a("emailInput: 앞뒤 공백 제거 + 소문자, 형식 검사는 그대로", async () => {
    const { emailInput: v_ae1ce0 } = await import("../src/lib/validate");
    v_4d37e3(v_ae1ce0().parse("  Sungji.Us@Gmail.COM ")).toBe("oth-user@example.invalid");
    v_4d37e3(v_ae1ce0().safeParse("not-an-email").success).toBe(false);
  });

  v_23805a("비밀번호 로그인: 대문자 섞인 입력으로 소문자 계정에 로그인", async () => {
    const { hashPasswordUnchecked: v_1000e8 } = await import("../src/lib/password");
    await v_a1651b()
      .prepare(`INSERT INTO users (name, email, password_hash) VALUES ('U', 'mixed-login@test.local', ?)`)
      .bind(await v_1000e8("Passw0rdX"))
      .run();
    const v_cb35cb = await v_4f438a("/oth-path", { email: "Mixed-Login@Test.LOCAL", password: "Passw0rdX" });
    v_4d37e3(v_cb35cb.status).toBe(200);
    v_4d37e3(v_cb35cb.json.accessToken).toBeTruthy();
  });

  v_23805a("OTP 로그인 코드: 대문자 섞인 입력도 소문자 계정으로 보고 코드 발급", async () => {
    await v_a1651b()
      .prepare(`INSERT INTO users (name, email, password_hash) VALUES ('U', 'mixed-otp@test.local', 'x')`)
      .run();
    v_8fd90d.get("https://oauth2.googleapis.com").intercept({ path: "/token", method: "POST" })
      .reply(200, { access_token: "t", expires_in: 3600 });
    v_8fd90d.get("https://gmail.googleapis.com").intercept({ path: /\/gmail\/v1\/oth-path\/me\/messages\/send/, method: "POST" })
      .reply(200, { id: "m1" });
    const v_cb35cb = await v_4f438a("/oth-path", { email: "Mixed-OTP@Test.Local" });
    v_4d37e3(v_cb35cb.status).toBe(200);
    v_4d37e3(await v_c9c489.KV_AUTH.get("signup_otp:mixed-otp@test.local")).not.toBeNull();
    const v_3e58a1 = await v_a1651b()
      .prepare(`SELECT email FROM otp_send_logs ORDER BY id DESC LIMIT 1`)
      .first<{ email: string }>();
    v_4d37e3(v_3e58a1?.email).toBe("mixed-otp@test.local");
  });
});
