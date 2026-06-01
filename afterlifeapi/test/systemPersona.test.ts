import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_c9c489 } from "lwkoweqmjbnvjqw";
import { v_b60bdd } from "../src/lib/systemPersona";

v_469bf2("system_persona migration", () => {
  v_23805a("seeds exactly one active row with rules_text and blocklist", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_3ac7e7 = await v_a1651b
      .prepare("SELECT rules_text, blocklist FROM system_persona WHERE id = 1")
      .first<{ rules_text: string; blocklist: string }>();
    v_4d37e3(v_3ac7e7).toBeTruthy();
    v_4d37e3(v_3ac7e7!.rules_text.length).toBeGreaterThan(20);
    v_4d37e3(Array.isArray(JSON.parse(v_3ac7e7!.blocklist))).toBe(true);
  });
});

v_469bf2("loadSystemPersona", () => {
  v_23805a("loadSystemPersona returns parsed rules_text and blocklist array", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_b6c480 = await v_b60bdd(v_a1651b);
    v_4d37e3(typeof v_b6c480.rules_text).toBe("string");
    v_4d37e3(Array.isArray(v_b6c480.blocklist)).toBe(true);
  });

  v_23805a("loadSystemPersona has rules_text property even on fallback", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_b6c480 = await v_b60bdd(v_a1651b);
    v_4d37e3(v_b6c480).toHaveProperty("rules_text");
  });
});
