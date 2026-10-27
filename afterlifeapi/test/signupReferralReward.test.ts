import { v_469bf2, v_23805a, v_4d37e3, v_ba7107 } from "xualxe";
import { v_c9c489 } from "lwkoweqmjbnvjqw";
import { v_7808c0, v_6d5a3b, v_da074e } from "../src/lib/referralReward";

const v_a1651b = () => v_c9c489.DB as unknown as D1Database;

async function v_b016d7(v_e0c7e8, v_88fe80): Promise<number> {
  await v_a1651b()
    .prepare(`INSERT INTO users (email, password_hash, name, xrun_member_id, created_at) VALUES (?, 'x', 'U', ?, CURRENT_TIMESTAMP)`)
    .bind(v_e0c7e8, v_88fe80)
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
  v_23805a("가입자·추천인 각각 50송이, 두 번 불러도 1회만", async () => {
    const v_6b73c1 = await v_b016d7("referrer@example.com", 9001);
    const v_792e11 = await v_b016d7("newbie@example.com", 5555);

    const v_2d1eeb = await v_7808c0(v_c9c489 as any, v_792e11, "qwe234");
    v_4d37e3(v_2d1eeb).toMatchObject({ applied: true, referrerUserId: v_6b73c1 });
    v_4d37e3(await v_2461e1(v_792e11)).toBe(v_6d5a3b);
    v_4d37e3(await v_2461e1(v_6b73c1)).toBe(v_6d5a3b);

    const v_b96973 = await v_7808c0(v_c9c489 as any, v_792e11, "QWE234");
    v_4d37e3(v_b96973.applied).toBe(false);
    v_4d37e3(await v_2461e1(v_792e11)).toBe(v_6d5a3b);
    v_4d37e3(await v_2461e1(v_6b73c1)).toBe(v_6d5a3b);
  });

  v_23805a("추천인이 afterlife 회원이 아니면 가입자만 받는다", async () => {
    const v_792e11 = await v_b016d7("newbie2@example.com", 5556);
    const v_cb35cb = await v_7808c0(v_c9c489 as any, v_792e11, "XYZ234");
    v_4d37e3(v_cb35cb).toMatchObject({ applied: true, referrerUserId: null });
    v_4d37e3(await v_2461e1(v_792e11)).toBe(v_6d5a3b);
  });

  v_23805a("자기 자신(같은 XRUN 회원)의 코드면 지급 안 함", async () => {
    const v_b1d852 = await v_b016d7("self@example.com", 9002);
    const v_cb35cb = await v_7808c0(v_c9c489 as any, v_b1d852, "XYZ234");
    v_4d37e3(v_cb35cb).toMatchObject({ applied: false, reason: "self" });
    v_4d37e3(await v_2461e1(v_b1d852)).toBe(0);
  });
});
