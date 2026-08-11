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

  it("role=user 수용 → call_turns(user) INSERT + seq 원자 채번", async () => {
    await env.DB.prepare(
      "INSERT INTO call_sessions (call_id, user_id, clone_id, started_at) VALUES (?,?,?,?)"
    ).bind("turn-u1", 1, 1, Date.now()).run();
    const post = (role: string, text: string) =>
      SELF.fetch("http://localhost/oth-path", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(env as { ORCH_SECRET: string }).ORCH_SECRET}`,
        },
        body: JSON.stringify({ role, text }),
      });

    const r1 = await post("user", "이름 기억해");
    expect(r1.status).toBe(200);
    const r2 = await post("clone", "그래 기억할게");
    expect(r2.status).toBe(200);

    const rows = await env.DB.prepare(
      "SELECT seq, role, text FROM call_turns WHERE call_id=? ORDER BY seq"
    ).bind("turn-u1").all<{ seq: number; role: string; text: string }>();
    expect(rows.results).toEqual([
      { seq: 1, role: "user", text: "이름 기억해" },
      { seq: 2, role: "clone", text: "그래 기억할게" },
    ]);
  });

  it("허용되지 않은 role → 400, INSERT 안 함", async () => {
    await env.DB.prepare(
      "INSERT INTO call_sessions (call_id, user_id, clone_id, started_at) VALUES (?,?,?,?)"
    ).bind("turn-bad", 1, 1, Date.now()).run();
    for (const role of ["system", "assistant", "", "CLONE"]) {
      const res = await SELF.fetch("http://localhost/oth-path", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(env as { ORCH_SECRET: string }).ORCH_SECRET}`,
        },
        body: JSON.stringify({ role, text: "x" }),
      });
      expect(res.status, `role=${role}`).toBe(400);
    }
    const row = await env.DB.prepare(
      "SELECT 1 FROM call_turns WHERE call_id=?"
    ).bind("turn-bad").first();
    expect(row).toBeNull();
  });

  it("role=user + 빈 텍스트 → 400", async () => {
    await env.DB.prepare(
      "INSERT INTO call_sessions (call_id, user_id, clone_id, started_at) VALUES (?,?,?,?)"
    ).bind("turn-empty", 1, 1, Date.now()).run();
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${(env as { ORCH_SECRET: string }).ORCH_SECRET}`,
      },
      body: JSON.stringify({ role: "user", text: "   " }),
    });
    expect(res.status).toBe(400);
  });

  it("role=user 도 존재하지 않는 call_id → 404, INSERT 안 함", async () => {
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${(env as { ORCH_SECRET: string }).ORCH_SECRET}`,
      },
      body: JSON.stringify({ role: "user", text: "x" }),
    });
    expect(res.status).toBe(404);
    const row = await env.DB.prepare(
      "SELECT 1 FROM call_turns WHERE call_id=?"
    ).bind("ghost-u").first();
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
