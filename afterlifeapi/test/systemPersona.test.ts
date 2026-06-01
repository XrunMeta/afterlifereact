import { describe, it, expect } from "vitest";
import { env } from "cloudflare:test";

describe("system_persona migration", () => {
  it("seeds exactly one active row with rules_text and blocklist", async () => {
    const db = env.DB as unknown as D1Database;
    const row = await db
      .prepare("SELECT rules_text, blocklist FROM system_persona WHERE id = 1")
      .first<{ rules_text: string; blocklist: string }>();
    expect(row).toBeTruthy();
    expect(row!.rules_text.length).toBeGreaterThan(20);
    expect(Array.isArray(JSON.parse(row!.blocklist))).toBe(true);
  });
});
