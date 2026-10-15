
import { v_469bf2, v_23805a, v_4d37e3, v_ba7107 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";
import { v_60df93, v_2c3572 } from "../src/lib/conversationMemory";
import { v_a8614b, v_85de88, v_b31343 } from "../src/lib/ale";

const v_a1651b = () => v_c9c489.DB as unknown as D1Database;
const v_8fe3be = () => (v_c9c489 as { ORCH_SECRET: string }).ORCH_SECRET;
const v_68f0aa = () => ({ Authorization: `Bearer ${v_8fe3be()}`, "Content-Type": "application/json" });

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

async function v_65cdd1(v_be62d3, v_43e90c, v_6e0fd3, v_f6634c) {
  await v_c9c489.DB.prepare(
    "INSERT INTO call_sessions (call_id, user_id, clone_id, started_at) VALUES (?,?,?,?)",
  ).bind(v_be62d3, v_43e90c, v_6e0fd3, v_f6634c).run();
}

async function v_180e63(v_be62d3, v_22da99, v_9b6134) {
  return v_1df298.fetch(`http://localhost/oth-path${v_be62d3}/turn`, {
    method: "POST",
    headers: v_68f0aa(),
    body: JSON.stringify({ role: v_22da99, text: v_9b6134 }),
  });
}

async function v_20c619(v_be62d3): Promise<string[]> {
  const { results: v_a7f568 } = await v_c9c489.DB.prepare(
    "SELECT text FROM call_turns WHERE call_id = ? ORDER BY seq",
  ).bind(v_be62d3).all<{ text: string }>();
  return (v_a7f568 ?? []).map((v_cb35cb) => v_cb35cb.text);
}

async function v_aff13d(v_43e90c, v_6e0fd3, v_7c5791 = "") {
  const v_8f00b9 = await v_1df298.fetch(
    `http://localhost/oth-path${v_43e90c}/${v_6e0fd3}${v_7c5791}`,
    { headers: v_68f0aa() },
  );
  v_4d37e3(v_8f00b9.status).toBe(200);
  return (await v_8f00b9.json()) as {
    turns: Array<{ callId: string; role: string; text: string; at: number; source: string }>;
  };
}

v_469bf2("통화 발화 저장 시 암호화", () => {
  v_ba7107(v_fc6bcf);

  v_23805a("저장된 text 는 평문이 아니라 v3 암호문이고, 이전 대화 API 는 평문으로 돌려준다", async () => {
    await v_65cdd1("enc-a1", 5101, 6101, 1_000_000);
    v_4d37e3((await v_180e63("enc-a1", "user", "고추 땄어")).status).toBe(200);
    v_4d37e3((await v_180e63("enc-a1", "clone", "많이 땄어?")).status).toBe(200);

    const v_5885b8 = await v_20c619("enc-a1");
    v_4d37e3(v_5885b8).toHaveLength(2);
    for (const v_fd5f43 of v_5885b8) {
      v_4d37e3(v_fd5f43.startsWith("v3.")).toBe(true);
      v_4d37e3(v_fd5f43).not.toContain("고추");
    }

    const v_4d33b2 = await v_aff13d(5101, 6101);
    v_4d37e3(v_4d33b2.turns.map((v_8d41d7) => v_8d41d7.text)).toEqual(["고추 땄어", "많이 땄어?"]);
    v_4d37e3(v_4d33b2.turns[0]).toMatchObject({ callId: "enc-a1", role: "user", source: "call" });
  });

  v_23805a("같은 사용자×클론은 통화가 달라도 키 하나를 쓰고, 클론이 다르면 키도 다르다", async () => {
    await v_65cdd1("enc-b1", 5102, 6102, 1_000_000);
    await v_65cdd1("enc-b2", 5102, 6102, 2_000_000);
    await v_65cdd1("enc-b3", 5102, 6103, 3_000_000);
    await v_180e63("enc-b1", "user", "하나");
    await v_180e63("enc-b2", "user", "둘");
    await v_180e63("enc-b2", "clone", "셋");
    await v_180e63("enc-b3", "user", "다른 클론");

    const v_9e8c70 = async (v_ceb55a, v_3f4e2e) =>
      (await v_c9c489.DB.prepare(
        "SELECT COUNT(*) AS n FROM dek_registry WHERE resource_type='conversation' AND resource_id=?",
      ).bind(v_2c3572(v_ceb55a, v_3f4e2e)).first<{ n: number }>())!.n;
    v_4d37e3(await v_9e8c70(5102, 6102)).toBe(1);
    v_4d37e3(await v_9e8c70(5102, 6103)).toBe(1);

    const v_f5fecf = (v_3263c7) => v_3263c7.split(".")[2];
    const v_779914 = [...(await v_20c619("enc-b1")), ...(await v_20c619("enc-b2"))].map(v_f5fecf);
    const v_148ff6 = (await v_20c619("enc-b3")).map(v_f5fecf);
    v_4d37e3(new Set(v_779914).size).toBe(1);
    v_4d37e3(v_148ff6[0]).not.toBe(v_779914[0]);
  });

  v_23805a("예전 평문 행도 그대로 읽힌다(일괄 암호화 전 데이터)", async () => {
    await v_65cdd1("enc-c1", 5103, 6104, 1_000_000);
    await v_c9c489.DB.prepare(
      "INSERT INTO call_turns (call_id, seq, role, text, created_at) VALUES (?,?,?,?,?)",
    ).bind("enc-c1", 1, "user", "옛날 평문", 1_000_001).run();
    await v_180e63("enc-c1", "clone", "새 암호문");

    const v_4d33b2 = await v_aff13d(5103, 6104);
    v_4d37e3(v_4d33b2.turns.map((v_8d41d7) => v_8d41d7.text)).toEqual(["옛날 평문", "새 암호문"]);
  });

  v_23805a("키가 파쇄되면 그 대화는 이전 대화에서 빠지고 500 이 나지 않는다", async () => {
    await v_65cdd1("enc-d1", 5104, 6105, 1_000_000);
    await v_180e63("enc-d1", "user", "지워질 말");
    const v_9419a6 = (await v_20c619("enc-d1"))[0]!.split(".")[2]!;
    await v_b31343(v_a1651b(), v_9419a6);

    const v_4d33b2 = await v_aff13d(5104, 6105);
    v_4d37e3(v_4d33b2.turns).toEqual([]);
  });

  v_23805a("파쇄된 키에는 새 발화를 평문으로 남기지 않는다", async () => {
    await v_65cdd1("enc-e1", 5105, 6106, 1_000_000);
    await v_180e63("enc-e1", "user", "처음");
    const v_9419a6 = (await v_20c619("enc-e1"))[0]!.split(".")[2]!;
    await v_b31343(v_a1651b(), v_9419a6);

    v_4d37e3((await v_180e63("enc-e1", "user", "파쇄 뒤 발화")).status).toBe(200);
    const v_5885b8 = await v_20c619("enc-e1");
    v_4d37e3(v_5885b8.some((v_fd5f43) => v_fd5f43.includes("파쇄 뒤 발화"))).toBe(false);
  });
});

v_469bf2("대화 기억 조립 — 통화 + 채팅", () => {
  v_ba7107(v_fc6bcf);

  async function v_952094(v_bd1444): Promise<{ u: number; c: number }> {
    await v_c9c489.DB.prepare(
      `INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`,
    ).bind(`${v_bd1444}@mem.test`).run();
    const v_ceb55a = (await v_c9c489.DB.prepare("SELECT id FROM users WHERE email = ?")
      .bind(`${v_bd1444}@mem.test`).first<{ id: number }>())!.id;
    await v_c9c489.DB.prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
       VALUES (?, 'CT', ?, 'memlow', 'public', CURRENT_TIMESTAMP)`,
    ).bind(v_ceb55a, v_bd1444).run();
    const v_3f4e2e = (await v_c9c489.DB.prepare("SELECT id FROM clones WHERE username = ?")
      .bind(v_bd1444).first<{ id: number }>())!.id;
    return { u: v_ceb55a, c: v_3f4e2e };
  }

  async function v_0558a4(v_43e90c, v_6e0fd3, v_22da99, v_9b6134, v_83d291) {
    const v_3263c7 = v_85de88(v_9b6134, v_a8614b((v_c9c489 as { ALE_KEK: string }).ALE_KEK), `msg:${v_6e0fd3}`);
    await v_c9c489.DB.prepare(
      `INSERT INTO messages (clone_id, user_id, session_id, role, content, created_at)
       VALUES (?, ?, 'chat-s', ?, ?, ?)`,
    ).bind(v_6e0fd3, v_43e90c, v_22da99, v_3263c7, v_83d291).run();
  }

  v_23805a("includeChat 이면 채팅과 통화를 시각순으로 합친다(통화는 시작 시각 한 점)", async () => {
    const { u: v_ceb55a, c: v_3f4e2e } = await v_952094("mem-a");
    const v_fe37f7 = Date.parse("2026-10-15T01:00:00Z");
    await v_0558a4(v_ceb55a, v_3f4e2e, "user", "채팅 먼저", "2026-10-15 01:00:00");
    await v_65cdd1("mem-a1", v_ceb55a, v_3f4e2e, v_fe37f7 + 60_000);
    await v_180e63("mem-a1", "user", "통화 중");
    await v_0558a4(v_ceb55a, v_3f4e2e, "user", "통화 뒤 채팅", "2026-10-15 02:00:00");

    const v_8d4337 = await v_60df93(v_c9c489 as never, {
      userId: v_ceb55a, cloneId: v_3f4e2e, includeChat: true, maxTurns: 100,
    });
    v_4d37e3(v_8d4337.turns.map((v_8d41d7) => v_8d41d7.text)).toEqual(["채팅 먼저", "통화 중", "통화 뒤 채팅"]);
    v_4d37e3(v_8d4337.turns[0]).toMatchObject({ source: "chat", callId: "chat-2026-10-15", role: "user" });
    v_4d37e3(v_8d4337.turns[1]).toMatchObject({ source: "call", callId: "mem-a1" });
  });

  v_23805a("ISO 형식(T 구분자) created_at 도 reset 컷오프가 제대로 걸린다", async () => {
    const { u: v_ceb55a, c: v_3f4e2e } = await v_952094("mem-iso");
    await v_0558a4(v_ceb55a, v_3f4e2e, "user", "리셋 전 ISO", "2026-10-15T00:00:00");
    await v_c9c489.DB.prepare(
      "INSERT INTO conversation_resets (user_id, clone_id, reset_at) VALUES (?,?,?)",
    ).bind(v_ceb55a, v_3f4e2e, Date.parse("2026-10-15T00:30:00Z")).run();
    await v_0558a4(v_ceb55a, v_3f4e2e, "user", "리셋 뒤", "2026-10-15 01:00:00");
    const v_8d4337 = await v_60df93(v_c9c489 as never, {
      userId: v_ceb55a, cloneId: v_3f4e2e, includeChat: true, maxTurns: 100,
    });
    v_4d37e3(v_8d4337.turns.map((v_8d41d7) => v_8d41d7.text)).toEqual(["리셋 뒤"]);
  });

  v_23805a("includeChat 이 아니면 채팅은 넣지 않는다", async () => {
    const { u: v_ceb55a, c: v_3f4e2e } = await v_952094("mem-b");
    await v_0558a4(v_ceb55a, v_3f4e2e, "user", "채팅", "2026-10-15 01:00:00");
    await v_65cdd1("mem-b1", v_ceb55a, v_3f4e2e, Date.parse("2026-10-15T00:00:00Z"));
    await v_180e63("mem-b1", "user", "통화");
    const v_8d4337 = await v_60df93(v_c9c489 as never, {
      userId: v_ceb55a, cloneId: v_3f4e2e, includeChat: false, maxTurns: 100,
    });
    v_4d37e3(v_8d4337.turns.map((v_8d41d7) => v_8d41d7.text)).toEqual(["통화"]);
  });

  v_23805a("reset 컷오프 이전 채팅도 빠지고, maxTurns 는 합친 뒤 최근 쪽을 남긴다", async () => {
    const { u: v_ceb55a, c: v_3f4e2e } = await v_952094("mem-c");
    await v_0558a4(v_ceb55a, v_3f4e2e, "user", "리셋 전 채팅", "2026-10-15 00:00:00");
    await v_c9c489.DB.prepare(
      "INSERT INTO conversation_resets (user_id, clone_id, reset_at) VALUES (?,?,?)",
    ).bind(v_ceb55a, v_3f4e2e, Date.parse("2026-10-15T00:30:00Z")).run();
    await v_0558a4(v_ceb55a, v_3f4e2e, "user", "a", "2026-10-15 01:00:00");
    await v_65cdd1("mem-c1", v_ceb55a, v_3f4e2e, Date.parse("2026-10-15T02:00:00Z"));
    await v_180e63("mem-c1", "user", "b");
    await v_0558a4(v_ceb55a, v_3f4e2e, "clone", "c", "2026-10-15 03:00:00");

    const v_48c915 = await v_60df93(v_c9c489 as never, {
      userId: v_ceb55a, cloneId: v_3f4e2e, includeChat: true, maxTurns: 100,
    });
    v_4d37e3(v_48c915.turns.map((v_8d41d7) => v_8d41d7.text)).toEqual(["a", "b", "c"]);
    const v_5dd9f4 = await v_60df93(v_c9c489 as never, {
      userId: v_ceb55a, cloneId: v_3f4e2e, includeChat: true, maxTurns: 2,
    });
    v_4d37e3(v_5dd9f4.turns.map((v_8d41d7) => v_8d41d7.text)).toEqual(["b", "c"]);
  });
});

v_469bf2("POST /oth-path — 기존 평문 일괄 암호화", () => {
  v_ba7107(v_fc6bcf);

  const v_d1bf04 = (v_02be30, v_3f4675 = v_68f0aa(), v_7bc053 = 0) =>
    v_1df298.fetch("http://localhost/oth-path", {
      method: "POST", headers: v_3f4675, body: JSON.stringify({ limit: v_02be30, afterId: v_7bc053 }),
    });

  async function v_d343a4(v_be62d3, v_43e90c, v_6e0fd3, v_8adfb8) {
    await v_65cdd1(v_be62d3, v_43e90c, v_6e0fd3, 1_000_000);
    let v_1923e2 = 0;
    for (const v_8d41d7 of v_8adfb8) {
      v_1923e2 += 1;
      await v_c9c489.DB.prepare(
        "INSERT INTO call_turns (call_id, seq, role, text, created_at) VALUES (?,?,?,?,?)",
      ).bind(v_be62d3, v_1923e2, "user", v_8d41d7, 1_000_000 + v_1923e2).run();
    }
  }

  v_23805a("ORCH_SECRET 없으면 401", async () => {
    v_4d37e3((await v_d1bf04(10, {})).status).toBe(401);
  });

  v_23805a("평문만 골라 암호화하고, 나눠 돌려도 남은 수가 0 이 되며, 내용은 그대로 읽힌다", async () => {
    await v_d343a4("bf-a1", 5301, 6301, ["가", "나", "다"]);
    await v_d343a4("bf-a2", 5302, 6302, ["라"]);

    let v_916658 = -1;
    let v_7bc053 = 0;
    for (let v_ebec57 = 0; v_ebec57 < 10 && v_916658 !== 0; v_ebec57++) {
      const v_8f00b9 = await v_d1bf04(2, v_68f0aa(), v_7bc053);
      v_4d37e3(v_8f00b9.status).toBe(200);
      const v_8d4337 = (await v_8f00b9.json()) as { remaining: number; lastId: number };
      v_916658 = v_8d4337.remaining;
      v_7bc053 = v_8d4337.lastId;
    }
    v_4d37e3(v_916658).toBe(0);
    for (const v_fd5f43 of [...(await v_20c619("bf-a1")), ...(await v_20c619("bf-a2"))]) {
      v_4d37e3(v_fd5f43.startsWith("v3.")).toBe(true);
    }
    v_4d37e3((await v_aff13d(5301, 6301)).turns.map((v_8d41d7) => v_8d41d7.text)).toEqual(["가", "나", "다"]);
    v_4d37e3((await v_aff13d(5302, 6302)).turns.map((v_8d41d7) => v_8d41d7.text)).toEqual(["라"]);
  });

  v_23805a("이미 암호화된 행은 다시 건드리지 않는다", async () => {
    await v_65cdd1("bf-b1", 5303, 6303, 1_000_000);
    await v_180e63("bf-b1", "user", "이미 암호문");
    const v_e98932 = await v_20c619("bf-b1");
    await v_d1bf04(100);
    v_4d37e3(await v_20c619("bf-b1")).toEqual(v_e98932);
  });
});

v_469bf2("파쇄·백필 경계 (el 검토 반영)", () => {
  v_ba7107(v_fc6bcf);

  async function v_6ebfe1(v_be62d3) {
    const v_9419a6 = (await v_20c619(v_be62d3)).find((v_fd5f43) => v_fd5f43.startsWith("v3."))!.split(".")[2]!;
    await v_b31343(v_a1651b(), v_9419a6);
  }

  v_23805a("파쇄된 대화는 남아 있던 평문 행도 읽기에서 빠진다", async () => {
    await v_65cdd1("sh-a1", 5401, 6401, 1_000_000);
    await v_c9c489.DB.prepare(
      "INSERT INTO call_turns (call_id, seq, role, text, created_at) VALUES (?,?,?,?,?)",
    ).bind("sh-a1", 1, "user", "파쇄 전 평문", 1_000_001).run();
    await v_180e63("sh-a1", "user", "암호문");
    await v_6ebfe1("sh-a1");
    v_4d37e3((await v_aff13d(5401, 6401)).turns).toEqual([]);
  });

  v_23805a("백필은 파쇄된 대화의 평문에 막히지 않고 뒤쪽 행까지 진행하며, 그 평문은 비운다", async () => {
    await v_65cdd1("sh-b1", 5402, 6402, 1_000_000);
    await v_180e63("sh-b1", "user", "키 만들기");
    for (let v_ebec57 = 0; v_ebec57 < 3; v_ebec57++) {
      await v_c9c489.DB.prepare(
        "INSERT INTO call_turns (call_id, seq, role, text, created_at) VALUES (?,?,?,?,?)",
      ).bind("sh-b1", 10 + v_ebec57, "user", `파쇄 평문 ${v_ebec57}`, 1_000_100 + v_ebec57).run();
    }
    await v_6ebfe1("sh-b1");
    await v_65cdd1("sh-b2", 5403, 6403, 2_000_000);
    await v_c9c489.DB.prepare(
      "INSERT INTO call_turns (call_id, seq, role, text, created_at) VALUES (?,?,?,?,?)",
    ).bind("sh-b2", 1, "user", "뒤쪽 정상", 2_000_001).run();

    let v_8d4337 = { processed: 0, remaining: -1, lastId: 0, erasedShredded: 0 };
    let v_f6eb4c = 0;
    for (let v_ebec57 = 0; v_ebec57 < 10 && v_8d4337.remaining !== 0; v_ebec57++) {
      const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
        method: "POST", headers: v_68f0aa(), body: JSON.stringify({ limit: 2, afterId: v_8d4337.lastId }),
      });
      v_8d4337 = (await v_8f00b9.json()) as typeof v_8d4337;
      v_f6eb4c += v_8d4337.erasedShredded;
    }
    v_4d37e3(v_8d4337.remaining).toBe(0);
    v_4d37e3((await v_20c619("sh-b2"))[0]!.startsWith("v3.")).toBe(true);

    v_4d37e3(v_f6eb4c).toBe(3);
    const v_dbaa7f = await v_20c619("sh-b1");
    v_4d37e3(v_dbaa7f.filter((v_8d41d7) => v_8d41d7.includes("파쇄 평문"))).toEqual([]);
    v_4d37e3(v_dbaa7f).toHaveLength(4);
  });
});

v_469bf2("mizu 검토 반영", () => {
  v_ba7107(v_fc6bcf);

  v_23805a("KEK 를 못 얻어도 파쇄된 대화에는 평문을 남기지 않는다", async () => {
    await v_65cdd1("mz-a1", 5501, 6501, 1_000_000);
    await v_180e63("mz-a1", "user", "처음");
    const v_9419a6 = (await v_20c619("mz-a1"))[0]!.split(".")[2]!;
    await v_b31343(v_a1651b(), v_9419a6);
    await v_c9c489.DB.prepare("UPDATE encryption_keys SET status = 'retired' WHERE status = 'active'").run();
    try {
      v_4d37e3((await v_180e63("mz-a1", "user", "KEK 없음 파쇄")).status).toBe(200);
    } finally {
      await v_c9c489.DB.prepare("UPDATE encryption_keys SET status = 'active' WHERE kek_id = 'kek_test_v1'").run();
    }
    v_4d37e3((await v_20c619("mz-a1")).some((v_8d41d7) => v_8d41d7.includes("KEK 없음 파쇄"))).toBe(false);
  });

  v_23805a("KEK 를 못 얻고 파쇄도 안 된 대화는 평문으로라도 남긴다(발화 유실 금지)", async () => {
    await v_65cdd1("mz-b1", 5502, 6502, 1_000_000);
    await v_c9c489.DB.prepare("UPDATE encryption_keys SET status = 'retired' WHERE status = 'active'").run();
    try {
      v_4d37e3((await v_180e63("mz-b1", "user", "폴백 평문")).status).toBe(200);
    } finally {
      await v_c9c489.DB.prepare("UPDATE encryption_keys SET status = 'active' WHERE kek_id = 'kek_test_v1'").run();
    }
    v_4d37e3(await v_20c619("mz-b1")).toEqual(["폴백 평문"]);
  });

  v_23805a("암호문을 다른 통화 행으로 옮겨 붙이면 열리지 않는다(AAD)", async () => {
    await v_65cdd1("mz-c1", 5503, 6503, 1_000_000);
    await v_65cdd1("mz-c2", 5503, 6503, 2_000_000);
    await v_180e63("mz-c1", "user", "원래 자리");
    await v_180e63("mz-c2", "user", "다른 통화");
    const v_3263c7 = (await v_20c619("mz-c1"))[0]!;
    await v_c9c489.DB.prepare("UPDATE call_turns SET text = ? WHERE call_id = ?").bind(v_3263c7, "mz-c2").run();
    const v_8adfb8 = (await v_aff13d(5503, 6503)).turns.map((v_8d41d7) => v_8d41d7.text);
    v_4d37e3(v_8adfb8).toEqual(["원래 자리"]);
  });

  v_23805a("'V3.0' 으로 시작하는 평문도 백필이 암호화한다(대소문자)", async () => {
    await v_65cdd1("mz-d1", 5504, 6504, 1_000_000);
    await v_c9c489.DB.prepare(
      "INSERT INTO call_turns (call_id, seq, role, text, created_at) VALUES (?,?,?,?,?)",
    ).bind("mz-d1", 1, "user", "V3.0 출시했대", 1_000_001).run();
    let v_8d4337 = { remaining: -1, lastId: 0 };
    for (let v_ebec57 = 0; v_ebec57 < 20 && v_8d4337.remaining !== 0; v_ebec57++) {
      const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
        method: "POST", headers: v_68f0aa(), body: JSON.stringify({ limit: 50, afterId: v_8d4337.lastId }),
      });
      v_8d4337 = (await v_8f00b9.json()) as typeof v_8d4337;
    }
    v_4d37e3((await v_20c619("mz-d1"))[0]!.startsWith("v3.")).toBe(true);
    v_4d37e3((await v_aff13d(5504, 6504)).turns.map((v_8d41d7) => v_8d41d7.text)).toEqual(["V3.0 출시했대"]);
  });
});
