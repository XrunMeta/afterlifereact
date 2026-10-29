
import { v_469bf2, v_23805a, v_4d37e3, v_719203 } from "xualxe";
import { v_c9c489, v_1df298 } from "lwkoweqmjbnvjqw";
import { v_191156 } from "../src/lib/appConfig";

async function v_121982(): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return v_b2eae5({ sub: 99996, kind: "access", admin: true }, v_43fd42, 600);
}

async function v_309144(v_9fe22d, v_bfe9b9, v_21cc31, v_4d33b2) {
  const v_3f4675 = { "Content-Type": "application/json" };
  if (v_21cc31) v_3f4675.Authorization = `Bearer ${v_21cc31}`;
  return v_1df298.fetch(`https://x${v_9fe22d}`, {
    method: v_bfe9b9,
    headers: v_3f4675,
    body: v_4d33b2 ? JSON.stringify(v_4d33b2) : undefined,
  });
}

v_719203(async () => {
  await v_c9c489.DB.prepare(
    "UPDATE app_config SET value = '1' WHERE key IN ('auth.google_enabled_ios', 'auth.google_enabled_android', 'auth.apple_enabled_ios')",
  ).run();
});

v_469bf2("getAppleEnabled", () => {
  v_23805a("마이그레이션 seed 기준 true", async () => {
    v_4d37e3((await v_191156(v_c9c489 as never)).ios).toBe(true);
  });

  v_23805a("D1 조회가 터져도 던지지 않고 true 로 폴백", async () => {
    const v_e1be02 = { DB: { prepare() { throw new Error("d1 down"); } } };
    const v_779914 = await v_191156(v_e1be02 as never);
    v_4d37e3(v_779914.ios).toBe(true);
    v_4d37e3(v_779914.updatedAt).toBe(0);
  });
});

v_469bf2("GET /oth-path — appleEnabled", () => {
  v_23805a("appleEnabled.ios 를 함께 준다", async () => {
    const v_cb35cb = await v_1df298.fetch("https://example.com/oth-path");
    const v_b75e36 = (await v_cb35cb.json()) as { appleEnabled: { ios: boolean } };
    v_4d37e3(v_b75e36.appleEnabled.ios).toBe(true);
  });

  v_23805a("D1 값을 '0' 으로 바꾸면 false", async () => {
    await v_c9c489.DB.prepare("UPDATE app_config SET value = '0' WHERE key = 'auth.apple_enabled_ios'").run();
    const v_cb35cb = await v_1df298.fetch("https://example.com/oth-path");
    const v_b75e36 = (await v_cb35cb.json()) as { appleEnabled: { ios: boolean } };
    v_4d37e3(v_b75e36.appleEnabled.ios).toBe(false);
  });
});

v_469bf2("admin /config/auth-login", () => {
  v_23805a("관리자 토큰 없으면 401", async () => {
    const v_cb35cb = await v_309144("/oth-path", "GET", null);
    v_4d37e3(v_cb35cb.status).toBe(401);
  });

  v_23805a("GET — 세 토글을 boolean 으로 준다", async () => {
    const v_cb35cb = await v_309144("/oth-path", "GET", await v_121982());
    v_4d37e3(v_cb35cb.status).toBe(200);
    v_4d37e3(await v_cb35cb.json()).toEqual({ googleIos: true, googleAndroid: true, appleIos: true });
  });

  v_23805a("PATCH — 일부만 바꾸고 나머지는 유지, 공개 config 에도 반영", async () => {
    const v_21cc31 = await v_121982();
    const v_cb35cb = await v_309144("/oth-path", "PATCH", v_21cc31, {
      googleIos: false,
      appleIos: false,
    });
    v_4d37e3(v_cb35cb.status).toBe(200);
    v_4d37e3(await v_cb35cb.json()).toEqual({ ok: true, googleIos: false, googleAndroid: true, appleIos: false });

    const v_492054 = (await (await v_1df298.fetch("https://example.com/oth-path")).json()) as {
      googleEnabled: { ios: boolean; android: boolean };
      appleEnabled: { ios: boolean };
    };
    v_4d37e3(v_492054.googleEnabled).toEqual({ ios: false, android: true });
    v_4d37e3(v_492054.appleEnabled).toEqual({ ios: false });
  });

  v_23805a("PATCH — boolean 이 아니거나 필드가 없으면 422", async () => {
    const v_21cc31 = await v_121982();
    const v_0af197 = await v_309144("/oth-path", "PATCH", v_21cc31, { appleIos: "0" });
    v_4d37e3(v_0af197.status).toBe(422);
    const v_d6db99 = await v_309144("/oth-path", "PATCH", v_21cc31, {});
    v_4d37e3(v_d6db99.status).toBe(422);
  });
});
