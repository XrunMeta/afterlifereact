import { v_469bf2, v_23805a, v_4d37e3, v_ba7107 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

v_469bf2("0092 clone_type expert", () => {
  let v_1badb6;

  v_ba7107(async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_e0c7e8 = `owner_clone_type_${Date.now()}@x.test`;
    await v_a1651b
      .prepare(
        `INSERT INTO users (email, password_hash, name, created_at)
         VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`,
      )
      .bind(v_e0c7e8)
      .run();
    const v_ceb55a = await v_a1651b
      .prepare("SELECT id FROM users WHERE email = ?")
      .bind(v_e0c7e8)
      .first<{ id: number }>();
    v_1badb6 = v_ceb55a!.id;
  });

  const v_d70f86 = (v_3b27d9) => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    return v_a1651b
      .prepare(
        "INSERT INTO clones (owner_id, clone_type, name, username, visibility) VALUES (?, ?, ?, ?, 'private')",
      )
      .bind(v_1badb6, v_3b27d9, `t-${v_3b27d9}`, `u_${v_3b27d9}_${Date.now()}_${Math.random()}`)
      .run();
  };

  v_23805a("accepts expert", async () => {
    await v_4d37e3(v_d70f86("expert")).resolves.toBeTruthy();
  });

  v_23805a("still accepts legacy 4 types", async () => {
    for (const v_8d41d7 of ["memlow", "friend", "mentor", "celeb"]) {
      await v_4d37e3(v_d70f86(v_8d41d7)).resolves.toBeTruthy();
    }
  });

  v_23805a("still rejects unknown type", async () => {
    await v_4d37e3(v_d70f86("wizard")).rejects.toThrow();
  });
});

v_469bf2("POST /oth-path rejects expert clone_type (미개방 API 고정)", () => {
  async function v_86c39f(v_43e90c): Promise<string> {
    const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
    const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
    if (!v_43fd42) throw new Error("JWT_ACCESS_SECRET missing in test env");
    return await v_b2eae5({ sub: v_43e90c, kind: "access" }, v_43fd42, 60 * 10);
  }

  async function v_bfb240(v_e0c7e8): Promise<number> {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    await v_a1651b
      .prepare(
        `INSERT INTO users (email, password_hash, name, created_at)
         VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`,
      )
      .bind(v_e0c7e8)
      .run();
    const v_ceb55a = await v_a1651b
      .prepare("SELECT id FROM users WHERE email = ?")
      .bind(v_e0c7e8)
      .first<{ id: number }>();
    return v_ceb55a!.id;
  }

  v_23805a("POST /oth-path with clone_type=expert returns 400", async () => {
    const v_43e90c = await v_bfb240(`expert-api-test-${Date.now()}-${Math.random()}@test.local`);
    const v_21cc31 = await v_86c39f(v_43e90c);
    const v_6f448e = `test-expert-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${v_21cc31}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": v_6f448e,
      },
      body: JSON.stringify({
        clone_type: "expert",
        name: "Expert Clone",
        username: `expert_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        visibility: "private",
      }),
    });

    v_4d37e3(v_8f00b9.status).toBe(422);
    const v_4d33b2 = await v_8f00b9.json<{ error?: { code?: string } }>();

    v_4d37e3(v_4d33b2.error?.code).toBe("VALIDATION_FAILED");
  });

});
