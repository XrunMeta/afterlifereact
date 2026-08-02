import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

let v_1923e2 = 0;
function v_a1651b(): D1Database {
  return v_c9c489.DB as unknown as D1Database;
}

async function v_bfb240(): Promise<number> {
  v_1923e2 += 1;
  const v_e0c7e8 = `acsf-${v_1923e2}-${Date.now()}@test.local`;
  await v_a1651b()
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(v_e0c7e8)
    .run();
  return (await v_a1651b().prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>())!.id;
}

async function v_4d24a9(v_1badb6): Promise<number> {
  v_1923e2 += 1;
  const v_556427 = `acsf_clone_${v_1923e2}`;
  await v_a1651b()
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
       VALUES (?, 'CT', ?, 'friend', 'public', CURRENT_TIMESTAMP)`,
    )
    .bind(v_1badb6, v_556427)
    .run();
  return (await v_a1651b().prepare("SELECT id FROM clones WHERE username = ?").bind(v_556427).first<{ id: number }>())!.id;
}

async function v_c8e75a(v_6e0fd3): Promise<void> {
  await v_a1651b()
    .prepare(`UPDATE clones SET admin_suspended_at = CURRENT_TIMESTAMP, admin_suspend_reason = '테스트' WHERE id = ?`)
    .bind(v_6e0fd3)
    .run();
}

async function v_121982(): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return v_b2eae5({ sub: 88801, kind: "access", admin: true }, v_43fd42, 600);
}

async function v_894788(v_212049, v_8d41d7): Promise<{ items: Array<{ id: number }> }> {
  const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_212049}`, {
    headers: { Authorization: `Bearer ${v_8d41d7}` },
  });
  return v_8f00b9.json();
}

v_469bf2("GET /oth-path?suspended= — 정지 필터", () => {
  v_23805a("suspended=1 이면 정지된 클론만, suspended=0 이면 정지 안 된 클론만 반환", async () => {
    const v_257b90 = await v_bfb240();
    const v_7f572b = await v_4d24a9(v_257b90);
    const v_375bef = await v_4d24a9(v_257b90);
    await v_c8e75a(v_7f572b);
    const v_8d41d7 = await v_121982();

    const v_ee35ad = await v_894788("?suspended=1&limit=200", v_8d41d7);
    const v_d2db98 = v_ee35ad.items.map((v_ebec57) => v_ebec57.id);
    v_4d37e3(v_d2db98).toContain(v_7f572b);
    v_4d37e3(v_d2db98).not.toContain(v_375bef);

    const v_59b8e7 = await v_894788("?suspended=0&limit=200", v_8d41d7);
    const v_aea9ad = v_59b8e7.items.map((v_ebec57) => v_ebec57.id);
    v_4d37e3(v_aea9ad).not.toContain(v_7f572b);
    v_4d37e3(v_aea9ad).toContain(v_375bef);

    const v_afafa4 = await v_894788("?limit=200", v_8d41d7);
    const v_cabe28 = v_afafa4.items.map((v_ebec57) => v_ebec57.id);
    v_4d37e3(v_cabe28).toContain(v_7f572b);
    v_4d37e3(v_cabe28).toContain(v_375bef);
  });
});
