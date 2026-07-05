import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_c9c489, v_1df298 } from "lwkoweqmjbnvjqw";
import type { v_273a0c } from "../src/lib/env";
const v_9542f7 = v_c9c489 as unknown as v_273a0c;
const v_7169b4 = v_9542f7.DEV_SECRET; 

async function v_bdb39e(v_6e0fd3, v_43e90c, v_9390e8) {

  await v_9542f7.DB.prepare(
    `INSERT OR IGNORE INTO users (id, email, password_hash, name, created_at)
     VALUES (?, ?, 'x', 'TestUser', CURRENT_TIMESTAMP)`,
  ).bind(v_43e90c, `testuser${v_43e90c}@test.test`).run();
  await v_9542f7.DB.prepare(
    `INSERT OR REPLACE INTO clones (id, owner_id, name, username, clone_type, visibility, l1_profile)
     VALUES (?,?,?,?,?,?,?)`,
  ).bind(v_6e0fd3, v_43e90c, "테스트클론", `u${v_6e0fd3}`, "memlow", "public", JSON.stringify({ tone: "다정함" })).run();
  await v_9542f7.DB.prepare(
    "INSERT OR REPLACE INTO clone_ont (clone_id, user_id, data, updated_at) VALUES (?,?,?,unixepoch())",
  ).bind(v_6e0fd3, v_43e90c, JSON.stringify(v_9390e8)).run();
  await v_9542f7.KV_ONT.delete(`l2:${v_6e0fd3}:${v_43e90c}`);
}

function v_4f438a(v_389afb, v_4d33b2, v_ea333d) {
  return v_1df298.fetch(`https://x/oth-path${v_389afb}/ont-merge`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(v_ea333d ? { Authorization: `Bearer ${v_ea333d}` } : {}),
    },
    body: JSON.stringify(v_4d33b2),
  });
}

v_469bf2("POST /oth-path", () => {
  v_23805a("시크릿 없음 → 401", async () => {
    const v_cb35cb = await v_4f438a(7401, { userId: 6401, extracted: {}, source: "call" });
    v_4d37e3(v_cb35cb.status).toBe(401);
  });

  v_23805a("시크릿 불일치 → 401", async () => {
    const v_cb35cb = await v_4f438a(7401, { userId: 6401, extracted: {}, source: "call" }, "wrong");
    v_4d37e3(v_cb35cb.status).toBe(401);
  });

  v_23805a("정상 병합 → 200 + rev 증가 + data 반영", async () => {
    await v_bdb39e(7402, 6402, {
      preference_personal: { 음료: "사이다" },
      relation: "친구",
      memories_personal: [],
      _meta: { layer: "L2", rev: 5 },
    });
    const v_cb35cb = await v_4f438a(
      7402,
      {
        userId: 6402,
        extracted: { preference_personal: { 음료: "콜라" }, relation: "손녀", memories_personal: ["콜라 좋아함"] },
        source: "call",
      },
      v_7169b4,
    );
    v_4d37e3(v_cb35cb.status).toBe(200);
    const v_148ff6 = await v_cb35cb.json() as any;
    v_4d37e3(v_148ff6.skipped).toBe(false);
    v_4d37e3(v_148ff6.rev).toBe(6);
    v_4d37e3(v_148ff6.data.preference_personal.음료).toBe("콜라");
    v_4d37e3(v_148ff6.data.relation).toBe("손녀");
    v_4d37e3(v_148ff6.data.memories_personal).toEqual(["콜라 좋아함"]);
  });

  v_23805a("call_sessions/messages 상호작용 기록 없어도 200 (프로덕션 learn과 대비되는 핵심 케이스)", async () => {
    await v_bdb39e(7403, 6403, { preference_personal: {}, _meta: { layer: "L2", rev: 0 } });

    const v_cb35cb = await v_4f438a(
      7403,
      { userId: 6403, extracted: { relation: "이웃" }, source: "chat" },
      v_7169b4,
    );
    v_4d37e3(v_cb35cb.status).toBe(200);
    const v_148ff6 = await v_cb35cb.json() as any;
    v_4d37e3(v_148ff6.skipped).toBe(false);
    v_4d37e3(v_148ff6.data.relation).toBe("이웃");
  });

  v_23805a("스키마 위반(userId 누락) → 400", async () => {
    const v_cb35cb = await v_4f438a(7404, { extracted: { relation: "x" }, source: "call" }, v_7169b4);
    v_4d37e3(v_cb35cb.status).toBe(400);
  });

  v_23805a("cloneId 비정수 → 400", async () => {
    const v_cb35cb = await v_1df298.fetch(`https://x/oth-path`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${v_7169b4}` },
      body: JSON.stringify({ userId: 6405, extracted: {}, source: "call" }),
    });
    v_4d37e3(v_cb35cb.status).toBe(400);
  });

  v_23805a("존재하지 않는 userId → 404 + clone_ont write 안 됨(부작용 없음)", async () => {
    await v_bdb39e(7406, 6406, { preference_personal: {}, _meta: { layer: "L2", rev: 0 } });
    const v_87a83f = 999406; 
    await v_9542f7.DB.prepare("DELETE FROM clone_ont WHERE clone_id = ? AND user_id = ?")
      .bind(7406, v_87a83f).run();
    const v_cb35cb = await v_4f438a(
      7406,
      { userId: v_87a83f, extracted: { relation: "손녀" }, source: "call" },
      v_7169b4,
    );
    v_4d37e3(v_cb35cb.status).toBe(404);
    const v_148ff6 = await v_cb35cb.json() as any;
    v_4d37e3(v_148ff6.error).toBe("user_not_found");
    const v_3ac7e7 = await v_9542f7.DB.prepare("SELECT 1 FROM clone_ont WHERE clone_id = ? AND user_id = ?")
      .bind(7406, v_87a83f).first();
    v_4d37e3(v_3ac7e7).toBeNull(); 
  });

  v_23805a("존재하지 않는 cloneId → 404 clone_not_found", async () => {
    const v_45a91c = 999407; 
    const v_82b53c = 6407;

    await v_9542f7.DB.prepare(
      `INSERT OR IGNORE INTO users (id, email, password_hash, name, created_at)
       VALUES (?, ?, 'x', 'TestUser', CURRENT_TIMESTAMP)`,
    ).bind(v_82b53c, `testuser${v_82b53c}@test.test`).run();
    const v_cb35cb = await v_4f438a(
      v_45a91c,
      { userId: v_82b53c, extracted: { relation: "손녀" }, source: "call" },
      v_7169b4,
    );
    v_4d37e3(v_cb35cb.status).toBe(404);
    const v_148ff6 = await v_cb35cb.json() as any;
    v_4d37e3(v_148ff6.error).toBe("clone_not_found");
    const v_3ac7e7 = await v_9542f7.DB.prepare("SELECT 1 FROM clone_ont WHERE clone_id = ?")
      .bind(v_45a91c).first();
    v_4d37e3(v_3ac7e7).toBeNull();
  });
});
