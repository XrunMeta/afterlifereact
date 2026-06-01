import { describe, it, expect } from "vitest";
import { env } from "cloudflare:test";
import { loadSystemPersona } from "../src/lib/systemPersona";
import type { D1Database } from "@cloudflare/workers-types";

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

describe("halbae system clone seed (0052)", () => {
  it("seeds a system 'halbae' clone with non-empty l1_profile", async () => {
    const db = env.DB as unknown as D1Database;
    const clone = await db
      .prepare("SELECT id, l1_profile FROM clones WHERE username = 'halbae'")
      .first<{ id: number; l1_profile: string | null }>();
    expect(clone).toBeTruthy();
    expect(clone!.l1_profile).toBeTruthy();
    const l1 = JSON.parse(clone!.l1_profile!);
    expect(l1.personality_core ?? l1.attrs?.personality_core).toBeTruthy();
  });

  it("mirrors halbae l1_profile into persona_attributes(level='l1')", async () => {
    const db = env.DB as unknown as D1Database;
    const rows = await db
      .prepare(
        `SELECT pa.key, pa.value FROM persona_attributes pa
         JOIN clones c ON c.id = pa.clone_id
         WHERE c.username = 'halbae' AND pa.level = 'l1'`
      )
      .all<{ key: string; value: string }>();
    expect(rows.results.length).toBeGreaterThanOrEqual(1);
    const keys = rows.results.map((r) => r.key);
    expect(keys).toContain("personality_core");
  });

  it("seeds exactly 3 persona_attributes(level='l1') rows for halbae (R-1)", async () => {
    const db = env.DB as unknown as D1Database;
    const row = await db
      .prepare(
        `SELECT COUNT(*) AS cnt FROM persona_attributes pa
         JOIN clones c ON c.id = pa.clone_id
         WHERE c.username = 'halbae' AND pa.level = 'l1'`
      )
      .first<{ cnt: number }>();
    expect(row?.cnt).toBe(3);

    const rows = await db
      .prepare(
        `SELECT pa.key FROM persona_attributes pa
         JOIN clones c ON c.id = pa.clone_id
         WHERE c.username = 'halbae' AND pa.level = 'l1'`
      )
      .all<{ key: string }>();
    const keys = rows.results.map((r) => r.key);
    expect(keys).toContain("personality_core");
    expect(keys).toContain("tone");
    expect(keys).toContain("speech_patterns");
  });
});

describe("loadSystemPersona", () => {
  it("loadSystemPersona returns parsed rules_text and blocklist array", async () => {
    const db = env.DB as unknown as D1Database;
    const l0 = await loadSystemPersona(db);
    expect(typeof l0.rules_text).toBe("string");
    expect(Array.isArray(l0.blocklist)).toBe(true);
  });

  it("loadSystemPersona has rules_text property even on fallback", async () => {
    const db = env.DB as unknown as D1Database;
    const l0 = await loadSystemPersona(db);
    expect(l0).toHaveProperty("rules_text");
  });
});
