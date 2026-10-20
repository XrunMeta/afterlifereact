import { v_469bf2, v_23805a, v_4d37e3, v_ba7107, v_719203 } from "xualxe";
import { v_1df298, v_c9c489, v_8fd90d } from "lwkoweqmjbnvjqw";

const v_cafb6f = "https://oth-path-f0013c.example.invalid";
const v_a1651b = () => v_c9c489.DB as unknown as D1Database;

async function v_21cc31(v_43e90c): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return v_b2eae5({ sub: v_43e90c, kind: "access" }, v_43fd42, 600);
}

async function v_bfb240(v_9816e7): Promise<number> {
  const v_cb35cb = await v_a1651b()
    .prepare(`INSERT INTO users (email, password_hash, name, xrun_member_id, created_at) VALUES (?, 'x', 'U', ?, CURRENT_TIMESTAMP)`)
    .bind(`gx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.local`, v_9816e7)
    .run();
  return v_cb35cb.meta.last_row_id as number;
}

async function v_8b0655(v_43e90c, v_96f93d, v_9fdb66): Promise<void> {
  const v_c83285 = v_9fdb66.reduce((v_fd5f43, [, v_f4e98d]) => v_fd5f43 + v_f4e98d, 0);
  await v_a1651b()
    .prepare(`INSERT INTO user_gift_inventory (user_id, gift_id, count, total_received, updated_at) VALUES (?, ?, ?, ?, strftime('%s','now'))`)
    .bind(v_43e90c, v_96f93d, v_c83285, v_c83285)
    .run();
  let v_8d41d7 = 1_700_000_000;
  for (const [v_6bbb57, v_f4e98d] of v_9fdb66) {
    await v_a1651b()
      .prepare(
        `INSERT INTO user_gift_lots (user_id, gift_id, received_at, count_received, count_remaining, xrun_price_snapshot) VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(v_43e90c, v_96f93d, v_8d41d7++, v_f4e98d, v_f4e98d, v_6bbb57)
      .run();
  }
}

async function v_51c3d2(v_43e90c, v_bfe9b9, v_9fe22d, v_4d33b2, v_b24339) {
  const v_3f4675 = { Authorization: `Bearer ${await v_21cc31(v_43e90c)}`, "Content-Type": "application/json" };
  if (v_b24339) v_3f4675["X-Idempotency-Key"] = v_b24339;
  const v_8f00b9 = await v_1df298.fetch(`https://x${v_9fe22d}`, { method: v_bfe9b9, headers: v_3f4675, body: v_4d33b2 ? JSON.stringify(v_4d33b2) : undefined });
  return { status: v_8f00b9.status, json: await v_8f00b9.json<Record<string, any>>() };
}

async function v_2461e1(v_43e90c, v_96f93d): Promise<number> {
  const v_cb35cb = await v_a1651b()
    .prepare(`SELECT count FROM user_gift_inventory WHERE user_id = ? AND gift_id = ?`)
    .bind(v_43e90c, v_96f93d)
    .first<{ count: number }>();
  return Number(v_cb35cb?.count ?? 0);
}

v_469bf2("gift → XRUN exchange", () => {
  v_ba7107(() => {
    v_8fd90d.activate();
    v_8fd90d.disableNetConnect();
  });
  v_719203(() => v_8fd90d.assertNoPendingInterceptors());

  v_23805a("eligibility: 보유·교환 가능 수량·조건·송이별 가격 구간", async () => {
    const v_ceb55a = await v_bfb240(5001);
    await v_8b0655(v_ceb55a, "gift-rose", [[0.01, 3], [0.1, 10]]);
    const v_cb35cb = await v_51c3d2(v_ceb55a, "GET", "/oth-path");
    v_4d37e3(v_cb35cb.status).toBe(200);
    v_4d37e3(v_cb35cb.json).toMatchObject({
      xrunLinked: true,
      giftId: "gift-rose",
      ownedQty: 13,
      exchangeableQty: 11, 
      minQty: 10,
      feeQty: 1,
      feeUnit: 10,
      rateVersion: 1,
      priceSegments: [{ price: "0.01", count: 3 }, { price: "0.1", count: 10 }],
    });
  });

  v_23805a("교환: 오래된 송이부터 차감, 보상 = 앞 교환 수량 가격 합, XRUN 수령 대기 생성", async () => {
    const v_ceb55a = await v_bfb240(5002);
    await v_8b0655(v_ceb55a, "gift-rose", [[0.01, 3], [0.1, 10]]);
    let v_f966e3 = null;
    v_8fd90d
      .get(v_cafb6f)
      .intercept({ path: "/oth-path", method: "POST" })
      .reply((v_328259) => {
        v_f966e3 = JSON.parse(String(v_328259.body));
        return { statusCode: 200, data: { status: "success", data: { rewardId: 77 } } };
      });
    const v_cb35cb = await v_51c3d2(v_ceb55a, "POST", "/oth-path", { giftId: "gift-rose", qty: 10, rateVersion: 1 }, "key-ex-0001");
    v_4d37e3(v_cb35cb.status).toBe(200);

    v_4d37e3(v_cb35cb.json).toMatchObject({ qty: 10, feeQty: 1, deductedQty: 11, reward: "0.73", rewardStatus: "pending_claim" });
    v_4d37e3(v_f966e3).toMatchObject({ member: 5002, xrunAmount: "0.73", qty: 10 });
    v_4d37e3(await v_2461e1(v_ceb55a, "gift-rose")).toBe(2);

    const v_826279 = await v_51c3d2(v_ceb55a, "POST", "/oth-path", { giftId: "gift-rose", qty: 10, rateVersion: 1 }, "key-ex-0001");
    v_4d37e3(v_826279.status).toBe(200);
    v_4d37e3(v_826279.json.exchangeId).toBe(v_cb35cb.json.exchangeId);
    v_4d37e3(await v_2461e1(v_ceb55a, "gift-rose")).toBe(2);

    const v_65a2cd = await v_51c3d2(v_ceb55a, "GET", "/oth-path");
    v_4d37e3(v_65a2cd.json.items[0]).toMatchObject({ exchangeNo: v_cb35cb.json.exchangeNo, rewardStatus: "pending_claim", reward: "0.73" });

    const v_16dbdb = await v_1df298.fetch("https://x/oth-path", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Xrun-Bridge-Secret": "test-xrun-bridge-secret" },
      body: JSON.stringify({ refId: `afterlife-exchange:${v_cb35cb.json.exchangeId}` }),
    });
    v_4d37e3(v_16dbdb.status).toBe(200);
    const v_33b04f = await v_51c3d2(v_ceb55a, "GET", "/oth-path");
    v_4d37e3(v_33b04f.json.items[0].rewardStatus).toBe("claimed");
  });

  v_23805a("교환 내역: XRUN 에서 받았으면 수령 완료로 맞춘다", async () => {
    const v_ceb55a = await v_bfb240(5005);
    await v_8b0655(v_ceb55a, "gift-rose", [[0.1, 11]]);
    v_8fd90d
      .get(v_cafb6f)
      .intercept({ path: "/oth-path", method: "POST" })
      .reply(200, { status: "success", data: { rewardId: 91 } });
    const v_3e36b0 = await v_51c3d2(v_ceb55a, "POST", "/oth-path", { giftId: "gift-rose", qty: 10, rateVersion: 1 }, "key-ex-0301");
    v_4d37e3(v_3e36b0.status).toBe(200);
    v_8fd90d
      .get(v_cafb6f)
      .intercept({ path: (v_e2a85c) => v_e2a85c.startsWith("/oth-path"), method: "GET" })
      .reply(200, {
        status: "success",
        data: { items: [{ refId: `afterlife-exchange:${v_3e36b0.json.exchangeId}`, status: "claimed", claimedAt: "2026-10-20 03:00:00" }] },
      });
    const v_65a2cd = await v_51c3d2(v_ceb55a, "GET", "/oth-path");
    v_4d37e3(v_65a2cd.json.items[0]).toMatchObject({ exchangeId: v_3e36b0.json.exchangeId, rewardStatus: "claimed" });
  });

  v_23805a("수수료는 10송이당 1송이: 12송이 보유면 최대 10송이, 21송이면 19송이", async () => {
    const { giftExchangeFee: v_e4ea0f, giftExchangeMaxQty: v_c47972, GIFT_EXCHANGE_DEFAULT: v_6ebdd1 } = await import("../src/lib/appConfig");
    const v_01dcf5 = v_6ebdd1;
    v_4d37e3(v_e4ea0f(v_01dcf5, 10)).toBe(1);
    v_4d37e3(v_e4ea0f(v_01dcf5, 11)).toBe(2);
    v_4d37e3(v_e4ea0f(v_01dcf5, 20)).toBe(2);
    v_4d37e3(v_c47972(v_01dcf5, 11)).toBe(10);
    v_4d37e3(v_c47972(v_01dcf5, 12)).toBe(10);
    v_4d37e3(v_c47972(v_01dcf5, 13)).toBe(11);
    v_4d37e3(v_c47972(v_01dcf5, 21)).toBe(19);
    v_4d37e3(v_c47972(v_01dcf5, 22)).toBe(20);
  });

  v_23805a("검증: 최소 미달·보유 부족·조건 변경·점검·키 없음", async () => {
    const v_ceb55a = await v_bfb240(5003);
    await v_8b0655(v_ceb55a, "gift-rose", [[0.1, 10]]);
    v_4d37e3((await v_51c3d2(v_ceb55a, "POST", "/oth-path", { giftId: "gift-rose", qty: 9, rateVersion: 1 }, "key-ex-0101")).json.error.code).toBe("BELOW_MIN_QTY");
    const v_57506c = await v_51c3d2(v_ceb55a, "POST", "/oth-path", { giftId: "gift-rose", qty: 10, rateVersion: 1 }, "key-ex-0102");
    v_4d37e3(v_57506c.status).toBe(409);
    v_4d37e3(v_57506c.json.error).toMatchObject({ code: "INSUFFICIENT_QTY", details: { ownedQty: 10, exchangeableQty: 9 } });
    v_4d37e3((await v_51c3d2(v_ceb55a, "POST", "/oth-path", { giftId: "gift-rose", qty: 10, rateVersion: 0 }, "key-ex-0103")).json.error.code).toBe("RATE_CHANGED");
    v_4d37e3((await v_51c3d2(v_ceb55a, "POST", "/oth-path", { giftId: "gift-rose", qty: 10, rateVersion: 1 })).json.error.code).toBe("IDEMPOTENCY_REQUIRED");

    const { setGiftExchangeConfig: v_1e6592 } = await import("../src/lib/appConfig");
    const v_9e86fd = v_c9c489 as unknown as import("../src/lib/env").Bindings;
    await v_1e6592(v_9e86fd, { maintenance: { from: Date.now() - 1000, to: Date.now() + 60_000, message: "점검" } });
    const v_4138b9 = await v_51c3d2(v_ceb55a, "POST", "/oth-path", { giftId: "gift-rose", qty: 10, rateVersion: 1 }, "key-ex-0104");
    v_4d37e3(v_4138b9.status).toBe(503);
    v_4d37e3(v_4138b9.json.error.code).toBe("MAINTENANCE");

    const v_a448ad = await v_1e6592(v_9e86fd, { maintenance: null, minQty: 5 });
    v_4d37e3(v_a448ad.version).toBe(2);
    await v_1e6592(v_9e86fd, { minQty: 10 });
  });

  v_23805a("XRUN 실패 시 선물 원복 + 실패 기록, 정지 회원은 ACCOUNT_RESTRICTED", async () => {
    const { getGiftExchangeConfig: v_705aa5 } = await import("../src/lib/appConfig");
    const v_afd1df = (await v_705aa5(v_c9c489 as never)).version;
    const v_ceb55a = await v_bfb240(5004);
    await v_8b0655(v_ceb55a, "gift-rose", [[0.1, 22]]);
    v_8fd90d
      .get(v_cafb6f)
      .intercept({ path: "/oth-path", method: "POST" })
      .reply(500, { status: "error", message: "boom" })
      .times(2);
    const v_cb35cb = await v_51c3d2(v_ceb55a, "POST", "/oth-path", { giftId: "gift-rose", qty: 10, rateVersion: v_afd1df }, "key-ex-0201");
    v_4d37e3(v_cb35cb.status).toBe(500);
    v_4d37e3(v_cb35cb.json.error.details.exchangeNo).toMatch(/^EX-\d{6}$/);
    v_4d37e3(await v_2461e1(v_ceb55a, "gift-rose")).toBe(22);

    v_8fd90d
      .get(v_cafb6f)
      .intercept({ path: "/oth-path", method: "POST" })
      .reply(403, { status: "error", code: "ACCOUNT_RESTRICTED", message: "restricted" });
    const v_b96973 = await v_51c3d2(v_ceb55a, "POST", "/oth-path", { giftId: "gift-rose", qty: 10, rateVersion: v_afd1df }, "key-ex-0202");
    v_4d37e3(v_b96973.json.error.code).toBe("ACCOUNT_RESTRICTED");
    v_4d37e3(await v_2461e1(v_ceb55a, "gift-rose")).toBe(22);
  });

  v_23805a("XRUN 앱 쪽 기존 즉시 교환은 닫힘", async () => {
    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Xrun-Bridge-Secret": "test-xrun-bridge-secret" },
      body: JSON.stringify({ email: "a@b.cd", giftId: "gift-rose" }),
    });
    v_4d37e3(v_8f00b9.status).toBe(403);
  });
});
