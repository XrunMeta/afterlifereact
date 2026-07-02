import { describe, it, expect, beforeEach } from "vitest";
import { SELF, env } from "cloudflare:test";

const db = () => env.DB as unknown as D1Database;

async function setKey(key: string, value: string, updatedAt = 1000): Promise<void> {
  await db()
    .prepare("INSERT OR REPLACE INTO app_config (key, value, updated_at) VALUES (?, ?, ?)")
    .bind(key, value, updatedAt)
    .run();
}

describe("GET /oth-path", () => {
  beforeEach(async () => {
    await db().prepare("DELETE FROM app_config WHERE key LIKE 'call.%'").run();
  });

  it("D1 값이 있으면 그 값 + updatedAt 반환 (비인증 200)", async () => {
    await setKey("call.prethird_base", "https://rtc.example.invalid/prethird", 1700);
    await setKey("call.route", "prethird", 1650);
    const res = await SELF.fetch("https://x/oth-path");
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toContain("max-age=60");
    const j = (await res.json()) as Record<string, unknown>;
    expect(j.prethirdBase).toBe("https://rtc.example.invalid/prethird");
    expect(j.callRoute).toBe("prethird");
    expect(j.secondBase).toBeNull();
    expect(j.updatedAt).toBe(1700);
  });

  it("D1에 call.* 없으면 코드 상수 폴백", async () => {
    const res = await SELF.fetch("https://x/oth-path");
    const j = (await res.json()) as Record<string, unknown>;
    expect(j.prethirdBase).toContain("rtc.example.invalid");
    expect(j.callRoute).toBe("prethird");
    expect(j.updatedAt).toBe(0);
  });

  it("잘못된 callRoute 값은 prethird 로 방어", async () => {
    await setKey("call.route", "bogus", 10);
    const res = await SELF.fetch("https://x/oth-path");
    const j = (await res.json()) as Record<string, unknown>;
    expect(j.callRoute).toBe("prethird");
  });
});
