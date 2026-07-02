import { v_469bf2, v_23805a, v_4d37e3, v_ff107d } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

const v_a1651b = () => v_c9c489.DB as unknown as D1Database;

async function v_342dde(v_b24339, v_3b402b, v_3eee66 = 1000): Promise<void> {
  await v_a1651b()
    .prepare("INSERT OR REPLACE INTO app_config (key, value, updated_at) VALUES (?, ?, ?)")
    .bind(v_b24339, v_3b402b, v_3eee66)
    .run();
}

v_469bf2("GET /oth-path", () => {
  v_ff107d(async () => {
    await v_a1651b().prepare("DELETE FROM app_config WHERE key LIKE 'call.%'").run();
  });

  v_23805a("D1 값이 있으면 그 값 + updatedAt 반환 (비인증 200)", async () => {
    await v_342dde("call.prethird_base", "https://rtc.example.invalid/prethird", 1700);
    await v_342dde("call.route", "prethird", 1650);
    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path");
    v_4d37e3(v_8f00b9.status).toBe(200);
    v_4d37e3(v_8f00b9.headers.get("Cache-Control")).toContain("max-age=60");
    const v_b75e36 = (await v_8f00b9.json()) as Record<string, unknown>;
    v_4d37e3(v_b75e36.prethirdBase).toBe("https://rtc.example.invalid/prethird");
    v_4d37e3(v_b75e36.callRoute).toBe("prethird");
    v_4d37e3(v_b75e36.secondBase).toBeNull();
    v_4d37e3(v_b75e36.updatedAt).toBe(1700);
  });

  v_23805a("D1에 call.* 없으면 코드 상수 폴백", async () => {
    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path");
    const v_b75e36 = (await v_8f00b9.json()) as Record<string, unknown>;
    v_4d37e3(v_b75e36.prethirdBase).toContain("rtc.example.invalid");
    v_4d37e3(v_b75e36.callRoute).toBe("prethird");
    v_4d37e3(v_b75e36.updatedAt).toBe(0);
  });

  v_23805a("잘못된 callRoute 값은 prethird 로 방어", async () => {
    await v_342dde("call.route", "bogus", 10);
    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path");
    const v_b75e36 = (await v_8f00b9.json()) as Record<string, unknown>;
    v_4d37e3(v_b75e36.callRoute).toBe("prethird");
  });
});
