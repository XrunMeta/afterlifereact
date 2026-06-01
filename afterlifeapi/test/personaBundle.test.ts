import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_c9c489 } from "lwkoweqmjbnvjqw";
import { v_db508f, v_445ba7 } from "../src/lib/personaBundle";

v_469bf2("personaBundle", () => {
  v_23805a("loadCloneProfiles parses l1/l2 JSON, null when absent", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    await v_a1651b.prepare("INSERT OR IGNORE INTO users (id,email,password_hash,name,created_at) VALUES (80,'p@t','x','P',CURRENT_TIMESTAMP)").run();
    await v_a1651b.prepare("INSERT INTO clones (owner_id,name,username,clone_type,visibility,l1_profile) VALUES (80,'C','pbclone','friend','public',?)")
      .bind(JSON.stringify({ tone: "다정", personality_core: "낙천" })).run();
    const v_389afb = (await v_a1651b.prepare("SELECT id FROM clones WHERE username='pbclone'").first<{id:number}>())!.id;
    const { l1: v_020b4b, l2: v_1af19b } = await v_db508f(v_a1651b, v_389afb);
    v_4d37e3((v_020b4b as any).tone).toBe("다정");
    v_4d37e3(v_1af19b).toBeNull();
  });

  v_23805a("buildPersonaBundle wraps l0 + resolved persona", () => {
    const v_79521f = v_445ba7({ rules_text: "규칙", blocklist: ["x"] }, { tone: "다정", personality_core: "낙천" }, 123);
    v_4d37e3(v_79521f.l0.rules_text).toBe("규칙");
    v_4d37e3(v_79521f.cloneId).toBe("123");
    v_4d37e3(v_79521f.persona.tone).toBe("다정");
  });
});
