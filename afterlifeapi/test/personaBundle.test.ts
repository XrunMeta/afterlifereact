import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_c9c489 } from "lwkoweqmjbnvjqw";
import { v_db508f, v_445ba7, v_56dc8c, v_20b0e8 } from "../src/lib/personaBundle";
import { v_24564b } from "../src/lib/personaResolver";
import type { v_273a0c } from "../src/lib/env";
const v_7ac368 = v_c9c489 as unknown as v_273a0c;

async function v_81e28f(v_6e0fd3, v_43e90c, v_9390e8) {
  await v_7ac368.DB.prepare(
    "INSERT OR REPLACE INTO clone_ont (clone_id, user_id, data, updated_at) VALUES (?,?,?,unixepoch())",
  ).bind(v_6e0fd3, v_43e90c, JSON.stringify(v_9390e8)).run();
  await v_7ac368.KV_ONT.delete(`l2:${v_6e0fd3}:${v_43e90c}`);
}

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

  v_23805a("flattenAttrs lets top-level core win over attrs on key conflict", () => {
    const v_15168d = v_56dc8c({ personality_core: "핵심", attrs: { personality_core: "덮어쓰기시도", age: "60대" } });
    v_4d37e3((v_15168d as any).personality_core).toBe("핵심"); 
    v_4d37e3((v_15168d as any).age).toBe("60대");              
  });

  v_23805a("flattenAttrs returns null for null, passes through when no attrs", () => {
    v_4d37e3(v_56dc8c(null)).toBeNull();
    v_4d37e3(v_56dc8c({ tone: "다정" })).toEqual({ tone: "다정" });
  });
});

v_469bf2("loadUserL2 — 학습 키 소비(E 핫픽스)", () => {
  v_23805a("relation/preference_personal/memories_personal 을 반환", async () => {
    await v_81e28f(7101, 6101, {
      relation: "손녀", preference_personal: { coffee: "라떼" },
      memories_personal: ["여행 좋아함"], address: "서울", _meta: { rev: 2 },
    });
    const v_1af19b = await v_20b0e8(v_7ac368.DB, 7101, 6101) as Record<string, unknown>;
    v_4d37e3(v_1af19b.relation).toBe("손녀");
    v_4d37e3(v_1af19b.preference_personal).toEqual({ coffee: "라떼" });
    v_4d37e3(v_1af19b.memories_personal).toEqual(["여행 좋아함"]);
    v_4d37e3(v_1af19b.address).toBeUndefined();   
    v_4d37e3(v_1af19b._meta).toBeUndefined();
  });
  v_23805a("구 4필드도 계속 반환(union·하위호환)", async () => {
    await v_81e28f(7102, 6102, { memory_summary: "이름: 철수", relation: "친구" });
    const v_1af19b = await v_20b0e8(v_7ac368.DB, 7102, 6102) as Record<string, unknown>;
    v_4d37e3(v_1af19b.memory_summary).toBe("이름: 철수");
    v_4d37e3(v_1af19b.relation).toBe("친구");
  });
  v_23805a("빈 통화(학습 키 없음)면 null(회귀 0)", async () => {
    await v_81e28f(7103, 6103, { address: "서울", _meta: { rev: 1 } });
    v_4d37e3(await v_20b0e8(v_7ac368.DB, 7103, 6103)).toBeNull();
  });
  v_23805a("빈 배열/빈 객체만 있으면 null(memory.ts 스캐폴딩 기본값 회귀 방어)", async () => {
    await v_81e28f(7104, 6104, { memories_personal: [], preference_personal: {}, address: "서울" });
    v_4d37e3(await v_20b0e8(v_7ac368.DB, 7104, 6104)).toBeNull();
  });
});

v_469bf2("resolvePersona — 학습 키 보존(E 핫픽스)", () => {
  v_23805a("L2 학습 키가 out 에 실린다", () => {
    const v_8d4337 = v_24564b({
      l1: { tone: "다정함", displayName: "할머니" },
      l2: { relation: "손녀", preference_personal: { coffee: "라떼" }, memories_personal: ["여행"] },
    });
    v_4d37e3(v_8d4337.relation).toBe("손녀");
    v_4d37e3(v_8d4337.preference_personal).toEqual({ coffee: "라떼" });
    v_4d37e3(v_8d4337.memories_personal).toEqual(["여행"]);
    v_4d37e3(v_8d4337.tone).toBe("다정함");          
  });
});
