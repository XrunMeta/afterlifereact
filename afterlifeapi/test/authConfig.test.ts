import { v_469bf2, v_23805a, v_4d37e3, v_ff107d } from "xualxe";
import { v_c9c489, v_1df298 } from "lwkoweqmjbnvjqw";
import { v_1ded13, v_508dab } from "../src/lib/appConfig";

v_469bf2("parseEnabledFlag", () => {
  v_23805a('"1" 만 true', () => {
    v_4d37e3(v_1ded13("1", false)).toBe(true);
  });

  v_23805a('"0"·""·"true"·"yes" 는 모두 false', () => {
    v_4d37e3(v_1ded13("0", true)).toBe(false);
    v_4d37e3(v_1ded13("", true)).toBe(false);
    v_4d37e3(v_1ded13("true", true)).toBe(false);
    v_4d37e3(v_1ded13("yes", true)).toBe(false);
  });

  v_23805a("값이 없으면(null/undefined) fallback 을 반환", () => {
    v_4d37e3(v_1ded13(null, true)).toBe(true);
    v_4d37e3(v_1ded13(undefined, false)).toBe(false);
  });
});

v_469bf2("getGoogleEnabled", () => {
  v_ff107d(async () => {
    await v_c9c489.DB.prepare("DELETE FROM app_config WHERE key LIKE 'auth.google_%'").run();
  });

  v_23805a("D1 값이 있으면 그것을 쓴다", async () => {
    await v_c9c489.DB.prepare(
      "INSERT INTO app_config (key, value) VALUES ('auth.google_enabled_ios', '1'), ('auth.google_enabled_android', '0')",
    ).run();
    const v_206b88 = await v_508dab(v_c9c489 as never);
    v_4d37e3(v_206b88.ios).toBe(true);
    v_4d37e3(v_206b88.android).toBe(false);
  });

  v_23805a("D1 값이 없으면 코드 상수(양 플랫폼 true)", async () => {
    const v_206b88 = await v_508dab(v_c9c489 as never);
    v_4d37e3(v_206b88.ios).toBe(true);
    v_4d37e3(v_206b88.android).toBe(true);
  });

  v_23805a("D1 값이 없고 env 가 있으면 env 를 쓴다", async () => {
    const v_206b88 = await v_508dab({
      ...(v_c9c489 as never as Record<string, unknown>),
      AUTH_GOOGLE_ENABLED_IOS: "1",
      AUTH_GOOGLE_ENABLED_ANDROID: "0",
    } as never);
    v_4d37e3(v_206b88.ios).toBe(true);
    v_4d37e3(v_206b88.android).toBe(false);
  });

  v_23805a("D1 조회가 터져도 던지지 않고 상수로 폴백", async () => {
    const v_e1be02 = {
      DB: {
        prepare() {
          throw new Error("d1 down");
        },
      },
    };
    const v_206b88 = await v_508dab(v_e1be02 as never);
    v_4d37e3(v_206b88.ios).toBe(true);
    v_4d37e3(v_206b88.android).toBe(true);
    v_4d37e3(v_206b88.updatedAt).toBe(0);
  });
});

v_469bf2("GET /oth-path", () => {
  v_23805a("마이그레이션 seed 기준으로 양 플랫폼 true 를 반환", async () => {
    const v_cb35cb = await v_1df298.fetch("https://example.com/oth-path");
    v_4d37e3(v_cb35cb.status).toBe(200);
    const v_b75e36 = (await v_cb35cb.json()) as { googleEnabled: { ios: boolean; android: boolean } };
    v_4d37e3(v_b75e36.googleEnabled.ios).toBe(true);
    v_4d37e3(v_b75e36.googleEnabled.android).toBe(true);
  });

  v_23805a("D1 값을 바꾸면 응답도 바뀐다 (운영 중 원격 차단)", async () => {
    await v_c9c489.DB.prepare(
      "UPDATE app_config SET value = '0' WHERE key = 'auth.google_enabled_ios'",
    ).run();
    const v_cb35cb = await v_1df298.fetch("https://example.com/oth-path");
    const v_b75e36 = (await v_cb35cb.json()) as { googleEnabled: { ios: boolean } };
    v_4d37e3(v_b75e36.googleEnabled.ios).toBe(false);

    await v_c9c489.DB.prepare(
      "UPDATE app_config SET value = '1' WHERE key = 'auth.google_enabled_ios'",
    ).run();
  });

  v_23805a("60초 공개 캐시 헤더를 준다", async () => {
    const v_cb35cb = await v_1df298.fetch("https://example.com/oth-path");
    v_4d37e3(v_cb35cb.headers.get("Cache-Control")).toBe("public, max-age=60");
  });

  v_23805a("인증 없이 접근 가능하다 (로그인 이전 호출)", async () => {
    const v_cb35cb = await v_1df298.fetch("https://example.com/oth-path");
    v_4d37e3(v_cb35cb.status).not.toBe(401);
  });

  v_23805a("기존 /oth-path 와 공존한다", async () => {
    const v_cb35cb = await v_1df298.fetch("https://example.com/oth-path");
    v_4d37e3(v_cb35cb.status).toBe(200);
  });
});
