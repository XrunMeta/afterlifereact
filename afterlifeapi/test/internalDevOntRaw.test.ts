import { describe, it, expect } from "vitest";
import { env, SELF } from "cloudflare:test";
import type { Bindings } from "../src/lib/env";
const E = env as unknown as Bindings;
const SECRET = E.DEV_SECRET;   

async function seed(cloneId: number, userId: number) {

  await E.DB.prepare(
    `INSERT OR IGNORE INTO users (id, email, password_hash, name, created_at)
     VALUES (?, ?, 'x', 'TestUser', CURRENT_TIMESTAMP)`,
  ).bind(userId, `testuser${userId}@test.test`).run();
  await E.DB.prepare(
    `INSERT OR REPLACE INTO clones (id, owner_id, name, username, clone_type, visibility, l1_profile)
     VALUES (?,?,?,?,?,?,?)`,
  ).bind(cloneId, userId, "테스트클론", `u${cloneId}`, "memlow", "public", JSON.stringify({ tone: "다정함" })).run();
  await E.DB.prepare("INSERT OR REPLACE INTO clone_ont (clone_id, user_id, data, updated_at) VALUES (?,?,?,unixepoch())")
    .bind(cloneId, userId, JSON.stringify({ relation: "손녀", address: "서울", _meta: { rev: 3 } })).run();
  await E.KV_ONT.delete(`l2:${cloneId}:${userId}`);
}
const get = (id: number, uid: number, tok?: string) =>
  SELF.fetch(`https://x/oth-path${id}/ont-raw?userId=${uid}`, {
    headers: tok ? { Authorization: `Bearer ${tok}` } : {},
  });

describe("GET /oth-path", () => {
  it("DEV_SECRET 정상 → data 원문+l1_profile+l2_consumed", async () => {
    await seed(7301, 6301);
    const r = await get(7301, 6301, SECRET);
    expect(r.status).toBe(200);
    const b = await r.json() as any;
    expect(b.data.relation).toBe("손녀");
    expect(b.data.address).toBe("서울");           
    expect(b.data._meta.rev).toBe(3);
    expect(b.l1_profile.tone).toBe("다정함");
    expect(b.l2_consumed.relation).toBe("손녀");    
    expect(b.l2_consumed.address).toBeUndefined();  
  });
  it("시크릿 불일치 → 401", async () => {
    await seed(7302, 6302);
    expect((await get(7302, 6302, "wrong")).status).toBe(401);
  });
  it("시크릿 없음 → 401", async () => {
    expect((await get(7302, 6302)).status).toBe(401);
  });
  it("userId 누락 → 400", async () => {
    const r = await SELF.fetch(`https://x/oth-path`, { headers: { Authorization: `Bearer ${SECRET}` } });
    expect(r.status).toBe(400);
  });
});
