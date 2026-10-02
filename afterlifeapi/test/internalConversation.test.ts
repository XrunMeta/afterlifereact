
import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

const v_8fe3be = () => (v_c9c489 as { ORCH_SECRET: string }).ORCH_SECRET;
const v_68f0aa = () => ({ Authorization: `Bearer ${v_8fe3be()}` });

async function v_98daea(v_be62d3, v_43e90c, v_6e0fd3, v_f6634c,
                        v_3035d9) {
  await v_c9c489.DB.prepare(
    "INSERT INTO call_sessions (call_id, user_id, clone_id, started_at) VALUES (?,?,?,?)"
  ).bind(v_be62d3, v_43e90c, v_6e0fd3, v_f6634c).run();
  let v_1923e2 = 0;
  for (const [v_22da99, v_9b6134] of v_3035d9) {
    v_1923e2 += 1;
    await v_c9c489.DB.prepare(
      "INSERT INTO call_turns (call_id, seq, role, text, created_at) VALUES (?,?,?,?,?)"
    ).bind(v_be62d3, v_1923e2, v_22da99, v_9b6134, v_f6634c + v_1923e2).run();
  }
}

type Turn = { callId: string; role: string; text: string; at: number };
async function v_aff13d(v_9fe22d, v_3f4675 = v_68f0aa()) {
  return v_1df298.fetch(`http://localhost/oth-path${v_9fe22d}`, { headers: v_3f4675 });
}

v_469bf2("GET /oth-path", () => {
  v_23805a("ORCH_SECRET 없으면 401", async () => {
    const v_8f00b9 = await v_aff13d("901/801", {});
    v_4d37e3(v_8f00b9.status).toBe(401);
  });

  v_23805a("이 계정×이 클론의 턴만, 통화 시작순·seq 순으로 돌려준다", async () => {
    await v_98daea("cv-a2", 901, 801, 2_000_000, [["user", "두번째 통화"], ["clone", "그래"]]);
    await v_98daea("cv-a1", 901, 801, 1_000_000, [["user", "첫 통화"], ["clone", "안녕"]]);
    await v_98daea("cv-other-user", 902, 801, 1_500_000, [["user", "남의 대화"]]);
    await v_98daea("cv-other-clone", 901, 802, 1_500_000, [["user", "다른 클론"]]);

    const v_8f00b9 = await v_aff13d("901/801");
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = await v_8f00b9.json() as { turns: Turn[]; resetAt: number };
    v_4d37e3(v_4d33b2.turns.map((v_8d41d7) => v_8d41d7.text)).toEqual(["첫 통화", "안녕", "두번째 통화", "그래"]);
    v_4d37e3(v_4d33b2.turns[0]).toMatchObject({ callId: "cv-a1", role: "user" });
    v_4d37e3(v_4d33b2.resetAt).toBe(0);
  });

  v_23805a("excludeCallId 로 지금 통화는 빼고, maxTurns 는 최근 쪽을 남긴다", async () => {
    await v_98daea("cv-b1", 903, 801, 1_000_000, [["user", "u1"], ["clone", "c1"], ["user", "u2"]]);
    await v_98daea("cv-b-now", 903, 801, 3_000_000, [["user", "지금"]]);

    const v_8f00b9 = await v_aff13d("903/801?excludeCallId=cv-b-now&maxTurns=2");
    const v_4d33b2 = await v_8f00b9.json() as { turns: Turn[] };
    v_4d37e3(v_4d33b2.turns.map((v_8d41d7) => v_8d41d7.text)).toEqual(["c1", "u2"]);
  });

  v_23805a("reset 이후 턴만 돌려준다 · reset 은 행을 지우지 않는다", async () => {
    await v_98daea("cv-c1", 904, 801, 1_000_000, [["user", "리허설"]]);
    const v_cb35cb = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST", headers: v_68f0aa(),
    });
    v_4d37e3(v_cb35cb.status).toBe(200);
    const { resetAt: v_b98b4f } = await v_cb35cb.json() as { resetAt: number };
    v_4d37e3(v_b98b4f).toBeGreaterThan(1_000_000);

    let v_4d33b2 = await (await v_aff13d("904/801")).json() as { turns: Turn[]; resetAt: number };
    v_4d37e3(v_4d33b2.turns).toEqual([]);
    v_4d37e3(v_4d33b2.resetAt).toBe(v_b98b4f);

    const v_145782 = await v_c9c489.DB.prepare("SELECT COUNT(*) AS n FROM call_turns WHERE call_id=?")
      .bind("cv-c1").first() as { n: number };
    v_4d37e3(v_145782.n).toBe(1);

    await v_98daea("cv-c2", 904, 801, v_b98b4f + 10, [["user", "본 시연"]]);
    v_4d33b2 = await (await v_aff13d("904/801")).json() as { turns: Turn[]; resetAt: number };
    v_4d37e3(v_4d33b2.turns.map((v_8d41d7) => v_8d41d7.text)).toEqual(["본 시연"]);
  });

  v_23805a("reset 직전 통화의 늦게 도착한 턴도 새지 않는다(통화 단위 컷오프)", async () => {
    await v_98daea("cv-d1", 906, 801, 1_000_000, [["user", "리허설"]]);
    const v_cb35cb = await v_1df298.fetch("http://localhost/oth-path", {
      method: "POST", headers: v_68f0aa(),
    });
    const { resetAt: v_b98b4f } = await v_cb35cb.json() as { resetAt: number };

    await v_c9c489.DB.prepare(
      "INSERT INTO call_turns (call_id, seq, role, text, created_at) VALUES (?,?,?,?,?)"
    ).bind("cv-d1", 2, "clone", "늦게 온 답", v_b98b4f + 5).run();
    const v_4d33b2 = await (await v_aff13d("906/801")).json() as { turns: Turn[] };
    v_4d37e3(v_4d33b2.turns).toEqual([]);
  });

  v_23805a("reset 은 멱등 upsert — 두 번 불러도 200", async () => {
    for (let v_ebec57 = 0; v_ebec57 < 2; v_ebec57++) {
      const v_cb35cb = await v_1df298.fetch("http://localhost/oth-path", {
        method: "POST", headers: v_68f0aa(),
      });
      v_4d37e3(v_cb35cb.status).toBe(200);
    }
    const v_f4e98d = await v_c9c489.DB.prepare(
      "SELECT COUNT(*) AS n FROM conversation_resets WHERE user_id=905 AND clone_id=801"
    ).first() as { n: number };
    v_4d37e3(v_f4e98d.n).toBe(1);
  });

  v_23805a("id 가 양의 정수가 아니면 400", async () => {
    v_4d37e3((await v_aff13d("abc/801")).status).toBe(400);
    v_4d37e3((await v_aff13d("901/0")).status).toBe(400);
  });
});
