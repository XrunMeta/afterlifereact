

import { v_469bf2, v_23805a, v_4d37e3, v_ba7107, v_719203 } from "xualxe";
import { v_1df298, v_c9c489, v_8fd90d } from "lwkoweqmjbnvjqw";
import { v_2c3572 } from "../src/lib/conversationMemory";
import { v_663c07, v_4dc423, v_70ddfa } from "../src/lib/chatReply";
import { v_b31343, v_a8614b, v_85de88 } from "../src/lib/ale";
import type { v_273a0c } from "../src/lib/env";

const v_a1651b = () => v_c9c489.DB as unknown as D1Database;
const v_8fe3be = () => (v_c9c489 as { ORCH_SECRET: string }).ORCH_SECRET;

async function v_fc6bcf(): Promise<void> {
  const v_3ac7e7 = await v_a1651b()
    .prepare(`SELECT kek_id FROM encryption_keys WHERE status = 'active' LIMIT 1`)
    .first<{ kek_id: string }>();
  if (v_3ac7e7) return;
  const { generateKekAndWrap: v_8bb5d2 } = await import("../src/lib/kekProvider");
  const { encryptedKek: v_8f246d } = v_8bb5d2((v_c9c489 as { MASTER_ROOT: string }).MASTER_ROOT);
  await v_a1651b()
    .prepare(
      `INSERT INTO encryption_keys (kek_id, version, encrypted_kek, status)
       VALUES ('kek_test_v1', 1, ?, 'active')`,
    )
    .bind(v_8f246d)
    .run();
}

async function v_bfb240(v_e0c7e8, v_e2c945 = 0): Promise<number> {
  await v_a1651b()
    .prepare(`INSERT INTO users (email, password_hash, name, credits, created_at)
              VALUES (?, 'x', 'U', ?, CURRENT_TIMESTAMP)`)
    .bind(v_e0c7e8, v_e2c945)
    .run();
  return (await v_a1651b().prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8)
    .first<{ id: number }>())!.id;
}

async function v_4d24a9(v_1badb6, v_556427): Promise<number> {
  await v_a1651b()
    .prepare(`INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
              VALUES (?, 'CT', ?, 'memlow', 'public', CURRENT_TIMESTAMP)`)
    .bind(v_1badb6, v_556427)
    .run();
  return (await v_a1651b().prepare("SELECT id FROM clones WHERE username = ?").bind(v_556427)
    .first<{ id: number }>())!.id;
}

async function v_21cc31(v_43e90c): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  return v_b2eae5({ sub: v_43e90c, kind: "access" },
    (v_c9c489 as { JWT_ACCESS_SECRET: string }).JWT_ACCESS_SECRET, 600);
}

async function v_c5d920(v_43e90c, v_6e0fd3, v_b43b74, v_4fab5a) {
  return v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await v_21cc31(v_43e90c)}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": `afl1018-${v_4fab5a}`,
    },
    body: JSON.stringify({ content: v_b43b74 }),
  });
}

async function v_98daea(v_be62d3, v_43e90c, v_6e0fd3, v_f6634c) {
  await v_a1651b().prepare(
    "INSERT INTO call_sessions (call_id, user_id, clone_id, started_at) VALUES (?,?,?,?)",
  ).bind(v_be62d3, v_43e90c, v_6e0fd3, v_f6634c).run();
}

async function v_f19c91(v_43e90c, v_6e0fd3): Promise<void> {
  await v_a1651b()
    .prepare(`INSERT OR IGNORE INTO clone_follows (user_id, clone_id) VALUES (?, ?)`)
    .bind(v_43e90c, v_6e0fd3)
    .run();
}

async function v_180e63(v_be62d3, v_22da99, v_9b6134) {
  const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_be62d3}/turn`, {
    method: "POST",
    headers: { Authorization: `Bearer ${v_8fe3be()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ role: v_22da99, text: v_9b6134 }),
  });
  v_4d37e3(v_8f00b9.status).toBe(200);
}

async function v_fb3621<T>(v_43e90c, v_9fe22d): Promise<{ status: number; body: T }> {
  const v_8f00b9 = await v_1df298.fetch(`http://localhost${v_9fe22d}`, {
    headers: { Authorization: `Bearer ${await v_21cc31(v_43e90c)}` },
  });
  return { status: v_8f00b9.status, body: (await v_8f00b9.json()) as T };
}

type TimelineItem =
  | { type: "chat"; id: number; role: string; content: string; at: number }
  | { type: "call"; callId: string; startedAt: number; durationSec: number | null; turnCount: number };

v_469bf2("채팅 전송 — 크레딧 없음 · 대화 DEK 암호화", () => {
  v_ba7107(v_fc6bcf);

  v_23805a("크레딧 0 이어도 보낼 수 있고 아무것도 차감되지 않는다", async () => {
    const v_0c8987 = await v_bfb240("chat-free@t.local", 0);
    const v_062ae9 = await v_4d24a9(v_0c8987, "chat_free");
    const v_8f00b9 = await v_c5d920(v_0c8987, v_062ae9, "안녕하세요", "free-1");
    if (v_8f00b9.status !== 200) console.log("SEND_FAIL", await v_8f00b9.clone().text());
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = (await v_8f00b9.json()) as { billing: { credits: number }; cloneReply: { content: string } };
    v_4d37e3(v_4d33b2.billing.credits).toBe(0);
    v_4d37e3(v_4d33b2.cloneReply.content.length).toBeGreaterThan(0);
    const v_ceb55a = await v_a1651b().prepare("SELECT credits FROM users WHERE id = ?").bind(v_0c8987)
      .first<{ credits: number }>();
    v_4d37e3(v_ceb55a!.credits).toBe(0);
    const v_7d5618 = await v_a1651b().prepare(
      "SELECT COUNT(*) AS n FROM credit_ledgers WHERE user_id = ?",
    ).bind(v_0c8987).first<{ n: number }>();
    v_4d37e3(v_7d5618!.n).toBe(0);
  });

  v_23805a("저장된 채팅은 통화와 같은 대화 DEK(v3)로 잠기고, 목록 조회는 평문을 돌려준다", async () => {
    const v_0c8987 = await v_bfb240("chat-enc@t.local");
    const v_062ae9 = await v_4d24a9(v_0c8987, "chat_enc");
    v_4d37e3((await v_c5d920(v_0c8987, v_062ae9, "고추 땄어요", "enc-1")).status).toBe(200);

    const v_18b8bf = (await v_a1651b().prepare(
      "SELECT role, content FROM messages WHERE user_id = ? AND clone_id = ? ORDER BY id",
    ).bind(v_0c8987, v_062ae9).all<{ role: string; content: string }>()).results!;
    v_4d37e3(v_18b8bf).toHaveLength(2);
    const v_426a9a = await v_a1651b().prepare(
      "SELECT dek_id FROM dek_registry WHERE resource_type = 'conversation' AND resource_id = ?",
    ).bind(v_2c3572(v_0c8987, v_062ae9)).first<{ dek_id: string }>();
    for (const v_cb35cb of v_18b8bf) {
      v_4d37e3(v_cb35cb.content.startsWith("v3.")).toBe(true);
      v_4d37e3(v_cb35cb.content).toContain(v_426a9a!.dek_id);
      v_4d37e3(v_cb35cb.content).not.toContain("고추");
    }

    const v_ef8ab1 = await v_fb3621<{ items: Array<{ role: string; content: string }> }>(
      v_0c8987, `/oth-path${v_062ae9}/messages`,
    );
    v_4d37e3(v_ef8ab1.status).toBe(200);
    v_4d37e3(v_ef8ab1.body.items.find((v_ebec57) => v_ebec57.role === "user")!.content).toBe("고추 땄어요");
  });
});

v_469bf2("GET /oth-path", () => {
  v_ba7107(v_fc6bcf);

  v_23805a("채팅과 통화 카드를 최신순으로 섞어 주고, 통화 카드엔 시작 시각·길이(표시 안 함)·발화 수", async () => {
    const v_0c8987 = await v_bfb240("tl-a@t.local");
    const v_062ae9 = await v_4d24a9(v_0c8987, "tl_a");

    v_4d37e3((await v_c5d920(v_0c8987, v_062ae9, "아침 채팅", "tl-a-1")).status).toBe(200);
    await v_a1651b().prepare("UPDATE messages SET created_at = '2025-10-01 09:00:00' WHERE user_id = ?")
      .bind(v_0c8987).run();
    const v_4139cb = Date.UTC(2025, 9, 1, 10, 0, 0);
    await v_98daea("tl-call-1", v_0c8987, v_062ae9, v_4139cb);
    await v_180e63("tl-call-1", "user", "통화 첫말");
    await v_180e63("tl-call-1", "clone", "통화 답");
    await v_a1651b().prepare("UPDATE call_sessions SET ended_at = ?, duration_sec = 95 WHERE call_id = 'tl-call-1'")
      .bind(v_4139cb + 95_000).run();
    v_4d37e3((await v_c5d920(v_0c8987, v_062ae9, "점심 채팅", "tl-a-2")).status).toBe(200);
    await v_a1651b().prepare(
      "UPDATE messages SET created_at = '2025-10-01 11:00:00' WHERE user_id = ? AND created_at > '2025-10-01 09:00:00'",
    ).bind(v_0c8987).run();

    await v_98daea("tl-call-empty", v_0c8987, v_062ae9, v_4139cb + 1000);

    const { status: v_d308b5, body: v_4d33b2 } = await v_fb3621<{ items: TimelineItem[]; nextCursor: string | null }>(
      v_0c8987, `/oth-path${v_062ae9}/timeline`,
    );
    v_4d37e3(v_d308b5).toBe(200);
    const v_28c2de = v_4d33b2.items.map((v_ebec57) => (v_ebec57.type === "call" ? `call:${v_ebec57.callId}` : `chat:${v_ebec57.role}`));
    v_4d37e3(v_28c2de).toEqual([
      "chat:clone", "chat:user",     
      "call:tl-call-empty",          
      "call:tl-call-1",              
      "chat:clone", "chat:user",     
    ]);
    const v_5eae50 = v_4d33b2.items.find((v_ebec57) => v_ebec57.type === "call" && v_ebec57.callId === "tl-call-1");
    v_4d37e3(v_5eae50).toEqual({ type: "call", callId: "tl-call-1", startedAt: v_4139cb, durationSec: 95, turnCount: 2 });
    const v_ad3352 = v_4d33b2.items.find((v_ebec57) => v_ebec57.type === "call" && v_ebec57.callId === "tl-call-empty");
    v_4d37e3(v_ad3352).toEqual({ type: "call", callId: "tl-call-empty", startedAt: v_4139cb + 1000, durationSec: null, turnCount: 0 });
    v_4d37e3((v_4d33b2.items[1] as { content: string }).content).toBe("점심 채팅");
    v_4d37e3(v_4d33b2.nextCursor).toBeNull();
  });

  v_23805a("limit·cursor 로 끊어 읽어도 빠짐·중복이 없다(같은 초 채팅 포함)", async () => {
    const v_0c8987 = await v_bfb240("tl-b@t.local");
    const v_062ae9 = await v_4d24a9(v_0c8987, "tl_b");
    for (let v_ebec57 = 0; v_ebec57 < 3; v_ebec57++) {
      v_4d37e3((await v_c5d920(v_0c8987, v_062ae9, `m${v_ebec57}`, `tl-b-${v_ebec57}`)).status).toBe(200);
    }
    await v_a1651b().prepare("UPDATE messages SET created_at = '2025-10-02 09:00:00' WHERE user_id = ?")
      .bind(v_0c8987).run();
    await v_98daea("tl-b-call", v_0c8987, v_062ae9, Date.UTC(2025, 9, 2, 9, 0, 0));
    await v_180e63("tl-b-call", "user", "x");

    const v_110a8b = [];
    let v_75cbf4 = null;
    for (let v_2365e9 = 0; v_2365e9 < 10; v_2365e9++) {
      const v_ab6401 = `/oth-path${v_062ae9}/timeline?limit=2${v_75cbf4 ? `&cursor=${encodeURIComponent(v_75cbf4)}` : ""}`;
      const { body: v_4d33b2 } = await v_fb3621<{ items: TimelineItem[]; nextCursor: string | null }>(v_0c8987, v_ab6401);
      for (const v_ebec57 of v_4d33b2.items) v_110a8b.push(v_ebec57.type === "call" ? v_ebec57.callId : String(v_ebec57.id));
      v_75cbf4 = v_4d33b2.nextCursor;
      if (!v_75cbf4) break;
    }
    v_4d37e3(v_110a8b).toHaveLength(7);
    v_4d37e3(new Set(v_110a8b).size).toBe(7);
  });

  v_23805a("다른 사용자의 대화는 섞이지 않는다", async () => {
    const v_779914 = await v_bfb240("tl-c1@t.local");
    const v_148ff6 = await v_bfb240("tl-c2@t.local");
    const v_062ae9 = await v_4d24a9(v_779914, "tl_c");
    v_4d37e3((await v_c5d920(v_148ff6, v_062ae9, "B의 채팅", "tl-c-1")).status).toBe(200);
    await v_98daea("tl-c-call", v_148ff6, v_062ae9, Date.now());
    await v_180e63("tl-c-call", "user", "B의 통화");
    const { body: v_4d33b2 } = await v_fb3621<{ items: TimelineItem[] }>(v_779914, `/oth-path${v_062ae9}/timeline`);
    v_4d37e3(v_4d33b2.items).toEqual([]);
  });

  v_23805a("대화 키가 파쇄되면 예전 방식(v2)으로 잠긴 채팅까지 아무것도 안 보인다", async () => {
    const v_0c8987 = await v_bfb240("tl-d@t.local");
    const v_062ae9 = await v_4d24a9(v_0c8987, "tl_d");
    v_4d37e3((await v_c5d920(v_0c8987, v_062ae9, "새 채팅", "tl-d-1")).status).toBe(200);
    const v_66ed66 = v_85de88("옛 채팅", v_a8614b((v_c9c489 as { ALE_KEK: string }).ALE_KEK), `msg:${v_062ae9}`);
    await v_a1651b().prepare(
      `INSERT INTO messages (clone_id, user_id, session_id, role, content, status, reconciliation_status)
       VALUES (?, ?, 's', 'user', ?, 'active', 'pending')`,
    ).bind(v_062ae9, v_0c8987, v_66ed66).run();
    const v_426a9a = await v_a1651b().prepare(
      "SELECT dek_id FROM dek_registry WHERE resource_type='conversation' AND resource_id=?",
    ).bind(v_2c3572(v_0c8987, v_062ae9)).first<{ dek_id: string }>();
    await v_b31343(v_a1651b(), v_426a9a!.dek_id);

    const { body: v_4d33b2 } = await v_fb3621<{ items: TimelineItem[]; nextCursor: string | null }>(
      v_0c8987, `/oth-path${v_062ae9}/timeline`,
    );
    v_4d37e3(v_4d33b2.items).toEqual([]);
  });

  v_23805a("잘못된 cursor 는 422", async () => {
    const v_0c8987 = await v_bfb240("tl-e@t.local");
    const v_062ae9 = await v_4d24a9(v_0c8987, "tl_e");
    const { status: v_d308b5 } = await v_fb3621(v_0c8987, `/oth-path${v_062ae9}/timeline?cursor=abc`);
    v_4d37e3(v_d308b5).toBe(422);
  });
});

v_469bf2("GET /oth-path — 대화보기", () => {
  v_ba7107(v_fc6bcf);

  v_23805a("본인 통화의 발화를 순서대로 평문으로 준다", async () => {
    const v_0c8987 = await v_bfb240("turns-a@t.local");
    const v_062ae9 = await v_4d24a9(v_0c8987, "turns_a");
    await v_98daea("turns-a-call", v_0c8987, v_062ae9, 1_000_000);
    await v_180e63("turns-a-call", "user", "여보세요");
    await v_180e63("turns-a-call", "clone", "오냐");
    const { status: v_d308b5, body: v_4d33b2 } = await v_fb3621<{
      callId: string; startedAt: number; turns: Array<{ seq: number; role: string; text: string; at: number }>;
    }>(v_0c8987, `/oth-path${v_062ae9}/oth-path`);
    v_4d37e3(v_d308b5).toBe(200);
    v_4d37e3(v_4d33b2.callId).toBe("turns-a-call");
    v_4d37e3(v_4d33b2.startedAt).toBe(1_000_000);
    v_4d37e3(v_4d33b2.turns.map((v_8d41d7) => [v_8d41d7.role, v_8d41d7.text])).toEqual([["user", "여보세요"], ["clone", "오냐"]]);
  });

  v_23805a("긴 통화는 최신부터 limit 개씩, cursor 로 이전 발화를 이어 읽는다(빠짐·중복 없음)", async () => {
    const v_0c8987 = await v_bfb240("turns-p@t.local");
    const v_062ae9 = await v_4d24a9(v_0c8987, "turns_p");
    await v_98daea("turns-p-call", v_0c8987, v_062ae9, 1_000_000);
    for (let v_ebec57 = 0; v_ebec57 < 7; v_ebec57++) await v_180e63("turns-p-call", v_ebec57 % 2 ? "clone" : "user", `말${v_ebec57}`);

    type Page = { turns: Array<{ seq: number; text: string }>; nextCursor: string | null };
    const v_ea719c = await v_fb3621<Page>(v_0c8987, `/oth-path${v_062ae9}/oth-path?limit=3`);
    v_4d37e3(v_ea719c.status).toBe(200);

    v_4d37e3(v_ea719c.body.turns.map((v_8d41d7) => v_8d41d7.text)).toEqual(["말4", "말5", "말6"]);
    v_4d37e3(v_ea719c.body.nextCursor).not.toBeNull();

    const v_09c678 = [v_ea719c.body.turns.map((v_8d41d7) => v_8d41d7.text)];
    let v_75cbf4 = v_ea719c.body.nextCursor;
    while (v_75cbf4) {
      const v_e2a85c = await v_fb3621<Page>(v_0c8987,
        `/oth-path${v_062ae9}/oth-path?limit=3&cursor=${encodeURIComponent(v_75cbf4)}`);
      v_09c678.push(v_e2a85c.body.turns.map((v_8d41d7) => v_8d41d7.text));
      v_75cbf4 = v_e2a85c.body.nextCursor;
    }
    v_4d37e3(v_09c678).toEqual([["말4", "말5", "말6"], ["말1", "말2", "말3"], ["말0"]]);
  });

  v_23805a("대화보기 limit·cursor 가 잘못되면 422", async () => {
    const v_0c8987 = await v_bfb240("turns-q@t.local");
    const v_062ae9 = await v_4d24a9(v_0c8987, "turns_q");
    await v_98daea("turns-q-call", v_0c8987, v_062ae9, 1_000_000);
    v_4d37e3((await v_fb3621(v_0c8987, `/oth-path${v_062ae9}/oth-path?limit=0`)).status).toBe(422);
    v_4d37e3((await v_fb3621(v_0c8987, `/oth-path${v_062ae9}/oth-path?cursor=x`)).status).toBe(422);
  });

  v_23805a("남의 통화·다른 클론의 통화는 404", async () => {
    const v_779914 = await v_bfb240("turns-b1@t.local");
    const v_148ff6 = await v_bfb240("turns-b2@t.local");
    const v_062ae9 = await v_4d24a9(v_779914, "turns_b");
    const v_a9cbf1 = await v_4d24a9(v_779914, "turns_b2");
    await v_98daea("turns-b-call", v_148ff6, v_062ae9, 1_000_000);
    await v_180e63("turns-b-call", "user", "B 비밀");
    v_4d37e3((await v_fb3621(v_779914, `/oth-path${v_062ae9}/oth-path`)).status).toBe(404);
    v_4d37e3((await v_fb3621(v_148ff6, `/oth-path${v_a9cbf1}/oth-path`)).status).toBe(404);
  });
});

v_469bf2("채팅 답장 맥락·요청", () => {
  v_ba7107(async () => {
    await v_fc6bcf();
    v_8fd90d.activate();
    v_8fd90d.disableNetConnect();
  });
  v_719203(() => v_8fd90d.assertNoPendingInterceptors());

  v_23805a("최근 채팅은 recent 로, 그 이전 통화·채팅은 prior 로 나눈다", async () => {
    const v_0c8987 = await v_bfb240("ctx-a@t.local");
    const v_062ae9 = await v_4d24a9(v_0c8987, "ctx_a");
    await v_98daea("ctx-call", v_0c8987, v_062ae9, Date.UTC(2025, 9, 1, 0, 0, 0));
    await v_180e63("ctx-call", "user", "고추 땄어");
    for (let v_ebec57 = 0; v_ebec57 < 3; v_ebec57++) {
      v_4d37e3((await v_c5d920(v_0c8987, v_062ae9, `채팅${v_ebec57}`, `ctx-a-${v_ebec57}`)).status).toBe(200);
    }
    const v_16e2dd = await v_663c07(v_c9c489 as unknown as v_273a0c, v_0c8987, v_062ae9, 4);
    v_4d37e3(v_16e2dd.recent.map((v_cb35cb) => v_cb35cb.text).slice(-1)[0]).not.toBe("채팅0");
    v_4d37e3(v_16e2dd.recent).toHaveLength(4);
    v_4d37e3(v_16e2dd.recent[v_16e2dd.recent.length - 1]!.role).toBe("clone");
    const v_1e770f = v_16e2dd.prior.map((v_e2a85c) => v_e2a85c.text);
    v_4d37e3(v_1e770f).toContain("고추 땄어");
    v_4d37e3(v_1e770f).toContain("채팅0");
    for (const v_cb35cb of v_16e2dd.recent) v_4d37e3(v_1e770f).not.toContain(v_cb35cb.text === "채팅0" ? "__" : v_cb35cb.text);
  });

  v_23805a("prethird /chat/reply 에 내부 시크릿·사용자 토큰·맥락을 실어 보내고 답을 받는다", async () => {
    let v_df0713 = null;
    v_8fd90d
      .get("http://prethird.test")
      .intercept({ path: "/prethird/chat/reply", method: "POST" })
      .reply((v_328259) => {
        v_df0713 = {
          secret: new Headers(v_328259.headers as Record<string, string>).get("x-internal-secret"),
          body: JSON.parse(String(v_328259.body)),
        };
        return { statusCode: 200, data: { reply: "오냐" } };
      });
    const v_9e86fd = { ...(v_c9c489 as unknown as v_273a0c), CHAT_REPLY_SECRET: "isec" };
    const v_677216 = await v_4dc423(v_9e86fd, {
      cloneId: 7, userToken: "UT", text: "안녕",
      prior: [{ callId: "c", role: "user", text: "옛말", at: 1, source: "call" }],
      recent: [{ role: "clone", text: "왔니", at: 2 }],
    });
    v_4d37e3(v_677216).toBe("오냐");
    v_4d37e3(v_df0713!.secret).toBe("isec");
    v_4d37e3(v_df0713!.body).toMatchObject({
      clone_id: 7, user_token: "UT", text: "안녕",
      prior: [{ callId: "c", role: "user", text: "옛말", at: 1 }],
      recent: [{ role: "clone", text: "왔니" }],
    });
  });

  v_23805a("prethird 가 실패하면 UPSTREAM_FAILURE 로 던진다", async () => {
    v_8fd90d
      .get("http://prethird.test")
      .intercept({ path: "/prethird/chat/reply", method: "POST" })
      .reply(502, { error: "llm_failed" });
    const v_9e86fd = { ...(v_c9c489 as unknown as v_273a0c), CHAT_REPLY_SECRET: "isec" };
    await v_4d37e3(v_4dc423(v_9e86fd, {
      cloneId: 7, userToken: "UT", text: "안녕", prior: [], recent: [],
    })).rejects.toMatchObject({ code: "UPSTREAM_FAILURE" });
  });
});

v_469bf2("채팅 남용·파쇄 방어(mizu H1·H2·M3)", () => {
  v_ba7107(v_fc6bcf);

  v_23805a("채팅 전용 시크릿이 없으면 prethird 로 보내지 않고 503", async () => {
    const v_9e86fd = { ...(v_c9c489 as unknown as v_273a0c), CHAT_REPLY_SECRET: undefined, KNOWLEDGE_INTERPRET_SECRET: "isec" };
    await v_4d37e3(v_4dc423(v_9e86fd, {
      cloneId: 7, userToken: "UT", text: "안녕", prior: [], recent: [],
    })).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
  });

  v_23805a("사용자 하루 채팅 상한(KST)을 넘으면 RATE_LIMITED", async () => {
    const v_0c8987 = await v_bfb240("quota@t.local");
    const v_062ae9 = await v_4d24a9(v_0c8987, "quota_c");
    const v_9e86fd = { ...(v_c9c489 as unknown as v_273a0c), CHAT_DAILY_LIMIT: "2" };
    await v_70ddfa(v_9e86fd, v_0c8987);
    v_4d37e3((await v_c5d920(v_0c8987, v_062ae9, "하나", "q-1")).status).toBe(200);
    v_4d37e3((await v_c5d920(v_0c8987, v_062ae9, "둘", "q-2")).status).toBe(200);
    await v_4d37e3(v_70ddfa(v_9e86fd, v_0c8987)).rejects.toMatchObject({ code: "RATE_LIMITED" });

    await v_a1651b().prepare("UPDATE messages SET created_at = datetime('now', '-2 days') WHERE user_id = ?")
      .bind(v_0c8987).run();
    await v_70ddfa(v_9e86fd, v_0c8987);
  });

  v_23805a("대화 키가 파쇄된 대화에는 답장을 만들기 전에 403 으로 멈추고 아무것도 저장하지 않는다", async () => {
    const v_0c8987 = await v_bfb240("shred-send@t.local");
    const v_062ae9 = await v_4d24a9(v_0c8987, "shred_send");
    v_4d37e3((await v_c5d920(v_0c8987, v_062ae9, "처음", "s-1")).status).toBe(200);
    const v_426a9a = await v_a1651b().prepare(
      "SELECT dek_id FROM dek_registry WHERE resource_type='conversation' AND resource_id=?",
    ).bind(v_2c3572(v_0c8987, v_062ae9)).first<{ dek_id: string }>();
    await v_b31343(v_a1651b(), v_426a9a!.dek_id);
    v_4d37e3((await v_c5d920(v_0c8987, v_062ae9, "또", "s-2")).status).toBe(403);
    const v_f4e98d = await v_a1651b().prepare("SELECT COUNT(*) AS n FROM messages WHERE user_id = ?")
      .bind(v_0c8987).first<{ n: number }>();
    v_4d37e3(v_f4e98d!.n).toBe(2);
  });
});

v_469bf2("채팅 목록 클론 정보 · 대화한 클론 목록", () => {
  v_ba7107(v_fc6bcf);

  v_23805a("timeline 응답에 클론 id·이름·대표 사진이 같이 온다", async () => {
    const v_0c8987 = await v_bfb240("cl-a@t.local");
    const v_062ae9 = await v_4d24a9(v_0c8987, "cl_a");
    await v_a1651b().prepare("UPDATE clones SET avatar_url = 'https://x.test/a.png' WHERE id = ?").bind(v_062ae9).run();
    const { status: v_d308b5, body: v_4d33b2 } = await v_fb3621<{ clone: unknown }>(v_0c8987, `/oth-path${v_062ae9}/timeline`);
    v_4d37e3(v_d308b5).toBe(200);
    v_4d37e3(v_4d33b2.clone).toEqual({ id: v_062ae9, name: "CT", avatarUrl: "https://x.test/a.png" });
  });

  type ConvItem = {
    clone: { id: number; name: string; avatarUrl: string | null };
    isMine: boolean;
    last: { type: "chat" | "call"; role: string | null; text: string | null; at: number } | null;
  };

  v_23805a("대화한 클론 + 내가 만든 클론을 마지막 대화 최신순으로, 마지막 한 줄·시각과 함께 준다", async () => {
    const v_b32680 = await v_bfb240("cl-b@t.local");
    const v_a9cbf1 = await v_bfb240("cl-b2@t.local");
    const v_1c1268 = await v_4d24a9(v_b32680, "cl_b_mine");          
    const v_8977fc = await v_4d24a9(v_a9cbf1, "cl_b_chat");      
    const v_6d4e32 = await v_4d24a9(v_a9cbf1, "cl_b_call");      
    const v_d50b63 = await v_4d24a9(v_a9cbf1, "cl_b_miss");      
    const v_9eb431 = await v_4d24a9(v_a9cbf1, "cl_b_none");  
    void v_9eb431;
    await v_a1651b().prepare("UPDATE clones SET avatar_url = 'https://x.test/c.png' WHERE id = ?").bind(v_8977fc).run();

    await v_f19c91(v_b32680, v_8977fc);
    await v_f19c91(v_b32680, v_6d4e32);
    await v_f19c91(v_b32680, v_d50b63);

    v_4d37e3((await v_c5d920(v_b32680, v_8977fc, "줄1\n줄2   공백", "cl-b-1")).status).toBe(200);
    await v_a1651b().prepare("UPDATE messages SET created_at = '2025-10-03 00:00:00' WHERE user_id = ?").bind(v_b32680).run();
    await v_98daea("cl-b-call", v_b32680, v_6d4e32, Date.UTC(2025, 9, 2));
    await v_180e63("cl-b-call", "user", "통화 첫말");
    await v_180e63("cl-b-call", "clone", "통화 끝말");
    await v_98daea("cl-b-miss", v_b32680, v_d50b63, Date.UTC(2025, 9, 1));

    await v_98daea("cl-b-other", v_a9cbf1, v_8977fc, Date.UTC(2025, 9, 9));
    await v_180e63("cl-b-other", "user", "남의 말");

    const { status: v_d308b5, body: v_4d33b2 } = await v_fb3621<{ items: ConvItem[] }>(v_b32680, "/oth-path");
    v_4d37e3(v_d308b5).toBe(200);
    v_4d37e3(v_4d33b2.items.map((v_ebec57) => v_ebec57.clone.id)).toEqual([v_8977fc, v_6d4e32, v_d50b63, v_1c1268]);

    const [v_bff046, v_51c3d2, v_90d74f, v_da74da] = v_4d33b2.items;
    v_4d37e3(v_bff046!.clone).toEqual({ id: v_8977fc, name: "CT", avatarUrl: "https://x.test/c.png" });
    v_4d37e3(v_bff046!.isMine).toBe(false);
    v_4d37e3(v_bff046!.last!.type).toBe("chat");
    v_4d37e3(v_bff046!.last!.role).toBe("clone");               
    v_4d37e3(v_bff046!.last!.at).toBe(Date.UTC(2025, 9, 3));
    v_4d37e3(v_bff046!.last!.text).not.toContain("\n");

    v_4d37e3(v_51c3d2!.last).toMatchObject({ type: "call", role: "clone", text: "통화 끝말" });
    v_4d37e3(v_90d74f!.last).toEqual({ type: "call", role: null, text: null, at: Date.UTC(2025, 9, 1) });
    v_4d37e3(v_da74da).toMatchObject({ isMine: true, last: null });
  });

  v_23805a("다른 사람이 내 클론과 한 대화는 내 대화 목록·채팅 화면·대화보기 어디에도 안 나온다", async () => {
    const v_b32680 = await v_bfb240("cl-d@t.local");
    const v_a9cbf1 = await v_bfb240("cl-d2@t.local");
    const v_1c1268 = await v_4d24a9(v_b32680, "cl_d_mine");
    v_4d37e3((await v_c5d920(v_a9cbf1, v_1c1268, "남이 보낸 채팅", "cl-d-1")).status).toBe(200);
    await v_98daea("cl-d-call", v_a9cbf1, v_1c1268, Date.now());
    await v_180e63("cl-d-call", "user", "남의 통화");

    const v_ef8ab1 = await v_fb3621<{ items: ConvItem[] }>(v_b32680, "/oth-path");
    v_4d37e3(v_ef8ab1.body.items).toEqual([
      { clone: { id: v_1c1268, name: "CT", avatarUrl: null }, isMine: true, last: null, unreadCount: 0 },
    ]);
    const v_fcb4e5 = await v_fb3621<{ items: unknown[] }>(v_b32680, `/oth-path${v_1c1268}/timeline`);
    v_4d37e3(v_fcb4e5.body.items).toEqual([]);
    v_4d37e3((await v_fb3621(v_b32680, `/oth-path${v_1c1268}/oth-path`)).status).toBe(404);
    const v_765b79 = await v_fb3621<{ items: unknown[] }>(v_b32680, `/oth-path${v_1c1268}/messages`);
    v_4d37e3(v_765b79.body.items).toEqual([]);
  });

  v_23805a("삭제된 클론은 빠진다", async () => {
    const v_b32680 = await v_bfb240("cl-c@t.local");
    const v_062ae9 = await v_4d24a9(v_b32680, "cl_c");
    await v_a1651b().prepare("UPDATE clones SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?").bind(v_062ae9).run();
    const { body: v_4d33b2 } = await v_fb3621<{ items: ConvItem[] }>(v_b32680, "/oth-path");
    v_4d37e3(v_4d33b2.items.map((v_ebec57) => v_ebec57.clone.id)).not.toContain(v_062ae9);
  });
});
