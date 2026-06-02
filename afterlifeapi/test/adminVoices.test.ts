import { v_469bf2, v_23805a, v_4d37e3, v_ba7107 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

const v_d72b33 = 9002; 

async function v_b2eae5(v_f91f33): Promise<string> {
  const { issueToken: v_c43006 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET!;
  return v_c43006(v_f91f33, v_43fd42, 600);
}

async function v_5d5cfb(): Promise<string> {
  return v_b2eae5({ sub: v_d72b33, kind: "access", admin: true });
}

async function v_7c351e(): Promise<string> {
  return v_b2eae5({ sub: 99998, kind: "access", admin: true });
}

v_ba7107(async () => {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b
    .prepare(
      `INSERT OR REPLACE INTO admin_users
         (id, email, password_hash, role, is_active)
       VALUES (?, ?, ?, 'super_admin', 1)`,
    )
    .bind(v_d72b33, "superadmin-voices@afterlife.test", "hashed-placeholder")
    .run();
});

v_469bf2("admin /oth-path", () => {
  v_23805a("목록 조회 — admin 토큰으로 200", async () => {
    const v_21cc31 = await v_7c351e();
    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path", {
      headers: { Authorization: `Bearer ${v_21cc31}` },
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_4d33b2 = await v_8f00b9.json<{ voices: unknown[] }>();
    v_4d37e3(Array.isArray(v_4d33b2.voices)).toBe(true);
  });

  v_23805a("생성·수정·비활성 — super_admin 토큰으로 201→200", async () => {
    const v_21cc31 = await v_5d5cfb();
    const v_68f0aa = { Authorization: `Bearer ${v_21cc31}`, "Content-Type": "application/json" };

    const v_28eeb6 = await v_1df298.fetch("https://x/oth-path", {
      method: "POST",
      headers: v_68f0aa,
      body: JSON.stringify({ name: "테스트음색", sort_order: 5, r2_key: "voice/sample/test.mp3" }),
    });
    v_4d37e3(v_28eeb6.status).toBe(201);
    const { id: v_389afb } = await v_28eeb6.json<{ id: number }>();
    v_4d37e3(typeof v_389afb).toBe("number");

    const v_b1eff4 = await v_1df298.fetch(`https://x/oth-path${v_389afb}`, {
      method: "PUT",
      headers: v_68f0aa,
      body: JSON.stringify({ is_active: 0, sort_order: 9 }),
    });
    v_4d37e3(v_b1eff4.status).toBe(200);
    const v_435448 = await v_b1eff4.json<{ ok: boolean }>();
    v_4d37e3(v_435448.ok).toBe(true);
  });

  v_23805a("일반 유저(admin 클레임 없음) — 401 거부", async () => {
    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path");
    v_4d37e3(v_8f00b9.status).toBe(401);
  });

  v_23805a("POST r2_key가 voice/ prefix 없으면 422", async () => {
    const v_21cc31 = await v_5d5cfb();
    const v_68f0aa = { Authorization: `Bearer ${v_21cc31}`, "Content-Type": "application/json" };
    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path", {
      method: "POST",
      headers: v_68f0aa,
      body: JSON.stringify({ name: "악의적음색", r2_key: "private/secret/key.mp3" }),
    });
    v_4d37e3(v_8f00b9.status).toBe(422);
    const v_4d33b2 = await v_8f00b9.json<{ error: { code: string } }>();
    v_4d37e3(v_4d33b2.error.code).toBe("VALIDATION_FAILED");
  });

  v_23805a("PUT r2_key가 voice/ prefix 없으면 422", async () => {
    const v_21cc31 = await v_5d5cfb();
    const v_68f0aa = { Authorization: `Bearer ${v_21cc31}`, "Content-Type": "application/json" };

    const v_28eeb6 = await v_1df298.fetch("https://x/oth-path", {
      method: "POST",
      headers: v_68f0aa,
      body: JSON.stringify({ name: "prefix테스트음색", r2_key: "voice/ok/test.mp3" }),
    });
    v_4d37e3(v_28eeb6.status).toBe(201);
    const { id: v_389afb } = await v_28eeb6.json<{ id: number }>();

    const v_8f00b9 = await v_1df298.fetch(`https://x/oth-path${v_389afb}`, {
      method: "PUT",
      headers: v_68f0aa,
      body: JSON.stringify({ r2_key: "../sensitive/path.mp3" }),
    });
    v_4d37e3(v_8f00b9.status).toBe(422);
    const v_4d33b2 = await v_8f00b9.json<{ error: { code: string } }>();
    v_4d37e3(v_4d33b2.error.code).toBe("VALIDATION_FAILED");
  });

  v_23805a("POST name 81자 초과 — 422", async () => {
    const v_21cc31 = await v_5d5cfb();
    const v_8f00b9 = await v_1df298.fetch("https://x/oth-path", {
      method: "POST",
      headers: { Authorization: `Bearer ${v_21cc31}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: "a".repeat(81) }),
    });
    v_4d37e3(v_8f00b9.status).toBe(422);
  });
});
