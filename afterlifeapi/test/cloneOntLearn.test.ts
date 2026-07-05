import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_c9c489 } from "lwkoweqmjbnvjqw";
import { v_1df298 } from "lwkoweqmjbnvjqw";
import { v_0ac5b7, v_3821c0, v_5729a9 } from "../src/lib/memoryStore";
import type { v_273a0c } from "../src/lib/env";

const v_9542f7 = v_c9c489 as unknown as v_273a0c;

async function v_1ef59f(v_6e0fd3, v_43e90c, v_9390e8) {
  await v_9542f7.DB.prepare(
    "INSERT OR REPLACE INTO clone_ont (clone_id, user_id, data, updated_at) VALUES (?, ?, ?, unixepoch())",
  ).bind(v_6e0fd3, v_43e90c, JSON.stringify(v_9390e8)).run();
  await v_9542f7.KV_ONT.delete(`l2:${v_6e0fd3}:${v_43e90c}`); 
}
async function v_f97f57(v_6e0fd3, v_43e90c): Promise<Record<string, unknown>> {
  await v_9542f7.KV_ONT.delete(`l2:${v_6e0fd3}:${v_43e90c}`);
  const v_479f05 = await v_3821c0(v_9542f7, v_6e0fd3, v_43e90c);
  return v_479f05 ? JSON.parse(v_479f05) : {};
}

v_469bf2("updateOntFromExtraction", () => {
  v_23805a("빈 추출이면 skip(쓰기·rev 증가 없음)", async () => {
    const v_cb35cb = await v_0ac5b7(v_9542f7, 9001, 8001, {}, "call");
    v_4d37e3(v_cb35cb).toEqual({ rev: 0, skipped: true });
    const v_1af19b = await v_f97f57(9001, 8001);
    v_4d37e3(v_1af19b).toEqual({}); 
  });

  v_23805a("preference 중복키 update + memories append+dedup + rev 증가", async () => {
    await v_1ef59f(9002, 8002, {
      preference_personal: { coffee: "라떼" },
      memories_personal: ["여행 좋아함"],
      relation: "친구",
      _meta: { layer: "L2", rev: 3 },
    });
    const v_cb35cb = await v_0ac5b7(v_9542f7, 9002, 8002, {
      preference_personal: { coffee: "아메리카노", music: "재즈" },
      memories_personal: ["여행 좋아함", "강아지 키움"],
    }, "call");
    v_4d37e3(v_cb35cb.skipped).toBe(false);
    v_4d37e3(v_cb35cb.rev).toBe(4);
    const v_1af19b = await v_f97f57(9002, 8002);
    v_4d37e3(v_1af19b.preference_personal).toEqual({ coffee: "아메리카노", music: "재즈" });
    v_4d37e3(v_1af19b.memories_personal).toEqual(["여행 좋아함", "강아지 키움"]); 
    v_4d37e3(v_1af19b.relation).toBe("친구"); 
    v_4d37e3((v_1af19b._meta as Record<string, unknown>).source).toBe("call");
    v_4d37e3((v_1af19b._meta as Record<string, unknown>).auto_learned_at).toBeTruthy();
  });

  v_23805a("통화/검증 L2 4필드(memory_summary 등) 보존", async () => {
    await v_1ef59f(9003, 8003, {
      preference_personal: {},
      memory_summary: "손녀와 자주 통화",
      relationship: "할머니-손녀",
      context: "명절",
      recent_topics: ["김장"],
      _meta: { layer: "L2", rev: 1 },
    });
    await v_0ac5b7(v_9542f7, 9003, 8003, { relation: "손녀" }, "call");
    const v_1af19b = await v_f97f57(9003, 8003);
    v_4d37e3(v_1af19b.memory_summary).toBe("손녀와 자주 통화");
    v_4d37e3(v_1af19b.relationship).toBe("할머니-손녀");
    v_4d37e3(v_1af19b.context).toBe("명절");
    v_4d37e3(v_1af19b.recent_topics).toEqual(["김장"]);
    v_4d37e3(v_1af19b.relation).toBe("손녀");
  });

  v_23805a("손상 JSON은 덮어쓰기", async () => {
    await v_9542f7.DB.prepare(
      "INSERT OR REPLACE INTO clone_ont (clone_id, user_id, data, updated_at) VALUES (?, ?, ?, unixepoch())",
    ).bind(9004, 8004, "{not json").run();
    await v_9542f7.KV_ONT.delete(`l2:9004:8004`);
    const v_cb35cb = await v_0ac5b7(v_9542f7, 9004, 8004, { relation: "친구" }, "call");
    v_4d37e3(v_cb35cb.skipped).toBe(false);
    const v_1af19b = await v_f97f57(9004, 8004);
    v_4d37e3(v_1af19b.relation).toBe("친구");
  });

  v_23805a("memories 50개 cap(오래된 것부터 drop)", async () => {
    const v_9acf41 = Array.from({ length: 50 }, (v_37eab7, v_ebec57) => `mem${v_ebec57}`);
    await v_1ef59f(9005, 8005, { memories_personal: v_9acf41, _meta: { rev: 0 } });
    await v_0ac5b7(v_9542f7, 9005, 8005, { memories_personal: ["mem-new"] }, "call");
    const v_1af19b = await v_f97f57(9005, 8005);
    const v_79fcca = v_1af19b.memories_personal as string[];
    v_4d37e3(v_79fcca.length).toBe(50);
    v_4d37e3(v_79fcca[v_79fcca.length - 1]).toBe("mem-new");
    v_4d37e3(v_79fcca).not.toContain("mem0"); 
  });

  v_23805a("relation 빈문자열/whitespace/null이면 보존(replace 안 함)", async () => {
    await v_1ef59f(9006, 8006, { relation: "친구", preference_personal: {}, _meta: { rev: 0 } });

    await v_0ac5b7(v_9542f7, 9006, 8006, { relation: "   ", memories_personal: ["m"] }, "call");
    let v_1af19b = await v_f97f57(9006, 8006);
    v_4d37e3(v_1af19b.relation).toBe("친구");
    await v_0ac5b7(v_9542f7, 9006, 8006, { relation: null, memories_personal: ["m2"] }, "call");
    v_1af19b = await v_f97f57(9006, 8006);
    v_4d37e3(v_1af19b.relation).toBe("친구"); 
  });

  v_23805a("preference 빈 객체만이면 skip", async () => {
    const v_cb35cb = await v_0ac5b7(v_9542f7, 9007, 8007, { preference_personal: {} }, "call");
    v_4d37e3(v_cb35cb).toEqual({ rev: 0, skipped: true });
    v_4d37e3(await v_f97f57(9007, 8007)).toEqual({});
  });

  v_23805a("memories 없이 preference만으로 16KB 초과면 throw", async () => {
    const v_fdfe85 = "x".repeat(20 * 1024); 
    await v_4d37e3(
      v_0ac5b7(v_9542f7, 9008, 8008, { preference_personal: { huge: v_fdfe85 } }, "call"),
    ).rejects.toThrow(/too large/);
  });

  v_23805a("rev가 숫자가 아니면 0으로 보고 1로 증가", async () => {
    await v_1ef59f(9009, 8009, { preference_personal: {}, _meta: { layer: "L2", rev: "abc" } });
    const v_cb35cb = await v_0ac5b7(v_9542f7, 9009, 8009, { relation: "이웃" }, "call");
    v_4d37e3(v_cb35cb.rev).toBe(1);
  });

  v_23805a("동일 memory 재추출 시 위치를 최신(끝)으로 갱신(dedup new 우선)", async () => {
    await v_1ef59f(9010, 8010, { memories_personal: ["a", "b", "c"], _meta: { rev: 0 } });
    await v_0ac5b7(v_9542f7, 9010, 8010, { memories_personal: ["a"] }, "call");
    const v_1af19b = await v_f97f57(9010, 8010);
    v_4d37e3(v_1af19b.memories_personal).toEqual(["b", "c", "a"]); 
  });

  v_23805a("자동학습 시 clone_ont.auto_learned_at 컬럼이 채워짐(숫자)", async () => {
    await v_1ef59f(9011, 8011, { preference_personal: {}, _meta: { layer: "L2", rev: 0 } });
    await v_0ac5b7(v_9542f7, 9011, 8011, { relation: "딸" }, "call");
    const v_3ac7e7 = await v_9542f7.DB.prepare(
      "SELECT auto_learned_at FROM clone_ont WHERE clone_id = ? AND user_id = ?",
    ).bind(9011, 8011).first<{ auto_learned_at: number | null }>();
    v_4d37e3(typeof v_3ac7e7?.auto_learned_at).toBe("number");
    v_4d37e3(v_3ac7e7!.auto_learned_at).toBeGreaterThan(0);
  });

  v_23805a("수동 PUT(markAutoLearned 미전달) 시 기존 auto_learned_at 보존(COALESCE)", async () => {

    await v_1ef59f(9012, 8012, { preference_personal: {}, _meta: { layer: "L2", rev: 0 } });
    await v_0ac5b7(v_9542f7, 9012, 8012, { relation: "아들" }, "call");
    const v_e98932 = await v_9542f7.DB.prepare(
      "SELECT auto_learned_at FROM clone_ont WHERE clone_id = ? AND user_id = ?",
    ).bind(9012, 8012).first<{ auto_learned_at: number | null }>();
    const v_67cd67 = v_e98932?.auto_learned_at;
    v_4d37e3(typeof v_67cd67).toBe("number");

    await v_5729a9(v_9542f7, 9012, 8012, JSON.stringify({ relation: "아들", preference_personal: {}, _meta: { layer: "L2", rev: 2 } }));
    const v_33efc5 = await v_9542f7.DB.prepare(
      "SELECT auto_learned_at FROM clone_ont WHERE clone_id = ? AND user_id = ?",
    ).bind(9012, 8012).first<{ auto_learned_at: number | null }>();
    v_4d37e3(v_33efc5?.auto_learned_at).toBe(v_67cd67); 
  });

  v_23805a("preference 값이 바뀌면 preference_history에 {key,from,to} 기록(토글 ON)", async () => {
    const v_9542f7 = { ...v_c9c489, L2_PREF_HISTORY_ENABLED: "1" } as unknown as v_273a0c;
    const v_6e0fd3 = 900101, v_43e90c = 5;
    await v_0ac5b7(v_9542f7, v_6e0fd3, v_43e90c, { preference_personal: { 음료: "콜라" } }, "call");
    await v_0ac5b7(v_9542f7, v_6e0fd3, v_43e90c, { preference_personal: { 음료: "사이다" } }, "call");
    const v_479f05 = await v_3821c0(v_9542f7, v_6e0fd3, v_43e90c);
    const v_9390e8 = JSON.parse(v_479f05!);
    v_4d37e3(v_9390e8.preference_personal).toEqual({ 음료: "사이다" });      
    v_4d37e3(v_9390e8.preference_history).toEqual([
      { key: "음료", from: "콜라", to: "사이다", at: v_4d37e3.any(String) },
    ]);
  });

  v_23805a("같은 값 재학습은 history 미기록", async () => {
    const v_9542f7 = { ...v_c9c489, L2_PREF_HISTORY_ENABLED: "1" } as unknown as v_273a0c;
    const v_6e0fd3 = 900102, v_43e90c = 5;
    await v_0ac5b7(v_9542f7, v_6e0fd3, v_43e90c, { preference_personal: { 음료: "콜라" } }, "call");
    await v_0ac5b7(v_9542f7, v_6e0fd3, v_43e90c, { preference_personal: { 음료: "콜라" } }, "call");
    const v_9390e8 = JSON.parse((await v_3821c0(v_9542f7, v_6e0fd3, v_43e90c))!);
    v_4d37e3(v_9390e8.preference_history ?? []).toEqual([]);
  });

  v_23805a("새 키(기존에 없던 항목)는 history 미기록", async () => {
    const v_9542f7 = { ...v_c9c489, L2_PREF_HISTORY_ENABLED: "1" } as unknown as v_273a0c;
    const v_6e0fd3 = 900103, v_43e90c = 5;
    await v_0ac5b7(v_9542f7, v_6e0fd3, v_43e90c, { preference_personal: { 음료: "콜라" } }, "call");
    const v_9390e8 = JSON.parse((await v_3821c0(v_9542f7, v_6e0fd3, v_43e90c))!);
    v_4d37e3(v_9390e8.preference_history ?? []).toEqual([]);
  });

  v_23805a("토글 OFF면 preference_history 미기록(회귀0)", async () => {
    const v_9542f7 = { ...v_c9c489, L2_PREF_HISTORY_ENABLED: "0" } as unknown as v_273a0c;
    const v_6e0fd3 = 900104, v_43e90c = 5;
    await v_0ac5b7(v_9542f7, v_6e0fd3, v_43e90c, { preference_personal: { 음료: "콜라" } }, "call");
    await v_0ac5b7(v_9542f7, v_6e0fd3, v_43e90c, { preference_personal: { 음료: "사이다" } }, "call");
    const v_9390e8 = JSON.parse((await v_3821c0(v_9542f7, v_6e0fd3, v_43e90c))!);
    v_4d37e3(v_9390e8.preference_history).toBeUndefined();
    v_4d37e3(v_9390e8.preference_personal).toEqual({ 음료: "사이다" });
  });

  v_23805a("memories 0개 + 큰 preference_history일 때 16KB 트림 루프가 history를 shift한다(throw 안 남)", async () => {
    const v_9542f7 = { ...v_c9c489, L2_PREF_HISTORY_ENABLED: "1" } as unknown as v_273a0c;
    const v_6e0fd3 = 900105, v_43e90c = 5;
    const v_6ea868 = "x".repeat(700);
    const v_bc5c08 = Array.from({ length: 20 }, () => ({
      key: "음료",
      from: v_6ea868,
      to: v_6ea868,
      at: new Date().toISOString(),
    }));
    await v_1ef59f(v_6e0fd3, v_43e90c, {
      preference_personal: { 음료: "콜라" },
      memories_personal: [], 
      preference_history: v_bc5c08, 
      _meta: { layer: "L2", rev: 0 },
    });
    const v_cb35cb = await v_0ac5b7(
      v_9542f7, v_6e0fd3, v_43e90c, { preference_personal: { 음료: "사이다" } }, "call",
    ); 
    v_4d37e3(v_cb35cb.skipped).toBe(false);
    const v_479f05 = await v_3821c0(v_9542f7, v_6e0fd3, v_43e90c);
    const v_9390e8 = JSON.parse(v_479f05!);
    v_4d37e3(v_479f05!.length).toBeLessThanOrEqual(16 * 1024);
    v_4d37e3((v_9390e8.preference_history as unknown[]).length).toBeLessThan(v_bc5c08.length + 1); 
  });

  v_23805a("preference_personal에 프로토타입 상속 키(constructor 등)가 있어도 own-property만 history 대상(구버그면 from에 함수가 샘)", async () => {
    const v_9542f7 = { ...v_c9c489, L2_PREF_HISTORY_ENABLED: "1" } as unknown as v_273a0c;
    const v_6e0fd3 = 900106, v_43e90c = 5;
    await v_1ef59f(v_6e0fd3, v_43e90c, {
      preference_personal: {}, 
      memories_personal: [],
      _meta: { layer: "L2", rev: 0 },
    });
    await v_0ac5b7(v_9542f7, v_6e0fd3, v_43e90c, {
      preference_personal: { constructor: "이상한값", toString: "다른값", 음료: "콜라" },
    }, "call");
    const v_a9ab58 = JSON.parse((await v_3821c0(v_9542f7, v_6e0fd3, v_43e90c))!);

    v_4d37e3(v_a9ab58.preference_history ?? []).toEqual([]);
    v_4d37e3(v_a9ab58.preference_personal).toEqual({ constructor: "이상한값", toString: "다른값", 음료: "콜라" });

    await v_0ac5b7(v_9542f7, v_6e0fd3, v_43e90c, {
      preference_personal: { constructor: "새이상한값2" },
    }, "call");
    const v_d3c584 = JSON.parse((await v_3821c0(v_9542f7, v_6e0fd3, v_43e90c))!);
    v_4d37e3(v_d3c584.preference_history).toEqual([
      { key: "constructor", from: "이상한값", to: "새이상한값2", at: v_4d37e3.any(String) },
    ]);
  });
});

v_469bf2("migration 0075", () => {
  v_23805a("clone_ont.auto_learned_at 컬럼 존재", async () => {
    const v_34d5e3 = await (v_c9c489 as unknown as v_273a0c).DB
      .prepare("PRAGMA table_info(clone_ont)")
      .all<{ name: string }>();
    v_4d37e3(v_34d5e3.results.some((v_cb35cb) => v_cb35cb.name === "auto_learned_at")).toBe(true);
  });
});

v_469bf2("POST /oth-path", () => {
  const v_7169b4 = "test-learn-secret"; 
  async function v_f18a65(v_6e0fd3, v_1badb6) {

    await (v_c9c489 as unknown as v_273a0c).DB.prepare(
      `INSERT OR IGNORE INTO users (id, email, password_hash, name, created_at, call_learning_consent)
       VALUES (?, ?, 'x', 'TestUser', CURRENT_TIMESTAMP, 1)`,
    ).bind(v_1badb6, `testuser${v_1badb6}@test.test`).run();
    await (v_c9c489 as unknown as v_273a0c).DB.prepare(
      `INSERT OR IGNORE INTO clones (id, owner_id, name, username, clone_type, visibility, created_at)
       VALUES (?, ?, 'CT', ?, 'memlow', 'public', CURRENT_TIMESTAMP)`,
    ).bind(v_6e0fd3, v_1badb6, `u${v_6e0fd3}`).run();
  }

  async function v_98daea(v_6e0fd3, v_43e90c) {
    await (v_c9c489 as unknown as v_273a0c).DB.prepare(
      `INSERT OR IGNORE INTO call_sessions (call_id, user_id, clone_id, started_at)
       VALUES (?, ?, ?, unixepoch())`,
    ).bind(`call-${v_6e0fd3}-${v_43e90c}`, v_43e90c, v_6e0fd3).run();
  }

  v_23805a("LEARN_SECRET 불일치면 401", async () => {
    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path", {
      method: "POST",
      headers: { Authorization: "Bearer wrong", "Content-Type": "application/json" },
      body: JSON.stringify({ userId: 8101, extracted: { relation: "친구" }, source: "call" }),
    });
    v_4d37e3(v_8f00b9.status).toBe(401);
  });

  v_23805a("정상 학습 → 200 + L2 반영 + auto_learned_at 갱신", async () => {
    await v_f18a65(9102, 8102);
    await v_98daea(9102, 8102); 
    await (v_c9c489 as unknown as v_273a0c).KV_ONT.delete("l2:9102:8102");
    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_7169b4}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: 8102,
        extracted: { preference_personal: { tea: "녹차" }, memories_personal: ["등산 좋아함"] },
        source: "call",
      }),
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_7ecfd1 = await v_8f00b9.json<{ ok: boolean; skipped: boolean; rev: number }>();
    v_4d37e3(v_7ecfd1.ok).toBe(true);
    v_4d37e3(v_7ecfd1.skipped).toBe(false);

    const v_3ac7e7 = await (v_c9c489 as unknown as v_273a0c).DB
      .prepare("SELECT data, auto_learned_at FROM clone_ont WHERE clone_id = ? AND user_id = ?")
      .bind(9102, 8102)
      .first<{ data: string; auto_learned_at: number | null }>();
    const v_1af19b = JSON.parse(v_3ac7e7!.data);
    v_4d37e3(v_1af19b.preference_personal).toEqual({ tea: "녹차" });
    v_4d37e3(v_3ac7e7!.auto_learned_at).toBeTypeOf("number");
  });

  v_23805a("빈 추출이면 skipped=true (rev 0)", async () => {
    await v_f18a65(9103, 8103);
    await v_98daea(9103, 8103); 
    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_7169b4}`, "Content-Type": "application/json" },
      body: JSON.stringify({ userId: 8103, extracted: {}, source: "call" }),
    });
    const v_7ecfd1 = await v_8f00b9.json<{ skipped: boolean }>();
    v_4d37e3(v_7ecfd1.skipped).toBe(true);
  });

  v_23805a("존재하지 않는 clone → 404", async () => {
    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_7169b4}`, "Content-Type": "application/json" },
      body: JSON.stringify({ userId: 8104, extracted: { relation: "x" }, source: "call" }),
    });
    v_4d37e3(v_8f00b9.status).toBe(404);
  });

  v_23805a("스키마 위반(userId 누락) → 400", async () => {
    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_7169b4}`, "Content-Type": "application/json" },
      body: JSON.stringify({ extracted: { relation: "x" }, source: "call" }),
    });
    v_4d37e3(v_8f00b9.status).toBe(400);
  });

  v_23805a("call_sessions 기록 없는 userId → 403 no_interaction", async () => {
    await v_f18a65(9106, 8106);

    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_7169b4}`, "Content-Type": "application/json" },
      body: JSON.stringify({ userId: 8106, extracted: { relation: "친구" }, source: "call" }),
    });
    v_4d37e3(v_8f00b9.status).toBe(403);
    const v_7ecfd1 = await v_8f00b9.json<{ error: string }>();
    v_4d37e3(v_7ecfd1.error).toBe("no_interaction");
  });
});
