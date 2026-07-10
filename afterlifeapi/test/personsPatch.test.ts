import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

async function v_d33950(v_e0c7e8): Promise<{ id: number; token: string }> {
  const { hashPassword: v_54846c } = await import("../src/lib/password");
  await (v_c9c489 as any).DB.prepare(
    `INSERT INTO users (email, password_hash, name, created_at) VALUES (?, ?, 'U', CURRENT_TIMESTAMP)`,
  ).bind(v_e0c7e8, await v_54846c("Passw0rd!!")).run();
  const v_ceb55a = await (v_c9c489 as any).DB.prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>();
  const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: v_e0c7e8, password: "Passw0rd!!" }),
  });
  const v_21cc31 = (await v_8f00b9.json<{ accessToken: string }>()).accessToken;
  return { id: v_ceb55a!.id, token: v_21cc31 };
}

async function v_4e7b87(v_21cc31, v_4d33b2 = {}): Promise<number> {
  const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
    method: "POST",
    headers: { Authorization: `Bearer ${v_21cc31}`, "Content-Type": "application/json" },
    body: JSON.stringify(v_4d33b2),
  });
  const { id: v_389afb } = (await v_8f00b9.json()) as { id: number };
  return v_389afb;
}

v_469bf2("PATCH /oth-path", () => {
  v_23805a("displayName 갱신 성공 → 200 + D1 반영", async () => {
    const { token: v_21cc31 } = await v_d33950("patch-ok@test.test");
    const v_ca1ec5 = await v_4e7b87(v_21cc31);
    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_ca1ec5}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${v_21cc31}`, "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: "민지" }),
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = (await v_8f00b9.json()) as { id: number; displayName: string };
    v_4d37e3(v_4d33b2.displayName).toBe("민지");
    const v_3ac7e7 = await (v_c9c489 as any).DB.prepare("SELECT display_name FROM persons WHERE id = ?")
      .bind(v_ca1ec5).first<{ display_name: string }>();
    v_4d37e3(v_3ac7e7?.display_name).toBe("민지");
  });

  v_23805a("빈 문자열/31자 초과 → 422", async () => {
    const { token: v_21cc31 } = await v_d33950("patch-bad@test.test");
    const v_ca1ec5 = await v_4e7b87(v_21cc31);
    const v_d6db99 = await v_1df298.fetch(`http://localhost/oth-path${v_ca1ec5}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${v_21cc31}`, "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: "  " }),
    });
    v_4d37e3(v_d6db99.status).toBe(422);
    const v_d0bb64 = await v_1df298.fetch(`http://localhost/oth-path${v_ca1ec5}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${v_21cc31}`, "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: "가".repeat(31) }),
    });
    v_4d37e3(v_d0bb64.status).toBe(422);
  });

  v_23805a("타인 소유 person → 404", async () => {
    const v_257b90 = await v_d33950("patch-owner@test.test");
    const v_53bb36 = await v_d33950("patch-attacker@test.test");
    const v_ca1ec5 = await v_4e7b87(v_257b90.token);
    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_ca1ec5}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${v_53bb36.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: "철수" }),
    });
    v_4d37e3(v_8f00b9.status).toBe(404);
  });

  v_23805a("미인증 → 401", async () => {
    const v_8f00b9 = await v_1df298.fetch("http://localhost/oth-path", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: "철수" }),
    });
    v_4d37e3(v_8f00b9.status).toBe(401);
  });
});
