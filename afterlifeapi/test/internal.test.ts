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

  it("2000자 초과 텍스트는 400 text_too_long 이고 아무것도 저장하지 않는다", async () => {
    await env.DB.prepare(
      "INSERT INTO call_sessions (call_id, user_id, clone_id, started_at) VALUES (?,?,?,?)"
    ).bind("turn-long", 1, 1, Date.now()).run();
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${(env as { ORCH_SECRET: string }).ORCH_SECRET}`,
      },
      body: JSON.stringify({ role: "user", text: "가".repeat(2001) }),
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "text_too_long" });
    const row = await env.DB.prepare(
      "SELECT * FROM call_turns WHERE call_id=?"
    ).bind("turn-long").first();
    expect(row).toBeNull();
  });

  it("정확히 2000자는 통과한다(경계)", async () => {
    await env.DB.prepare(
      "INSERT INTO call_sessions (call_id, user_id, clone_id, started_at) VALUES (?,?,?,?)"
    ).bind("turn-edge", 1, 1, Date.now()).run();
    const res = await SELF.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${(env as { ORCH_SECRET: string }).ORCH_SECRET}`,
      },
      body: JSON.stringify({ role: "user", text: "나".repeat(2000) }),
    });
    expect(res.status).toBe(200);
    const row = await env.DB.prepare(
      "SELECT length(text) AS n FROM call_turns WHERE call_id=?"
    ).bind("turn-edge").first<{ n: number }>();
    expect(row?.n).toBe(2000);
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

  describe("speaker_person_id", () => {

    async function seed(callId: string, cloneId: number) {
      await env.DB.prepare(
        "INSERT INTO call_sessions (call_id, user_id, clone_id, started_at) VALUES (?,?,?,?)"
      ).bind(callId, 1, cloneId, Date.now()).run();
      const mine = await env.DB.prepare(
        "INSERT INTO persons (user_id, clone_id, display_name, created_at) VALUES (?,?,?,?) RETURNING id"
      ).bind(1, cloneId, `p-${callId}`, Date.now()).first<{ id: number }>();
      const other = await env.DB.prepare(
        "INSERT INTO persons (user_id, clone_id, display_name, created_at) VALUES (?,?,?,?) RETURNING id"
      ).bind(1, cloneId + 1000, `x-${callId}`, Date.now()).first<{ id: number }>();
      return { mine: mine!.id, other: other!.id };
    }

    const post = (callId: string, body: Record<string, unknown>) =>
      SELF.fetch(`http://localhost/oth-path${callId}/turn`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(env as { ORCH_SECRET: string }).ORCH_SECRET}`,
        },
        body: JSON.stringify(body),
      });

    const speakerOf = (callId: string, seq: number) =>
      env.DB.prepare(
        "SELECT speaker_person_id AS s FROM call_turns WHERE call_id=? AND seq=?"
      ).bind(callId, seq).first<{ s: number | null }>();

    it("같은 클론 소속 person → user 턴에 화자가 붙는다", async () => {
      const { mine } = await seed("spk-ok", 7001);
      const res = await post("spk-ok", { role: "user", text: "나 왔어", speakerPersonId: mine });
      expect(res.status).toBe(200);
      expect((await speakerOf("spk-ok", 1))?.s).toBe(mine);
    });

    it("clone 턴에는 붙지 않는다 — 말한 주체가 클론이므로 NULL", async () => {
      const { mine } = await seed("spk-clone", 7002);
      const res = await post("spk-clone", { role: "clone", text: "그래", speakerPersonId: mine });
      expect(res.status).toBe(200);
      expect((await speakerOf("spk-clone", 1))?.s).toBeNull();
    });

    it("없는 person id → 발화는 남고 화자만 NULL (FK 위반으로 기록을 잃지 않는다)", async () => {
      await seed("spk-ghost", 7003);
      const res = await post("spk-ghost", { role: "user", text: "유령", speakerPersonId: 999999 });
      expect(res.status).toBe(200);
      const row = await env.DB.prepare(
        "SELECT text, speaker_person_id AS s FROM call_turns WHERE call_id=?"
      ).bind("spk-ghost").first<{ text: string; s: number | null }>();
      expect(row?.text).toBe("유령");
      expect(row?.s).toBeNull();
    });

    it("다른 클론 소속 person → NULL (타인 person 주입 차단)", async () => {
      const { other } = await seed("spk-idor", 7004);
      const res = await post("spk-idor", { role: "user", text: "남의 사람", speakerPersonId: other });
      expect(res.status).toBe(200);
      const row = await env.DB.prepare(
        "SELECT text, speaker_person_id AS s FROM call_turns WHERE call_id=?"
      ).bind("spk-idor").first<{ text: string; s: number | null }>();
      expect(row?.text).toBe("남의 사람");
      expect(row?.s).toBeNull();
    });

    it("미전달/비정수 → NULL (기존 호출자 회귀 0)", async () => {
      await seed("spk-none", 7005);
      expect((await post("spk-none", { role: "user", text: "없음" })).status).toBe(200);
      expect((await post("spk-none", { role: "user", text: "문자열", speakerPersonId: "42" })).status).toBe(200);
      expect((await speakerOf("spk-none", 1))?.s).toBeNull();
      expect((await speakerOf("spk-none", 2))?.s).toBeNull();
    });
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
