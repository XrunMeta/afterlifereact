import { describe, it, expect } from "vitest";
import { env, SELF } from "cloudflare:test";
import type { Bindings } from "../src/lib/env";
const E = env as unknown as Bindings;
const SECRET = E.DEV_SECRET; 

async function seed(cloneId: number, userId: number, data: object) {

  await E.DB.prepare(
    `INSERT OR IGNORE INTO users (id, email, password_hash, name, created_at)
     VALUES (?, ?, 'x', 'TestUser', CURRENT_TIMESTAMP)`,
  ).bind(userId, `testuser${userId}@test.test`).run();
  await E.DB.prepare(
    `INSERT OR REPLACE INTO clones (id, owner_id, name, username, clone_type, visibility, l1_profile)
     VALUES (?,?,?,?,?,?,?)`,
  ).bind(cloneId, userId, "테스트클론", `u${cloneId}`, "memlow", "public", JSON.stringify({ tone: "다정함" })).run();
  await E.DB.prepare(
    "INSERT OR REPLACE INTO clone_ont (clone_id, user_id, data, updated_at) VALUES (?,?,?,unixepoch())",
  ).bind(cloneId, userId, JSON.stringify(data)).run();
  await E.KV_ONT.delete(`l2:${cloneId}:${userId}`);
}

function post(id: number, body: unknown, tok?: string) {
  return SELF.fetch(`https://x/oth-path${id}/ont-merge`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(tok ? { Authorization: `Bearer ${tok}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

describe("POST /oth-path", () => {
  it("시크릿 없음 → 401", async () => {
    const r = await post(7401, { userId: 6401, extracted: {}, source: "call" });
    expect(r.status).toBe(401);
  });

  it("시크릿 불일치 → 401", async () => {
    const r = await post(7401, { userId: 6401, extracted: {}, source: "call" }, "wrong");
    expect(r.status).toBe(401);
  });

  it("정상 병합 → 200 + rev 증가 + data 반영", async () => {
    await seed(7402, 6402, {
      preference_personal: { 음료: "사이다" },
      relation: "친구",
      memories_personal: [],
      _meta: { layer: "L2", rev: 5 },
    });
    const r = await post(
      7402,
      {
        userId: 6402,
        extracted: { preference_personal: { 음료: "콜라" }, relation: "손녀", memories_personal: ["콜라 좋아함"] },
        source: "call",
      },
      SECRET,
    );
    expect(r.status).toBe(200);
    const b = await r.json() as any;
    expect(b.skipped).toBe(false);
    expect(b.rev).toBe(6);
    expect(b.data.preference_personal.음료).toBe("콜라");
    expect(b.data.relation).toBe("손녀");
    expect(b.data.memories_personal).toEqual(["콜라 좋아함"]);
  });

  it("call_sessions/messages 상호작용 기록 없어도 200 (프로덕션 learn과 대비되는 핵심 케이스)", async () => {
    await seed(7403, 6403, { preference_personal: {}, _meta: { layer: "L2", rev: 0 } });

    const r = await post(
      7403,
      { userId: 6403, extracted: { relation: "이웃" }, source: "chat" },
      SECRET,
    );
    expect(r.status).toBe(200);
    const b = await r.json() as any;
    expect(b.skipped).toBe(false);
    expect(b.data.relation).toBe("이웃");
  });

  it("스키마 위반(userId 누락) → 400", async () => {
    const r = await post(7404, { extracted: { relation: "x" }, source: "call" }, SECRET);
    expect(r.status).toBe(400);
  });

  it("cloneId 비정수 → 400", async () => {
    const r = await SELF.fetch(`https://x/oth-path`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${SECRET}` },
      body: JSON.stringify({ userId: 6405, extracted: {}, source: "call" }),
    });
    expect(r.status).toBe(400);
  });

  it("존재하지 않는 userId → 404 + clone_ont write 안 됨(부작용 없음)", async () => {
    await seed(7406, 6406, { preference_personal: {}, _meta: { layer: "L2", rev: 0 } });
    const ghostUserId = 999406; 
    await E.DB.prepare("DELETE FROM clone_ont WHERE clone_id = ? AND user_id = ?")
      .bind(7406, ghostUserId).run();
    const r = await post(
      7406,
      { userId: ghostUserId, extracted: { relation: "손녀" }, source: "call" },
      SECRET,
    );
    expect(r.status).toBe(404);
    const b = await r.json() as any;
    expect(b.error).toBe("user_not_found");
    const row = await E.DB.prepare("SELECT 1 FROM clone_ont WHERE clone_id = ? AND user_id = ?")
      .bind(7406, ghostUserId).first();
    expect(row).toBeNull(); 
  });

  it("존재하지 않는 cloneId → 404 clone_not_found", async () => {
    const ghostCloneId = 999407; 
    const realUserId = 6407;

    await E.DB.prepare(
      `INSERT OR IGNORE INTO users (id, email, password_hash, name, created_at)
       VALUES (?, ?, 'x', 'TestUser', CURRENT_TIMESTAMP)`,
    ).bind(realUserId, `testuser${realUserId}@test.test`).run();
    const r = await post(
      ghostCloneId,
      { userId: realUserId, extracted: { relation: "손녀" }, source: "call" },
      SECRET,
    );
    expect(r.status).toBe(404);
    const b = await r.json() as any;
    expect(b.error).toBe("clone_not_found");
    const row = await E.DB.prepare("SELECT 1 FROM clone_ont WHERE clone_id = ?")
      .bind(ghostCloneId).first();
    expect(row).toBeNull();
  });
});
