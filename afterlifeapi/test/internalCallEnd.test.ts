import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

const v_7169b4 = (v_c9c489 as { LEARN_SECRET?: string }).LEARN_SECRET ?? "test-learn-secret";

async function v_98daea(v_be62d3, v_f6634c) {
  await (v_c9c489.DB as unknown as D1Database).prepare(
    `INSERT OR REPLACE INTO call_sessions (call_id, user_id, clone_id, persona_slug, started_at)
     VALUES (?, 8001, 9001, 'prethird', ?)`,
  ).bind(v_be62d3, v_f6634c).run();
}
async function v_ac99e0(v_be62d3) {
  return (v_c9c489.DB as unknown as D1Database)
    .prepare("SELECT ended_at, duration_sec FROM call_sessions WHERE call_id = ?")
    .bind(v_be62d3).first<{ ended_at: number | null; duration_sec: number | null }>();
}

v_469bf2("POST /oth-path", () => {
  v_23805a("정상 — ended_at/duration_sec UPDATE", async () => {
    const v_062ae9 = "aaaa11112222";
    await v_98daea(v_062ae9, Date.now() - 5000);
    const v_8f00b9 = await v_1df298.fetch(`https://x/oth-path${v_062ae9}/end`, {
      method: "POST", headers: { Authorization: `Bearer ${v_7169b4}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_3ac7e7 = await v_ac99e0(v_062ae9);
    v_4d37e3(v_3ac7e7!.ended_at).not.toBeNull();
    v_4d37e3(v_3ac7e7!.duration_sec).toBeGreaterThanOrEqual(4);
  });

  v_23805a("멱등 — 이미 종료된 통화 재호출 시 ended_at 불변", async () => {
    const v_062ae9 = "bbbb33334444";
    await v_98daea(v_062ae9, Date.now() - 3000);
    await v_1df298.fetch(`https://x/oth-path${v_062ae9}/end`, {
      method: "POST", headers: { Authorization: `Bearer ${v_7169b4}` },
    });
    const v_ea719c = await v_ac99e0(v_062ae9);
    await v_1df298.fetch(`https://x/oth-path${v_062ae9}/end`, {
      method: "POST", headers: { Authorization: `Bearer ${v_7169b4}` },
    });
    const v_486a80 = await v_ac99e0(v_062ae9);
    v_4d37e3(v_486a80!.ended_at).toBe(v_ea719c!.ended_at);
  });

  v_23805a("무secret — 401", async () => {
    const v_8f00b9 = await v_1df298.fetch(`https://x/oth-path`, { method: "POST" });
    v_4d37e3(v_8f00b9.status).toBe(401);
  });

  v_23805a("미존재 call_id — 멱등 200", async () => {
    const v_8f00b9 = await v_1df298.fetch(`https://x/oth-path`, {
      method: "POST", headers: { Authorization: `Bearer ${v_7169b4}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
  });

  v_23805a("callId 형식 위반 — 멱등 200(미처리)", async () => {
    const v_8f00b9 = await v_1df298.fetch(`https://x/oth-path!id/end`, {
      method: "POST", headers: { Authorization: `Bearer ${v_7169b4}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
  });
});
