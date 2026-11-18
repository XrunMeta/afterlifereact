

import { v_469bf2, v_23805a, v_4d37e3, v_ff107d } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

const v_1441fe = () => (v_c9c489 as unknown as { DB: D1Database }).DB;

async function v_10abc2(v_328259): Promise<{ id: number; token: string }> {
  const v_a1651b = v_1441fe();
  const v_e0c7e8 = `t11-${Math.random().toString(36).slice(2, 8)}@example.com`;

  const v_8f00b9 = await v_a1651b
    .prepare(
      `INSERT INTO users (name, email, password_hash, birth_date_enc, deletion_state)
       VALUES (?, ?, ?, ?, ?)
       RETURNING id`,
    )
    .bind("T11", v_e0c7e8, "x", v_328259?.withBirthDate ? "sealed" : null, v_328259?.soft ? "soft_deleted" : "active")
    .first<{ id: number }>();
  const v_389afb = v_8f00b9!.id;

  return { id: v_389afb, token: `test-${v_389afb}` };
}

v_469bf2("T11 /oth-path", () => {
  v_23805a("토큰 없으면 401", async () => {
    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ birthDate: "1990-01-01" }),
    });
    v_4d37e3([401, 403]).toContain(v_8f00b9.status);
  });

  v_23805a("birthDate 포맷이 틀리면 422", async () => {
    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: "Bearer invalid" },
      body: JSON.stringify({ birthDate: "1990/01/01" }),
    });

    v_4d37e3(v_8f00b9.ok).toBe(false);
  });
});
