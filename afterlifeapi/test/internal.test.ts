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

  v_23805a("2000자 초과 텍스트는 400 text_too_long 이고 아무것도 저장하지 않는다", async () => {
    await v_c9c489.DB.prepare(
      "INSERT INTO call_sessions (call_id, user_id, clone_id, started_at) VALUES (?,?,?,?)"
    ).bind("turn-long", 1, 1, Date.now()).run();
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${(v_c9c489 as { ORCH_SECRET: string }).ORCH_SECRET}`,
      },
      body: JSON.stringify({ role: "user", text: "가".repeat(2001) }),
    });
    v_4d37e3(v_8f00b9.status).toBe(400);
    v_4d37e3(await v_8f00b9.json()).toEqual({ error: "text_too_long" });
    const v_3ac7e7 = await v_c9c489.DB.prepare(
      "SELECT * FROM call_turns WHERE call_id=?"
    ).bind("turn-long").first();
    v_4d37e3(v_3ac7e7).toBeNull();
  });

  v_23805a("정확히 2000자는 통과한다(경계)", async () => {
    await v_c9c489.DB.prepare(
      "INSERT INTO call_sessions (call_id, user_id, clone_id, started_at) VALUES (?,?,?,?)"
    ).bind("turn-edge", 1, 1, Date.now()).run();
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${(v_c9c489 as { ORCH_SECRET: string }).ORCH_SECRET}`,
      },
      body: JSON.stringify({ role: "user", text: "나".repeat(2000) }),
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_3ac7e7 = await v_c9c489.DB.prepare(
      "SELECT length(text) AS n FROM call_turns WHERE call_id=?"
    ).bind("turn-edge").first<{ n: number }>();
    v_4d37e3(v_3ac7e7?.n).toBe(2000);
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

  v_469bf2("speaker_person_id", () => {

    async function v_bdb39e(v_be62d3, v_6e0fd3) {
      await v_c9c489.DB.prepare(
        "INSERT INTO call_sessions (call_id, user_id, clone_id, started_at) VALUES (?,?,?,?)"
      ).bind(v_be62d3, 1, v_6e0fd3, Date.now()).run();
      const v_1c1268 = await v_c9c489.DB.prepare(
        "INSERT INTO persons (user_id, clone_id, display_name, created_at) VALUES (?,?,?,?) RETURNING id"
      ).bind(1, v_6e0fd3, `p-${v_be62d3}`, Date.now()).first<{ id: number }>();
      const v_a9cbf1 = await v_c9c489.DB.prepare(
        "INSERT INTO persons (user_id, clone_id, display_name, created_at) VALUES (?,?,?,?) RETURNING id"
      ).bind(1, v_6e0fd3 + 1000, `x-${v_be62d3}`, Date.now()).first<{ id: number }>();
      return { mine: v_1c1268!.id, other: v_a9cbf1!.id };
    }

    const v_4f438a = (v_be62d3, v_4d33b2) =>
      v_1df298.fetch(`http://localhost/oth-path${v_be62d3}/turn`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(v_c9c489 as { ORCH_SECRET: string }).ORCH_SECRET}`,
        },
        body: JSON.stringify(v_4d33b2),
      });

    const v_bc84d9 = (v_be62d3, v_1923e2) =>
      v_c9c489.DB.prepare(
        "SELECT speaker_person_id AS s FROM call_turns WHERE call_id=? AND seq=?"
      ).bind(v_be62d3, v_1923e2).first<{ s: number | null }>();

    v_23805a("같은 클론 소속 person → user 턴에 화자가 붙는다", async () => {
      const { mine: v_1c1268 } = await v_bdb39e("spk-ok", 7001);
      const v_8f00b9 = await v_4f438a("spk-ok", { role: "user", text: "나 왔어", speakerPersonId: v_1c1268 });
      v_4d37e3(v_8f00b9.status).toBe(200);
      v_4d37e3((await v_bc84d9("spk-ok", 1))?.s).toBe(v_1c1268);
    });

    v_23805a("clone 턴에는 붙지 않는다 — 말한 주체가 클론이므로 NULL", async () => {
      const { mine: v_1c1268 } = await v_bdb39e("spk-clone", 7002);
      const v_8f00b9 = await v_4f438a("spk-clone", { role: "clone", text: "그래", speakerPersonId: v_1c1268 });
      v_4d37e3(v_8f00b9.status).toBe(200);
      v_4d37e3((await v_bc84d9("spk-clone", 1))?.s).toBeNull();
    });

    v_23805a("없는 person id → 발화는 남고 화자만 NULL (FK 위반으로 기록을 잃지 않는다)", async () => {
      await v_bdb39e("spk-ghost", 7003);
      const v_8f00b9 = await v_4f438a("spk-ghost", { role: "user", text: "유령", speakerPersonId: 999999 });
      v_4d37e3(v_8f00b9.status).toBe(200);
      const v_3ac7e7 = await v_c9c489.DB.prepare(
        "SELECT text, speaker_person_id AS s FROM call_turns WHERE call_id=?"
      ).bind("spk-ghost").first<{ text: string; s: number | null }>();
      v_4d37e3(v_3ac7e7?.text).toBe("유령");
      v_4d37e3(v_3ac7e7?.s).toBeNull();
    });

    v_23805a("다른 클론 소속 person → NULL (타인 person 주입 차단)", async () => {
      const { other: v_a9cbf1 } = await v_bdb39e("spk-idor", 7004);
      const v_8f00b9 = await v_4f438a("spk-idor", { role: "user", text: "남의 사람", speakerPersonId: v_a9cbf1 });
      v_4d37e3(v_8f00b9.status).toBe(200);
      const v_3ac7e7 = await v_c9c489.DB.prepare(
        "SELECT text, speaker_person_id AS s FROM call_turns WHERE call_id=?"
      ).bind("spk-idor").first<{ text: string; s: number | null }>();
      v_4d37e3(v_3ac7e7?.text).toBe("남의 사람");
      v_4d37e3(v_3ac7e7?.s).toBeNull();
    });

    v_23805a("미전달/비정수 → NULL (기존 호출자 회귀 0)", async () => {
      await v_bdb39e("spk-none", 7005);
      v_4d37e3((await v_4f438a("spk-none", { role: "user", text: "없음" })).status).toBe(200);
      v_4d37e3((await v_4f438a("spk-none", { role: "user", text: "문자열", speakerPersonId: "42" })).status).toBe(200);
      v_4d37e3((await v_bc84d9("spk-none", 1))?.s).toBeNull();
      v_4d37e3((await v_bc84d9("spk-none", 2))?.s).toBeNull();
    });
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
