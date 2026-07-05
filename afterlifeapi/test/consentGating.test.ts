import { describe, it, expect } from "vitest";
import { SELF, env } from "cloudflare:test";
import type { Bindings } from "../src/lib/env";

const E = env as unknown as Bindings;
const SECRET = "test-learn-secret"; 

async function seedCloneUserCall(cloneId: number, userId: number, consent: number) {
  await E.DB.prepare(
    `INSERT OR IGNORE INTO users (id, email, password_hash, name, created_at, call_learning_consent)
     VALUES (?, ?, 'x', 'U', CURRENT_TIMESTAMP, ?)`,
  ).bind(userId, `gate${userId}@test.test`, consent).run();
  await E.DB.prepare(
    `INSERT OR IGNORE INTO clones (id, owner_id, name, username, clone_type, visibility, created_at)
     VALUES (?, ?, 'CT', ?, 'memlow', 'public', CURRENT_TIMESTAMP)`,
  ).bind(cloneId, userId, `g${cloneId}`).run();
  await E.DB.prepare(
    `INSERT OR IGNORE INTO call_sessions (call_id, user_id, clone_id, started_at)
     VALUES (?, ?, ?, unixepoch())`,
  ).bind(`call-${cloneId}-${userId}`, userId, cloneId).run();
}

describe("l2/learn 동의 게이트", () => {
  it("미동의 user → skipped no_consent, 쓰기 없음", async () => {
    await seedCloneUserCall(9301, 8301, 0);
    await E.KV_ONT.delete("l2:9301:8301");
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST", headers: { Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json" },
      body: JSON.stringify({ userId: 8301, extracted: { relation: "친구" }, source: "call" }),
    });
    expect(res.status).toBe(200);
    const json = await res.json<{ skipped: boolean; reason?: string }>();
    expect(json.skipped).toBe(true);
    expect(json.reason).toBe("no_consent");
    const row = await E.DB.prepare("SELECT data FROM clone_ont WHERE clone_id=? AND user_id=?")
      .bind(9301, 8301).first();
    expect(row).toBeNull();
  });

  it("동의 user → 정상 학습", async () => {
    await seedCloneUserCall(9302, 8302, 1);
    await E.KV_ONT.delete("l2:9302:8302");
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST", headers: { Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json" },
      body: JSON.stringify({ userId: 8302, extracted: { relation: "친구" }, source: "call" }),
    });
    const json = await res.json<{ skipped: boolean }>();
    expect(json.skipped).toBe(false);
    const row = await E.DB.prepare("SELECT data FROM clone_ont WHERE clone_id=? AND user_id=?")
      .bind(9302, 8302).first();
    expect(row).toBeTruthy();
  });
});

describe("l2p/learn 동의 게이트", () => {
  it("등록 user 미동의 → skipped no_consent", async () => {
    await seedCloneUserCall(9303, 8303, 0);
    await E.DB.prepare(
      `INSERT OR IGNORE INTO persons (id, user_id, clone_id, display_name, created_at)
       VALUES (?, ?, ?, 'P', unixepoch())`,
    ).bind(6301, 8303, 9303).run();
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST", headers: { Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json" },
      body: JSON.stringify({ personId: 6301, extracted: { relation: "이웃" }, source: "call" }),
    });
    expect(res.status).toBe(200);
    const json = await res.json<{ skipped: boolean; reason?: string }>();
    expect(json.skipped).toBe(true);
    expect(json.reason).toBe("no_consent");
  });
});
