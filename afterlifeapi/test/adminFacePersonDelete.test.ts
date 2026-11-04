import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

function v_a1651b(): D1Database {
  return v_c9c489.DB as unknown as D1Database;
}

async function v_121982(): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return v_b2eae5({ sub: 88802, kind: "access", admin: true }, v_43fd42, 600);
}

v_469bf2("DELETE /oth-path", () => {
  v_23805a("관리자가 등록 얼굴을 지우면 person 행이 없어지고, 없는 id 는 404", async () => {
    await v_a1651b()
      .prepare(`INSERT INTO users (email, password_hash, name, created_at) VALUES ('afpd@test.local', 'x', 'U', CURRENT_TIMESTAMP)`)
      .run();
    const v_0c8987 = (await v_a1651b().prepare("SELECT id FROM users WHERE email = 'afpd@test.local'").first<{ id: number }>())!.id;
    await v_a1651b()
      .prepare(`INSERT INTO persons (user_id, clone_id, display_name, consent_state, created_at) VALUES (?, NULL, '엄마', 'granted', ?)`)
      .bind(v_0c8987, Date.now())
      .run();
    const v_d4923e = (await v_a1651b().prepare("SELECT id FROM persons WHERE user_id = ?").bind(v_0c8987).first<{ id: number }>())!.id;
    const v_8d41d7 = await v_121982();
    const v_d0ca5b = (v_389afb) =>
      v_1df298.fetch(`http://localhost/oth-path${v_389afb}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${v_8d41d7}` },
      });

    const v_8f00b9 = await v_d0ca5b(v_d4923e);
    v_4d37e3(v_8f00b9.status).toBe(200);
    v_4d37e3(await v_a1651b().prepare("SELECT 1 FROM persons WHERE id = ?").bind(v_d4923e).first()).toBeNull();
    v_4d37e3((await v_d0ca5b(v_d4923e)).status).toBe(404);
  });

  v_23805a("관리자 토큰이 없으면 거절", async () => {
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", { method: "DELETE" });
    v_4d37e3([401, 403]).toContain(v_8f00b9.status);
  });
});
