import { describe, it, expect } from "vitest";
import { SELF, env } from "cloudflare:test";

const SECRET = (env as { LEARN_SECRET?: string }).LEARN_SECRET ?? "test-learn-secret";

async function seedCall(callId: string, startedAt: number) {
  await (env.DB as unknown as D1Database).prepare(
    `INSERT OR REPLACE INTO call_sessions (call_id, user_id, clone_id, persona_slug, started_at)
     VALUES (?, 8001, 9001, 'prethird', ?)`,
  ).bind(callId, startedAt).run();
}
async function getCall(callId: string) {
  return (env.DB as unknown as D1Database)
    .prepare("SELECT ended_at, duration_sec FROM call_sessions WHERE call_id = ?")
    .bind(callId).first<{ ended_at: number | null; duration_sec: number | null }>();
}

describe("POST /oth-path", () => {
  it("정상 — ended_at/duration_sec UPDATE", async () => {
    const cid = "aaaa11112222";
    await seedCall(cid, Date.now() - 5000);
    const res = await SELF.fetch(`https://x/oth-path${cid}/end`, {
      method: "POST", headers: { Authorization: `Bearer ${SECRET}` },
    });
    expect(res.status).toBe(200);
    const row = await getCall(cid);
    expect(row!.ended_at).not.toBeNull();
    expect(row!.duration_sec).toBeGreaterThanOrEqual(4);
  });

  it("멱등 — 이미 종료된 통화 재호출 시 ended_at 불변", async () => {
    const cid = "bbbb33334444";
    await seedCall(cid, Date.now() - 3000);
    await SELF.fetch(`https://x/oth-path${cid}/end`, {
      method: "POST", headers: { Authorization: `Bearer ${SECRET}` },
    });
    const first = await getCall(cid);
    await SELF.fetch(`https://x/oth-path${cid}/end`, {
      method: "POST", headers: { Authorization: `Bearer ${SECRET}` },
    });
    const second = await getCall(cid);
    expect(second!.ended_at).toBe(first!.ended_at);
  });

  it("무secret — 401", async () => {
    const res = await SELF.fetch(`https://x/oth-path`, { method: "POST" });
    expect(res.status).toBe(401);
  });

  it("미존재 call_id — 멱등 200", async () => {
    const res = await SELF.fetch(`https://x/oth-path`, {
      method: "POST", headers: { Authorization: `Bearer ${SECRET}` },
    });
    expect(res.status).toBe(200);
  });

  it("callId 형식 위반 — 멱등 200(미처리)", async () => {
    const res = await SELF.fetch(`https://x/oth-path!id/end`, {
      method: "POST", headers: { Authorization: `Bearer ${SECRET}` },
    });
    expect(res.status).toBe(200);
  });
});
