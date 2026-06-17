import { v_469bf2, v_23805a, v_4d37e3, v_ba7107 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

let v_1923e2 = 0;
async function v_bfb240(): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  v_1923e2 += 1;
  const v_e0c7e8 = `bh-${v_1923e2}-${(v_1923e2 * 7919) % 100000}@test.local`;
  await v_a1651b
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(v_e0c7e8)
    .run();
  return (await v_a1651b.prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>())!.id;
}

const v_491b6a = "zqxblocktag";
async function v_4d24a9(v_1badb6): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  v_1923e2 += 1;
  const v_556427 = `bh_clone_${v_1923e2}`;
  await v_a1651b
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
       VALUES (?, ?, ?, 'friend', 'public', CURRENT_TIMESTAMP)`,
    )
    .bind(v_1badb6, `${v_491b6a}_${v_1923e2}`, v_556427)
    .run();
  return (await v_a1651b.prepare("SELECT id FROM clones WHERE username = ?").bind(v_556427).first<{ id: number }>())!.id;
}

async function v_21cc31(v_43e90c): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!v_43fd42) throw new Error("JWT_ACCESS_SECRET missing");
  return await v_b2eae5({ sub: v_43e90c, kind: "access" }, v_43fd42, 600);
}

function v_a0c9cd(v_9fe22d, v_8d41d7): Promise<Response> {
  return v_1df298.fetch(`http://localhost${v_9fe22d}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${v_8d41d7}` },
  });
}

async function v_865bd1(v_8d41d7): Promise<number[]> {
  const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path?limit=50", {
    headers: { Authorization: `Bearer ${v_8d41d7}` },
  });
  const v_b75e36 = (await v_8f00b9.json()) as { items?: Array<{ cloneId?: number }> };
  return (v_b75e36.items ?? []).map((v_ebec57) => v_ebec57.cloneId!).filter(Boolean);
}

async function v_7f58d0(v_8d41d7): Promise<number[]> {
  const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path?q=${v_491b6a}&limit=50`, {
    headers: { Authorization: `Bearer ${v_8d41d7}` },
  });
  const v_b75e36 = (await v_8f00b9.json()) as { items?: Array<{ id?: number }> };
  return (v_b75e36.items ?? []).map((v_ebec57) => v_ebec57.id!).filter(Boolean);
}

v_469bf2("차단 시 클론 숨김 — 피드 + 검색", () => {
  v_ba7107(async () => {
    try {
      await (v_c9c489.DB as unknown as D1Database).prepare("SELECT COUNT(*) AS c FROM user_blocks").first();
    } catch {
      throw new Error("D1 migrations not applied.");
    }
  });

  v_23805a("유저 차단 → 그 유저의 클론이 피드/검색에서 사라짐, 정상 유저 클론은 유지", async () => {
    const v_debed8 = await v_bfb240();
    const v_83eddd = await v_bfb240();
    const v_588159 = await v_bfb240();
    const v_9e4d00 = await v_4d24a9(v_83eddd);
    const v_78d357 = await v_4d24a9(v_588159);
    const v_6369b9 = await v_21cc31(v_debed8);

    v_4d37e3(await v_865bd1(v_6369b9)).toEqual(v_4d37e3.arrayContaining([v_9e4d00, v_78d357]));
    v_4d37e3(await v_7f58d0(v_6369b9)).toEqual(v_4d37e3.arrayContaining([v_9e4d00, v_78d357]));

    v_4d37e3((await v_a0c9cd(`/oth-path${v_83eddd}/block`, v_6369b9)).status).toBe(200);

    const v_2db2a5 = await v_865bd1(v_6369b9);
    v_4d37e3(v_2db2a5).not.toContain(v_9e4d00);
    v_4d37e3(v_2db2a5).toContain(v_78d357);
    const v_9875a1 = await v_7f58d0(v_6369b9);
    v_4d37e3(v_9875a1).not.toContain(v_9e4d00);
    v_4d37e3(v_9875a1).toContain(v_78d357);
  });

  v_23805a("클론만 차단 → 그 클론만 사라지고 같은 주인의 다른 클론/타 클론은 유지", async () => {
    const v_debed8 = await v_bfb240();
    const v_257b90 = await v_bfb240();
    const v_d1bf0b = await v_4d24a9(v_257b90);
    const v_aaeaa8 = await v_4d24a9(v_257b90); 
    const v_6369b9 = await v_21cc31(v_debed8);

    v_4d37e3((await v_a0c9cd(`/oth-path${v_d1bf0b}/block`, v_6369b9)).status).toBe(200);

    const v_2db2a5 = await v_865bd1(v_6369b9);
    v_4d37e3(v_2db2a5).not.toContain(v_d1bf0b);
    v_4d37e3(v_2db2a5).toContain(v_aaeaa8); 

    const v_9875a1 = await v_7f58d0(v_6369b9);
    v_4d37e3(v_9875a1).not.toContain(v_d1bf0b);
    v_4d37e3(v_9875a1).toContain(v_aaeaa8);
  });
});
