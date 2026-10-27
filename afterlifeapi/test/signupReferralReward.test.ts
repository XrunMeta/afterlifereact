import { v_469bf2, v_23805a, v_4d37e3, v_ba7107 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";
import { v_7808c0, v_da074e } from "../src/lib/referralReward";
import { v_267b1e } from "../src/lib/appConfig";

const v_a1651b = () => v_c9c489.DB as unknown as D1Database;
const v_8c880b = "Abcdef1";

async function v_b016d7(v_e0c7e8, v_88fe80): Promise<number> {
  const { hashPassword: v_54846c } = await import("../src/lib/password");
  await v_a1651b()
    .prepare(`INSERT INTO users (email, password_hash, name, xrun_member_id, created_at) VALUES (?, ?, 'U', ?, CURRENT_TIMESTAMP)`)
    .bind(v_e0c7e8, await v_54846c(v_8c880b), v_88fe80)
    .run();
  const v_cb35cb = await v_a1651b().prepare(`SELECT id FROM users WHERE email = ?`).bind(v_e0c7e8).first<{ id: number }>();
  return v_cb35cb!.id;
}

async function v_2461e1(v_43e90c): Promise<number> {
  const v_cb35cb = await v_a1651b()
    .prepare(`SELECT count FROM user_gift_inventory WHERE user_id = ? AND gift_id = ?`)
    .bind(v_43e90c, v_da074e)
    .first<{ count: number }>();
  return v_cb35cb?.count ?? 0;
}

async function v_483de2(v_43e90c): Promise<Array<{ id: number; count: number }>> {
  const v_cb35cb = await v_a1651b()
    .prepare(`SELECT id, count FROM gift_inventory_events WHERE user_id = ? AND ref_id LIKE 'referral:%' AND claimed_at IS NULL`)
    .bind(v_43e90c)
    .all<{ id: number; count: number }>();
  return v_cb35cb.results ?? [];
}

async function v_21cc31(v_e0c7e8): Promise<string> {
  const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: v_e0c7e8, password: v_8c880b }),
  });
  return ((await v_8f00b9.json()) as { accessToken: string }).accessToken;
}

v_ba7107(async () => {
  const v_76be17 = (v_c9c489 as unknown as { XRUN_DB: D1Database }).XRUN_DB;
  await v_76be17.prepare(
    `CREATE TABLE IF NOT EXISTS Members (member INTEGER PRIMARY KEY, firstname TEXT, referral_code TEXT, status INTEGER)`,
  ).run();
  await v_76be17.prepare(
    `INSERT OR REPLACE INTO Members (member, firstname, referral_code, status) VALUES (9001, '추천', 'QWE234', 9203), (9002, '외부', 'XYZ234', 9203)`,
  ).run();
});

v_469bf2("가입 추천인 꽃 보상", () => {
  v_23805a("가입자·추천인 각각 수령 대기 N송이(관리자 설정) → 광고 보고 받기로 보유 증가, 1회만", async () => {
    await v_267b1e(v_c9c489 as any, "newUser", { qty: 30 });
    await v_267b1e(v_c9c489 as any, "referrer", { qty: 40 });
    const v_6b73c1 = await v_b016d7("referrer@test.local", 9001);
    const v_792e11 = await v_b016d7("newbie@test.local", 5555);

    const v_2d1eeb = await v_7808c0(v_c9c489 as any, v_792e11, "qwe234");
    v_4d37e3(v_2d1eeb).toMatchObject({ applied: true, referrerUserId: v_6b73c1 });

    v_4d37e3(await v_2461e1(v_792e11)).toBe(0);
    v_4d37e3(await v_2461e1(v_6b73c1)).toBe(0);
    const [v_49d970] = await v_483de2(v_792e11);
    const [v_c44eec] = await v_483de2(v_6b73c1);
    v_4d37e3(v_49d970.count).toBe(30);
    v_4d37e3(v_c44eec.count).toBe(40);

    v_4d37e3((await v_7808c0(v_c9c489 as any, v_792e11, "QWE234")).applied).toBe(false);
    v_4d37e3((await v_483de2(v_792e11)).length).toBe(1);

    const v_9edd60 = await v_21cc31("newbie@test.local");
    const v_de0f68 = () =>
      v_1df298.fetch(`http://localhost/oth-path${v_49d970.id}/claim`, {
        method: "POST",
        headers: { Authorization: `Bearer ${v_9edd60}` },
      });
    v_4d37e3((await v_de0f68()).status).toBe(200);
    v_4d37e3(await v_2461e1(v_792e11)).toBe(30);
    v_4d37e3((await v_de0f68()).status).toBe(404);
    v_4d37e3(await v_2461e1(v_792e11)).toBe(30);
    await v_267b1e(v_c9c489 as any, "newUser", { qty: 50 });
    await v_267b1e(v_c9c489 as any, "referrer", { qty: 50 });
  });

  v_23805a("추천인이 afterlife 회원이 아니면 가입자만 대기 보상", async () => {
    const v_792e11 = await v_b016d7("newbie2@test.local", 5556);
    const v_cb35cb = await v_7808c0(v_c9c489 as any, v_792e11, "XYZ234");
    v_4d37e3(v_cb35cb).toMatchObject({ applied: true, referrerUserId: null });
    v_4d37e3((await v_483de2(v_792e11))[0].count).toBe(50);
  });

  v_23805a("자기 자신(같은 XRUN 회원)의 코드면 지급 안 함", async () => {
    const v_b1d852 = await v_b016d7("self@test.local", 9002);
    const v_cb35cb = await v_7808c0(v_c9c489 as any, v_b1d852, "XYZ234");
    v_4d37e3(v_cb35cb).toMatchObject({ applied: false, reason: "self" });
    v_4d37e3((await v_483de2(v_b1d852)).length).toBe(0);
  });
});
