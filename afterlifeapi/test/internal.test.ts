import { describe, it, expect } from "vitest";
import { SELF, env } from "cloudflare:test";

describe("internal turn 콜백", () => {
  it("ORCH_SECRET 검증 + call_sessions 존재 시 call_turns(clone) INSERT", async () => {

    await env.DB.prepare(
      "INSERT INTO call_sessions (call_id, user_id, clone_id, started_at) VALUES (?,?,?,?)"
    ).bind("turn-c1", 1, 1, Date.now()).run();
    await env.DB.prepare(
      "INSERT INTO call_turns (call_id, seq, role, text, created_at) VALUES (?,?,?,?,?)"
    ).bind("turn-c1", 1, "user", "안녕", Date.now()).run();
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${(env as { ORCH_SECRET: string }).ORCH_SECRET}`,
      },
      body: JSON.stringify({ role: "clone", text: "왔는가" }),
    });
    expect(res.status).toBe(200);
    const row = await env.DB.prepare(
      "SELECT * FROM call_turns WHERE call_id=? AND role=?"
    ).bind("turn-c1", "clone").first() as { text: string; seq: number } | null;
    expect(row!.text).toBe("왔는가");
    expect(row!.seq).toBe(2);
  });

  it("존재하지 않는 call_id(고아) → 404, INSERT 안 함", async () => {
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${(env as { ORCH_SECRET: string }).ORCH_SECRET}`,
      },
      body: JSON.stringify({ role: "clone", text: "x" }),
    });
    expect(res.status).toBe(404);
    const row = await env.DB.prepare(
      "SELECT * FROM call_turns WHERE call_id=?"
    ).bind("ghost").first();
    expect(row).toBeNull();
  });

  it("secret 불일치 → 401", async () => {
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer WRONG",
      },
      body: JSON.stringify({ role: "clone", text: "x" }),
    });
    expect(res.status).toBe(401);
  });
});
