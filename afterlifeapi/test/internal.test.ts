import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

v_469bf2("internal turn 콜백", () => {
  v_23805a("ORCH_SECRET 검증 + call_sessions 존재 시 call_turns(clone) INSERT", async () => {

    await v_c9c489.DB.prepare(
      "INSERT INTO call_sessions (call_id, user_id, clone_id, started_at) VALUES (?,?,?,?)"
    ).bind("turn-c1", 1, 1, Date.now()).run();
    await v_c9c489.DB.prepare(
      "INSERT INTO call_turns (call_id, seq, role, text, created_at) VALUES (?,?,?,?,?)"
    ).bind("turn-c1", 1, "user", "안녕", Date.now()).run();
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${(v_c9c489 as { ORCH_SECRET: string }).ORCH_SECRET}`,
      },
      body: JSON.stringify({ role: "clone", text: "왔는가" }),
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_3ac7e7 = await v_c9c489.DB.prepare(
      "SELECT * FROM call_turns WHERE call_id=? AND role=?"
    ).bind("turn-c1", "clone").first() as { text: string; seq: number } | null;
    v_4d37e3(v_3ac7e7!.text).toBe("왔는가");
    v_4d37e3(v_3ac7e7!.seq).toBe(2);
  });

  v_23805a("존재하지 않는 call_id(고아) → 404, INSERT 안 함", async () => {
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${(v_c9c489 as { ORCH_SECRET: string }).ORCH_SECRET}`,
      },
      body: JSON.stringify({ role: "clone", text: "x" }),
    });
    v_4d37e3(v_8f00b9.status).toBe(404);
    const v_3ac7e7 = await v_c9c489.DB.prepare(
      "SELECT * FROM call_turns WHERE call_id=?"
    ).bind("ghost").first();
    v_4d37e3(v_3ac7e7).toBeNull();
  });

  v_23805a("role=user 수용 → call_turns(user) INSERT + seq 원자 채번", async () => {
    await v_c9c489.DB.prepare(
      "INSERT INTO call_sessions (call_id, user_id, clone_id, started_at) VALUES (?,?,?,?)"
    ).bind("turn-u1", 1, 1, Date.now()).run();
    const v_4f438a = (v_22da99, v_9b6134) =>
      v_1df298.fetch("http://localhost/oth-path", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(v_c9c489 as { ORCH_SECRET: string }).ORCH_SECRET}`,
        },
        body: JSON.stringify({ role: v_22da99, text: v_9b6134 }),
      });

    const v_2d1eeb = await v_4f438a("user", "이름 기억해");
    v_4d37e3(v_2d1eeb.status).toBe(200);
    const v_b96973 = await v_4f438a("clone", "그래 기억할게");
    v_4d37e3(v_b96973.status).toBe(200);

    const v_18b8bf = await v_c9c489.DB.prepare(
      "SELECT seq, role, text FROM call_turns WHERE call_id=? ORDER BY seq"
    ).bind("turn-u1").all<{ seq: number; role: string; text: string }>();
    v_4d37e3(v_18b8bf.results).toEqual([
      { seq: 1, role: "user", text: "이름 기억해" },
      { seq: 2, role: "clone", text: "그래 기억할게" },
    ]);
  });

  v_23805a("허용되지 않은 role → 400, INSERT 안 함", async () => {
    await v_c9c489.DB.prepare(
      "INSERT INTO call_sessions (call_id, user_id, clone_id, started_at) VALUES (?,?,?,?)"
    ).bind("turn-bad", 1, 1, Date.now()).run();
    for (const v_22da99 of ["system", "assistant", "", "CLONE"]) {
      const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(v_c9c489 as { ORCH_SECRET: string }).ORCH_SECRET}`,
        },
        body: JSON.stringify({ role: v_22da99, text: "x" }),
      });
      v_4d37e3(v_8f00b9.status, `role=${v_22da99}`).toBe(400);
    }
    const v_3ac7e7 = await v_c9c489.DB.prepare(
      "SELECT 1 FROM call_turns WHERE call_id=?"
    ).bind("turn-bad").first();
    v_4d37e3(v_3ac7e7).toBeNull();
  });

  v_23805a("role=user + 빈 텍스트 → 400", async () => {
    await v_c9c489.DB.prepare(
      "INSERT INTO call_sessions (call_id, user_id, clone_id, started_at) VALUES (?,?,?,?)"
    ).bind("turn-empty", 1, 1, Date.now()).run();
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${(v_c9c489 as { ORCH_SECRET: string }).ORCH_SECRET}`,
      },
      body: JSON.stringify({ role: "user", text: "   " }),
    });
    v_4d37e3(v_8f00b9.status).toBe(400);
  });

  v_23805a("role=user 도 존재하지 않는 call_id → 404, INSERT 안 함", async () => {
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${(v_c9c489 as { ORCH_SECRET: string }).ORCH_SECRET}`,
      },
      body: JSON.stringify({ role: "user", text: "x" }),
    });
    v_4d37e3(v_8f00b9.status).toBe(404);
    const v_3ac7e7 = await v_c9c489.DB.prepare(
      "SELECT 1 FROM call_turns WHERE call_id=?"
    ).bind("ghost-u").first();
    v_4d37e3(v_3ac7e7).toBeNull();
  });

  v_23805a("secret 불일치 → 401", async () => {
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer WRONG",
      },
      body: JSON.stringify({ role: "clone", text: "x" }),
    });
    v_4d37e3(v_8f00b9.status).toBe(401);
  });
});
