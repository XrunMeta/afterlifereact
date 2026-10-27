import { v_469bf2, v_23805a, v_4d37e3, v_ba7107 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

v_ba7107(async () => {
  const v_76be17 = (v_c9c489 as unknown as { XRUN_DB: D1Database }).XRUN_DB;
  await v_76be17.prepare(
    `CREATE TABLE IF NOT EXISTS Members (member INTEGER PRIMARY KEY, firstname TEXT, referral_code TEXT, status INTEGER)`,
  ).run();
  await v_76be17.prepare(
    `INSERT OR REPLACE INTO Members (member, firstname, referral_code, status) VALUES (777, '홍길동', 'ABC234', 9203)`,
  ).run();
});

v_469bf2("가입 추천인 코드", () => {
  v_23805a("있는 코드는 exists:true + 가린 이름", async () => {
    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path?code=abc234");
    v_4d37e3(v_8f00b9.status).toBe(200);
    v_4d37e3(await v_8f00b9.json()).toEqual({ exists: true, name: "홍**" });
  });

  v_23805a("형식이 틀린 코드는 exists:false", async () => {
    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path?code=abc");
    v_4d37e3(await v_8f00b9.json()).toEqual({ exists: false });
  });

  v_23805a("없는 추천인 코드로 가입하면 422", async () => {
    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "ref-test@example.com",
        password: "Abcdefg1x",
        name: "R",
        verificationCode: "123456",
        referralCode: "ZZZZZZ",
      }),
    });
    v_4d37e3(v_8f00b9.status).toBe(422);
  });
});
