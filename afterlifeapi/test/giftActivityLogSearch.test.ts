import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

const v_a1651b = () => v_c9c489.DB as unknown as D1Database;

async function v_21cc31(v_43e90c): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return v_b2eae5({ sub: v_43e90c, kind: "access" }, v_43fd42, 600);
}

async function v_bfb240(v_1833e7, v_e0c7e8): Promise<number> {
  const v_cb35cb = await v_a1651b()
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', ?, CURRENT_TIMESTAMP)`)
    .bind(v_e0c7e8 ?? `gas-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.local`, v_1833e7)
    .run();
  return v_cb35cb.meta.last_row_id as number;
}

const v_a8a114 = (v_64877a, v_35f85c, v_d5dda0) => Math.floor(Date.UTC(v_64877a, v_35f85c - 1, v_d5dda0, 3, 0, 0) / 1000);

async function v_bdb39e(v_43e90c, v_94302c, v_9e67a6, v_f6ec04 = null) {
  await v_a1651b()
    .prepare(
      `INSERT INTO gift_inventory_events (user_id, kind, gift_id, count, xrun_amount, counterpart_user_id, created_at)
       VALUES (?, ?, 'rose', 1, 0, ?, ?)`,
    )
    .bind(v_43e90c, v_94302c, v_f6ec04, v_9e67a6)
    .run();
}

async function v_38715b(v_43e90c, v_212049) {
  const v_8f00b9 = await v_1df298.fetch(`https://x/oth-path${v_212049}`, {
    headers: { Authorization: `Bearer ${await v_21cc31(v_43e90c)}` },
  });
  return { status: v_8f00b9.status, json: await v_8f00b9.json<Record<string, any>>() };
}

const v_6a53fd = (v_7ecfd1) =>
  (v_7ecfd1.items as { createdAt: string }[]).map((v_ebec57) => new Date(Date.parse(v_ebec57.createdAt) + 9 * 3600_000).toISOString().slice(0, 10)).sort();

v_469bf2("GET /oth-path?q= 검색", () => {
  v_23805a("날짜: 연·연월·연월일·월일 (KST)", async () => {
    const v_b32680 = await v_bfb240("나");
    await v_bdb39e(v_b32680, "sent", v_a8a114(2026, 10, 26));
    await v_bdb39e(v_b32680, "sent", v_a8a114(2026, 10, 3));
    await v_bdb39e(v_b32680, "sent", v_a8a114(2026, 9, 26));
    await v_bdb39e(v_b32680, "sent", v_a8a114(2025, 10, 26));
    const v_ab6401 = (v_fd5f43) => v_38715b(v_b32680, `?kind=sent&tz=540&q=${encodeURIComponent(v_fd5f43)}`);

    v_4d37e3(v_6a53fd((await v_ab6401("2026")).json)).toEqual(["2026-09-26", "2026-10-03", "2026-10-26"]);
    v_4d37e3(v_6a53fd((await v_ab6401("202610")).json)).toEqual(["2026-10-03", "2026-10-26"]);
    v_4d37e3(v_6a53fd((await v_ab6401("2026-10-26")).json)).toEqual(["2026-10-26"]);
    v_4d37e3(v_6a53fd((await v_ab6401("1026")).json)).toEqual(["2025-10-26", "2026-10-26"]);
    const v_cb35cb = await v_ab6401("10-26");
    v_4d37e3(v_6a53fd(v_cb35cb.json)).toEqual(["2025-10-26", "2026-10-26"]);
    v_4d37e3(v_cb35cb.json.total).toBe(2); 
  });

  v_23805a("KST 자정 근처도 현지 날짜로", async () => {
    const v_b32680 = await v_bfb240("나");

    await v_bdb39e(v_b32680, "sent", Math.floor(Date.UTC(2026, 9, 25, 15, 30) / 1000));
    v_4d37e3((await v_38715b(v_b32680, "?kind=sent&tz=540&q=1026")).json.items).toHaveLength(1);
    v_4d37e3((await v_38715b(v_b32680, "?kind=sent&tz=540&q=1025")).json.items).toHaveLength(0);
  });

  v_23805a("이름: 상대 이름 부분 일치, 이메일은 검색 안 됨, LIKE 와일드카드는 글자 그대로", async () => {
    const v_b32680 = await v_bfb240("나");
    const v_69caa4 = await v_bfb240("박희은", "secret-mail@test.local");
    const v_da9872 = await v_bfb240("50%할인");
    await v_bdb39e(v_b32680, "sent", v_a8a114(2026, 10, 1), v_69caa4);
    await v_bdb39e(v_b32680, "sent", v_a8a114(2026, 10, 2), v_da9872);
    await v_bdb39e(v_b32680, "sent", v_a8a114(2026, 10, 3), null);

    v_4d37e3((await v_38715b(v_b32680, `?kind=sent&q=${encodeURIComponent("희은")}`)).json.items).toHaveLength(1);
    v_4d37e3((await v_38715b(v_b32680, `?kind=sent&q=secret-mail`)).json.items).toHaveLength(0);
    v_4d37e3((await v_38715b(v_b32680, `?kind=sent&q=${encodeURIComponent("%")}`)).json.items).toHaveLength(1);
    v_4d37e3((await v_38715b(v_b32680, `?kind=sent&q=${encodeURIComponent("_")}`)).json.items).toHaveLength(0);
  });

  v_23805a("q 없음·빈 q 는 기존과 같다, 다른 사람 내역은 안 나온다", async () => {
    const v_b32680 = await v_bfb240("나");
    const v_a9cbf1 = await v_bfb240("남");
    await v_bdb39e(v_b32680, "sent", v_a8a114(2026, 10, 26));
    await v_bdb39e(v_a9cbf1, "sent", v_a8a114(2026, 10, 26));
    v_4d37e3((await v_38715b(v_b32680, "?kind=sent")).json.total).toBe(1);
    v_4d37e3((await v_38715b(v_b32680, "?kind=sent&q=")).json.total).toBe(1);
    v_4d37e3((await v_38715b(v_b32680, "?kind=sent&q=1026")).json.total).toBe(1);
  });

  v_23805a("tz 가 이상하면 KST 로", async () => {
    const v_b32680 = await v_bfb240("나");
    await v_bdb39e(v_b32680, "sent", Math.floor(Date.UTC(2026, 9, 25, 15, 30) / 1000));
    for (const v_640210 of ["abc", "99999", ""]) {
      const v_cb35cb = await v_38715b(v_b32680, `?kind=sent&q=1026&tz=${v_640210}`);
      v_4d37e3(v_cb35cb.status).toBe(200);
      v_4d37e3(v_cb35cb.json.items).toHaveLength(1);
    }
  });
});
