import { describe, it, expect } from "vitest";
import { env } from "cloudflare:test";
import { SELF } from "cloudflare:test";
import { updateOntFromExtraction, readOnt, writeOnt } from "../src/lib/memoryStore";
import type { Bindings } from "../src/lib/env";

const E = env as unknown as Bindings;

async function seedL2(cloneId: number, userId: number, data: object) {
  await E.DB.prepare(
    "INSERT OR REPLACE INTO clone_ont (clone_id, user_id, data, updated_at) VALUES (?, ?, ?, unixepoch())",
  ).bind(cloneId, userId, JSON.stringify(data)).run();
  await E.KV_ONT.delete(`l2:${cloneId}:${userId}`); 
}
async function getL2(cloneId: number, userId: number): Promise<Record<string, unknown>> {
  await E.KV_ONT.delete(`l2:${cloneId}:${userId}`);
  const raw = await readOnt(E, cloneId, userId);
  return raw ? JSON.parse(raw) : {};
}

describe("updateOntFromExtraction", () => {
  it("빈 추출이면 skip(쓰기·rev 증가 없음)", async () => {
    const r = await updateOntFromExtraction(E, 9001, 8001, {}, "call");
    expect(r).toEqual({ rev: 0, skipped: true });
    const l2 = await getL2(9001, 8001);
    expect(l2).toEqual({}); 
  });

  it("preference 중복키 update + memories append+dedup + rev 증가", async () => {
    await seedL2(9002, 8002, {
      preference_personal: { coffee: "라떼" },
      memories_personal: ["여행 좋아함"],
      relation: "친구",
      _meta: { layer: "L2", rev: 3 },
    });
    const r = await updateOntFromExtraction(E, 9002, 8002, {
      preference_personal: { coffee: "아메리카노", music: "재즈" },
      memories_personal: ["여행 좋아함", "강아지 키움"],
    }, "call");
    expect(r.skipped).toBe(false);
    expect(r.rev).toBe(4);
    const l2 = await getL2(9002, 8002);
    expect(l2.preference_personal).toEqual({ coffee: "아메리카노", music: "재즈" });
    expect(l2.memories_personal).toEqual(["여행 좋아함", "강아지 키움"]); 
    expect(l2.relation).toBe("친구"); 
    expect((l2._meta as Record<string, unknown>).source).toBe("call");
    expect((l2._meta as Record<string, unknown>).auto_learned_at).toBeTruthy();
  });

  it("통화/검증 L2 4필드(memory_summary 등) 보존", async () => {
    await seedL2(9003, 8003, {
      preference_personal: {},
      memory_summary: "손녀와 자주 통화",
      relationship: "할머니-손녀",
      context: "명절",
      recent_topics: ["김장"],
      _meta: { layer: "L2", rev: 1 },
    });
    await updateOntFromExtraction(E, 9003, 8003, { relation: "손녀" }, "call");
    const l2 = await getL2(9003, 8003);
    expect(l2.memory_summary).toBe("손녀와 자주 통화");
    expect(l2.relationship).toBe("할머니-손녀");
    expect(l2.context).toBe("명절");
    expect(l2.recent_topics).toEqual(["김장"]);
    expect(l2.relation).toBe("손녀");
  });

  it("손상 JSON은 덮어쓰기", async () => {
    await E.DB.prepare(
      "INSERT OR REPLACE INTO clone_ont (clone_id, user_id, data, updated_at) VALUES (?, ?, ?, unixepoch())",
    ).bind(9004, 8004, "{not json").run();
    await E.KV_ONT.delete(`l2:9004:8004`);
    const r = await updateOntFromExtraction(E, 9004, 8004, { relation: "친구" }, "call");
    expect(r.skipped).toBe(false);
    const l2 = await getL2(9004, 8004);
    expect(l2.relation).toBe("친구");
  });

  it("memories 50개 cap(오래된 것부터 drop)", async () => {
    const many = Array.from({ length: 50 }, (_, i) => `mem${i}`);
    await seedL2(9005, 8005, { memories_personal: many, _meta: { rev: 0 } });
    await updateOntFromExtraction(E, 9005, 8005, { memories_personal: ["mem-new"] }, "call");
    const l2 = await getL2(9005, 8005);
    const mems = l2.memories_personal as string[];
    expect(mems.length).toBe(50);
    expect(mems[mems.length - 1]).toBe("mem-new");
    expect(mems).not.toContain("mem0"); 
  });

  it("relation 빈문자열/whitespace/null이면 보존(replace 안 함)", async () => {
    await seedL2(9006, 8006, { relation: "친구", preference_personal: {}, _meta: { rev: 0 } });

    await updateOntFromExtraction(E, 9006, 8006, { relation: "   ", memories_personal: ["m"] }, "call");
    let l2 = await getL2(9006, 8006);
    expect(l2.relation).toBe("친구");
    await updateOntFromExtraction(E, 9006, 8006, { relation: null, memories_personal: ["m2"] }, "call");
    l2 = await getL2(9006, 8006);
    expect(l2.relation).toBe("친구"); 
  });

  it("preference 빈 객체만이면 skip", async () => {
    const r = await updateOntFromExtraction(E, 9007, 8007, { preference_personal: {} }, "call");
    expect(r).toEqual({ rev: 0, skipped: true });
    expect(await getL2(9007, 8007)).toEqual({});
  });

  it("memories 없이 preference만으로 16KB 초과면 throw", async () => {
    const big = "x".repeat(20 * 1024); 
    await expect(
      updateOntFromExtraction(E, 9008, 8008, { preference_personal: { huge: big } }, "call"),
    ).rejects.toThrow(/too large/);
  });

  it("rev가 숫자가 아니면 0으로 보고 1로 증가", async () => {
    await seedL2(9009, 8009, { preference_personal: {}, _meta: { layer: "L2", rev: "abc" } });
    const r = await updateOntFromExtraction(E, 9009, 8009, { relation: "이웃" }, "call");
    expect(r.rev).toBe(1);
  });

  it("동일 memory 재추출 시 위치를 최신(끝)으로 갱신(dedup new 우선)", async () => {
    await seedL2(9010, 8010, { memories_personal: ["a", "b", "c"], _meta: { rev: 0 } });
    await updateOntFromExtraction(E, 9010, 8010, { memories_personal: ["a"] }, "call");
    const l2 = await getL2(9010, 8010);
    expect(l2.memories_personal).toEqual(["b", "c", "a"]); 
  });

  it("자동학습 시 clone_ont.auto_learned_at 컬럼이 채워짐(숫자)", async () => {
    await seedL2(9011, 8011, { preference_personal: {}, _meta: { layer: "L2", rev: 0 } });
    await updateOntFromExtraction(E, 9011, 8011, { relation: "딸" }, "call");
    const row = await E.DB.prepare(
      "SELECT auto_learned_at FROM clone_ont WHERE clone_id = ? AND user_id = ?",
    ).bind(9011, 8011).first<{ auto_learned_at: number | null }>();
    expect(typeof row?.auto_learned_at).toBe("number");
    expect(row!.auto_learned_at).toBeGreaterThan(0);
  });

  it("수동 PUT(markAutoLearned 미전달) 시 기존 auto_learned_at 보존(COALESCE)", async () => {

    await seedL2(9012, 8012, { preference_personal: {}, _meta: { layer: "L2", rev: 0 } });
    await updateOntFromExtraction(E, 9012, 8012, { relation: "아들" }, "call");
    const before = await E.DB.prepare(
      "SELECT auto_learned_at FROM clone_ont WHERE clone_id = ? AND user_id = ?",
    ).bind(9012, 8012).first<{ auto_learned_at: number | null }>();
    const stamp = before?.auto_learned_at;
    expect(typeof stamp).toBe("number");

    await writeOnt(E, 9012, 8012, JSON.stringify({ relation: "아들", preference_personal: {}, _meta: { layer: "L2", rev: 2 } }));
    const after = await E.DB.prepare(
      "SELECT auto_learned_at FROM clone_ont WHERE clone_id = ? AND user_id = ?",
    ).bind(9012, 8012).first<{ auto_learned_at: number | null }>();
    expect(after?.auto_learned_at).toBe(stamp); 
  });

  it("preference 값이 바뀌면 preference_history에 {key,from,to} 기록(토글 ON)", async () => {
    const E = { ...env, L2_PREF_HISTORY_ENABLED: "1" } as unknown as Bindings;
    const cloneId = 900101, userId = 5;
    await updateOntFromExtraction(E, cloneId, userId, { preference_personal: { 음료: "콜라" } }, "call");
    await updateOntFromExtraction(E, cloneId, userId, { preference_personal: { 음료: "사이다" } }, "call");
    const raw = await readOnt(E, cloneId, userId);
    const data = JSON.parse(raw!);
    expect(data.preference_personal).toEqual({ 음료: "사이다" });      
    expect(data.preference_history).toEqual([
      { key: "음료", from: "콜라", to: "사이다", at: expect.any(String) },
    ]);
  });

  it("같은 값 재학습은 history 미기록", async () => {
    const E = { ...env, L2_PREF_HISTORY_ENABLED: "1" } as unknown as Bindings;
    const cloneId = 900102, userId = 5;
    await updateOntFromExtraction(E, cloneId, userId, { preference_personal: { 음료: "콜라" } }, "call");
    await updateOntFromExtraction(E, cloneId, userId, { preference_personal: { 음료: "콜라" } }, "call");
    const data = JSON.parse((await readOnt(E, cloneId, userId))!);
    expect(data.preference_history ?? []).toEqual([]);
  });

  it("새 키(기존에 없던 항목)는 history 미기록", async () => {
    const E = { ...env, L2_PREF_HISTORY_ENABLED: "1" } as unknown as Bindings;
    const cloneId = 900103, userId = 5;
    await updateOntFromExtraction(E, cloneId, userId, { preference_personal: { 음료: "콜라" } }, "call");
    const data = JSON.parse((await readOnt(E, cloneId, userId))!);
    expect(data.preference_history ?? []).toEqual([]);
  });

  it("토글 OFF면 preference_history 미기록(회귀0)", async () => {
    const E = { ...env, L2_PREF_HISTORY_ENABLED: "0" } as unknown as Bindings;
    const cloneId = 900104, userId = 5;
    await updateOntFromExtraction(E, cloneId, userId, { preference_personal: { 음료: "콜라" } }, "call");
    await updateOntFromExtraction(E, cloneId, userId, { preference_personal: { 음료: "사이다" } }, "call");
    const data = JSON.parse((await readOnt(E, cloneId, userId))!);
    expect(data.preference_history).toBeUndefined();
    expect(data.preference_personal).toEqual({ 음료: "사이다" });
  });

  it("memories 0개 + 큰 preference_history일 때 16KB 트림 루프가 history를 shift한다(throw 안 남)", async () => {
    const E = { ...env, L2_PREF_HISTORY_ENABLED: "1" } as unknown as Bindings;
    const cloneId = 900105, userId = 5;
    const bigVal = "x".repeat(700);
    const bigHistory = Array.from({ length: 20 }, () => ({
      key: "음료",
      from: bigVal,
      to: bigVal,
      at: new Date().toISOString(),
    }));
    await seedL2(cloneId, userId, {
      preference_personal: { 음료: "콜라" },
      memories_personal: [], 
      preference_history: bigHistory, 
      _meta: { layer: "L2", rev: 0 },
    });
    const r = await updateOntFromExtraction(
      E, cloneId, userId, { preference_personal: { 음료: "사이다" } }, "call",
    ); 
    expect(r.skipped).toBe(false);
    const raw = await readOnt(E, cloneId, userId);
    const data = JSON.parse(raw!);
    expect(raw!.length).toBeLessThanOrEqual(16 * 1024);
    expect((data.preference_history as unknown[]).length).toBeLessThan(bigHistory.length + 1); 
  });

  it("preference_personal에 프로토타입 상속 키(constructor 등)가 있어도 own-property만 history 대상(구버그면 from에 함수가 샘)", async () => {
    const E = { ...env, L2_PREF_HISTORY_ENABLED: "1" } as unknown as Bindings;
    const cloneId = 900106, userId = 5;
    await seedL2(cloneId, userId, {
      preference_personal: {}, 
      memories_personal: [],
      _meta: { layer: "L2", rev: 0 },
    });
    await updateOntFromExtraction(E, cloneId, userId, {
      preference_personal: { constructor: "이상한값", toString: "다른값", 음료: "콜라" },
    }, "call");
    const data1 = JSON.parse((await readOnt(E, cloneId, userId))!);

    expect(data1.preference_history ?? []).toEqual([]);
    expect(data1.preference_personal).toEqual({ constructor: "이상한값", toString: "다른값", 음료: "콜라" });

    await updateOntFromExtraction(E, cloneId, userId, {
      preference_personal: { constructor: "새이상한값2" },
    }, "call");
    const data2 = JSON.parse((await readOnt(E, cloneId, userId))!);
    expect(data2.preference_history).toEqual([
      { key: "constructor", from: "이상한값", to: "새이상한값2", at: expect.any(String) },
    ]);
  });
});

describe("migration 0075", () => {
  it("clone_ont.auto_learned_at 컬럼 존재", async () => {
    const info = await (env as unknown as Bindings).DB
      .prepare("PRAGMA table_info(clone_ont)")
      .all<{ name: string }>();
    expect(info.results.some((r) => r.name === "auto_learned_at")).toBe(true);
  });
});

describe("POST /oth-path", () => {
  const SECRET = "test-learn-secret"; 
  async function seedCloneRow(cloneId: number, ownerId: number) {

    await (env as unknown as Bindings).DB.prepare(
      `INSERT OR IGNORE INTO users (id, email, password_hash, name, created_at)
       VALUES (?, ?, 'x', 'TestUser', CURRENT_TIMESTAMP)`,
    ).bind(ownerId, `testuser${ownerId}@test.test`).run();
    await (env as unknown as Bindings).DB.prepare(
      `INSERT OR IGNORE INTO clones (id, owner_id, name, username, clone_type, visibility, created_at)
       VALUES (?, ?, 'CT', ?, 'memlow', 'public', CURRENT_TIMESTAMP)`,
    ).bind(cloneId, ownerId, `u${cloneId}`).run();
  }

  async function seedCall(cloneId: number, userId: number) {
    await (env as unknown as Bindings).DB.prepare(
      `INSERT OR IGNORE INTO call_sessions (call_id, user_id, clone_id, started_at)
       VALUES (?, ?, ?, unixepoch())`,
    ).bind(`call-${cloneId}-${userId}`, userId, cloneId).run();
  }

  it("LEARN_SECRET 불일치면 401", async () => {
    const res = await SELF.fetch("https://x/oth-path", {
      method: "POST",
      headers: { Authorization: "Bearer wrong", "Content-Type": "application/json" },
      body: JSON.stringify({ userId: 8101, extracted: { relation: "친구" }, source: "call" }),
    });
    expect(res.status).toBe(401);
  });

  it("정상 학습 → 200 + L2 반영 + auto_learned_at 갱신", async () => {
    await seedCloneRow(9102, 8102);
    await seedCall(9102, 8102); 
    await (env as unknown as Bindings).KV_ONT.delete("l2:9102:8102");
    const res = await SELF.fetch("https://x/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: 8102,
        extracted: { preference_personal: { tea: "녹차" }, memories_personal: ["등산 좋아함"] },
        source: "call",
      }),
    });
    expect(res.status).toBe(200);
    const json = await res.json<{ ok: boolean; skipped: boolean; rev: number }>();
    expect(json.ok).toBe(true);
    expect(json.skipped).toBe(false);

    const row = await (env as unknown as Bindings).DB
      .prepare("SELECT data, auto_learned_at FROM clone_ont WHERE clone_id = ? AND user_id = ?")
      .bind(9102, 8102)
      .first<{ data: string; auto_learned_at: number | null }>();
    const l2 = JSON.parse(row!.data);
    expect(l2.preference_personal).toEqual({ tea: "녹차" });
    expect(row!.auto_learned_at).toBeTypeOf("number");
  });

  it("빈 추출이면 skipped=true (rev 0)", async () => {
    await seedCloneRow(9103, 8103);
    await seedCall(9103, 8103); 
    const res = await SELF.fetch("https://x/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json" },
      body: JSON.stringify({ userId: 8103, extracted: {}, source: "call" }),
    });
    const json = await res.json<{ skipped: boolean }>();
    expect(json.skipped).toBe(true);
  });

  it("존재하지 않는 clone → 404", async () => {
    const res = await SELF.fetch("https://x/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json" },
      body: JSON.stringify({ userId: 8104, extracted: { relation: "x" }, source: "call" }),
    });
    expect(res.status).toBe(404);
  });

  it("스키마 위반(userId 누락) → 400", async () => {
    const res = await SELF.fetch("https://x/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json" },
      body: JSON.stringify({ extracted: { relation: "x" }, source: "call" }),
    });
    expect(res.status).toBe(400);
  });

  it("call_sessions 기록 없는 userId → 403 no_interaction", async () => {
    await seedCloneRow(9106, 8106);

    const res = await SELF.fetch("https://x/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json" },
      body: JSON.stringify({ userId: 8106, extracted: { relation: "친구" }, source: "call" }),
    });
    expect(res.status).toBe(403);
    const json = await res.json<{ error: string }>();
    expect(json.error).toBe("no_interaction");
  });
});
