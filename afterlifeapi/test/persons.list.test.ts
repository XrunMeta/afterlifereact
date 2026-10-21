import { v_469bf2, v_23805a, v_4d37e3, v_ba7107 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

async function v_bfb240(v_e0c7e8): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`)
    .bind(v_e0c7e8)
    .run();
  const v_ceb55a = await v_a1651b.prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>();
  return v_ceb55a!.id;
}

async function v_4d24a9(v_1badb6, v_556427): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(
      `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at)
       VALUES (?, 'TestClone', ?, 'memlow', 'public', CURRENT_TIMESTAMP)`
    )
    .bind(v_1badb6, v_556427)
    .run();
  const v_3f4e2e = await v_a1651b.prepare("SELECT id FROM clones WHERE username = ?").bind(v_556427).first<{ id: number }>();
  return v_3f4e2e!.id;
}

async function v_86c39f(v_43e90c): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!v_43fd42) throw new Error("JWT_ACCESS_SECRET missing in test env");
  return await v_b2eae5({ sub: v_43e90c, kind: "access" }, v_43fd42, 60 * 10);
}

async function v_2f0be6(v_43e90c, v_6e0fd3, v_1833e7): Promise<void> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(
      `INSERT INTO persons (user_id, clone_id, display_name, consent_state, created_at)
       VALUES (?, ?, ?, 'none', ?)`
    )
    .bind(v_43e90c, v_6e0fd3, v_1833e7, Date.now())
    .run();
}

v_469bf2("GET /oth-path — cloneId 필터", () => {
  let v_21cc31;
  let v_43e90c;
  let v_6e0fd3;
  let v_79e62f;

  v_ba7107(async () => {
    v_43e90c = await v_bfb240("persons-list-filter@test.local");
    v_21cc31 = await v_86c39f(v_43e90c);
    v_6e0fd3 = await v_4d24a9(v_43e90c, "persons-list-clone-a");
    v_79e62f = await v_4d24a9(v_43e90c, "persons-list-clone-b");

    await v_2f0be6(v_43e90c, v_6e0fd3, "형"); 
    await v_2f0be6(v_43e90c, null, "전역이"); 
    await v_2f0be6(v_43e90c, v_79e62f, "다른형"); 
  });

  v_23805a("401 without auth", async () => {
    const v_cb35cb = await v_1df298.fetch("https://x/oth-path");
    v_4d37e3(v_cb35cb.status).toBe(401);
  });

  v_23805a("returns all persons without cloneId (기존 동작 불변)", async () => {
    const v_cb35cb = await v_1df298.fetch("https://x/oth-path", {
      headers: { Authorization: `Bearer ${v_21cc31}` },
    });
    v_4d37e3(v_cb35cb.status).toBe(200);
    const v_4d33b2 = await v_cb35cb.json<{ data: Array<{ displayName: string | null }> }>();
    const v_77b1ac = v_4d33b2.data.map((v_e2a85c) => v_e2a85c.displayName).sort();
    v_4d37e3(v_77b1ac).toEqual(["다른형", "형", "전역이"].sort());
  });

  v_23805a("cloneId 지정 시 그 클론 소속만 (전역·다른 클론 제외)", async () => {
    const v_cb35cb = await v_1df298.fetch(`https://x/oth-path?cloneId=${v_6e0fd3}`, {
      headers: { Authorization: `Bearer ${v_21cc31}` },
    });
    v_4d37e3(v_cb35cb.status).toBe(200);
    const v_4d33b2 = await v_cb35cb.json<{ data: Array<{ displayName: string | null; cloneId: number | null }> }>();
    const v_77b1ac = v_4d33b2.data.map((v_e2a85c) => v_e2a85c.displayName).sort();

    v_4d37e3(v_77b1ac).toEqual(["형"]);
  });

  v_23805a("invalid cloneId → VALIDATION_FAILED(422)", async () => {
    const v_cb35cb = await v_1df298.fetch("https://x/oth-path?cloneId=abc", {
      headers: { Authorization: `Bearer ${v_21cc31}` },
    });
    v_4d37e3(v_cb35cb.status).toBe(422);
    const v_4d33b2 = (await v_cb35cb.json()) as { error: { code: string } };
    v_4d37e3(v_4d33b2.error.code).toBe("VALIDATION_FAILED");
  });
});
