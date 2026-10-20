
import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";
import { v_4d538f, v_60d58e } from "../src/scheduled/staleCalls";

const v_a1651b = () => v_c9c489.DB as unknown as D1Database;
const v_a5302d = () => v_c9c489 as unknown as Parameters<typeof v_4d538f>[0];
const v_300473 = () => crypto.randomUUID().slice(0, 8);
const v_9aead9 = () => crypto.randomUUID().replace(/-/g, "").slice(0, 12);

async function v_bfb240(): Promise<number> {
  const v_e0c7e8 = `cs_${v_300473()}@test.local`;
  await v_a1651b().prepare(
    `INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`,
  ).bind(v_e0c7e8).run();
  return (await v_a1651b().prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>())!.id;
}

async function v_4d24a9(v_1badb6): Promise<number> {
  const v_cb35cb = await v_a1651b().prepare(
    `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
     VALUES (?, 'CT', ?, 'memlow', 'public', CURRENT_TIMESTAMP) RETURNING id`,
  ).bind(v_1badb6, `cs_${v_300473()}`).first<{ id: number }>();
  return v_cb35cb!.id;
}

async function v_65cdd1(v_be62d3, v_43e90c, v_6e0fd3, v_f6634c) {
  await v_a1651b().prepare(
    `INSERT INTO call_sessions (call_id, user_id, clone_id, started_at) VALUES (?, ?, ?, ?)`,
  ).bind(v_be62d3, v_43e90c, v_6e0fd3, v_f6634c).run();
}

async function v_86c39f(v_43e90c): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return await v_b2eae5({ sub: v_43e90c, kind: "access" }, v_43fd42, 60 * 10);
}

function v_e1c97a(v_6e0fd3, v_ea333d, v_4d33b2) {
  return v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/call-event`, {
    method: "POST",
    headers: { Authorization: `Bearer ${v_ea333d}`, "Content-Type": "application/json" },
    body: JSON.stringify(v_4d33b2),
  });
}

async function v_741013(v_be62d3) {
  return v_a1651b().prepare(
    `SELECT ended_at, duration_sec, talk_sec, ad_sec, end_reason FROM call_sessions WHERE call_id = ?`,
  ).bind(v_be62d3).first<{
    ended_at: number | null; duration_sec: number | null; talk_sec: number | null;
    ad_sec: number | null; end_reason: string | null;
  }>();
}

v_469bf2("POST /oth-path — talk_sec/ad_sec", () => {
  v_23805a("본인 통화면 talk_sec/ad_sec 기록", async () => {
    const v_0c8987 = await v_bfb240();
    const v_062ae9 = await v_4d24a9(v_0c8987);
    const v_be62d3 = v_9aead9();
    await v_65cdd1(v_be62d3, v_0c8987, v_062ae9, Date.now());
    const v_8f00b9 = await v_e1c97a(v_062ae9, await v_86c39f(v_0c8987), { durationSeconds: 417, adSeconds: 80, callId: v_be62d3 });
    v_4d37e3(v_8f00b9.status).toBe(200);
    v_4d37e3(await v_741013(v_be62d3)).toMatchObject({ talk_sec: 417, ad_sec: 80 });
  });

  v_23805a("남의 통화 callId 는 기록하지 않는다", async () => {
    const v_257b90 = await v_bfb240();
    const v_a9cbf1 = await v_bfb240();
    const v_062ae9 = await v_4d24a9(v_257b90);
    const v_be62d3 = v_9aead9();
    await v_65cdd1(v_be62d3, v_257b90, v_062ae9, Date.now());
    const v_8f00b9 = await v_e1c97a(v_062ae9, await v_86c39f(v_a9cbf1), { durationSeconds: 10, callId: v_be62d3 });
    v_4d37e3(v_8f00b9.status).toBe(200);
    v_4d37e3((await v_741013(v_be62d3))?.talk_sec).toBeNull();
  });

  v_23805a("callId 형식이 틀려도 call-event 자체는 성공(구버전·이상값 호환)", async () => {
    const v_0c8987 = await v_bfb240();
    const v_062ae9 = await v_4d24a9(v_0c8987);
    const v_8f00b9 = await v_e1c97a(v_062ae9, await v_86c39f(v_0c8987), { durationSeconds: 30, callId: "../x" });
    v_4d37e3(v_8f00b9.status).toBe(200);
  });
});

v_469bf2("closeStaleCalls — 미종료 통화 정리", () => {
  v_23805a("오래된 미종료 통화를 마지막 발화 시각으로 닫고 end_reason 표시", async () => {
    const v_0c8987 = await v_bfb240();
    const v_062ae9 = await v_4d24a9(v_0c8987);
    const v_5c2f9f = Date.now();
    const v_4c6dd7 = v_5c2f9f - v_60d58e - 60_000;
    const v_be62d3 = v_9aead9();
    await v_65cdd1(v_be62d3, v_0c8987, v_062ae9, v_4c6dd7);
    await v_a1651b().prepare(
      `INSERT INTO call_turns (call_id, seq, role, text, created_at) VALUES (?, 1, 'user', 'x', ?)`,
    ).bind(v_be62d3, v_4c6dd7 + 45_000).run();

    await v_4d538f(v_a5302d(), v_5c2f9f);

    v_4d37e3(await v_741013(v_be62d3)).toMatchObject({
      ended_at: v_4c6dd7 + 45_000, duration_sec: 45, end_reason: "stale_cleanup",
    });
  });

  v_23805a("발화 없는 통화는 0초로 닫는다", async () => {
    const v_0c8987 = await v_bfb240();
    const v_062ae9 = await v_4d24a9(v_0c8987);
    const v_5c2f9f = Date.now();
    const v_4c6dd7 = v_5c2f9f - v_60d58e - 1;
    const v_be62d3 = v_9aead9();
    await v_65cdd1(v_be62d3, v_0c8987, v_062ae9, v_4c6dd7);
    await v_4d538f(v_a5302d(), v_5c2f9f);
    v_4d37e3(await v_741013(v_be62d3)).toMatchObject({ ended_at: v_4c6dd7, duration_sec: 0, end_reason: "stale_cleanup" });
  });

  v_23805a("오래 전에 시작했어도 마지막 발화가 5분 이내면(긴 통화 진행 중) 건드리지 않는다", async () => {
    const v_0c8987 = await v_bfb240();
    const v_062ae9 = await v_4d24a9(v_0c8987);
    const v_5c2f9f = Date.now();
    const v_be62d3 = v_9aead9();
    await v_65cdd1(v_be62d3, v_0c8987, v_062ae9, v_5c2f9f - 6 * 60 * 60 * 1000);
    await v_a1651b().prepare(
      `INSERT INTO call_turns (call_id, seq, role, text, created_at) VALUES (?, 1, 'user', 'x', ?)`,
    ).bind(v_be62d3, v_5c2f9f - 2 * 60 * 1000).run();
    await v_4d538f(v_a5302d(), v_5c2f9f);
    v_4d37e3(await v_741013(v_be62d3)).toMatchObject({ ended_at: null, end_reason: null });
  });

  v_23805a("진행 중(5분 이내)·이미 종료된 통화는 건드리지 않는다", async () => {
    const v_0c8987 = await v_bfb240();
    const v_062ae9 = await v_4d24a9(v_0c8987);
    const v_5c2f9f = Date.now();
    const v_bb280b = v_9aead9();
    await v_65cdd1(v_bb280b, v_0c8987, v_062ae9, v_5c2f9f - 60_000);
    const v_eb62d7 = v_9aead9();
    await v_65cdd1(v_eb62d7, v_0c8987, v_062ae9, v_5c2f9f - v_60d58e - 60_000);
    await v_a1651b().prepare(`UPDATE call_sessions SET ended_at = ?, duration_sec = 30 WHERE call_id = ?`)
      .bind(v_5c2f9f - v_60d58e, v_eb62d7).run();

    await v_4d538f(v_a5302d(), v_5c2f9f);

    v_4d37e3(await v_741013(v_bb280b)).toMatchObject({ ended_at: null, end_reason: null });
    v_4d37e3(await v_741013(v_eb62d7)).toMatchObject({ duration_sec: 30, end_reason: null });
  });
});
