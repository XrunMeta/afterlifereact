import { describe, it, expect } from "vitest";
import { env } from "cloudflare:test";
import { loadCloneProfiles, buildPersonaBundle, flattenAttrs } from "../src/lib/personaBundle";

describe("personaBundle", () => {
  it("loadCloneProfiles parses l1/l2 JSON, null when absent", async () => {
    const db = env.DB as unknown as D1Database;
    await db.prepare("INSERT OR IGNORE INTO users (id,email,password_hash,name,created_at) VALUES (80,'p@t','x','P',CURRENT_TIMESTAMP)").run();
    await db.prepare("INSERT INTO clones (owner_id,name,username,clone_type,visibility,l1_profile) VALUES (80,'C','pbclone','friend','public',?)")
      .bind(JSON.stringify({ tone: "다정", personality_core: "낙천" })).run();
    const id = (await db.prepare("SELECT id FROM clones WHERE username='pbclone'").first<{id:number}>())!.id;
    const { l1, l2 } = await loadCloneProfiles(db, id);
    expect((l1 as any).tone).toBe("다정");
    expect(l2).toBeNull();
  });

  it("buildPersonaBundle wraps l0 + resolved persona", () => {
    const bundle = buildPersonaBundle({ rules_text: "규칙", blocklist: ["x"] }, { tone: "다정", personality_core: "낙천" }, 123);
    expect(bundle.l0.rules_text).toBe("규칙");
    expect(bundle.cloneId).toBe("123");
    expect(bundle.persona.tone).toBe("다정");
  });

  it("flattenAttrs lets top-level core win over attrs on key conflict", () => {
    const flat = flattenAttrs({ personality_core: "핵심", attrs: { personality_core: "덮어쓰기시도", age: "60대" } });
    expect((flat as any).personality_core).toBe("핵심"); 
    expect((flat as any).age).toBe("60대");              
  });

  it("flattenAttrs returns null for null, passes through when no attrs", () => {
    expect(flattenAttrs(null)).toBeNull();
    expect(flattenAttrs({ tone: "다정" })).toEqual({ tone: "다정" });
  });
});
