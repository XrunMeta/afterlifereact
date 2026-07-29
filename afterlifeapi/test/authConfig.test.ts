import { describe, it, expect, beforeEach } from "vitest";
import { env, SELF } from "cloudflare:test";
import { parseEnabledFlag, getGoogleEnabled } from "../src/lib/appConfig";

describe("parseEnabledFlag", () => {
  it('"1" 만 true', () => {
    expect(parseEnabledFlag("1", false)).toBe(true);
  });

  it('"0"·""·"true"·"yes" 는 모두 false', () => {
    expect(parseEnabledFlag("0", true)).toBe(false);
    expect(parseEnabledFlag("", true)).toBe(false);
    expect(parseEnabledFlag("true", true)).toBe(false);
    expect(parseEnabledFlag("yes", true)).toBe(false);
  });

  it("값이 없으면(null/undefined) fallback 을 반환", () => {
    expect(parseEnabledFlag(null, true)).toBe(true);
    expect(parseEnabledFlag(undefined, false)).toBe(false);
  });
});

describe("getGoogleEnabled", () => {
  beforeEach(async () => {
    await env.DB.prepare("DELETE FROM app_config WHERE key LIKE 'auth.google_%'").run();
  });

  it("D1 값이 있으면 그것을 쓴다", async () => {
    await env.DB.prepare(
      "INSERT INTO app_config (key, value) VALUES ('auth.google_enabled_ios', '1'), ('auth.google_enabled_android', '0')",
    ).run();
    const g = await getGoogleEnabled(env as never);
    expect(g.ios).toBe(true);
    expect(g.android).toBe(false);
  });

  it("D1 값이 없으면 코드 상수(양 플랫폼 true)", async () => {
    const g = await getGoogleEnabled(env as never);
    expect(g.ios).toBe(true);
    expect(g.android).toBe(true);
  });

  it("D1 값이 없고 env 가 있으면 env 를 쓴다", async () => {
    const g = await getGoogleEnabled({
      ...(env as never as Record<string, unknown>),
      AUTH_GOOGLE_ENABLED_IOS: "1",
      AUTH_GOOGLE_ENABLED_ANDROID: "0",
    } as never);
    expect(g.ios).toBe(true);
    expect(g.android).toBe(false);
  });

  it("D1 조회가 터져도 던지지 않고 상수로 폴백", async () => {
    const broken = {
      DB: {
        prepare() {
          throw new Error("d1 down");
        },
      },
    };
    const g = await getGoogleEnabled(broken as never);
    expect(g.ios).toBe(true);
    expect(g.android).toBe(true);
    expect(g.updatedAt).toBe(0);
  });
});

describe("GET /oth-path", () => {
  it("마이그레이션 seed 기준으로 양 플랫폼 true 를 반환", async () => {
    const r = await SELF.fetch("https://example.com/oth-path");
    expect(r.status).toBe(200);
    const j = (await r.json()) as { googleEnabled: { ios: boolean; android: boolean } };
    expect(j.googleEnabled.ios).toBe(true);
    expect(j.googleEnabled.android).toBe(true);
  });

  it("D1 값을 바꾸면 응답도 바뀐다 (운영 중 원격 차단)", async () => {
    await env.DB.prepare(
      "UPDATE app_config SET value = '0' WHERE key = 'auth.google_enabled_ios'",
    ).run();
    const r = await SELF.fetch("https://example.com/oth-path");
    const j = (await r.json()) as { googleEnabled: { ios: boolean } };
    expect(j.googleEnabled.ios).toBe(false);

    await env.DB.prepare(
      "UPDATE app_config SET value = '1' WHERE key = 'auth.google_enabled_ios'",
    ).run();
  });

  it("60초 공개 캐시 헤더를 준다", async () => {
    const r = await SELF.fetch("https://example.com/oth-path");
    expect(r.headers.get("Cache-Control")).toBe("public, max-age=60");
  });

  it("인증 없이 접근 가능하다 (로그인 이전 호출)", async () => {
    const r = await SELF.fetch("https://example.com/oth-path");
    expect(r.status).not.toBe(401);
  });

  it("기존 /oth-path 와 공존한다", async () => {
    const r = await SELF.fetch("https://example.com/oth-path");
    expect(r.status).toBe(200);
  });
});
