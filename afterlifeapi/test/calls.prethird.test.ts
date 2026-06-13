import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_1df298, v_c9c489 } from "lwkoweqmjbnvjqw";

async function v_bfb240(v_e0c7e8): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b.prepare(
    `INSERT INTO users (email, password_hash, name, created_at) VALUES (?, 'x', 'U', CURRENT_TIMESTAMP)`,
  ).bind(v_e0c7e8).run();
  const v_ceb55a = await v_a1651b.prepare("SELECT id FROM users WHERE email = ?").bind(v_e0c7e8).first<{ id: number }>();
  return v_ceb55a!.id;
}

async function v_4d24a9(v_1badb6, v_556427, v_818579 = "public"): Promise<number> {
  const v_a1651b = v_c9c489.DB as unknown as D1Database;
  await v_a1651b.prepare(
    `INSERT INTO clones (owner_id, name, username, clone_type, visibility, created_at) VALUES (?, 'CT', ?, 'memlow', ?, CURRENT_TIMESTAMP)`,
  ).bind(v_1badb6, v_556427, v_818579).run();
  const v_3f4e2e = await v_a1651b.prepare("SELECT id FROM clones WHERE username = ?").bind(v_556427).first<{ id: number }>();
  return v_3f4e2e!.id;
}

async function v_86c39f(v_43e90c): Promise<string> {
  const { issueToken: v_b2eae5 } = await import("../src/lib/jwt");
  const v_43fd42 = (v_c9c489 as { JWT_ACCESS_SECRET?: string }).JWT_ACCESS_SECRET;
  if (!v_43fd42) throw new Error("JWT_ACCESS_SECRET missing in test env");
  return await v_b2eae5({ sub: v_43e90c, kind: "access" }, v_43fd42, 60 * 10);
}

const v_102c26 = "abcdef012345"; 

v_469bf2("POST /oth-path", () => {
  v_23805a("public clone — 200 + call_sessions INSERT", async () => {
    const v_257b90 = await v_bfb240("pt-o@test.local");
    const v_6e0fd3 = await v_4d24a9(v_257b90, "pt_owner");
    const v_ea333d = await v_86c39f(v_257b90);
    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/call/prethird-start`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_ea333d}`, "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: v_102c26 }),
    });
    v_4d37e3(v_8f00b9.status).toBe(200);
    const v_3ac7e7 = await (v_c9c489.DB as unknown as D1Database)
      .prepare("SELECT user_id, clone_id, persona_slug, ended_at FROM call_sessions WHERE call_id = ?")
      .bind(v_102c26).first<{ user_id: number; clone_id: number; persona_slug: string; ended_at: number | null }>();
    v_4d37e3(v_3ac7e7).toMatchObject({ user_id: v_257b90, clone_id: v_6e0fd3, persona_slug: null, ended_at: null });
  });

  v_23805a("멱등 — 재호출해도 1행", async () => {
    const v_257b90 = await v_bfb240("pt-idem@test.local");
    const v_6e0fd3 = await v_4d24a9(v_257b90, "pt_idem");
    const v_ea333d = await v_86c39f(v_257b90);
    const v_adc048 = "fedcba543210";
    const v_51c3d2 = () => v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/call/prethird-start`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_ea333d}`, "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: v_adc048 }),
    });
    v_4d37e3((await v_51c3d2()).status).toBe(200);
    v_4d37e3((await v_51c3d2()).status).toBe(200);
    const v_7b3f91 = await (v_c9c489.DB as unknown as D1Database)
      .prepare("SELECT COUNT(*) AS n FROM call_sessions WHERE call_id = ?").bind(v_adc048).first<{ n: number }>();
    v_4d37e3(v_7b3f91!.n).toBe(1);
  });

  v_23805a("무토큰 — 401", async () => {
    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: v_102c26 }),
    });
    v_4d37e3(v_8f00b9.status).toBe(401);
  });

  v_23805a("sessionId 형식 위반 — 400", async () => {
    const v_257b90 = await v_bfb240("pt-bad@test.local");
    const v_6e0fd3 = await v_4d24a9(v_257b90, "pt_bad");
    const v_ea333d = await v_86c39f(v_257b90);
    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/call/prethird-start`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_ea333d}`, "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: "bad id!" }),
    });
    v_4d37e3(v_8f00b9.status).toBe(400);
  });

  v_23805a("클론 미존재 — 404", async () => {
    const v_257b90 = await v_bfb240("pt-404@test.local");
    const v_ea333d = await v_86c39f(v_257b90);
    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_ea333d}`, "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: "abcdef012345" }),
    });
    v_4d37e3(v_8f00b9.status).toBe(404);
  });

  v_23805a("private clone — 비owner 403", async () => {
    const v_257b90 = await v_bfb240("pt-priv-o@test.local");
    const v_1c6644 = await v_bfb240("pt-priv-s@test.local");
    const v_6e0fd3 = await v_4d24a9(v_257b90, "pt_priv", "private");
    const v_ea333d = await v_86c39f(v_1c6644);
    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/call/prethird-start`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_ea333d}`, "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: v_102c26 }),
    });
    v_4d37e3(v_8f00b9.status).toBe(403);
  });

  v_23805a("sessionId 대문자 거부 — 400", async () => {
    const v_257b90 = await v_bfb240("pt-up@test.local");
    const v_6e0fd3 = await v_4d24a9(v_257b90, "pt_up");
    const v_ea333d = await v_86c39f(v_257b90);
    const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/call/prethird-start`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_ea333d}`, "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: "ABCDEF012345" }),
    });
    v_4d37e3(v_8f00b9.status).toBe(400);
  });

  v_23805a("sessionId 길이 경계(11/13자) 거부 — 400", async () => {
    const v_257b90 = await v_bfb240("pt-len@test.local");
    const v_6e0fd3 = await v_4d24a9(v_257b90, "pt_len");
    const v_ea333d = await v_86c39f(v_257b90);
    for (const v_0af197 of ["abcdef01234", "abcdef0123456"]) {
      const v_8f00b9 = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/call/prethird-start`, {
        method: "POST",
        headers: { Authorization: `Bearer ${v_ea333d}`, "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: v_0af197 }),
      });
      v_4d37e3(v_8f00b9.status).toBe(400);
    }
  });

  v_23805a("E2E: prethird-start 후 동일 user의 learn → H-2 통과(no_interaction 403 아님)", async () => {
    const v_257b90 = await v_bfb240("pt-e2e@test.local");
    const v_6e0fd3 = await v_4d24a9(v_257b90, "pt_e2e");
    const v_ea333d = await v_86c39f(v_257b90);
    const v_adc048 = "0123456789ab"; 

    const v_2d1eeb = await v_1df298.fetch(`http://localhost/oth-path${v_6e0fd3}/call/prethird-start`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_ea333d}`, "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: v_adc048 }),
    });
    v_4d37e3(v_2d1eeb.status).toBe(200);

    const v_7169b4 = (v_c9c489 as { LEARN_SECRET?: string }).LEARN_SECRET ?? "test-learn-secret";
    const v_b96973 = await v_1df298.fetch(`https://x/oth-path${v_6e0fd3}/memory/l2/learn`, {
      method: "POST",
      headers: { Authorization: `Bearer ${v_7169b4}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: v_257b90,
        extracted: { preference_personal: { tea: "녹차" }, memories_personal: ["등산 좋아함"] },
        source: "call",
      }),
    });
    v_4d37e3(v_b96973.status).toBe(200); 
  });
});
