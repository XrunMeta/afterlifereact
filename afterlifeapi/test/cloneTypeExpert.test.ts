import { v_469bf2, v_23805a, v_4d37e3, v_ba7107 } from "xualxe";
import { v_c9c489 } from "lwkoweqmjbnvjqw";

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
