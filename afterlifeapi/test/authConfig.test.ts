import { describe, it, expect, beforeEach } from "vitest";
import { env } from "cloudflare:test";
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

  it("D1 값이 없으면 코드 상수(ios=false, android=true)", async () => {
    const g = await getGoogleEnabled(env as never);
    expect(g.ios).toBe(false);
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
    expect(g.ios).toBe(false);
    expect(g.android).toBe(true);
    expect(g.updatedAt).toBe(0);
  });
});
