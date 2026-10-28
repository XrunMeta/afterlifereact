import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

const v_a1651b = () => v_c9c489.DB as unknown as D1Database;

async function v_21cc31(v_43e90c): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return v_b2eae5({ sub: v_43e90c, kind: "access" }, v_43fd42, 600);
}

async function v_bfb240(): Promise<number> {
  const v_cb35cb = await v_a1651b()
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(`ges-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.local`)
    .run();
  return v_cb35cb.meta.last_row_id as number;
}

const v_44063a = (v_64877a, v_35f85c, v_d5dda0) => Date.UTC(v_64877a, v_35f85c - 1, v_d5dda0, 3, 0, 0);

async function v_f7d470(v_43e90c, v_9de800, v_d016c9): Promise<number> {
  const v_cb35cb = await v_a1651b()
    .prepare(
      `INSERT INTO gift_exchanges (user_id, gift_id, gift_name, qty, fee_qty, status, idempotency_key, created_at)
       VALUES (?, 'rose', 'ROSE', ?, 0, 'failed', ?, ?)`,
    )
    .bind(v_43e90c, v_d016c9, `k-${Math.random()}`, v_9de800)
    .run();
  return v_cb35cb.meta.last_row_id as number;
}

async function v_38715b(v_43e90c, v_212049) {
  const v_8f00b9 = await v_1df298.fetch(`https://x/oth-path${v_212049}`, {
    headers: { Authorization: `Bearer ${await v_21cc31(v_43e90c)}` },
  });
  return { status: v_8f00b9.status, json: await v_8f00b9.json<{ items: { exchangeId: number; qty: number }[] }>() };
}

v_469bf2("GET /oth-path?q=", () => {
  v_23805a("50건 밖의 옛 날짜도 찾는다", async () => {
    const v_ceb55a = await v_bfb240();
    const v_0ec238 = await v_f7d470(v_ceb55a, v_44063a(2026, 9, 1), 7);
    for (let v_ebec57 = 0; v_ebec57 < 55; v_ebec57++) await v_f7d470(v_ceb55a, v_44063a(2026, 10, 20) + v_ebec57 * 1000, 1);
    const v_48c915 = await v_38715b(v_ceb55a, "");
    v_4d37e3(v_48c915.json.items).toHaveLength(50);
    v_4d37e3(v_48c915.json.items.some((v_ebec57) => v_ebec57.exchangeId === v_0ec238)).toBe(false);

    const v_cb35cb = await v_38715b(v_ceb55a, "?tz=540&q=0901");
    v_4d37e3(v_cb35cb.status).toBe(200);
    v_4d37e3(v_cb35cb.json.items.map((v_ebec57) => v_ebec57.exchangeId)).toEqual([v_0ec238]);
    v_4d37e3((await v_38715b(v_ceb55a, "?tz=540&q=202609")).json.items.map((v_ebec57) => v_ebec57.exchangeId)).toEqual([v_0ec238]);
  });

  v_23805a("교환번호·수량으로 찾는다", async () => {
    const v_ceb55a = await v_bfb240();
    const v_779914 = await v_f7d470(v_ceb55a, v_44063a(2026, 10, 1), 12);
    await v_f7d470(v_ceb55a, v_44063a(2026, 10, 2), 3);
    const v_7fa7c6 = `EX-${String(v_779914).padStart(6, "0")}`;
    v_4d37e3((await v_38715b(v_ceb55a, `?q=${v_7fa7c6}`)).json.items.map((v_ebec57) => v_ebec57.exchangeId)).toEqual([v_779914]);
    v_4d37e3((await v_38715b(v_ceb55a, `?q=${v_7fa7c6.toLowerCase()}`)).json.items.map((v_ebec57) => v_ebec57.exchangeId)).toEqual([v_779914]);
    v_4d37e3((await v_38715b(v_ceb55a, "?q=12")).json.items.map((v_ebec57) => v_ebec57.qty)).toContain(12);
  });

  v_23805a("다른 사람 내역은 안 나온다", async () => {
    const v_ceb55a = await v_bfb240();
    const v_81e2ef = await v_bfb240();
    await v_f7d470(v_81e2ef, v_44063a(2026, 10, 26), 1);
    v_4d37e3((await v_38715b(v_ceb55a, "?q=1026")).json.items).toHaveLength(0);
  });
});

v_469bf2("GET /oth-path?from=&to= 기간", () => {
  v_23805a("양끝 포함, 검색어와 AND", async () => {
    const v_ceb55a = await v_bfb240();
    await v_f7d470(v_ceb55a, v_44063a(2026, 10, 1), 3);
    const v_779914 = await v_f7d470(v_ceb55a, v_44063a(2026, 10, 5), 777);
    const v_148ff6 = await v_f7d470(v_ceb55a, v_44063a(2026, 10, 10), 888);
    await v_f7d470(v_ceb55a, v_44063a(2026, 10, 11), 3);
    const v_52e08b = async (v_212049) => (await v_38715b(v_ceb55a, `?tz=540${v_212049}`)).json.items.map((v_ebec57) => v_ebec57.exchangeId).sort();
    v_4d37e3(await v_52e08b("&from=2026-10-05&to=2026-10-10")).toEqual([v_779914, v_148ff6].sort());
    v_4d37e3(await v_52e08b("&from=2026-10-05&to=2026-10-10&q=777")).toEqual([v_779914]);
  });
});
