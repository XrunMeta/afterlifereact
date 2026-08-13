import { describe, it, expect } from "vitest";
import { env } from "cloudflare:test";
import { loadCloneProfiles, buildPersonaBundle, flattenAttrs, loadUserL2, claimL2OwnerFace, loadL2OwnerPersonId } from "../src/lib/personaBundle";
import { resolvePersona } from "../src/lib/personaResolver";
import type { Bindings } from "../src/lib/env";
const Edb = env as unknown as Bindings;

async function seedOnt(cloneId: number, userId: number, data: object) {
  await Edb.DB.prepare(
    "INSERT OR REPLACE INTO clone_ont (clone_id, user_id, data, updated_at) VALUES (?,?,?,unixepoch())",
  ).bind(cloneId, userId, JSON.stringify(data)).run();
  await Edb.KV_ONT.delete(`l2:${cloneId}:${userId}`);
}

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

describe("loadUserL2 — 학습 키 소비(E 핫픽스)", () => {
  it("relation/preference_personal/memories_personal 을 반환", async () => {
    await seedOnt(7101, 6101, {
      relation: "손녀", preference_personal: { coffee: "라떼" },
      memories_personal: ["여행 좋아함"], address: "서울", _meta: { rev: 2 },
    });
    const l2 = await loadUserL2(Edb.DB, 7101, 6101) as Record<string, unknown>;
    expect(l2.relation).toBe("손녀");
    expect(l2.preference_personal).toEqual({ coffee: "라떼" });
    expect(l2.memories_personal).toEqual(["여행 좋아함"]);
    expect(l2.address).toBeUndefined();   
    expect(l2._meta).toBeUndefined();
  });
  it("구 4필드도 계속 반환(union·하위호환)", async () => {
    await seedOnt(7102, 6102, { memory_summary: "이름: 철수", relation: "친구" });
    const l2 = await loadUserL2(Edb.DB, 7102, 6102) as Record<string, unknown>;
    expect(l2.memory_summary).toBe("이름: 철수");
    expect(l2.relation).toBe("친구");
  });
  it("빈 통화(학습 키 없음)면 null(회귀 0)", async () => {
    await seedOnt(7103, 6103, { address: "서울", _meta: { rev: 1 } });
    expect(await loadUserL2(Edb.DB, 7103, 6103)).toBeNull();
  });
  it("빈 배열/빈 객체만 있으면 null(memory.ts 스캐폴딩 기본값 회귀 방어)", async () => {
    await seedOnt(7104, 6104, { memories_personal: [], preference_personal: {}, address: "서울" });
    expect(await loadUserL2(Edb.DB, 7104, 6104)).toBeNull();
  });

  it("preference_history를 소비 화이트리스트로 통과", async () => {
    const cloneId = 900201, userId = 7;
    await env.DB.prepare("INSERT INTO clone_ont (clone_id, user_id, data) VALUES (?,?,?)")
      .bind(cloneId, userId, JSON.stringify({
        preference_personal: { 음료: "사이다" },
        preference_history: [{ key: "음료", from: "콜라", to: "사이다", at: "2026-07-05T00:00:00Z" }],
        _meta: { layer: "L2", rev: 2 },
      })).run();
    const l2 = await loadUserL2(env.DB, cloneId, userId);
    expect(l2?.preference_history).toEqual([
      { key: "음료", from: "콜라", to: "사이다", at: "2026-07-05T00:00:00Z" },
    ]);
  });
});

describe("resolvePersona — 학습 키 보존(E 핫픽스)", () => {
  it("L2 학습 키가 out 에 실린다", () => {
    const out = resolvePersona({
      l1: { tone: "다정함", displayName: "할머니" },
      l2: { relation: "손녀", preference_personal: { coffee: "라떼" }, memories_personal: ["여행"] },
    });
    expect(out.relation).toBe("손녀");
    expect(out.preference_personal).toEqual({ coffee: "라떼" });
    expect(out.memories_personal).toEqual(["여행"]);
    expect(out.tone).toBe("다정함");          
  });
});

describe("T-252 viewer 슬롯", () => {
  const l0 = { rules_text: "", blocklist: [] };

  it("viewer 를 주면 번들에 실린다", () => {
    const b = buildPersonaBundle(l0, { displayName: "코조" }, 1, { displayName: "지호" });
    expect(b.viewer.displayName).toBe("지호");
  });

  it("viewer 미지정이면 displayName 이 null 이다", () => {
    const b = buildPersonaBundle(l0, { displayName: "코조" }, 1);

    expect(b.viewer).toEqual({ displayName: null, ownerPersonId: null });
  });

  it("users.name 이 null 이면 null 을 그대로 방출한다", () => {
    const b = buildPersonaBundle(l0, { displayName: "코조" }, 1, { displayName: null });
    expect(b.viewer.displayName).toBeNull();
  });
});

describe("L2 owner face — claim/load", () => {
  it("주인이 없으면 지정되고, 이후 다른 person 이 가로채지 못한다", async () => {
    await seedOnt(7301, 6301, { relation_subtype: "아내" });

    expect(await claimL2OwnerFace(Edb.DB, 7301, 6301, 58)).toBe(true);
    expect(await loadL2OwnerPersonId(Edb.DB, 7301, 6301)).toBe(58);

    expect(await claimL2OwnerFace(Edb.DB, 7301, 6301, 99)).toBe(false);
    expect(await loadL2OwnerPersonId(Edb.DB, 7301, 6301)).toBe(58);
  });

  it("기존 L2 내용을 훼손하지 않는다", async () => {
    await seedOnt(7302, 6302, { relation_subtype: "아내", memories_personal: ["여행"] });
    await claimL2OwnerFace(Edb.DB, 7302, 6302, 60);
    const l2 = (await loadUserL2(Edb.DB, 7302, 6302)) as Record<string, unknown>;
    expect(l2.relation_subtype).toBe("아내");
    expect(l2.memories_personal).toEqual(["여행"]);
  });

  it("owner_person_id 는 프롬프트로 새지 않는다 — 라우팅용 메타값", async () => {
    await seedOnt(7303, 6303, { relation_subtype: "아내" });
    await claimL2OwnerFace(Edb.DB, 7303, 6303, 61);
    const l2 = (await loadUserL2(Edb.DB, 7303, 6303)) as Record<string, unknown>;
    expect(l2.owner_person_id).toBeUndefined();
  });

  it("clone_ont 행이 없으면 지정하지 않는다(설문 전)", async () => {
    expect(await claimL2OwnerFace(Edb.DB, 7304, 6304, 62)).toBe(false);
    expect(await loadL2OwnerPersonId(Edb.DB, 7304, 6304)).toBeNull();
  });

  it("미지정이면 null 을 돌려준다 — prethird 가 기존 경로로 떨어진다", async () => {
    await seedOnt(7305, 6305, { relation: "친구" });
    expect(await loadL2OwnerPersonId(Edb.DB, 7305, 6305)).toBeNull();
  });
});
