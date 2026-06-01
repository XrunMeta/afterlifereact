import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_c9c489 } from "lwkoweqmjbnvjqw";
import { v_b60bdd } from "../src/lib/systemPersona";
import type { v_8330bc } from "audevgreebvpcootosqqkonhs";

v_469bf2("system_persona migration", () => {
  v_23805a("seeds exactly one active row with rules_text and blocklist", async () => {
    const v_a1651b = v_c9c489.DB as unknown as v_8330bc;
    const v_3ac7e7 = await v_a1651b
      .prepare("SELECT rules_text, blocklist FROM system_persona WHERE id = 1")
      .first<{ rules_text: string; blocklist: string }>();
    v_4d37e3(v_3ac7e7).toBeTruthy();
    v_4d37e3(v_3ac7e7!.rules_text.length).toBeGreaterThan(20);
    v_4d37e3(Array.isArray(JSON.parse(v_3ac7e7!.blocklist))).toBe(true);
  });
});

v_469bf2("halbae system clone seed (0052)", () => {
  v_23805a("seeds a system 'halbae' clone with non-empty l1_profile", async () => {
    const v_a1651b = v_c9c489.DB as unknown as v_8330bc;
    const v_eb25ce = await v_a1651b
      .prepare("SELECT id, l1_profile FROM clones WHERE username = 'halbae'")
      .first<{ id: number; l1_profile: string | null }>();
    v_4d37e3(v_eb25ce).toBeTruthy();
    v_4d37e3(v_eb25ce!.l1_profile).toBeTruthy();
    const v_020b4b = JSON.parse(v_eb25ce!.l1_profile!);
    v_4d37e3(v_020b4b.personality_core ?? v_020b4b.attrs?.personality_core).toBeTruthy();
  });

  v_23805a("mirrors halbae l1_profile into persona_attributes(level='l1')", async () => {
    const v_a1651b = v_c9c489.DB as unknown as v_8330bc;
    const v_18b8bf = await v_a1651b
      .prepare(
        `SELECT pa.key, pa.value FROM persona_attributes pa
         JOIN clones c ON c.id = pa.clone_id
         WHERE c.username = 'halbae' AND pa.level = 'l1'`
      )
      .all<{ key: string; value: string }>();
    v_4d37e3(v_18b8bf.results.length).toBeGreaterThanOrEqual(1);
    const v_fa53ec = v_18b8bf.results.map((v_cb35cb) => v_cb35cb.key);
    v_4d37e3(v_fa53ec).toContain("personality_core");
  });

  v_23805a("seeds exactly 3 persona_attributes(level='l1') rows for halbae (R-1)", async () => {
    const v_a1651b = v_c9c489.DB as unknown as v_8330bc;
    const v_3ac7e7 = await v_a1651b
      .prepare(
        `SELECT COUNT(*) AS cnt FROM persona_attributes pa
         JOIN clones c ON c.id = pa.clone_id
         WHERE c.username = 'halbae' AND pa.level = 'l1'`
      )
      .first<{ cnt: number }>();
    v_4d37e3(v_3ac7e7?.cnt).toBe(3);

    const v_18b8bf = await v_a1651b
      .prepare(
        `SELECT pa.key FROM persona_attributes pa
         JOIN clones c ON c.id = pa.clone_id
         WHERE c.username = 'halbae' AND pa.level = 'l1'`
      )
      .all<{ key: string }>();
    const v_fa53ec = v_18b8bf.results.map((v_cb35cb) => v_cb35cb.key);
    v_4d37e3(v_fa53ec).toContain("personality_core");
    v_4d37e3(v_fa53ec).toContain("tone");
    v_4d37e3(v_fa53ec).toContain("speech_patterns");
  });
});

v_469bf2("loadSystemPersona", () => {
  v_23805a("loadSystemPersona returns parsed rules_text and blocklist array", async () => {
    const v_a1651b = v_c9c489.DB as unknown as v_8330bc;
    const v_b6c480 = await v_b60bdd(v_a1651b);
    v_4d37e3(typeof v_b6c480.rules_text).toBe("string");
    v_4d37e3(Array.isArray(v_b6c480.blocklist)).toBe(true);
  });

  v_23805a("loadSystemPersona has rules_text property even on fallback", async () => {
    const v_a1651b = v_c9c489.DB as unknown as v_8330bc;
    const v_b6c480 = await v_b60bdd(v_a1651b);
    v_4d37e3(v_b6c480).toHaveProperty("rules_text");
  });
});
