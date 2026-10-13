

import { v_469bf2, v_23805a, v_4d37e3, v_ff107d } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

const v_a1651b = () => v_c9c489.DB as unknown as D1Database;

async function v_342dde(v_b24339, v_3b402b, v_3eee66 = 1000): Promise<void> {
  await v_a1651b()
    .prepare("INSERT OR REPLACE INTO app_config (key, value, updated_at) VALUES (?, ?, ?)")
    .bind(v_b24339, v_3b402b, v_3eee66)
    .run();
}

v_469bf2("GET /oth-path — 광고 주기(cadence)", () => {
  v_ff107d(async () => {
    await v_a1651b().prepare("DELETE FROM app_config WHERE key = 'ad.cadence'").run();
  });

  v_23805a("D1 ad.cadence 값이 있으면 그 값 반환", async () => {
    await v_342dde("ad.cadence", JSON.stringify({ firstRound: 3, interval: 2 }));
    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path");
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_b75e36 = (await v_8f00b9.json()) as { cadence?: { firstRound?: number; interval?: number } };
    v_4d37e3(v_b75e36.cadence?.firstRound).toBe(3);
    v_4d37e3(v_b75e36.cadence?.interval).toBe(2);
  });

  v_23805a("ad.cadence 없으면 기본 11/5 폴백", async () => {
    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path");
    const v_b75e36 = (await v_8f00b9.json()) as { cadence?: { firstRound?: number; interval?: number } };
    v_4d37e3(v_b75e36.cadence?.firstRound).toBe(11);
    v_4d37e3(v_b75e36.cadence?.interval).toBe(5);
  });

  v_23805a("비정상 값(0·음수·정수아님)은 기본값으로 방어", async () => {
    await v_342dde("ad.cadence", JSON.stringify({ firstRound: 0, interval: -5 }));
    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path");
    const v_b75e36 = (await v_8f00b9.json()) as { cadence?: { firstRound?: number; interval?: number } };
    v_4d37e3(v_b75e36.cadence?.firstRound).toBe(11);
    v_4d37e3(v_b75e36.cadence?.interval).toBe(5);
  });

  v_23805a("깨진 JSON 이어도 500 없이 기본값", async () => {
    await v_342dde("ad.cadence", "{not json");
    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path");
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_b75e36 = (await v_8f00b9.json()) as { cadence?: { firstRound?: number; interval?: number } };
    v_4d37e3(v_b75e36.cadence?.firstRound).toBe(11);
    v_4d37e3(v_b75e36.cadence?.interval).toBe(5);
  });
});
